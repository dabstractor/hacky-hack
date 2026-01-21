# External Dependencies & Technical Specifications

## 1. z.ai API Integration

### API Compatibility

The project uses **z.ai** as a model provider with full compatibility to Anthropic's SDK:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL ?? 'https://api.z.ai/api/anthropic',
});
```

### Available Models

| Model Name      | Purpose                | Max Tokens                      |
| --------------- | ---------------------- | ------------------------------- |
| **GLM-4.7**     | High-quality reasoning | 8192 (architect), 4096 (others) |
| **GLM-4.5-Air** | Fast/lightweight tasks | 4096                            |

### Model Selection Strategy

```typescript
// Architect Agent - Complex reasoning
getModel('sonnet'); // Returns 'GLM-4.7'

// Researcher/Coder/QA Agents - Balanced performance
getModel('sonnet'); // Returns 'GLM-4.7'

// Quick lookups (future enhancement)
getModel('haiku'); // Returns 'GLM-4.5-Air'
```

### Authentication Flow

**Environment Variable Mapping**:

```typescript
// Shell environment
ANTHROPIC_AUTH_TOKEN = zk - xxxxx;

// Internal mapping (performed at startup)
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
```

**Agent Configuration**:

```typescript
const agent = createAgent({
  name: 'ArchitectAgent',
  system: TASK_BREAKDOWN_PROMPT,
  model: 'GLM-4.7',
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
});
```

### API Endpoint Safeguards

**Tests Enforce z.ai Usage**:

```typescript
// From test setup
if (process.env.ANTHROPIC_BASE_URL?.includes('api.anthropic.com')) {
  throw new Error('Tests must use z.ai API, not Anthropic production API');
}
```

**Validation Scripts Block Execution**:

- Prevent accidental usage of Anthropic's production API
- Warn on non-z.ai endpoints (excluding localhost/mock/test)
- Prevent massive usage spikes from misconfigured tests

## 2. Groundswell Library

### Installation & Linking

**Local Development Setup**:

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
    groundswell: new URL('../groundswell/dist/index.js', import.meta.url)
      .pathname;
  }
}
```

### Core Classes

#### Workflow

```typescript
import { Workflow } from 'groundswell';

class PRPPipeline extends Workflow {
  @ObservedState()
  sessionManager!: SessionManager;

  @Step({ snapshotState: true, trackTiming: true })
  async initializeSession(): Promise<void> {
    // Automatically tracked with timing and state snapshots
  }

  async run(): Promise<void> {
    this.setStatus('running');
    // Pipeline logic
    this.setStatus('completed');
  }
}
```

**Key Features**:

- Automatic status tracking (`running`, `completed`, `failed`)
- Built-in logging with structured events
- State snapshots for error recovery
- Timing metrics for performance analysis

#### Agent

```typescript
import { createAgent } from 'groundswell';

const agent = createAgent({
  name: 'ResearcherAgent',
  system: 'You are a research specialist.',
  model: 'GLM-4.7',
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  mcps: [BASH_MCP, FILESYSTEM_MCP, GIT_MCP],
});

const result = await agent.prompt('Research this codebase...');
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | required | Agent name for logging |
| `system` | `string` | required | System prompt |
| `model` | `string` | required | Model identifier |
| `enableCache` | `boolean` | `false` | Enable response caching |
| `enableReflection` | `boolean` | `false` | Enable error reflection |
| `maxTokens` | `number` | `4096` | Max response tokens |
| `mcps` | `MCPServer[]` | `[]` | MCP tool servers |

#### Prompt

```typescript
import { createPrompt } from 'groundswell';
import { z } from 'zod';

const prompt = createPrompt({
  name: 'architect_breakdown',
  instruction: 'Break down this PRD into tasks...',
  outputSchema: z.object({
    backlog: z.array(
      z.object({
        type: z.literal('Phase'),
        id: z.string(),
        title: z.string(),
        status: z.enum([
          'Planned',
          'Researching',
          'Implementing',
          'Complete',
          'Failed',
        ]),
        milestones: z.array(/* ... */),
      })
    ),
  }),
});

const result = await agent.prompt(prompt);
// Type: { backlog: Phase[] }
```

**Features**:

- Automatic schema validation
- Type-safe responses
- Retry on parse errors

### Decorators

#### @ObservedState

```typescript
import { ObservedState } from 'groundswell';

