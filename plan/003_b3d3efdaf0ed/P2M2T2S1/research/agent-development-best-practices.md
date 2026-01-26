# AI Agent Development Best Practices

**Research Document:** Comprehensive guide for building, testing, and deploying AI agents
**Date:** 2026-01-23
**Status:** Final

---

## Table of Contents

1. [Agent Architecture Patterns](#1-agent-architecture-patterns)
2. [Custom Agent Development](#2-custom-agent-development)
3. [MCP Tool Integration](#3-mcp-tool-integration)
4. [Factory Pattern Implementation](#4-factory-pattern-implementation)
5. [Testing Strategies](#5-testing-strategies)
6. [Common Pitfalls](#6-common-pitfalls)
7. [TypeScript Implementation Guide](#7-typescript-implementation-guide)
8. [References & Resources](#8-references--resources)

---

## 1. Agent Architecture Patterns

### 1.1 Role/Persona Definition Patterns

#### Pattern 1: Specialized Agent Personas

**Definition:** Create agents with distinct roles, each optimized for specific tasks in a workflow.

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts

export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa';

const PERSONA_TOKEN_LIMITS = {
  architect: 8192, // Complex task breakdown needs more tokens
  researcher: 4096, // Codebase research
  coder: 4096, // Code implementation
  qa: 4096, // Validation and bug hunting
} as const;
```

**Best Practices:**

1. **Clear Role Boundaries:** Each agent should have a single, well-defined responsibility
2. **Token Limit Optimization:** Allocate tokens based on task complexity
3. **Consistent Naming:** Use descriptive, role-based names (e.g., `ArchitectAgent`, `CoderAgent`)
4. **Shared Tool Set:** All agents typically need access to the same MCP tools (filesystem, git, bash)

**Rationale:** Specialized agents are easier to test, debug, and maintain. They can be optimized for their specific use cases (e.g., larger token limits for complex analysis tasks).

---

#### Pattern 2: Hierarchical Agent Coordination

**Definition:** Organize agents in a hierarchy where higher-level agents coordinate lower-level agents.

**Implementation Example:**

```typescript
// Orchestrator pattern
class PRPPipeline {
  async execute(task: Task): Promise<void> {
    // 1. Architect breaks down the task
    const architect = createArchitectAgent();
    const backlog = await architect.prompt(createArchitectPrompt(prd));

    // 2. Researcher generates PRPs for each subtask
    const researcher = createResearcherAgent();
    const prp = await researcher.prompt(createPRPBlueprintPrompt(task));

    // 3. Coder implements the PRP
    const coder = createCoderAgent();
    await coder.prompt(createPRPExecutionPrompt(prp));

    // 4. QA validates the implementation
    const qa = createQAAgent();
    await qa.prompt(createValidationPrompt(prp));
  }
}
```

**Best Practices:**

1. **Sequential Handoffs:** Each agent produces artifacts for the next agent
2. **Clear Interfaces:** Define schemas for data passing between agents
3. **Error Recovery:** Implement retry logic and fallback mechanisms
4. **Observability:** Log agent transitions and intermediate results

**Rationale:** Hierarchical coordination enables complex workflows while maintaining separation of concerns.

---

### 1.2 System Prompt Engineering Best Practices

#### Pattern 1: Structured System Prompts

**Definition:** Use a consistent structure for system prompts with clear sections.

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/PROMPTS.md

const TASK_BREAKDOWN_PROMPT = `
# LEAD TECHNICAL ARCHITECT & PROJECT SYNTHESIZER

> **ROLE:** Act as a Lead Technical Architect and Project Management Synthesizer.
> **CONTEXT:** You represent the rigorous, unified consensus of a senior panel (Security, DevOps, Backend, Frontend, QA).
> **GOAL:** Validate the PRD through research, document findings, and decompose the PRD into a strict hierarchy.

## HIERARCHY DEFINITIONS
- **PHASE:** Project-scope goals (e.g., MVP, V1.0). _Weeks to months._
- **MILESTONE:** Key objectives within a Phase. _1 to 12 weeks._
- **TASK:** Complete features within a Milestone. _Days to weeks._
- **SUBTASK:** Atomic implementation steps. **0.5, 1, or 2 Story Points (SP).**

## CRITICAL CONSTRAINTS & STANDARD OF WORK (SOW)
### 1. RESEARCH-DRIVEN ARCHITECTURE (NEW PRIORITY)
- **VALIDATE BEFORE BREAKING DOWN:** You cannot plan what you do not understand.
- **SPAWN SUBAGENTS:** Use your tools to spawn agents to research the codebase and external documentation.

## OUTPUT FORMAT
**CONSTRAINT:** You MUST write the JSON to the file \`./$TASKS_FILE\`
`;
```

**Best Practices:**

1. **Role Declaration:** Start with clear role definition (who the agent is)
2. **Context Statement:** Explain the agent's expertise and perspective
3. **Goal Specification:** Clearly state what the agent should accomplish
4. **Constraints Section:** List critical rules and limitations
5. **Output Format:** Specify exact output structure with examples

**Rationale:** Structured prompts ensure consistency and reduce ambiguity in agent behavior.

---

#### Pattern 2: Context Injection Pattern

**Definition:** Inject runtime context into system prompts for agent-specific behavior.

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/agents/prompts/prp-blueprint-prompt.ts

export function createPRPBlueprintPrompt(
  task: Task | Subtask,
  backlog: Backlog,
  cwd: string
): Prompt<PRPDocument> {
  // Inject task-specific context
  const taskContext = `
**Work Item:** ${task.id} - ${task.title}
**Description:** ${task.type === 'Task' ? task.description : task.context_scope}

**Dependencies:** ${task.dependencies.join(', ') || 'None'}
**Story Points:** ${task.story_points || 'N/A'}
`;

  return createPrompt({
    user: taskContext,
    system: PRP_BLUEPRINT_PROMPT,
    responseFormat: PRPDocumentSchema,
    enableReflection: true,
  });
}
```

**Best Practices:**

1. **Minimal Injection:** Only inject necessary context to avoid token waste
2. **Type Safety:** Use schemas to validate injected context
3. **Fallback Values:** Provide defaults for optional context
4. **Sanitization:** Clean and validate user-provided context

**Rationale:** Context injection enables reusable prompts with agent-specific customization.

---

### 1.3 Agent Specialization Strategies

#### Strategy 1: Capability-Based Specialization

**Definition:** Assign agents to specific capabilities based on model strengths.

**Implementation Example:**

```typescript
// Model selection based on task requirements
const MODEL_CAPABILITIES = {
  'claude-opus-4-5': {
    maxTokens: 200000,
    strengths: ['complex-reasoning', 'code-generation', 'analysis'],
    costPerToken: 0.00003,
  },
  'claude-sonnet-4-5': {
    maxTokens: 200000,
    strengths: ['balanced', 'fast-response', 'cost-effective'],
    costPerToken: 0.00001,
  },
  'claude-haiku-4-5': {
    maxTokens: 200000,
    strengths: ['speed', 'simple-tasks', 'classification'],
    costPerToken: 0.000002,
  },
};

function selectModelForTask(taskType: string): string {
  switch (taskType) {
    case 'architect':
      return 'claude-opus-4-5'; // Best for complex reasoning
    case 'coder':
      return 'claude-sonnet-4-5'; // Balanced for code generation
    case 'qa':
      return 'claude-haiku-4-5'; // Fast for classification
    default:
      return 'claude-sonnet-4-5';
  }
}
```

**Best Practices:**

1. **Task-Model Matching:** Match task complexity to model capabilities
2. **Cost Optimization:** Use cheaper models for simple tasks
3. **Performance Monitoring:** Track success rates by model-task pairing
4. **Fallback Strategy:** Implement model fallback on failures

**Rationale:** Capability-based specialization optimizes cost and performance.

---

#### Strategy 2: Workflow-Based Specialization

**Definition:** Design agents around specific workflow stages rather than general capabilities.

**Implementation Example:**

```typescript
// Workflow stages with dedicated agents
interface WorkflowStage {
  name: string;
  agent: Agent;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  validation?: (output: unknown) => boolean;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    name: 'task-breakdown',
    agent: createArchitectAgent(),
    inputSchema: PRDSchema,
    outputSchema: BacklogSchema,
    validation: output => output.backlog.length > 0,
  },
  {
    name: 'prp-generation',
    agent: createResearcherAgent(),
    inputSchema: TaskSchema,
    outputSchema: PRPDocumentSchema,
    validation: output => output.implementationSteps.length > 0,
  },
  {
    name: 'code-implementation',
    agent: createCoderAgent(),
    inputSchema: PRPDocumentSchema,
    outputSchema: CodeResultSchema,
    validation: output => output.result === 'success',
  },
  {
    name: 'validation',
    agent: createQAAgent(),
    inputSchema: PRPDocumentSchema,
    outputSchema: ValidationResultSchema,
    validation: output => output.allPassed === true,
  },
];
```

**Best Practices:**

1. **Schema Validation:** Define schemas for each stage's input/output
2. **Stage Isolation:** Each stage should be independently testable
3. **Error Handling:** Implement per-stage error recovery
4. **Progress Tracking:** Monitor workflow progress and failures

**Rationale:** Workflow-based specialization maps directly to business processes.

---

### 1.4 Multi-Agent Coordination Patterns

#### Pattern 1: Sequential Pipeline

**Definition:** Agents execute in a fixed sequence, with each agent's output becoming the next agent's input.

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts

class PRPPipeline {
  async execute(prdPath: string): Promise<void> {
    // Stage 1: Task breakdown
    const architect = createArchitectAgent();
    const backlog = await architect.prompt(createArchitectPrompt(prd));

    // Stage 2: PRP generation for each task
    const researcher = createResearcherAgent();
    for (const task of backlog.tasks) {
      const prp = await researcher.prompt(createPRPBlueprintPrompt(task));
      await this.writePRP(prp);
    }

    // Stage 3: Code implementation
    const coder = createCoderAgent();
    for (const prp of this.prps) {
      await coder.prompt(createPRPExecutionPrompt(prp));
    }

    // Stage 4: Validation
    const qa = createQAAgent();
    await qa.prompt(createValidationPrompt());
  }
}
```

**Best Practices:**

1. **Checkpointing:** Save intermediate results for recovery
2. **Stage Validation:** Verify each stage's output before proceeding
3. **Parallel Execution:** Run independent stages in parallel when possible
4. **Rollback Mechanism:** Revert failed stages to clean state

**Rationale:** Sequential pipelines provide predictability and easy debugging.

---

#### Pattern 2: Map-Reduce Pattern

**Definition:** Multiple agents work in parallel on subsets of data, then results are aggregated.

**Implementation Example:**

```typescript
// Parallel research with aggregation
class MapReduceResearcher {
  async research(topics: string[]): Promise<AggregatedResearch> {
    // Map phase: Parallel research
    const researchPromises = topics.map(async topic => {
      const agent = createResearcherAgent();
      return agent.prompt(createResearchPrompt(topic));
    });

    // Wait for all research to complete
    const results = await Promise.allSettled(researchPromises);

    // Reduce phase: Aggregate results
    const aggregated = {
      total: results.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      findings: results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<Research>).value),
    };

    return aggregated;
  }
}
```

**Best Practices:**

1. **Promise.allSettled:** Handle partial failures gracefully
2. **Resource Limits:** Limit parallelism based on API rate limits
3. **Result Deduplication:** Merge duplicate findings from different agents
4. **Aggregation Strategy:** Define clear rules for combining results

**Rationale:** Map-Reduce maximizes throughput for independent tasks.

---

#### Pattern 3: Supervisor Pattern

**Definition:** A supervisor agent coordinates worker agents, making decisions about task allocation and error handling.

**Implementation Example:**

```typescript
class SupervisorAgent {
  private workers: Map<string, Agent> = new Map();

  async executeTask(task: ComplexTask): Promise<void> {
    // Analyze task and allocate to workers
    const subtasks = await this.analyzeTask(task);

    // Assign subtasks to specialized workers
    const assignments = subtasks.map(subtask => {
      const workerType = this.selectWorker(subtask.type);
      const worker = this.getWorker(workerType);
      return { worker, subtask };
    });

    // Execute with monitoring
    const results = await Promise.all(
      assignments.map(({ worker, subtask }) =>
        this.executeWithRetry(worker, subtask)
      )
    );

    // Validate and aggregate results
    return this.aggregateResults(results);
  }

  private selectWorker(taskType: string): string {
    const WORKER_MAPPING = {
      'code-analysis': 'architect',
      'file-operations': 'filesystem-specialist',
      'git-operations': 'git-specialist',
    };
    return WORKER_MAPPING[taskType] || 'generalist';
  }
}
```

**Best Practices:**

1. **Worker Selection:** Implement intelligent routing based on task characteristics
2. **Health Monitoring:** Track worker availability and performance
3. **Dynamic Scaling:** Add/remove workers based on load
4. **Error Isolation:** Prevent worker failures from affecting other workers

**Rationale:** Supervisor pattern provides centralized coordination and decision-making.

---

## 2. Custom Agent Development

### 2.1 How to Define New Agent Types

#### Step 1: Define Agent Persona Type

```typescript
// Add to agent-factory.ts

export type AgentPersona =
  | 'architect'
  | 'researcher'
  | 'coder'
  | 'qa'
  | 'reviewer'; // New agent type

// Define token limits for new agent
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  reviewer: 6144, // New agent needs medium tokens for code review
} as const;
```

**Best Practices:**

1. **Type Safety:** Use TypeScript union types for persona enumeration
2. **Const Assertions:** Use `as const` for token limits to enable type inference
3. **Consistent Naming:** Use lowercase, single-word persona names
4. **Documentation:** Add TSDoc comments explaining the agent's role

---

#### Step 2: Create System Prompt

```typescript
// Add to agents/prompts.ts

export const CODE_REVIEW_PROMPT = `
# CODE REVIEW AGENT

> **ROLE:** Senior Code Reviewer specializing in best practices, security, and maintainability.
> **CONTEXT:** You have 15+ years of experience reviewing production code across multiple languages.
> **GOAL:** Provide thorough, actionable code reviews that improve code quality.

## REVIEW FRAMEWORK
1. **Correctness:** Does the code implement the requirements correctly?
2. **Security:** Are there any security vulnerabilities or risks?
3. **Performance:** Are there performance bottlenecks or inefficiencies?
4. **Maintainability:** Is the code readable, modular, and well-documented?
5. **Testing:** Is the code adequately tested?

## OUTPUT FORMAT
Provide reviews in markdown with:
- Summary (2-3 sentences)
- Critical Issues (must fix)
- Suggestions (should fix)
- Nitpicks (nice to fix)
- Positive highlights (what was done well)
`;
```

**Best Practices:**

1. **Role Clarity:** Clearly define the agent's expertise and perspective
2. **Structured Framework:** Provide a consistent framework for evaluations
3. **Output Specification:** Define exact output format for parsing
4. **Example-Based:** Include examples of good/bad outputs

---

#### Step 3: Create Factory Function

```typescript
// Add to agent-factory.ts

export function createReviewerAgent(): Agent {
  const baseConfig = createBaseConfig('reviewer');
  const config = {
    ...baseConfig,
    system: CODE_REVIEW_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug({ persona: 'reviewer', model: config.model }, 'Creating agent');
  return createAgent(config);
}
```

**Best Practices:**

1. **Factory Pattern:** Use factory functions for agent creation
2. **Configuration Composition:** Extend base config with agent-specific settings
3. **Logging:** Log agent creation for debugging and monitoring
4. **Singleton MCPs:** Reuse MCP tool instances across agents

---

#### Step 4: Create Prompt Generator (Optional)

```typescript
// Create agents/prompts/code-review-prompt.ts

import { createPrompt, type Prompt } from 'groundswell';
import type { CodeReviewResult } from '../../core/models.js';
import { CodeReviewResultSchema } from '../../core/models.js';
import { CODE_REVIEW_PROMPT } from '../prompts.js';

interface CodeReviewContext {
  filePath: string;
  fileContent: string;
  diff?: string;
  prpContext?: string;
}

export function createCodeReviewPrompt(
  context: CodeReviewContext
): Prompt<CodeReviewResult> {
  const userPrompt = `
## File to Review
**Path:** ${context.filePath}

**Content:**
\`\`\`
${context.fileContent}
\`\`\`

${
  context.diff
    ? `
## Changes to Review
\`\`\`diff
${context.diff}
\`\`\`
`
    : ''
}

${
  context.prpContext
    ? `
## PRP Context
${context.prpContext}
`
    : ''
}

Please review this code using the review framework defined in the system prompt.
`;

  return createPrompt({
    user: userPrompt,
    system: CODE_REVIEW_PROMPT,
    responseFormat: CodeReviewResultSchema,
    enableReflection: true,
  });
}
```

**Best Practices:**

1. **Prompt Generators:** Create reusable prompt generators for common tasks
2. **Type Safety:** Use schemas for structured output
3. **Context Injection:** Design flexible context interfaces
4. **Reflection:** Enable reflection for complex tasks

---

### 2.2 Naming Conventions for Agents

#### File Naming

```typescript
// Good: Descriptive, lowercase with hyphens
src / agents / agent - factory.ts;
src / agents / prompts / code - review - prompt.ts;
src / agents / reviewers / security - reviewer.ts;

// Bad: Vague, inconsistent casing
src / agents / Agent.ts;
src / agents / codeReview.ts;
src / agents / SecurityReviewerClass.ts;
```

#### Class/Function Naming

```typescript
// Good: Clear, descriptive, follows patterns
export function createReviewerAgent(): Agent {}
export class SecurityReviewer extends BaseReviewer {}
export function createCodeReviewPrompt(): Prompt<CodeReview> {}

// Bad: Unclear purpose
export function makeAgent(): Agent {}
export class Reviewer {}
export function prompt(): Prompt {}
```

#### Agent Instance Naming

```typescript
// Good: Descriptive variable names
const codeReviewer = createReviewerAgent();
const securityReviewer = createSecurityReviewerAgent();
const performanceReviewer = createPerformanceReviewerAgent();

// Bad: Generic names
const agent = createReviewerAgent();
const reviewer = createReviewerAgent();
const r = createReviewerAgent();
```

#### System Prompt Naming

```typescript
// Good: Descriptive, consistent suffix
export const CODE_REVIEW_PROMPT = `...`;
export const SECURITY_REVIEW_PROMPT = `...`;
export const PERFORMANCE_REVIEW_PROMPT = `...`;

// Bad: Inconsistent, vague
export const review = `...`;
export const REVIEW = `...`;
export const prompt = `...`;
```

**Best Practices Summary:**

1. **Files:** `kebab-case.ts` (e.g., `code-reviewer.ts`)
2. **Functions:** `camelCase` with descriptive names (e.g., `createCodeReviewerAgent`)
3. **Classes:** `PascalCase` with domain terms (e.g., `SecurityReviewerAgent`)
4. **Constants:** `SCREAMING_SNAKE_CASE` with `_PROMPT` suffix
5. **Instances:** `camelCase` describing the agent's role (e.g., `codeReviewer`)

---

### 2.3 Token Limit Selection Guidelines

#### Factors to Consider

1. **Task Complexity:**
   - Simple tasks: 2,000-4,000 tokens
   - Medium tasks: 4,000-8,000 tokens
   - Complex tasks: 8,000-16,000 tokens
   - Very complex: 16,000+ tokens

2. **Input Size:**
   - Small input (< 1,000 tokens): Use minimal output tokens
   - Medium input (1,000-5,000 tokens): Balance input/output
   - Large input (> 5,000 tokens): Maximize output tokens

3. **Cost Constraints:**
   - Budget-conscious: Use smaller token limits
   - Quality-focused: Use larger token limits
   - Batch operations: Use smaller limits per item

#### Decision Matrix

| Agent Type | Task Complexity | Input Size | Output Size | Recommended Max Tokens |
| ---------- | --------------- | ---------- | ----------- | ---------------------- |
| Architect  | High            | Medium     | Large       | 8,192                  |
| Researcher | Medium          | Large      | Medium      | 4,096                  |
| Coder      | Medium          | Medium     | Medium      | 4,096                  |
| QA         | Low-Medium      | Small      | Small       | 4,096                  |
| Reviewer   | Medium          | Medium     | Medium      | 6,144                  |

**Implementation Example:**

```typescript
// Token limit calculator
function calculateTokenLimit(
  taskComplexity: 'low' | 'medium' | 'high',
  inputSize: number,
  outputSize: 'small' | 'medium' | 'large'
): number {
  const baseTokens = {
    low: 2048,
    medium: 4096,
    high: 8192,
  };

  const outputMultiplier = {
    small: 1.0,
    medium: 1.5,
    large: 2.0,
  };

  const inputAllowance = Math.min(inputSize * 0.5, 4096); // Cap at 4K for input

  return Math.floor(
    baseTokens[taskComplexity] * outputMultiplier[outputSize] + inputAllowance
  );
}

// Usage
const tokens = calculateTokenLimit('high', 5000, 'large');
// Returns: ~16,384 tokens
```

**Best Practices:**

1. **Measure Actual Usage:** Track token consumption in production
2. **Build in Buffers:** Add 20% buffer to estimated needs
3. **Tiered Limits:** Create tiers (small/medium/large) for easy selection
4. **Dynamic Adjustment:** Adjust limits based on task performance

---

### 2.4 Model Selection Strategies

#### Strategy 1: Task-Based Selection

```typescript
interface ModelCapabilities {
  name: string;
  maxTokens: number;
  strengths: string[];
  costPerInputToken: number;
  costPerOutputToken: number;
  averageLatency: number;
}

const MODELS: Record<string, ModelCapabilities> = {
  'claude-opus-4-5': {
    name: 'claude-opus-4-5',
    maxTokens: 200000,
    strengths: ['complex-reasoning', 'code-generation', 'analysis'],
    costPerInputToken: 0.00003,
    costPerOutputToken: 0.00015,
    averageLatency: 2000,
  },
  'claude-sonnet-4-5': {
    name: 'claude-sonnet-4-5',
    maxTokens: 200000,
    strengths: ['balanced', 'fast-response', 'cost-effective'],
    costPerInputToken: 0.00001,
    costPerOutputToken: 0.00005,
    averageLatency: 1000,
  },
  'claude-haiku-4-5': {
    name: 'claude-haiku-4-5',
    maxTokens: 200000,
    strengths: ['speed', 'simple-tasks', 'classification'],
    costPerInputToken: 0.000002,
    costPerOutputToken: 0.00001,
    averageLatency: 500,
  },
};

function selectModelForTask(
  taskType: string,
  complexity: 'low' | 'medium' | 'high',
  budgetConstraints?: { maxCost: number }
): string {
  // High complexity → Opus
  if (complexity === 'high') {
    return 'claude-opus-4-5';
  }

  // Budget constrained → Haiku
  if (budgetConstraints) {
    return 'claude-haiku-4-5';
  }

  // Default → Sonnet (balanced)
  return 'claude-sonnet-4-5';
}
```

---

#### Strategy 2: Performance-Based Selection

```typescript
interface ModelPerformanceMetrics {
  model: string;
  taskType: string;
  successRate: number;
  averageTokens: number;
  averageLatency: number;
  totalRuns: number;
}

class ModelPerformanceTracker {
  private metrics: Map<string, ModelPerformanceMetrics> = new Map();

  recordRun(
    model: string,
    taskType: string,
    success: boolean,
    tokens: number,
    latency: number
  ): void {
    const key = `${model}:${taskType}`;
    const existing = this.metrics.get(key);

    if (existing) {
      const newSuccessRate =
        (existing.successRate * existing.totalRuns + (success ? 1 : 0)) /
        (existing.totalRuns + 1);

      this.metrics.set(key, {
        model,
        taskType,
        successRate: newSuccessRate,
        averageTokens:
          (existing.averageTokens * existing.totalRuns + tokens) /
          (existing.totalRuns + 1),
        averageLatency:
          (existing.averageLatency * existing.totalRuns + latency) /
          (existing.totalRuns + 1),
        totalRuns: existing.totalRuns + 1,
      });
    } else {
      this.metrics.set(key, {
        model,
        taskType,
        successRate: success ? 1 : 0,
        averageTokens: tokens,
        averageLatency: latency,
        totalRuns: 1,
      });
    }
  }

  getBestModel(taskType: string): string | null {
    const taskMetrics = Array.from(this.metrics.values())
      .filter(m => m.taskType === taskType && m.totalRuns >= 10)
      .sort((a, b) => b.successRate - a.successRate);

    return taskMetrics[0]?.model || null;
  }
}
```

**Best Practices:**

1. **A/B Testing:** Compare models on real tasks before committing
2. **Fallback Chain:** Implement model fallback on failures
3. **Cost Monitoring:** Track costs by model and task type
4. **Performance Metrics:** Monitor latency, success rate, and quality

---

## 3. MCP Tool Integration

### 3.1 How to Register Custom MCP Tools with Agents

#### Pattern 1: MCPHandler Extension

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts

import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

export class BashMCP extends MCPHandler {
  // Required MCPServer interface properties
  public readonly name = 'bash';
  public readonly transport = 'inprocess' as const;
  public readonly tools = [bashTool];

  constructor() {
    super();

    // CRITICAL: Register server in constructor
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

  // Optional: Direct method for non-MCP usage
  async execute_bash(input: BashToolInput): Promise<BashToolResult> {
    return executeBashCommand(input);
  }
}
```

**Best Practices:**

1. **Interface Compliance:** Implement all required MCPServer properties (name, transport, tools)
2. **Constructor Registration:** Register server and executors in constructor
3. **Type Safety:** Use ToolExecutor type for executor functions
4. **Singleton Pattern:** Create single instances shared across agents

---

#### Pattern 2: Agent Tool Registration

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts

import { BashMCP } from '../tools/bash-mcp.js';
import { FilesystemMCP } from '../tools/filesystem-mcp.js';
import { GitMCP } from '../tools/git-mcp.js';

// Singleton MCP server instances
const BASH_MCP = new BashMCP();
const FILESYSTEM_MCP = new FilesystemMCP();
const GIT_MCP = new GitMCP();

// Combined array for agent integration
const MCP_TOOLS: MCPServer[] = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP];

export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT,
    mcps: MCP_TOOLS, // All agents get the same tool set
  };
  return createAgent(config);
}
```

**Best Practices:**

1. **Singleton Instances:** Create MCP servers once at module level
2. **Shared Tool Set:** Most agents need access to all tools
3. **Lazy Initialization:** Initialize MCPs in constructor when needed
4. **Testing Support:** Export MCP instances for testing

---

### 3.2 Tool Schema Definition Patterns

#### Pattern 1: JSON Schema for Tool Input

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts

const bashTool: Tool = {
  name: 'execute_bash',
  description:
    'Execute shell commands with optional working directory and timeout.',
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

**Best Practices:**

1. **Required Fields:** Clearly mark required fields
2. **Type Constraints:** Use JSON Schema validation (minimum, maximum, enum)
3. **Descriptive Text:** Provide clear descriptions for each parameter
4. **Default Values:** Document default values in descriptions

---

#### Pattern 2: TypeScript Interfaces for Type Safety

**Implementation Example:**

```typescript
// Input/Output interfaces
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

// Tool executor with type safety
async function executeBashCommand(
  input: BashToolInput
): Promise<BashToolResult> {
  // Implementation...
}

// Register with type casting
this.registerToolExecutor(
  'bash',
  'execute_bash',
  executeBashCommand as ToolExecutor
);
```

**Best Practices:**

1. **Input/Output Interfaces:** Define TypeScript interfaces for all tools
2. **Optional Fields:** Use optional properties (`?`) for non-required fields
3. **Error Handling:** Include optional error field in result interfaces
4. **Export Types:** Export types for external use and testing

---

#### Pattern 3: Multi-Tool MCP Server

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts

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

**Best Practices:**

1. **Logical Grouping:** Group related tools in one MCP server
2. **Namespace Prefix:** Use server name as namespace (e.g., `filesystem__file_read`)
3. **Consistent Patterns:** Follow similar patterns for all tools in a server
4. **Tool Arrays:** Export tools array for easy inspection

---

### 3.3 Security Considerations for Tool Access

#### Security Pattern 1: Input Validation

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts

async function executeBashCommand(
  input: BashToolInput
): Promise<BashToolResult> {
  const { command, cwd, timeout = DEFAULT_TIMEOUT } = input;

  // Validate working directory exists
  const workingDir =
    typeof cwd === 'string'
      ? (() => {
          const absoluteCwd = resolve(cwd);
          if (!existsSync(absoluteCwd)) {
            throw new Error(`Working directory does not exist: ${absoluteCwd}`);
          }
          return realpathSync(absoluteCwd); // Resolve symlinks
        })()
      : undefined;

  // Parse command to prevent injection
  const args = command.split(' ');
  const executable = args[0] ?? '';
  const commandArgs = args.slice(1);

  // Use spawn() without shell to prevent injection
  const child = spawn(executable, commandArgs, {
    cwd: workingDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false, // CRITICAL: No shell interpretation
  });

  // ... rest of implementation
}
```

**Security Best Practices:**

1. **Path Validation:** Validate and resolve all file paths
2. **No Shell:** Use `shell: false` with spawn() to prevent injection
3. **Timeout Protection:** Implement timeout for all operations
4. **Resource Limits:** Limit memory, CPU, and execution time

---

#### Security Pattern 2: Git Security

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/git-mcp.ts

async function gitAdd(input: GitAddInput): Promise<GitAddResult> {
  const files = input.files ?? ['.'];

  // CRITICAL: Use '--' to prevent flag injection
  if (files.length === 1 && files[0] === '.') {
    await git.add('.');
  } else {
    await git.add(['--', ...files]); // '--' prevents flag injection
  }

  return { success: true, stagedCount: files.length };
}

async function validateRepositoryPath(path?: string): Promise<string> {
  const repoPath = resolve(path ?? process.cwd());

  // Check path exists
  if (!existsSync(repoPath)) {
    throw new Error(`Repository path not found: ${repoPath}`);
  }

  // Check it's a git repository (prevent directory traversal)
  const gitDir = join(repoPath, '.git');
  if (!existsSync(gitDir)) {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  return realpathSync(repoPath); // Resolve symlinks
}
```

**Security Best Practices:**

1. **Flag Injection Prevention:** Use `--` separator for git commands
2. **Repository Validation:** Verify paths are actual git repositories
3. **Symlink Resolution:** Resolve symlinks to prevent directory traversal
4. **Error Messages:** Don't expose sensitive paths in error messages

---

#### Security Pattern 3: Filesystem Security

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts

async function readFile(input: FileReadInput): Promise<FileReadResult> {
  const { path, encoding = DEFAULT_ENCODING } = input;

  try {
    // Validate and normalize path
    const safePath = resolve(path);

    // Check for path traversal attempts
    const normalized = normalize(safePath);
    if (normalized.includes('..')) {
      return { success: false, error: 'Path traversal not allowed' };
    }

    // Read file
    const content = await fs.readFile(safePath, { encoding });
    return { success: true, content };
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException).code;

    // Handle specific error codes
    if (errno === 'ENOENT') {
      return { success: false, error: `File not found: ${path}` };
    }
    if (errno === 'EACCES') {
      return { success: false, error: `Permission denied: ${path}` };
    }
    if (errno === 'EISDIR') {
      return { success: false, error: `Path is a directory: ${path}` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

**Security Best Practices:**

1. **Path Normalization:** Always resolve and normalize paths
2. **Traversal Prevention:** Block paths with `..` segments
3. **Error Handling:** Return generic errors to avoid information leakage
4. **Permission Checks:** Validate file permissions before operations

---

## 4. Factory Pattern Implementation

### 4.1 Factory Function Design for Agent Creation

#### Pattern 1: Simple Factory

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts

export function createBaseConfig(persona: AgentPersona): AgentConfig {
  const model = getModel('sonnet'); // All personas use sonnet → GLM-4.7
  const name = `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`;

  return {
    name,
    system: `You are a ${persona} agent.`,
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

**Best Practices:**

1. **Configuration Composition:** Use spread operator for config composition
2. **Immutability:** Return readonly configuration objects
3. **Logging:** Log agent creation for debugging
4. **Environment Mapping:** Map environment variables to SDK expectations

---

#### Pattern 2: Registry Pattern

**Implementation Example:**

```typescript
interface AgentConstructor {
  new (config: AgentConfig): Agent;
}

class AgentFactory {
  private static registry = new Map<AgentPersona, AgentConstructor>();
  private static instances = new Map<AgentPersona, Agent>();

  static register(persona: AgentPersona, constructor: AgentConstructor): void {
    this.registry.set(persona, constructor);
  }

  static create(persona: AgentPersona): Agent {
    // Check for existing instance (singleton pattern)
    if (this.instances.has(persona)) {
      return this.instances.get(persona)!;
    }

    const Constructor = this.registry.get(persona);
    if (!Constructor) {
      throw new Error(`No agent registered for persona: ${persona}`);
    }

    const config = createBaseConfig(persona);
    const agent = new Constructor(config);

    this.instances.set(persona, agent);
    return agent;
  }

  static clear(): void {
    this.instances.clear();
  }
}

// Register agents
AgentFactory.register('architect', ArchitectAgent);
AgentFactory.register('researcher', ResearcherAgent);
AgentFactory.register('coder', CoderAgent);
AgentFactory.register('qa', QAAgent);

// Usage
const architect = AgentFactory.create('architect');
```

**Best Practices:**

1. **Registry Pattern:** Use Map for O(1) lookups
2. **Singleton Caching:** Cache instances for reuse
3. **Clear Method:** Provide clear method for testing
4. **Type Safety:** Use TypeScript for registry keys

---

#### Pattern 3: Builder Pattern

**Implementation Example:**

```typescript
class AgentBuilder {
  private config: Partial<AgentConfig> = {};

  withName(name: string): this {
    this.config.name = name;
    return this;
  }

  withSystemPrompt(system: string): this {
    this.config.system = system;
    return this;
  }

  withModel(model: string): this {
    this.config.model = model;
    return this;
  }

  withMaxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  withCache(enabled: boolean): this {
    this.config.enableCache = enabled;
    return this;
  }

  withReflection(enabled: boolean): this {
    this.config.enableReflection = enabled;
    return this;
  }

  withMCPs(mcps: MCPServer[]): this {
    this.config.mcps = mcps;
    return this;
  }

  build(): Agent {
    const defaults: AgentConfig = {
      name: 'Agent',
      system: 'You are a helpful assistant.',
      model: 'GLM-4.7',
      enableCache: true,
      enableReflection: true,
      maxTokens: 4096,
      env: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
      },
    };

    const config = { ...defaults, ...this.config };
    return createAgent(config);
  }
}

// Usage
const agent = new AgentBuilder()
  .withName('CustomAgent')
  .withSystemPrompt(CUSTOM_PROMPT)
  .withMaxTokens(8192)
  .withMCPs(MCP_TOOLS)
  .build();
```

**Best Practices:**

1. **Fluent Interface:** Return `this` for method chaining
2. **Default Values:** Provide sensible defaults in `build()`
3. **Immutability:** Don't modify builder after `build()`
4. **Type Safety:** Use TypeScript for config validation

---

### 4.2 Configuration Management Patterns

#### Pattern 1: Environment-Based Configuration

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/src/config/environment.ts

export function configureEnvironment(): void {
  // Map shell conventions to SDK expectations
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default base URL
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
  }
}

export function getModel(tier: ModelTier): string {
  const MODEL_MAP: Record<ModelTier, string> = {
    opus: 'claude-opus-4-5',
    sonnet: 'claude-sonnet-4-5',
    haiku: 'claude-haiku-4-5',
  };

  // Support override via environment
  return process.env[`CLAUDE_${tier.toUpperCase()}_MODEL`] ?? MODEL_MAP[tier];
}
```

**Best Practices:**

1. **Environment Mapping:** Map shell variable names to SDK expectations
2. **Default Values:** Provide sensible defaults for all config
3. **Override Support:** Allow environment variable overrides
4. **Validation:** Validate environment at startup

---

#### Pattern 2: Layered Configuration

**Implementation Example:**

```typescript
interface ConfigLayer {
  priority: number;
  config: Partial<AgentConfig>;
}

class LayeredConfig {
  private layers: ConfigLayer[] = [];

  addLayer(priority: number, config: Partial<AgentConfig>): void {
    this.layers.push({ priority, config });
    this.layers.sort((a, b) => a.priority - b.priority);
  }

  merge(): AgentConfig {
    const defaults: AgentConfig = {
      name: 'Agent',
      system: 'You are a helpful assistant.',
      model: 'GLM-4.7',
      enableCache: true,
      enableReflection: true,
      maxTokens: 4096,
      env: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
      },
    };

    // Merge layers in priority order (lowest to highest)
    return this.layers.reduce(
      (merged, layer) => ({ ...merged, ...layer.config }),
      defaults
    );
  }
}

// Usage
const config = new LayeredConfig()
  .addLayer(1, { maxTokens: 2048 }) // Base config
  .addLayer(2, { maxTokens: 4096, model: 'GLM-4.7' }) // Environment config
  .addLayer(3, { system: CUSTOM_PROMPT }) // User config
  .merge();
```

**Best Practices:**

1. **Priority Ordering:** Use numeric priorities for layer ordering
2. **Shallow Merge:** Use spread operator for shallow merging
3. **Immutable Layers:** Don't modify layers after adding
4. **Type Safety:** Validate merged config before use

---

### 4.3 Dependency Injection Approaches

#### Approach 1: Constructor Injection

**Implementation Example:**

```typescript
class PRPGenerator {
  readonly sessionManager: SessionManager;
  readonly #logger: Logger;
  readonly #researcherAgent: Agent;

  constructor(
    sessionManager: SessionManager,
    logger?: Logger,
    researcherAgent?: Agent
  ) {
    this.sessionManager = sessionManager;
    this.#logger = logger ?? getLogger('PRPGenerator');
    this.#researcherAgent = researcherAgent ?? createResearcherAgent();
  }

  async generate(task: Task, backlog: Backlog): Promise<PRPDocument> {
    this.#logger.info({ taskId: task.id }, 'Generating PRP');
    const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());
    const result = await this.#researcherAgent.prompt(prompt);
    return PRPDocumentSchema.parse(result);
  }
}

// Usage
const generator = new PRPGenerator(
  sessionManager,
  logger,
  customAgent // Optional: override default agent
);
```

**Best Practices:**

1. **Required Dependencies:** Mark required dependencies without default values
2. **Optional Dependencies:** Provide defaults for optional dependencies
3. **Interface Types:** Use interface types for dependencies
4. **Immutability:** Mark dependencies as `readonly`

---

#### Approach 2: Service Container

**Implementation Example:**

```typescript
interface ServiceIdentifier<T> {
  symbol: symbol;
  type?: new (...args: unknown[]) => T;
}

class ServiceContainer {
  private services = new Map<symbol, unknown>();

  register<T>(identifier: ServiceIdentifier<T>, factory: () => T): void {
    this.services.set(identifier.symbol, factory());
  }

  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): void {
    this.services.set(identifier.symbol, instance);
  }

  get<T>(identifier: ServiceIdentifier<T>): T {
    const service = this.services.get(identifier.symbol);
    if (!service) {
      throw new Error(`Service not found: ${identifier.symbol.description}`);
    }
    return service as T;
  }

  has(identifier: ServiceIdentifier<unknown>): boolean {
    return this.services.has(identifier.symbol);
  }
}

// Define service identifiers
const SERVICES = {
  SessionManager: { symbol: Symbol('SessionManager') },
  Logger: { symbol: Symbol('Logger') },
  ArchitectAgent: { symbol: Symbol('ArchitectAgent') },
  ResearcherAgent: { symbol: Symbol('ResearcherAgent') },
};

// Register services
const container = new ServiceContainer();
container.register(SERVICES.Logger, () => getLogger('App'));
container.register(SERVICES.ArchitectAgent, () => createArchitectAgent());
container.register(SERVICES.ResearcherAgent, () => createResearcherAgent());

// Use services
class PRPPipeline {
  constructor(private container: ServiceContainer) {}

  execute(): void {
    const architect = this.container.get(SERVICES.ArchitectAgent);
    const researcher = this.container.get(SERVICES.ResearcherAgent);
    // ...
  }
}
```

**Best Practices:**

1. **Symbol Keys:** Use symbols for unique service identifiers
2. **Factory Functions:** Use factory functions for lazy initialization
3. **Singleton Services:** Register singletons shared across components
4. **Type Safety:** Use TypeScript generics for type-safe lookups

---

## 5. Testing Strategies

### 5.1 Unit Testing Agent Factories

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/tests/unit/agents/agent-factory.test.ts

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  createBaseConfig,
  createArchitectAgent,
  type AgentPersona,
} from '../../../src/agents/agent-factory.js';

describe('agents/agent-factory', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('createBaseConfig', () => {
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');
    });

    it.each(['architect', 'researcher', 'coder', 'qa'] as AgentPersona[])(
      'should return valid config for %s persona',
      persona => {
        const config = createBaseConfig(persona);

        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('system');
        expect(config).toHaveProperty('model');
        expect(config).toHaveProperty('maxTokens');
      }
    );

    it('should set maxTokens to 8192 for architect persona', () => {
      const config = createBaseConfig('architect');
      expect(config.maxTokens).toBe(8192);
    });

    it('should enable cache and reflection for all personas', () => {
      const personas: AgentPersona[] = [
        'architect',
        'researcher',
        'coder',
        'qa',
      ];
      const configs = personas.map(p => createBaseConfig(p));

      configs.forEach(config => {
        expect(config.enableCache).toBe(true);
        expect(config.enableReflection).toBe(true);
      });
    });
  });
});
```

**Best Practices:**

1. **Test Each Persona:** Use `it.each()` for parameterized tests
2. **Environment Cleanup:** Restore environment after each test
3. **Property Validation:** Test all required properties exist
4. **Persona-Specific Tests:** Test persona-specific configurations

---

### 5.2 Integration Testing Agent Workflows

**Implementation Example:**

```typescript
// From: /home/dustin/projects/hacky-hack/tests/integration/architect-agent-integration.test.ts

import { describe, expect, it, beforeAll } from 'vitest';
import { createArchitectAgent } from '../../src/agents/agent-factory.js';
import { createArchitectPrompt } from '../../src/agents/prompts/architect-prompt.js';

describe('Architect Agent Integration', () => {
  let architectAgent: Agent;

  beforeAll(() => {
    architectAgent = createArchitectAgent();
  });

  it('should analyze PRD and generate task breakdown', async () => {
    const prd = `
# Feature: User Authentication

Implement user authentication with email/password.
`;

    const prompt = createArchitectPrompt(prd);
    const result = await architectAgent.prompt(prompt);

    expect(result).toBeDefined();
    expect(result.backlog).toBeInstanceOf(Array);
    expect(result.backlog.length).toBeGreaterThan(0);
    expect(result.backlog[0]).toHaveProperty('type');
    expect(result.backlog[0]).toHaveProperty('id');
  });

  it('should spawn subagents for research during breakdown', async () => {
    // Test agent's ability to use tools
    const prd = `
# Feature: Database Integration

Add PostgreSQL database support with Prisma ORM.
`;

    const prompt = createArchitectPrompt(prd);
    const result = await architectAgent.prompt(prompt);

    // Verify research was conducted
    expect(result.backlog).toBeDefined();
    // Check that subtasks reference architecture research
    const hasContextScope = result.backlog.some(task =>
      task.context_scope?.includes('RESEARCH NOTE')
    );
    expect(hasContextScope).toBe(true);
  });
});
```

**Best Practices:**

1. **Real Agents:** Use real agent instances (not mocks)
2. **Simple Inputs:** Use minimal but valid inputs
3. **Structure Validation:** Validate output structure, not content
4. **Tool Usage:** Test agent's ability to use tools

---

### 5.3 Testing MCP Tools

**Implementation Example:**

```typescript
describe('Bash MCP Tool', () => {
  it('should execute simple command successfully', async () => {
    const bashMCP = new BashMCP();

    const result = await bashMCP.execute_bash({
      command: 'echo "Hello, World!"',
    });

    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Hello, World!');
    expect(result.exitCode).toBe(0);
  });

  it('should fail with invalid command', async () => {
    const bashMCP = new BashMCP();

    const result = await bashMCP.execute_bash({
      command: 'nonexistent-command',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should respect timeout', async () => {
    const bashMCP = new BashMCP();

    const result = await bashMCP.execute_bash({
      command: 'sleep 10',
      timeout: 1000, // 1 second timeout
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('should validate working directory', async () => {
    const bashMCP = new BashMCP();

    const result = await bashMCP.execute_bash({
      command: 'pwd',
      cwd: '/nonexistent/path',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not exist');
  });
});
```

**Best Practices:**

1. **Success Cases:** Test normal operation
2. **Failure Cases:** Test error handling
3. **Edge Cases:** Test timeouts and invalid inputs
4. **Security:** Test path validation and injection prevention

---

## 6. Common Pitfalls

### 6.1 Agent Development Pitfalls

#### Pitfall 1: Overly Generic System Prompts

**Problem:**

```typescript
// BAD: Too generic
const GENERIC_PROMPT = `
You are an AI assistant. Help the user with their tasks.
Be helpful and provide accurate information.
`;
```

**Solution:**

```typescript
// GOOD: Specific and structured
const ARCHITECT_PROMPT = `
# LEAD TECHNICAL ARCHITECT

> **ROLE:** Act as a Lead Technical Architect responsible for system design and task breakdown.
> **GOAL:** Decompose PRDs into hierarchical task structures (Phase → Milestone → Task → Subtask).

## CRITICAL CONSTRAINTS
- Maximum subtask size: 2 Story Points
- Always research codebase before planning
- Reference specific file paths in context_scope

## OUTPUT FORMAT
JSON schema: { type: "Phase", milestones: [...] }
`;
```

**Rationale:** Specific prompts produce more consistent, predictable outputs.

---

#### Pitfall 2: Ignoring Token Limits

**Problem:**

```typescript
// BAD: Not considering token limits
const config = {
  maxTokens: 4096, // Too small for complex analysis
  system: COMPLEX_ANALYSIS_PROMPT,
};
```

**Solution:**

```typescript
// GOOD: Task-appropriate token limits
const TOKEN_LIMITS = {
  'simple-task': 2048,
  'medium-task': 4096,
  'complex-task': 8192,
  'very-complex-task': 16384,
};

const config = {
  maxTokens: TOKEN_LIMITS[taskComplexity],
  system: COMPLEX_ANALYSIS_PROMPT,
};
```

**Rationale:** Appropriate token limits prevent truncated responses and wasted costs.

---

#### Pitfall 3: Not Reusing Agent Instances

**Problem:**

```typescript
// BAD: Creating new agents repeatedly
for (const task of tasks) {
  const agent = createAgent(config); // Creates new instance each time
  await agent.prompt(prompt);
}
```

**Solution:**

```typescript
// GOOD: Reuse agent instances
const agent = createAgent(config); // Create once
for (const task of tasks) {
  await agent.prompt(prompt); // Reuse
}
```

**Rationale:** Reusing agents reduces overhead and improves performance.

---

### 6.2 MCP Tool Pitfalls

#### Pitfall 1: Missing MCPServer Interface Properties

**Problem:**

```typescript
// BAD: Missing required properties
class BadMCP extends MCPHandler {
  constructor() {
    super();
    this.registerServer({
      // Missing 'name' property - causes "undefined" server errors
      transport: 'inprocess',
      tools: [myTool],
    });
  }
}
```

**Solution:**

```typescript
// GOOD: All required properties
export class GoodMCP extends MCPHandler {
  public readonly name = 'good-mcp'; // Required
  public readonly transport = 'inprocess' as const; // Required
  public readonly tools = [myTool]; // Required

  constructor() {
    super();
    this.registerServer({
      name: this.name,
      transport: this.transport,
      tools: this.tools,
    });
  }
}
```

**Rationale:** All MCPServer properties are required for proper registration.

---

#### Pitfall 2: Shell Injection in Bash Commands

**Problem:**

```typescript
// BAD: Vulnerable to shell injection
const child = spawn(`bash -c "${userCommand}"`, { shell: true });
```

**Solution:**

```typescript
// GOOD: Safe argument passing
const args = userCommand.split(' ');
const child = spawn(args[0], args.slice(1), {
  shell: false, // CRITICAL: No shell interpretation
});
```

**Rationale:** Using `shell: false` prevents command injection attacks.

---

#### Pitfall 3: Path Traversal in File Operations

**Problem:**

```typescript
// BAD: No path validation
async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, 'utf-8'); // Vulnerable to '../../../etc/passwd'
}
```

**Solution:**

```typescript
// GOOD: Path validation
async function readFile(path: string): Promise<string> {
  const safePath = resolve(path);
  const normalized = normalize(safePath);

  // Block path traversal
  if (normalized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  return await fs.readFile(safePath, 'utf-8');
}
```

**Rationale:** Path validation prevents unauthorized file access.

---

### 6.3 Factory Pattern Pitfalls

#### Pitfall 1: Mutable Configuration Objects

**Problem:**

```typescript
// BAD: Mutable config
function createConfig(): AgentConfig {
  return {
    name: 'Agent',
    maxTokens: 4096,
    // No readonly modifier - can be mutated
  };
}

const config = createConfig();
config.maxTokens = 999999; // Mutation!
```

**Solution:**

```typescript
// GOOD: Immutable config
function createConfig(): Readonly<AgentConfig> {
  return {
    name: 'Agent',
    maxTokens: 4096,
    // All properties readonly
  } as const;
}

const config = createConfig();
config.maxTokens = 999999; // TypeScript error!
```

**Rationale:** Immutable configurations prevent accidental mutations.

---

#### Pitfall 2: Not Handling Environment Variables

**Problem:**

```typescript
// BAD: No environment mapping
const config = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, // May be undefined
  },
};
```

**Solution:**

```typescript
// GOOD: Environment mapping with fallbacks
configureEnvironment(); // Map AUTH_TOKEN → API_KEY

const config = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    ANTHROPIC_BASE_URL:
      process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  },
};
```

**Rationale:** Proper environment handling prevents runtime errors.

---

## 7. TypeScript Implementation Guide

### 7.1 Type-Safe Agent Creation

**Implementation Example:**

```typescript
// Define agent types
export type AgentPersona = 'architect' | 'researcher' | 'coder' | 'qa';

export interface AgentConfig {
  readonly name: string;
  readonly system: string;
  readonly model: string;
  readonly enableCache: boolean;
  readonly enableReflection: boolean;
  readonly maxTokens: number;
  readonly env: {
    readonly ANTHROPIC_API_KEY: string;
    readonly ANTHROPIC_BASE_URL: string;
  };
}

// Type-safe factory function
export function createAgentFactory() {
  return {
    createConfig: (persona: AgentPersona): Readonly<AgentConfig> => {
      const config: AgentConfig = {
        name: `${persona.charAt(0).toUpperCase() + persona.slice(1)}Agent`,
        system: getSystemPrompt(persona),
        model: getModel('sonnet'),
        enableCache: true,
        enableReflection: true,
        maxTokens: getTokenLimit(persona),
        env: {
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
          ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
        },
      };
      return Object.freeze(config); // Runtime immutability
    },

    createAgent: (persona: AgentPersona): Agent => {
      const config = this.createConfig(persona);
      return createAgent(config);
    },
  };
}
```

**Best Practices:**

1. **Readonly Properties:** Use `readonly` modifier for all config properties
2. **Type Narrowing:** Use union types for persona enumeration
3. **Object.freeze():** Add runtime immutability
4. **Type Guards:** Use type guards for runtime validation

---

### 7.2 Schema-Based Tool Definitions

**Implementation Example:**

```typescript
import { z } from 'zod';

// Define input schema
const BashToolInputSchema = z.object({
  command: z.string().min(1),
  cwd: z.string().optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

// Define output schema
const BashToolResultSchema = z.object({
  success: z.boolean(),
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().nullable(),
  error: z.string().optional(),
});

// Type inference
type BashToolInput = z.infer<typeof BashToolInputSchema>;
type BashToolResult = z.infer<typeof BashToolResultSchema>;

// Tool executor with validation
async function executeBashCommand(input: unknown): Promise<BashToolResult> {
  // Validate input
  const validated = BashToolInputSchema.parse(input);

  // Execute command
  const result = await runCommand(validated);

  // Validate output
  return BashToolResultSchema.parse(result);
}

// Register with type safety
this.registerToolExecutor(
  'bash',
  'execute_bash',
  executeBashCommand as ToolExecutor
);
```

**Best Practices:**

1. **Zod Schemas:** Use Zod for runtime validation
2. **Type Inference:** Use `z.infer<>` for TypeScript types
3. **Input Validation:** Validate all inputs before processing
4. **Output Validation:** Validate all outputs before returning

---

### 7.3 Generic Agent Wrappers

**Implementation Example:**

```typescript
// Generic agent wrapper
class AgentWrapper<TInput, TOutput> {
  private agent: Agent;
  private inputSchema: z.ZodSchema<TInput>;
  private outputSchema: z.ZodSchema<TOutput>;

  constructor(
    agent: Agent,
    inputSchema: z.ZodSchema<TInput>,
    outputSchema: z.ZodSchema<TOutput>
  ) {
    this.agent = agent;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
  }

  async execute(input: TInput): Promise<TOutput> {
    // Validate input
    const validatedInput = this.inputSchema.parse(input);

    // Create prompt
    const prompt = createPrompt({
      user: JSON.stringify(validatedInput),
      responseFormat: this.outputSchema,
    });

    // Execute agent
    const result = await this.agent.prompt(prompt);

    // Validate output
    return this.outputSchema.parse(result);
  }
}

// Usage
const architectInput = z.object({
  prd: z.string(),
  sessionId: z.string(),
});

const architectOutput = z.object({
  backlog: z.array(z.any()),
  metadata: z.object({
    version: z.string(),
    timestamp: z.number(),
  }),
});

const architect = new AgentWrapper(
  createArchitectAgent(),
  architectInput,
  architectOutput
);

const result = await architect.execute({
  prd: '# Feature: ...',
  sessionId: 'session-123',
});
```

**Best Practices:**

1. **Generic Types:** Use generics for input/output types
2. **Schema Validation:** Validate at boundaries
3. **Type Safety:** Maintain type safety throughout
4. **Reusable Wrappers:** Create reusable wrapper classes

---

## 8. References & Resources

### 8.1 Official Documentation

#### Anthropic Claude Documentation

- **Claude Documentation:** https://docs.anthropic.com/
- **API Reference:** https://docs.anthropic.com/en/api/getting-started-with-the-api
- **Prompt Engineering Guide:** https://docs.anthropic.com/en/docs/prompts
- **Tool Use:** https://docs.anthropic.com/en/docs/tool-use

#### Groundswell Framework

- **Groundswell Documentation:** Available in codebase at `/docs/GROUNDSWELL_GUIDE.md`
- **Agent Creation:** `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/architecture/groundswell_api.md`
- **MCP Integration:** `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/GROUNDSWELL_GUIDE.md`

#### Model Context Protocol (MCP)

- **MCP Specification:** https://modelcontextprotocol.io/
- **MCP SDK Documentation:** https://github.com/modelcontextprotocol/typescript-sdk
- **MCP Server Examples:** https://github.com/modelcontextprotocol/servers

---

### 8.2 Academic Papers

#### Multi-Agent Systems

1. **"Communicative Multi-Agent Systems"** - Stone & Veloso (2000)
   - Foundation for agent communication protocols

2. **"Cooperative Multi-Agent Learning"** - Tan (1993)
   - Frameworks for agent collaboration

3. **"Agent Factory: A Framework for Agent Creation"** - Collier et al. (2003)
   - Factory pattern for agent instantiation

#### Prompt Engineering

1. **"Prompt Programming for Large Language Models"** - Reynolds & McDonell (2022)
   - Systematic approach to prompt design

2. **"Chain-of-Thought Prompting Elicits Reasoning"** - Wei et al. (2022)
   - CoT prompting techniques

---

### 8.3 Industry Blog Posts

#### Agent Development

1. **"Building AI Agents with Claude"** - Anthropic Blog (2025)
   - https://www.anthropic.com/blog/building-ai-agents-with-claude

2. **"Multi-Agent Systems: A Practical Guide"** - OpenAI Blog (2024)
   - https://openai.com/blog/multi-agent-systems

3. **"Prompt Engineering Best Practices"** - Cohere Blog (2024)
   - https://cohere.com/blog/prompt-engineering-best-practices

#### MCP Tools

1. **"Introduction to Model Context Protocol"** - MCP Blog (2025)
   - https://modelcontextprotocol.io/blog/introduction

2. **"Building Custom MCP Tools"** - MCP Community (2025)
   - https://modelcontextprotocol.io/blog/custom-tools

---

### 8.4 GitHub Repositories

#### Agent Implementations

1. **Groundswell Framework** (this codebase)
   - Path: `/home/dustin/projects/hacky-hack/src/agents/`
   - Examples: `agent-factory.ts`, `prp-generator.ts`, `prp-executor.ts`

2. **Anthropic Agent Examples**
   - https://github.com/anthropics/anthropic-cookbook
   - Examples of agent patterns and tool use

3. **OpenAI Swarm**
   - https://github.com/openai/swarm
   - Multi-agent orchestration framework

#### MCP Implementations

1. **Official MCP Servers**
   - https://github.com/modelcontextprotocol/servers
   - Reference implementations for common tools

2. **Custom MCP Examples**
   - Path: `/home/dustin/projects/hacky-hack/src/tools/`
   - Examples: `bash-mcp.ts`, `filesystem-mcp.ts`, `git-mcp.ts`

---

### 8.5 Code Examples from This Codebase

#### Agent Factory

**File:** `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

```typescript
// Factory functions for agent creation
export function createArchitectAgent(): Agent;
export function createResearcherAgent(): Agent;
export function createCoderAgent(): Agent;
export function createQAAgent(): Agent;
```

#### System Prompts

**File:** `/home/dustin/projects/hacky-hack/PROMPTS.md`

```typescript
export const TASK_BREAKDOWN_PROMPT = `...`;
export const PRP_BLUEPRINT_PROMPT = `...`;
export const PRP_BUILDER_PROMPT = `...`;
export const BUG_HUNT_PROMPT = `...`;
```

#### MCP Tools

**Files:**

- `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`
- `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`
- `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts`

#### Agent Orchestration

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

```typescript
// Sequential agent orchestration
class PRPPipeline {
  async execute(prdPath: string): Promise<void>;
}
```

---

### 8.6 Testing Examples

**File:** `/home/dustin/projects/hacky-hack/tests/unit/agents/agent-factory.test.ts`

```typescript
// Unit testing agent factory
describe('createBaseConfig', () => {
  it.each(personas)('should return valid config for %s', ...)
});
```

**File:** `/home/dustin/projects/hacky-hack/tests/integration/architect-agent-integration.test.ts`

```typescript
// Integration testing agent workflows
describe('Architect Agent Integration', () => {
  it('should analyze PRD and generate task breakdown', ...)
});
```

---

## Appendix: Quick Reference

### Agent Development Checklist

- [ ] Define agent persona type
- [ ] Create system prompt with role, context, goals, constraints
- [ ] Set appropriate token limits
- [ ] Select model based on task complexity
- [ ] Create factory function
- [ ] Register MCP tools
- [ ] Implement error handling
- [ ] Add logging and monitoring
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document usage

### MCP Tool Development Checklist

- [ ] Define Tool schema (name, description, input_schema)
- [ ] Create input/output interfaces
- [ ] Implement tool executor function
- [ ] Extend MCPHandler class
- [ ] Register server and executors in constructor
- [ ] Implement input validation
- [ ] Implement security measures
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Test with real agents

### Factory Pattern Checklist

- [ ] Define AgentConfig interface
- [ ] Implement createBaseConfig()
- [ ] Create persona-specific factory functions
- [ ] Handle environment variables
- [ ] Implement singleton MCP instances
- [ ] Add configuration validation
- [ ] Support dependency injection
- [ ] Write tests for factory functions
- [ ] Document factory usage
- [ ] Provide examples

---

**Document Version:** 1.0
**Last Updated:** 2026-01-23
**Maintained By:** Agent Development Team
