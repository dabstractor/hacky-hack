# Groundswell Reflection Capabilities Research

**Date**: 2026-01-24
**Task**: P3M2T1S2 - Research Groundswell library's reflection capabilities for implementing retry logic
**Status**: Complete

---

## Executive Summary

**Recommendation**: **Use Groundswell's built-in reflection system** rather than implementing custom retry logic.

**Justification**:

- Groundswell provides a comprehensive, production-ready reflection system with intelligent retry capabilities
- The system supports both heuristic-based and agent-powered reflection analysis
- Built-in retry limits, delay configuration, and non-retryable error detection
- Full integration with workflows, agents, and prompts
- Observable and debuggable with event emission and history tracking

---

## 1. Groundswell Library Overview

### 1.1 Library Information

**Package**: `groundswell`
**Version**: 0.0.4
**Repository**: https://github.com/groundswell-ai/groundswell
**Description**: Hierarchical workflow orchestration engine with full observability
**Current Installation**: Local development via yalc (`file:.yalc/groundswell`)

### 1.2 Core Capabilities

- **Workflows**: Hierarchical task orchestration with decorators
- **Agents**: Lightweight wrappers around Anthropic SDK
- **Prompts**: Type-safe prompt definitions with Zod validation
- **Reflection**: Multi-level error analysis and retry system
- **Caching**: LLM response caching with LRU cache
- **MCP Integration**: Model Context Protocol tool support

---

## 2. Groundswell Reflection System

### 2.1 Architecture Overview

Groundswell's reflection system is built around three core components:

```
┌─────────────────────────────────────────────────────────┐
│                   ReflectionManager                      │
│  - Configurable retry limits                            │
│  - History tracking                                      │
│  - Event emission                                        │
│  - Optional agent-powered analysis                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ├─► Agent Mode (L-powered analysis)
                            │
                            └─► Heuristic Mode (Rule-based)
```

### 2.2 Type Definitions

#### ReflectionConfig

```typescript
interface ReflectionConfig {
  /** Whether reflection is enabled */
  enabled: boolean;
  /** Maximum number of reflection attempts (default: 3) */
  maxAttempts: number;
  /** Delay between retry attempts in milliseconds (default: 0) */
  retryDelayMs?: number;
}
```

#### ReflectionContext

```typescript
interface ReflectionContext {
  /** Level at which reflection is occurring */
  level: 'workflow' | 'agent' | 'prompt';
  /** The workflow node that failed */
  failedNode: WorkflowNode;
  /** The error that triggered reflection */
  error: Error;
  /** Current attempt number (1-indexed) */
  attemptNumber: number;
  /** History of previous reflection attempts */
  previousAttempts: ReflectionEntry[];
}
```

#### ReflectionResult

```typescript
interface ReflectionResult {
  /** Whether to retry the operation */
  shouldRetry: boolean;
  /** Revised prompt data for retry */
  revisedPromptData?: Record<string, unknown>;
  /** Revised system prompt for retry */
  revisedSystemPrompt?: string;
  /** Explanation of the reflection decision */
  reason: string;
}
```

#### ReflectionEntry

```typescript
interface ReflectionEntry {
  /** Timestamp when reflection occurred */
  timestamp: number;
  /** Level at which reflection occurred */
  level: 'workflow' | 'agent' | 'prompt';
  /** Reason for the reflection */
  reason: string;
  /** Original error that triggered reflection */
  error: Error;
  /** Resolution action taken */
  resolution: 'retry' | 'skip' | 'abort';
  /** Whether the retry was successful */
  success: boolean;
}
```

### 2.3 ReflectionManager API

```typescript
class ReflectionManager implements ReflectionAPI {
  constructor(config: ReflectionConfig, agent?: Agent);

  // State queries
  isEnabled(): boolean;
  getMaxAttempts(): number;
  getRetryDelayMs(): number;

  // History tracking
  getReflectionHistory(): ReflectionEntry[];

  // Reflection operations
  triggerReflection(reason?: string): Promise<void>;
  reflect(context: ReflectionContext): Promise<ReflectionResult>;
  markLastReflectionSuccessful(): void;

  // Event integration
  setEventEmitter(emitter: (event: WorkflowEvent) => void): void;
}
```

---

## 3. Reflection Modes

