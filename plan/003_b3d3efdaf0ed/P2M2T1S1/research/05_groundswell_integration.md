# Groundswell Framework Integration

## Key Decorators

### @Workflow Decorator
**Purpose**: Base class for workflow orchestration

```typescript
import { Workflow } from 'groundswell';

export class PRPPipeline extends Workflow {
  sessionManager: SessionManager;
  taskOrchestrator: TaskOrchestrator;

  constructor(prdPath: string, scope?: Scope) {
    super('PRPPipeline');
    // Initialization
  }
}
```

### @Step Decorator
**Purpose**: Marks methods as tracked steps

```typescript
@Step({ trackTiming: true, name: 'handleDelta' })
async handleDelta(): Promise<void> {
  // Delta handling logic
}
```

**Options**:
- `trackTiming: true` - Measures execution duration
- `name: 'stepName'` - Custom step name

### @ObservedState
**Purpose**: Automatic state tracking
**Pattern**: Public fields on workflow instances

```typescript
export class PRPPipeline extends Workflow {
  // Public fields tracked automatically
  currentPhase: string = 'init';
  totalTasks: number = 0;
  completedTasks: number = 0;
  shutdownRequested: boolean = false;
}
```

## Agent Creation

### createAgent() Pattern
```typescript
import { createAgent } from 'groundswell';

function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // GLM-4.7
  return {
    name: `${persona}Agent`,
    system: personaPrompt,
    model,
    enableCache: true,
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

### Persona Types
- 'architect' - 8192 tokens
- 'researcher' - 4096 tokens
- 'coder' - 4096 tokens
- 'qa' - 4096 tokens

## Tool Registration

### MCP Server Integration
```typescript
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

const MCP_TOOLS: MCPServer[] = [
  BASH_MCP,
  FILESYSTEM_MCP,
  GIT_MCP
];

// Agent creation includes tools
const config = {
  ...baseConfig,
  system: TASK_BREAKDOWN_PROMPT,
  mcps: MCP_TOOLS,
};
```

## Caching Behavior

### Agent-level Caching
```typescript
enableCache: true,  // LLM response caching
```

**Cache Key**: SHA-256(system prompt + user prompt + responseFormat)

**Performance Impact**:
- Cache Hit: <10ms, 0 API calls
- Cache Miss: 1-5 seconds, 1 API call
- Hit Rate: 80-95%

### Reflection
```typescript
enableReflection: true,  // Error recovery
```

## Workflow Lifecycle

### Status Tracking
```typescript
setStatus('running')
setStatus('completed')
setStatus('failed')
```

### Correlation Logging
- Each workflow generates correlation IDs
- Enables distributed tracing

## Observability

### Step Timing
```typescript
@Step({ trackTiming: true })
```
Measures execution duration for performance monitoring.

### Progress Tracking
Real-time progress reporting with completion percentages.

### Resource Monitoring
File handle and memory usage tracking.

## Validation

### Library Link Validation
Checks npm link to groundswell (version >= 0.0.3).

### Import Validation
Verifies all required exports (@Step, @Task, @ObservedState).

### Node.js Version
Ensures Node.js >= 18.