class MyWorkflow extends Workflow {
  @ObservedState()
  progress: number = 0;

  @ObservedState({ redact: true })
  apiKey: string = 'secret-key'; // Shown as '***' in logs

  @ObservedState({ hidden: true })
  internalDebug: object = {}; // Excluded from snapshots
}
```

**Metadata Options**:
| Option | Type | Description |
|--------|------|-------------|
| `redact` | `boolean` | Hide value in logs (show as '\*\*\*') |
| `hidden` | `boolean` | Exclude from state snapshots |

#### @Step

```typescript
import { Step } from 'groundswell';

class MyWorkflow extends Workflow {
  @Step({ snapshotState: true, trackTiming: true })
  async processData(): Promise<void> {
    // Step logic
  }
}
```

**Event Types**:

- `step:start`: Step execution started
- `step:complete`: Step execution finished (with duration)
- `step:failed`: Step execution failed (with error)
- `state:snapshot`: State captured (if `snapshotState: true`)

#### @Task

```typescript
import { Task } from 'groundswell';

class ParentWorkflow extends Workflow {
  // Single child workflow
  @Task()
  async createChild(): Promise<ChildWorkflow> {
    return new ChildWorkflow('child1', this);
  }

  // Multiple concurrent workflows
  @Task({ concurrent: true })
  async createWorkers(): Promise<WorkerWorkflow[]> {
    return [
      new WorkerWorkflow('worker1', this),
      new WorkerWorkflow('worker2', this),
    ];
  }
}
```

**Concurrency Behavior**:

- `concurrent: false` (default): Execute sequentially
- `concurrent: true`: Execute via `Promise.all()`
- Non-workflow returns are silently skipped (lenient validation)

### MCP (Model Context Protocol) Integration

#### MCPHandler

```typescript
import { MCPHandler } from 'groundswell';

class MyMCP implements MCPServer {
  readonly name = 'my-mcp';
  readonly handler = new MCPHandler();

  constructor() {
    const tool: Tool = {
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

    const executor: ToolExecutor = async input => {
      return { result: 'success' };
    };

    this.handler.registerTool(tool, executor);
  }
}
```

**Tool Naming Convention**: `serverName__toolName` (double underscore)

**Transport Types**:

- `inprocess`: Direct function calls (currently supported)
- `stdio`: External process communication (planned)

#### Introspection Tools

Six built-in tools for workflow hierarchy navigation:

```typescript
import { INTROSPECTION_TOOLS } from 'groundswell';

const agent = createAgent({
  name: 'IntrospectionAgent',
  tools: INTROSPECTION_TOOLS,
});

// Available tools:
// 1. inspect_current_node - Get current node info
// 2. read_ancestor_chain - Get all ancestors up to root
// 3. list_siblings_children - List siblings or children
// 4. inspect_prior_outputs - Get outputs from prior steps
// 5. inspect_cache_status - Check if response is cached
// 6. request_spawn_workflow - Request dynamic workflow spawn
```

### Caching

```typescript
import { defaultCache } from 'groundswell';

// Enable caching on agent
const agent = createAgent({ enableCache: true });

// Cache key deterministically generated from:
// - User message
// - Data payload
// - System prompt
// - Model
// - Temperature
// - Max tokens
// - Tools
// - Response format schema

// Manual cache operations
await defaultCache.set(key, value, { ttl: 3600000, prefix: 'agent1' });
const value = await defaultCache.get(key);
await defaultCache.bust(key); // Remove specific key
await defaultCache.bustPrefix('agent1'); // Remove all with prefix
await defaultCache.clear(); // Clear all

// Metrics
const metrics = defaultCache.metrics();
// { hits: 10, misses: 5, size: 15, hitRate: 66.67 }
```

**Cache Configuration**:

- Default max items: 1000
- Default max size: 50MB
- Default TTL: 1 hour

**PRP Cache Implementation**:

```typescript
// PRP-specific cache (24-hour TTL)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Cache key: SHA-256 hash of task definition
const taskHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(task))
  .digest('hex');

// Metadata structure
interface PRPCacheMetadata {
  taskId: string;
  taskHash: string;
  createdAt: number;
  prp: PRPDocument; // Full PRP content
}
```

### Reflection (Error Recovery)

```typescript
import { executeWithReflection, ReflectionManager } from 'groundswell';