### 3.1 Heuristic Mode (Default)

When no agent is provided, `ReflectionManager` uses rule-based heuristics:

#### Non-Retryable Errors (Immediately Aborted)

```typescript
// Rate limit and quota errors
if (
  message.includes('rate limit') ||
  message.includes('quota exceeded') ||
  message.includes('429')
) {
  return { shouldRetry: false, reason: 'Non-retryable error: rate limit' };
}

// Authentication errors
if (
  message.includes('authentication') ||
  message.includes('unauthorized') ||
  message.includes('401') ||
  message.includes('403') ||
  message.includes('invalid api key')
) {
  return { shouldRetry: false, reason: 'Non-retryable error: auth' };
}

// Network errors (should use exponential backoff instead)
if (
  message.includes('econnrefused') ||
  message.includes('etimedout') ||
  message.includes('network')
) {
  return { shouldRetry: false, reason: 'Non-retryable error: network' };
}
```

#### Retryable Errors

```typescript
// Validation/parsing errors
if (
  errorMessage.includes('validation') ||
  errorMessage.includes('parse') ||
  errorMessage.includes('schema') ||
  errorMessage.includes('json')
) {
  return {
    shouldRetry: true,
    reason: 'Validation/parsing error detected - retry may succeed',
  };
}

// Timeout errors (retry once)
if (errorMessage.includes('timeout')) {
  return {
    shouldRetry: context.attemptNumber < 2,
    reason:
      context.attemptNumber < 2
        ? 'Timeout error - retry once'
        : 'Timeout error - too many attempts',
  };
}

// Default: retry if under max attempts
const shouldRetry = context.attemptNumber < this.config.maxAttempts;
return {
  shouldRetry,
  reason: shouldRetry
    ? `Attempt ${context.attemptNumber} failed - retrying`
    : `Max attempts (${this.config.maxAttempts}) reached`,
};
```

### 3.2 Agent Mode (L-Powered)

When an agent is provided, reflection uses L analysis:

```typescript
const REFLECTION_PROMPT_TEMPLATE = `
A previous operation failed with the following error:

Error: {{errorMessage}}
Stack: {{errorStack}}

Level: {{level}}
Node: {{nodeName}} ({{nodeId}})
Attempt: {{attemptNumber}} of {{maxAttempts}}

Previous attempts:
{{previousAttempts}}

Analyze the error and determine:
1. Can this operation be retried with modifications?
2. What changes would help it succeed?
3. Is this a transient error (worth retrying) or a fundamental issue (should abort)?

Consider:
- Rate limits and quota errors should NOT be retried via reflection
- Authentication errors should NOT be retried via reflection
- Schema validation errors may be retried with revised data
- Logic errors may be retried with revised prompts

Respond with JSON:
{
  "shouldRetry": boolean,
  "reason": string,
  "revisedPromptData": { /* optional revised data */ },
  "revisedSystemPrompt": "optional revised system prompt"
}
`;
```

**Key Capabilities**:

- Intelligent analysis of error context
- Suggests prompt revisions for retry
- Learns from previous attempts
- Can modify both system prompts and data

---

## 4. Integration Patterns

### 4.1 Agent-Level Reflection

```typescript
import { createAgent, createPrompt } from 'groundswell';

const agent = createAgent({
  name: 'ReflectiveAgent',
  enableReflection: true, // Enable at agent level
});

const result = await agent.prompt(prompt);
```

**What it does**: Prepends reflection prefix to system prompt:

```
Before answering, reflect on your reasoning step by step.
Consider alternative approaches and potential errors.
Then provide your final answer.
```

### 4.2 Prompt-Level Reflection

```typescript
const prompt = createPrompt({
  user: 'Complex question',
  enableReflection: true, // Enable at prompt level
  responseFormat: schema,
});

const result = await agent.prompt(prompt);
```

### 4.3 Workflow-Level Reflection

```typescript
import { createWorkflow } from 'groundswell';

const workflow = createWorkflow(
  {
    name: 'DataPipeline',
    enableReflection: true, // Enable at workflow level
    maxReflectionAttempts: 3,
    reflectionRetryDelayMs: 1000,
  },
  async ctx => {
    const result = await ctx.step('process', async () => {
      return processData();
    });
    return result;
  }
);
```

### 4.4 Direct ReflectionManager Usage

```typescript
import { ReflectionManager, executeWithReflection } from 'groundswell';

// Create reflection manager
const reflection = new ReflectionManager({
  enabled: true,
  maxAttempts: 3,
  retryDelayMs: 1000,
});

// Use with executeWithReflection helper
const result = await executeWithReflection(
  async () => {
    return await someOperation();
  },
  reflection,
  (error, attempt, history) => ({
    level: 'prompt',
    failedNode: currentNode,
    error,
    attemptNumber: attempt,
    previousAttempts: history,
  })
);
```

**Implementation of `executeWithReflection`**:

```typescript
export async function executeWithReflection<T>(
  fn: () => Promise<T>,
  reflection: ReflectionManager,
  createContext: (
    error: Error,
    attempt: number,
    history: ReflectionEntry[]
  ) => ReflectionContext
): Promise<T> {
  let lastError: Error | null = null;
  const maxAttempts = reflection.getMaxAttempts();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Mark as successful if we recovered
      if (attempt > 1) {
        reflection.markLastReflectionSuccessful();
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Create reflection context
      const context = createContext(
        lastError,
        attempt,
        reflection.getReflectionHistory()
      );

      // Analyze error
      const result = await reflection.reflect(context);

      // Abort if reflection says don't retry
      if (!result.shouldRetry) {
        throw new Error(
          `Reflection aborted: ${result.reason}\nOriginal error: ${lastError.message}`
        );
      }

      // Apply delay if configured
      if (reflection.getRetryDelayMs() > 0) {
        await new Promise(resolve =>
          setTimeout(resolve, reflection.getRetryDelayMs())
        );
      }

      // Retry with revised prompts if provided
      if (result.revisedPromptData || result.revisedSystemPrompt) {
        // Update context for next attempt
        // Implementation-specific
      }
    }
  }

  throw lastError;
}
```

---

## 5. Current Codebase Usage

### 5.1 Existing Reflection Configuration

**File**: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

```typescript
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  return {
    name,
    system,
    model,
    enableCache: true,
    enableReflection: true, // ✅ Already enabled!
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
    },
  };
}
```

**Status**: All agents (Architect, Researcher, Coder, QA) already have `enableReflection: true` set.

### 5.2 Agent Reflection Method

**File**: `/home/dustin/projects/hacky-hack/node_modules/groundswell/dist/core/agent.d.ts`

```typescript
class Agent {
  /**
   * Execute a prompt with reflection capabilities
   * @param prompt Prompt to execute
   * @param overrides Optional overrides for this execution
   * @returns AgentResponse containing validated response or error
   */
  reflect<T>(
    prompt: Prompt<T>,
    overrides?: PromptOverrides
  ): Promise<AgentResponse<T>>;
}
```

**Available but not currently used** in the codebase.

---

## 6. Comparison: Groundswell Reflection vs Custom Retry

### 6.1 Feature Comparison

| Feature                     | Groundswell Reflection        | Custom Retry Implementation |
| --------------------------- | ----------------------------- | --------------------------- |
| **Retry Limits**            | ✅ Configurable `maxAttempts` | ❌ Must implement           |
| **Delay Configuration**     | ✅ `retryDelayMs`             | ❌ Must implement           |
| **Non-Retryable Detection** | ✅ Built-in heuristics        | ❌ Must implement           |
| **L-Powered Analysis**      | ✅ Optional agent mode        | ❌ Must implement           |
| **History Tracking**        | ✅ Automatic                  | ❌ Must implement           |
| **Event Emission**          | ✅ Workflow integration       | ❌ Must implement           |
| **Prompt Revision**         | ✅ Suggests changes           | ❌ Must implement           |
| **Observability**           | ✅ Full history               | ❌ Must implement           |
| **Testing**                 | ✅ Unit tests included        | ❌ Must write               |
| **Maintenance**             | ✅ Library updates            | 🔴 Ongoing maintenance      |

### 6.2 Code Complexity Comparison

#### Using Groundswell Reflection

```typescript
// Simple: Already configured in agent factory
const agent = createArchitectAgent(); // enableReflection: true
const result = await agent.reflect(prompt); // Automatic retry with analysis
```

**Lines of Code**: ~2

#### Custom Retry Implementation