const reflection = new ReflectionManager({
  enabled: true,
  maxAttempts: 3,
  retryDelayMs: 1000,
});

const result = await executeWithReflection(
  async () => {
    // Operation that may fail
    return await unreliableOperation();
  },
  reflection,
  (error, attempt, history) => ({
    level: 'workflow',
    error,
    failedNode: currentNode,
    attemptNumber: attempt,
    previousAttempts: history,
  })
);
```

**Non-Retryable Errors** (automatic detection):

- Rate limits / quota exceeded
- Authentication / authorization errors
- Network connection errors

**Retry Strategy**:

- Max 3 attempts
- Exponential backoff: 1s → 2s → 4s
- Reflection context provided on each retry

### Observability

#### WorkflowTreeDebugger

```typescript
import { WorkflowTreeDebugger } from 'groundswell';

const debugger = new WorkflowTreeDebugger(workflow);

await workflow.run();

// ASCII tree visualization
console.log(debugger.toTreeString());
// Root [completed]
//   Child-1 [completed]
//   Child-2 [failed]

// Formatted logs
console.log(debugger.toLogString());

// Statistics
console.log(debugger.getStats());
// { totalNodes: 3, byStatus: { completed: 2, failed: 1 } }

// Find node
const node = debugger.getNode(workflowId);

// Subscribe to events
debugger.events.subscribe({
  next: (event) => console.log(event.type)
});
```

#### Observer Pattern

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

## 3. TypeScript Best Practices

### Project Structure

```
project/
├── src/
│   ├── agents/              # Agent implementations
│   ├── cli/                # CLI interface
│   ├── config/             # Configuration management
│   ├── core/               # Core business logic
│   ├── tools/              # MCP tool implementations
│   ├── utils/              # Utility functions
│   ├── workflows/          # Workflow orchestration
│   └── index.ts            # Main entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/              # End-to-end tests
│   ├── fixtures/         # Test fixtures
│   └── setup.ts          # Test configuration
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### TypeScript Configuration

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "useDefineForClassFields": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist"
  }
}
```

**Key Settings**:

- `strict: true`: All strict type checking enabled
- `moduleResolution: "NodeNext"`: ES Module support with .js extensions
- `isolatedModules: true`: Each file must be transpilable independently

### Async/Await Patterns

**Sequential Processing**:

```typescript
for (const item of items) {
  await processItem(item);
}
```

**Parallel with Promise.all**:

```typescript
const results = await Promise.all(items.map(item => processItem(item)));
```

**Concurrent Workflows**:

```typescript
@Task({ concurrent: true })
async createWorkers(): Promise<Workflow[]> {
  return items.map(item => new Worker(item, this));
}
```

### Error Handling

**Decorator-Based** (@Step):

```typescript
@Step({ snapshotState: true })
async processData(): Promise<void> {
  throw new Error('Processing failed');
  // Error automatically captured with state snapshot
}
```

**Try-Catch with Isolation**:

```typescript
for (const child of children) {
  try {
    await child.run();
  } catch (error) {
    this.logger.warn(`Child failed: ${error.message}`);
    // Continue with other children
  }
}
```

**Error Merge Strategy**:

```typescript
@Task({
  concurrent: true,
  errorMergeStrategy: {
    enabled: true,
    combine: (errors) => mergeWorkflowErrors(errors)
  }
})
async processBatch(): Promise<Workflow[]> { }
```

## 4. Testing Framework

### Vitest Configuration

**vitest.config.ts**:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  esbuild: {
    target: 'node18',
  },
});
```

### Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── core/
│   ├── agents/
│   └── utils/
├── integration/       # Integration tests
│   ├── workflows/
│   └── tools/
├── e2e/              # End-to-end tests
│   └── pipeline.test.ts
├── fixtures/         # Test data
│   ├── prds/
│   └── sessions/
└── setup.ts          # Test configuration
```

**Coverage Requirements**: 100% for all metrics

### Test Utilities

**Environment Setup** (tests/setup.ts):

```typescript
import { beforeEach } from 'vitest';