```typescript
// Complex: Must implement entire retry logic
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check non-retryable errors
      if (isNonRetryable(error)) {
        throw error;
      }

      // Log attempt
      logger.warn(`Attempt ${attempt} failed: ${error.message}`);

      // Wait before retry
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

function isNonRetryable(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('authentication') ||
    msg.includes('401') ||
    msg.includes('403')
  );
}

// Usage
const result = await executeWithRetry(() => agent.prompt(prompt), 3, 1000);
```

**Lines of Code**: ~40

### 6.3 Capability Comparison

| Capability                    | Groundswell | Custom    |
| ----------------------------- | ----------- | --------- |
| Basic retry                   | ✅          | ✅        |
| Retry limits                  | ✅          | ✅        |
| Delay between retries         | ✅          | ✅        |
| Non-retryable error detection | ✅          | ⚠️ Manual |
| L-powered error analysis      | ✅          | ❌        |
| Prompt revision suggestions   | ✅          | ❌        |
| History tracking              | ✅          | ⚠️ Manual |
| Event emission                | ✅          | ❌        |
| Workflow integration          | ✅          | ❌        |
| Observable debugging          | ✅          | ❌        |

---

## 7. Recommendations

### 7.1 Primary Recommendation

**✅ Use Groundswell's built-in reflection system**

**Rationale**:

1. **Already Enabled**: All agents have `enableReflection: true` in their configuration
2. **Production-Ready**: Includes comprehensive error handling, history tracking, and observability
3. **Intelligent**: Both heuristic and L-powered analysis modes
4. **Low Complexity**: Minimal code changes required
5. **Maintainable**: Library updates provide improvements
6. **Observable**: Full event emission and history tracking

### 7.2 Implementation Strategy

#### Option 1: Agent-Level Reflection (Recommended for Simple Cases)

```typescript
// Already configured - just use agent.reflect() instead of agent.prompt()
const agent = createArchitectAgent();

// Before: Basic prompt execution
const result = await agent.prompt(prompt);

// After: Reflection-enabled execution
const result = await agent.reflect(prompt);
```

**When to Use**:

- Simple retry scenarios
- Standard error handling needs
- Agent-level configuration sufficient

#### Option 2: Direct ReflectionManager (Recommended for Advanced Cases)

```typescript
import { ReflectionManager, executeWithReflection } from 'groundswell';

// Create custom reflection configuration
const reflection = new ReflectionManager({
  enabled: true,
  maxAttempts: 3,
  retryDelayMs: 2000, // 2 second delay
});

// Execute with reflection
const result = await executeWithReflection(
  async () => await agent.prompt(prompt),
  reflection,
  (error, attempt, history) => ({
    level: 'agent',
    failedNode: currentNode,
    error,
    attemptNumber: attempt,
    previousAttempts: history,
  })
);
```

**When to Use**:

- Custom retry limits needed
- Specific delay requirements
- Integration with custom workflows
- Need reflection history for debugging

#### Option 3: Agent-Powered Reflection (Recommended for Complex Errors)

```typescript
// Create reflection agent for intelligent analysis
const reflectionAgent = createAgent({
  name: 'ReflectionAgent',
  system:
    'You are an error analysis expert. Analyze errors and recommend retry strategies.',
});

// Create ReflectionManager with agent
const reflection = new ReflectionManager(
  { enabled: true, maxAttempts: 3 },
  reflectionAgent // Pass agent for L-powered analysis
);

// Use with executeWithReflection
const result = await executeWithReflection(
  async () => await agent.prompt(prompt),
  reflection,
  createContext
);
```

**When to Use**:

- Complex error scenarios
- Need intelligent error analysis
- Want prompt revision suggestions
- Have reflection budget available

### 7.3 When to Use Custom Retry Logic

**⚠️ Consider custom implementation ONLY if**:

1. **Domain-Specific Error Handling**
   - Your errors don't fit Groundswell's heuristic patterns
   - Need custom error classification logic
   - Have business-specific retry rules

2. **Advanced Retry Strategies**
   - Exponential backoff with jitter
   - Circuit breaker patterns
   - Deadline-based timeouts
   - Multi-region failover

3. **External System Integration**
   - Need to integrate with external monitoring
   - Custom telemetry requirements
   - Legacy retry system integration

**Even in these cases**, consider extending Groundswell's `ReflectionManager` rather than building from scratch.

---

## 8. Implementation Examples

### 8.1 Simple Retry for PRP Generation

**Scenario**: PRP generation fails due to transient API errors

```typescript
// File: src/agents/prp-generator.ts

// Before: Basic execution
export async function generatePRP(workItem: WorkItem): Promise<PRP> {
  const agent = createResearcherAgent();
  const prompt = createPRPBlueprintPrompt(workItem);
  return await agent.prompt(prompt);
}

// After: Reflection-enabled
export async function generatePRP(workItem: WorkItem): Promise<PRP> {
  const agent = createResearcherAgent();
  const prompt = createPRPBlueprintPrompt(workItem);

  // Use reflect() for automatic retry with analysis
  const response = await agent.reflect(prompt);

  if (response.status === 'error') {
    throw new Error(`PRP generation failed: ${response.error?.message}`);
  }

  return response.data;
}
```

### 8.2 Custom Retry Limits for Delta PRD Generation

**Scenario**: Delta PRD generation needs specific retry configuration

```typescript
// File: src/workflows/delta-analysis-workflow.ts

import { ReflectionManager, executeWithReflection } from 'groundswell';

export async function generateDeltaPRD(
  oldPRD: string,
  newPRD: string
): Promise<string> {
  const agent = createArchitectAgent();

  // Custom reflection configuration for delta generation
  const reflection = new ReflectionManager({
    enabled: true,
    maxAttempts: 5, // More attempts for delta generation
    retryDelayMs: 3000, // 3 second delay
  });

  return await executeWithReflection(
    async () => {
      const prompt = createDeltaPRDPrompt(oldPRD, newPRD);
      const response = await agent.prompt(prompt);

      if (response.status === 'error') {
        throw response.error || new Error('Unknown error');
      }

      return response.data.deltaPRD;
    },
    reflection,
    (error, attempt, history) => ({
      level: 'workflow',
      failedNode: { id: 'delta-prd-gen', name: 'Delta PRD Generation' },
      error,
      attemptNumber: attempt,
      previousAttempts: history,
    })
  );
}
```

### 8.3 Agent-Powered Reflection for Complex Errors

**Scenario**: Code generation fails with complex validation errors

```typescript
// File: src/agents/prp-executor.ts

import { ReflectionManager } from 'groundswell';

// Create specialized reflection agent
const reflectionAgent = createAgent({
  name: 'CodeReflectionAgent',
  system: `You are a code generation error analyst.

Analyze code generation failures and recommend:
1. Whether to retry with modified approach
2. Specific changes to prompts or context
3. Alternative implementation strategies

Focus on:
- Schema validation errors
- Type system issues
- Compilation failures
- Test failures`,
  enableCache: true,
});

export async function executePRPWithReflection(prp: PRP): Promise<void> {
  const coderAgent = createCoderAgent();

  // Create ReflectionManager with agent
  const reflection = new ReflectionManager(
    {
      enabled: true,
      maxAttempts: 3,
      retryDelayMs: 2000,
    },
    reflectionAgent // Agent-powered analysis
  );

  await executeWithReflection(
    async () => {
      const prompt = createPRPExecutionPrompt(prp);
      const response = await coderAgent.prompt(prompt);

      if (response.status === 'error') {
        throw response.error || new Error('PRP execution failed');
      }

      return response.data;
    },
    reflection,
    (error, attempt, history) => ({
      level: 'agent',
      failedNode: { id: prp.id, name: prp.title },
      error,
      attemptNumber: attempt,
      previousAttempts: history,
    })
  );
}
```

---

## 9. Migration Path

### 9.1 Phase 1: Enable Reflection (Immediate)

**Action**: Replace `agent.prompt()` with `agent.reflect()` in critical paths

**Locations**:

- `src/agents/prp-generator.ts` - PRP generation
- `src/agents/prp-executor.ts` - PRP execution
- `src/workflows/delta-analysis-workflow.ts` - Delta PRD generation

**Impact**: Low - Reflection already configured, just change method call

**Example**:

```typescript
// Before
const result = await agent.prompt(prompt);

// After
const response = await agent.reflect(prompt);
if (response.status === 'error') {
  throw response.error;
}
const result = response.data;
```