// Configure environment before each test
beforeEach(async () => {
  // Set test environment variables
  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
});
```

**Mock Patterns**:

```typescript
// Mock agent responses
vi.mock('../src/agents/agent-factory.js', () => ({
  createArchitectAgent: () => ({
    prompt: vi.fn().mockResolvedValue({ backlog: mockBacklog }),
  }),
}));
```

## 5. Recommended Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.71.1",
    "commander": "^14.0.2",
    "fast-glob": "^3.3.3",
    "pino": "^9.14.0",
    "simple-git": "^3.30.0",
    "zod": "^3.23.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "@vitest/coverage-v8": "^1.6.1",
    "dotenv": "^17.2.3",
    "esbuild": "^0.27.2",
    "eslint": "^8.57.1",
    "nodemon": "^3.0.2",
    "prettier": "^3.7.4",
    "tsx": "^4.7.0",
    "typescript": "^5.2.0",
    "vitest": "^1.6.1"
  }
}
```

## 6. Module System Best Practices

### Import Patterns

**ES Module Imports** (requires .js extensions):

```typescript
// Correct
import { Workflow } from 'groundswell';
import { SessionManager } from './core/session-manager.js';

// Incorrect (missing .js extension)
import { SessionManager } from './core/session-manager';
```

**Absolute Imports** (recommended for stability):

```typescript
// Use absolute paths from project root
import { TaskOrchestrator } from '/home/dustin/projects/hacky-hack/src/core/task-orchestrator.js';
```

**Dynamic Imports**:

```typescript
// Load module at runtime
const module = await import('./utils/helper.js');
```

### Path Resolution

**Vitest Path Aliases**:

```typescript
// vitest.config.ts
resolve: {
  alias: {
    groundswell: new URL('../groundswell/dist/index.js', import.meta.url)
      .pathname;
  }
}
```

**TypeScript Path Mapping** (optional):

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 7. Tool Registration Best Practices

### MCP Tool Schema

**Tool Definition**:

```typescript
interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: 'string' | 'number' | 'boolean' | 'array' | 'object';
        description?: string;
        enum?: string[];
        items?: {
          /* array item schema */
        };
      }
    >;
    required: string[];
  };
}
```

**Registration Pattern**:

```typescript
class MyMCP implements MCPServer {
  readonly name = 'my-mcp';
  readonly handler = new MCPHandler();

  constructor() {
    const tool: Tool = {
      name: 'calculate',
      description: 'Performs arithmetic',
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

    const executor: ToolExecutor = async input => {
      const { operation, a, b } = input as CalculateInput;
      return { result: operation === 'add' ? a + b : a - b };
    };

    this.handler.registerTool(tool, executor);
  }
}
```

### Best Practices

1. **Naming Convention**: `serverName__toolName` (double underscore)
2. **Input Validation**: Use Zod schemas for validation
3. **Error Handling**: Return structured errors with `is_error: true`
4. **Idempotency**: Tools should be idempotent when possible
5. **Timeout Handling**: Implement reasonable timeouts

## 8. Environment Configuration

### Required Variables

```bash
# API Connection
ANTHROPIC_AUTH_TOKEN=zk-xxxxx              # Mapped to ANTHROPIC_API_KEY
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic

# Pipeline Control
PRP_PIPELINE_RUNNING=<PID>                  # Nested execution guard
SKIP_BUG_FINDING=true                       # Skip bug hunt / bug fix mode
SKIP_EXECUTION_LOOP=true                    # Skip execution, run validation only

# Models (with defaults)
ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7
ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air

# Bug Hunt Configuration
BUG_FINDER_AGENT=glp
BUG_RESULTS_FILE=TEST_RESULTS.md
BUGFIX_SCOPE=subtask
```

### Configuration Loading Order

1. **Shell Environment**: Inherited environment variables
2. **`.env` File**: Local project configuration (loaded by test setup)
3. **Runtime Overrides**: Explicit environment variable settings

## Summary

This document provides comprehensive reference material for:

- z.ai API integration with Anthropic SDK
- Groundswell library (decorators, workflows, agents, MCP, caching, reflection)
- TypeScript best practices (project structure, async patterns, error handling)
- Testing framework (Vitest with 100% coverage)
- Module system (ES Modules with .js extensions)
- Tool registration (MCP protocol)
- Environment configuration (z.ai models, pipeline controls)

All file paths referenced are absolute paths under `/home/dustin/projects/` for consistency.