### 9.2 Phase 2: Add ReflectionManager (Short-term)

**Action**: Use `ReflectionManager` for workflows needing custom retry limits

**Locations**:

- Workflow classes with specific retry requirements
- Long-running operations (delta analysis, fix cycles)

**Impact**: Medium - Requires adding `executeWithReflection` wrapper

### 9.3 Phase 3: Agent-Powered Reflection (Optional)

**Action**: Create specialized reflection agents for complex error scenarios

**Locations**:

- Code generation workflows
- Test execution workflows
- Bug fix workflows

**Impact**: Higher - Requires creating and tuning reflection agents

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ReflectionManager } from 'groundswell';

describe('Reflection Configuration', () => {
  it('should respect max attempts limit', async () => {
    const reflection = new ReflectionManager({
      enabled: true,
      maxAttempts: 2,
    });

    expect(reflection.getMaxAttempts()).toBe(2);
  });

  it('should detect non-retryable errors', async () => {
    const reflection = new ReflectionManager({
      enabled: true,
      maxAttempts: 3,
    });

    const context = {
      level: 'agent' as const,
      failedNode: { id: 'test', name: 'Test' },
      error: new Error('rate limit exceeded'),
      attemptNumber: 1,
      previousAttempts: [],
    };

    const result = await reflection.reflect(context);
    expect(result.shouldRetry).toBe(false);
    expect(result.reason).toContain('Non-retryable');
  });
});
```

### 10.2 Integration Tests

```typescript
describe('Agent Reflection Integration', () => {
  it('should retry on validation errors', async () => {
    const agent = createTestAgent();
    const prompt = createTestPrompt();

    // Mock API to fail once, then succeed
    mockAPI
      .mockRejectedValueOnce(new Error('validation failed'))
      .mockResolvedValueOnce({ data: testResponse });

    const response = await agent.reflect(prompt);

    expect(response.status).toBe('success');
    expect(response.data).toEqual(testResponse);
  });
});
```

---

## 11. Monitoring and Observability

### 11.1 Reflection History Tracking

```typescript
const reflection = new ReflectionManager({
  enabled: true,
  maxAttempts: 3,
});

// After execution
const history = reflection.getReflectionHistory();

history.forEach(entry => {
  console.log(`[${entry.level}] ${entry.reason}`);
  console.log(`  Resolution: ${entry.resolution}`);
  console.log(`  Success: ${entry.success}`);
  console.log(`  Timestamp: ${new Date(entry.timestamp).toISOString()}`);
});
```

### 11.2 Event Emission

```typescript
reflection.setEventEmitter(event => {
  if (event.type === 'reflectionStart') {
    logger.info(`Reflection started for ${event.node.name}`);
  } else if (event.type === 'reflectionEnd') {
    logger.info(`Reflection ended: ${event.success ? 'success' : 'failed'}`);
  }
});
```

### 11.3 Metrics to Track

- Reflection trigger frequency
- Retry success rate
- Common error types
- Average attempts before success
- Reflection duration

---

## 12. Best Practices

### 12.1 DO ✅

1. **Use `agent.reflect()` for simple retry scenarios**
   - Already configured
   - Minimal code changes
   - Built-in error handling

2. **Configure appropriate retry limits**
   - Start with 3 attempts
   - Adjust based on error patterns
   - Consider cost vs reliability tradeoffs

3. **Monitor reflection history**
   - Track common failure modes
   - Identify non-retryable errors
   - Optimize retry strategies

4. **Use heuristic mode for fast retries**
   - No additional L API calls
   - Rule-based error classification
   - Suitable for known error patterns

5. **Use agent mode for complex errors**
   - Intelligent error analysis
   - Prompt revision suggestions
   - Worth the extra API cost

### 12.2 DON'T ❌

1. **Don't implement custom retry logic**
   - Unless you have domain-specific requirements
   - Groundswell's system is production-ready
   - Custom implementations add maintenance burden

2. **Don't set unlimited retry attempts**
   - Always use `maxAttempts`
   - Prevent infinite retry loops
   - Control API costs

3. **Don't ignore non-retryable errors**
   - Let Groundswell detect them
   - Prevents unnecessary API calls
   - Faster failure detection

4. **Don't use reflection for rate limiting**
   - Use exponential backoff instead
   - Groundswell marks rate limits as non-retryable
   - Implement proper rate limiting at client level

5. **Don't forget to handle `AgentResponse`**
   - Check `response.status`
   - Handle `response.error`
   - Access `response.data` safely

---

## 13. References and Resources

### 13.1 Groundswell Documentation

**Official Repository**:

- URL: https://github.com/groundswell-ai/groundswell
- Version: 0.0.4
- Installation: `file:.yalc/groundswell` (local development)

**Core Documentation**:

- `/home/dustin/projects/groundswell/README.md` - Main README
- `/home/dustin/projects/groundswell/docs/agent.md` - Agent documentation
- `/home/dustin/projects/groundswell/docs/workflow.md` - Workflow documentation
- `/home/dustin/projects/groundswell/docs/prompt.md` - Prompt documentation

### 13.2 Source Code

**Reflection Implementation**:

- `/home/dustin/projects/groundswell/src/reflection/reflection.ts` - Full implementation
- `/home/dustin/projects/groundswell/src/types/reflection.ts` - Type definitions

**Type Definitions**:

- `/home/dustin/projects/hacky-hack/node_modules/groundswell/dist/reflection/reflection.d.ts`
- `/home/dustin/projects/hacky-hack/node_modules/groundswell/dist/types/reflection.d.ts`
- `/home/dustin/projects/hacky-hack/node_modules/groundswell/dist/core/agent.d.ts`

**Tests**:

- `/home/dustin/projects/hacky-hack/node_modules/groundswell/dist/__tests__/unit/reflection.test.js`

### 13.3 Current Codebase Usage

**Agent Configuration**:

- `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts` - Agent factory with reflection enabled

**Existing Patterns**:

- `/home/dustin/projects/hacky-hack/docs/CUSTOM_AGENTS.md` - Agent development guide
- `/home/dustin/projects/hacky-hack/docs/TESTING.md` - Testing patterns

### 13.4 Key Code Examples

**Agent Reflection Method**:

```typescript
// From: node_modules/groundswell/dist/core/agent.d.ts
class Agent {
  /**
   * Execute a prompt with reflection capabilities
   */
  reflect<T>(
    prompt: Prompt<T>,
    overrides?: PromptOverrides
  ): Promise<AgentResponse<T>>;
}
```

**Reflection Manager Constructor**:

```typescript
// From: node_modules/groundswell/dist/reflection/reflection.d.ts
class ReflectionManager implements ReflectionAPI {
  constructor(config: ReflectionConfig, agent?: Agent);
}
```

**Execute With Reflection Helper**:

```typescript
// From: node_modules/groundswell/dist/reflection/reflection.d.ts
export declare function executeWithReflection<T>(
  fn: () => Promise<T>,
  reflection: ReflectionManager,
  createContext: (
    error: Error,
    attempt: number,
    history: ReflectionEntry[]
  ) => ReflectionContext
): Promise<T>;
```

---

## 14. Conclusion

Groundswell's reflection system provides a comprehensive, production-ready solution for implementing retry logic in AI agent workflows. The system offers:

1. **Intelligent Error Analysis**: Both heuristic and L-powered modes
2. **Flexible Configuration**: Per-agent, per-prompt, and per-workflow settings
3. **Full Observability**: History tracking, event emission, and debugging support
4. **Production-Ready**: Extensive testing, documentation, and real-world usage
5. **Easy Integration**: Minimal code changes required

**Recommendation**: Use Groundswell's built-in reflection system rather than implementing custom retry logic. The system is already configured in the codebase (`enableReflection: true` in all agents) and provides superior capabilities compared to custom implementations.

**Next Steps**:

1. Replace `agent.prompt()` with `agent.reflect()` in critical error-prone paths
2. Add `ReflectionManager` for workflows requiring custom retry limits
3. Monitor reflection history to identify common failure patterns
4. Consider agent-powered reflection for complex error scenarios

**Estimated Implementation Effort**:

- Phase 1 (Basic reflection): 1-2 hours
- Phase 2 (ReflectionManager): 2-4 hours
- Phase 3 (Agent-powered): 4-8 hours (optional)

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-24
**Researcher**: AI Assistant (Claude)
**Status**: Complete
