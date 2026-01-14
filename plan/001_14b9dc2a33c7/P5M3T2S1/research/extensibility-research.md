# Groundswell Integration and Extensibility Patterns Research

**Date**: 2026-01-13
**Author**: Research Agent
**Status**: Complete

## Table of Contents

1. [Custom Agent/Tool Extensions](#1-custom-agenttool-extensions)
2. [Workflow Extensibility](#2-workflow-extensibility)
3. [Groundswell Framework Patterns](#3-groundswell-framework-patterns)
4. [Integration Points](#4-integration-points)
5. [Future Extension Examples](#5-future-extension-examples)

---

## 1. Custom Agent/Tool Extensions

### 1.1 Agent Creation Patterns

#### Agent Factory Pattern

**Location**: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

The codebase uses a centralized factory pattern for creating agents. This pattern provides:

- **Type-safe agent configuration** via `AgentConfig` interface
- **Persona-specific optimization** with different token limits
- **Environment variable mapping** for z.ai API compatibility
- **MCP tool integration** via singleton instances

**Key Pattern**:

```typescript
// Factory function creates persona-specific agents
export function createArchitectAgent(): Agent {
  const baseConfig = createBaseConfig('architect');
  const config = {
    ...baseConfig,
    system: TASK_BREAKDOWN_PROMPT, // Persona-specific system prompt
    mcps: MCP_TOOLS, // All agents get same tool set
  };
  return createAgent(config);
}
```

**Extension Point**: Adding a new agent persona

1. **Add persona type**:

```typescript
export type AgentPersona =
  | 'architect'
  | 'researcher'
  | 'coder'
  | 'qa'
  | 'security_auditor';
```

2. **Define token limit**:

```typescript
const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  security_auditor: 6144, // New persona
} as const;
```

3. **Create system prompt** in `/home/dustin/projects/hacky-hack/src/agents/prompts.ts`:

```typescript
export const SECURITY_AUDITOR_PROMPT = `
You are a Security Auditor agent specializing in identifying vulnerabilities,
security flaws, and compliance issues in code.

Your responsibilities:
- Analyze code for common vulnerabilities (OWASP Top 10)
- Check for authentication/authorization issues
- Verify input validation and sanitization
- Identify dependency vulnerabilities
- Review cryptographic implementations
- Assess compliance with security best practices
`;
```

4. **Create factory function**:

```typescript
export function createSecurityAuditorAgent(): Agent {
  const baseConfig = createBaseConfig('security_auditor');
  const config = {
    ...baseConfig,
    system: SECURITY_AUDITOR_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug(
    { persona: 'security_auditor', model: config.model },
    'Creating agent'
  );
  return createAgent(config);
}
```

### 1.2 MCP Tool Definition and Registration

#### MCP Tool Pattern

All MCP tools follow a consistent structure defined in the codebase:

**Example**: `/home/dustin/projects/hacky-hack/src/tools/bash-mcp.ts`

```typescript
// 1. Define input interface
interface BashToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

// 2. Define result interface
interface BashToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

// 3. Define tool schema (JSON Schema for validation)
const bashTool: Tool = {
  name: 'execute_bash',
  description:
    'Execute shell commands with optional working directory and timeout...',
  input_schema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      cwd: { type: 'string', description: 'Working directory (optional)' },
      timeout: { type: 'number', minimum: 1000, maximum: 300000 },
    },
    required: ['command'],
  },
};

// 4. Implement executor function
async function executeBashCommand(
  input: BashToolInput
): Promise<BashToolResult> {
  // Implementation
}

// 5. Create MCP server class extending MCPHandler
export class BashMCP extends MCPHandler {
  constructor() {
    super();

    // Register server
    this.registerServer({
      name: 'bash',
      transport: 'inprocess',
      tools: [bashTool],
    });

    // Register executor
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

**Extension Point**: Adding a new MCP tool (e.g., DockerTool)

**File**: `/home/dustin/projects/hacky-hack/src/tools/docker-mcp.ts` (new)

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';
import { spawn } from 'node:child_process';

// Input interface
interface DockerToolInput {
  action: 'build' | 'run' | 'ps' | 'logs' | 'stop' | 'rm';
  container?: string;
  image?: string;
  command?: string;
}

// Result interface
interface DockerToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

// Tool schema
const dockerBuildTool: Tool = {
  name: 'docker_build',
  description: 'Build a Docker image from Dockerfile',
  input_schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to Dockerfile context' },
      tag: { type: 'string', description: 'Image tag (e.g., myapp:v1)' },
    },
    required: ['path', 'tag'],
  },
};

// Executor
async function dockerBuild(input: {
  path: string;
  tag: string;
}): Promise<DockerToolResult> {
  try {
    const result = await spawn('docker', [
      'build',
      '-t',
      input.tag,
      input.path,
    ]);
    return { success: true, output: result.toString() };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// MCP Server
export class DockerMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'docker',
      transport: 'inprocess',
      tools: [dockerBuildTool],
    });

    this.registerToolExecutor(
      'docker',
      'docker_build',
      dockerBuild as ToolExecutor
    );
  }
}
```

**Integration**:

```typescript
// In agent-factory.ts
import { DockerMCP } from '../tools/docker-mcp.js';

const DOCKER_MCP = new DockerMCP();
const MCP_TOOLS = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP, DOCKER_MCP] as const;
```

### 1.3 Multi-Tool MCP Servers

**Pattern from**: `/home/dustin/projects/hacky-hack/src/tools/filesystem-mcp.ts`

A single MCP server can expose multiple tools:

```typescript
export class FilesystemMCP extends MCPHandler {
  constructor() {
    super();

    // Register all tools in one server
    this.registerServer({
      name: 'filesystem',
      transport: 'inprocess',
      tools: [fileReadTool, fileWriteTool, globFilesTool, grepSearchTool],
    });

    // Register each executor
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

---

## 2. Workflow Extensibility

### 2.1 Groundswell Decorators

#### @Step Decorator

**Purpose**: Marks methods for execution tracking, timing, and state snapshots

**Usage from**: `/home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts`

```typescript
import { Workflow, Step } from 'groundswell';

export class BugHuntWorkflow extends Workflow {
  @Step({ trackTiming: true })
  async analyzeScope(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');
    // Implementation
  }

  @Step({ trackTiming: true })
  async creativeE2ETesting(): Promise<void> {
    this.logger.info('[BugHuntWorkflow] Phase 2: Creative E2E Testing');
    // Implementation
  }
}
```

**Decorator Options**:

- `trackTiming: boolean` - Enable execution time tracking
- `name?: string` - Custom step name for logging (defaults to method name)

#### @ObservedState Decorator

**Purpose**: Tracks state fields for observability and persistence

**Usage from**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

```typescript
export class PRPPipeline extends Workflow {
  // Public state fields are automatically observed
  sessionManager: SessionManager;
  taskOrchestrator: TaskOrchestrator;
  currentPhase: string = 'init';
  totalTasks: number = 0;
  completedTasks: number = 0;
  shutdownRequested: boolean = false;

  // State changes trigger snapshots
  async executeBacklog(): Promise<void> {
    this.currentPhase = 'executing'; // Observed
    this.completedTasks++; // Observed
  }
}
```

#### @Task Decorator with Parallel Execution

**Pattern**: While not directly used in the codebase, Groundswell supports parallel task execution:

```typescript
import { Workflow, Step, Task } from 'groundswell';

export class ParallelWorkflow extends Workflow {
  @Step({ trackTiming: true })
  async sequentialStep(): Promise<void> {
    // Executes sequentially
  }

  @Task({ concurrent: true })
  async parallelTask1(): Promise<void> {
    // Can run in parallel with other @Task methods
  }

  @Task({ concurrent: true })
  async parallelTask2(): Promise<void> {
    // Runs concurrently with parallelTask1
  }
}
```

### 2.2 Custom Workflow Creation

#### Workflow Base Class Pattern

**All workflows extend**: `Workflow` from Groundswell

**Minimal workflow template**:

```typescript
import { Workflow, Step } from 'groundswell';

export class MyCustomWorkflow extends Workflow {
  // Public state fields (observed by Groundswell)
  input: string;
  result: string | null = null;

  constructor(input: string) {
    super('MyCustomWorkflow');
    this.input = input;
  }

  @Step({ trackTiming: true })
  async process(): Promise<string> {
    // Implementation
    this.result = `Processed: ${this.input}`;
    return this.result;
  }

  async run(): Promise<string> {
    this.setStatus('running');

    try {
      const result = await this.process();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

#### Complex Workflow Example

**From**: `/home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts`

```typescript
export class FixCycleWorkflow extends Workflow {
  // Public state
  testResults: TestResults;
  iteration: number = 0;
  maxIterations: number = 3;
  currentResults: TestResults | null = null;

  constructor(testResults: TestResults, prdContent: string, ...) {
    super('FixCycleWorkflow');
    this.testResults = testResults;
    // ...
  }

  @Step({ trackTiming: true })
  async createFixTasks(): Promise<void> {
    // Phase 1 implementation
  }

  @Step({ trackTiming: true })
  async executeFixes(): Promise<void> {
    // Phase 2 implementation
  }

  @Step({ trackTiming: true })
  async retest(): Promise<TestResults> {
    // Phase 3 implementation
  }

  @Step({ trackTiming: true })
  async checkComplete(): Promise<boolean> {
    // Phase 4 implementation
  }

  async run(): Promise<TestResults> {
    this.setStatus('running');

    while (this.iteration < this.maxIterations) {
      this.iteration++;
      await this.createFixTasks();
      await this.executeFixes();
      await this.retest();

      const complete = await this.checkComplete();
      if (complete) break;
    }

    this.setStatus('completed');
    return this.currentResults ?? this.testResults;
  }
}
```

**Extension Point**: Creating a DeployWorkflow

**File**: `/home/dustin/projects/hacky-hack/src/workflows/deploy-workflow.ts` (new)

```typescript
import { Workflow, Step } from 'groundswell';
import { createDeployAgent } from '../agents/agent-factory.js';
import { createDeployPrompt } from '../agents/prompts/deploy-prompt.js';

export interface DeployConfig {
  environment: 'staging' | 'production';
  serviceName: string;
  dockerTag: string;
}

export class DeployWorkflow extends Workflow {
  config: DeployConfig;
  deployStatus: 'pending' | 'building' | 'deploying' | 'complete' | 'failed' =
    'pending';
  deployUrl: string | null = null;

  constructor(config: DeployConfig) {
    super('DeployWorkflow');
    this.config = config;
  }

  @Step({ trackTiming: true })
  async buildImage(): Promise<string> {
    this.deployStatus = 'building';
    const agent = createDeployAgent();
    const prompt = createDeployPrompt('build', this.config);
    const result = await agent.prompt(prompt);
    return result.imageId;
  }

  @Step({ trackTiming: true })
  async deployImage(imageId: string): Promise<string> {
    this.deployStatus = 'deploying';
    const agent = createDeployAgent();
    const prompt = createDeployPrompt('deploy', { ...this.config, imageId });
    const result = await agent.prompt(prompt);
    this.deployUrl = result.url;
    return result.url;
  }

  @Step({ trackTiming: true })
  async verifyDeployment(): Promise<boolean> {
    const agent = createDeployAgent();
    const prompt = createDeployPrompt('verify', { url: this.deployUrl });
    const result = await agent.prompt(prompt);
    return result.healthy;
  }

  async run(): Promise<{ success: boolean; url: string | null }> {
    this.setStatus('running');

    try {
      const imageId = await this.buildImage();
      await this.deployImage(imageId);
      const healthy = await this.verifyDeployment();

      this.deployStatus = healthy ? 'complete' : 'failed';
      this.setStatus(healthy ? 'completed' : 'failed');

      return { success: healthy, url: this.deployUrl };
    } catch (error) {
      this.deployStatus = 'failed';
      this.setStatus('failed');
      throw error;
    }
  }
}
```

---

## 3. Groundswell Framework Patterns

### 3.1 Workflow Base Class Usage

**Import**: `import { Workflow, Step } from 'groundswell';`

**Required Methods**:

```typescript
export class MyWorkflow extends Workflow {
  constructor(name: string) {
    super(name); // Required: Pass workflow name to base class
  }

  async run(): Promise<ReturnType> {
    this.setStatus('running');

    try {
      // Workflow logic
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Built-in Properties** (from Workflow base class):

- `logger: Logger` - Structured logger with workflow context
- `status: 'idle' | 'running' | 'completed' | 'failed'` - Workflow status
- `setStatus(status: string): void` - Update workflow status
- `metadata: Record<string, unknown>` - Arbitrary metadata storage

### 3.2 Agent Creation with createAgent()

**Pattern from**: `/home/dustin/projects/hacky-hack/src/agents/agent-factory.ts`

```typescript
import { createAgent, type Agent } from 'groundswell';

// Basic agent creation
const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant.',
  model: 'GLM-4.7',
  enableCache: true,
  enableReflection: true,
  maxTokens: 4096,
  mcps: [BASH_MCP, FILESYSTEM_MCP], // MCP tools
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL ?? '',
  },
});

// Using the agent
const result = await agent.prompt('Hello, world!');
```

**Agent Options Interface**:

```typescript
interface AgentOptions {
  name: string;
  system: string;
  model: string;
  enableCache?: boolean;
  enableReflection?: boolean;
  maxTokens?: number;
  mcps?: Array<MCPHandler>;
  env?: {
    ANTHROPIC_API_KEY: string;
    ANTHROPIC_BASE_URL: string;
  };
}
```

### 3.3 Prompt Creation with createPrompt() and Zod Schemas

**Pattern from**: `/home/dustin/projects/hacky-hack/src/agents/prompts/bug-hunt-prompt.ts`

```typescript
import { createPrompt, type Prompt } from 'groundswell';
import { z } from 'zod';
import { TestResultsSchema } from '../../core/models.js';

// Define Zod schema for structured output
const BugReportSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
  title: z.string(),
  description: z.string(),
  reproduction: z.string(),
  location: z.string().optional(),
});

const TestResultsSchema = z.object({
  hasBugs: z.boolean(),
  bugs: z.array(BugReportSchema),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

// Create typed prompt
export function createBugHuntPrompt(
  prd: string,
  completedTasks: Task[]
): Prompt<TestResults> {
  return createPrompt({
    user: constructUserPrompt(prd, completedTasks),
    system: BUG_HUNT_PROMPT,
    responseFormat: TestResultsSchema, // Zod schema for validation
    enableReflection: true, // Error recovery for structured output
  });
}

// Usage
const qaAgent = createQAAgent();
const prompt = createBugHuntPrompt(prd, completedTasks);
const result = await qaAgent.prompt(prompt);
// result is typed as TestResults (inferred from TestResultsSchema)
```

**Key Features**:

- **Type-safe responses**: Groundswell validates LLM output against Zod schema
- **Reflection mode**: Automatically retries on validation failures
- **User and system prompts**: Separate for clarity

### 3.4 MCPHandler for Tool Management

**Base Class**: `MCPHandler` from Groundswell

**Registration Pattern**:

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

export class MyCustomMCP extends MCPHandler {
  constructor() {
    super();

    // Step 1: Register server
    this.registerServer({
      name: 'myserver',
      transport: 'inprocess', // or 'stdio' for external processes
      tools: [tool1, tool2, tool3],
    });

    // Step 2: Register executors
    this.registerToolExecutor(
      'myserver',
      'tool1',
      tool1Executor as ToolExecutor
    );
    this.registerToolExecutor(
      'myserver',
      'tool2',
      tool2Executor as ToolExecutor
    );
  }

  // Optional: Direct method for non-MCP usage
  async tool1Direct(input: Tool1Input): Promise<Tool1Result> {
    return tool1Executor(input);
  }
}
```

**Tool Schema Interface**:

```typescript
interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        minimum?: number;
        maximum?: number;
      }
    >;
    required: string[];
  };
}
```

---

## 4. Integration Points

### 4.1 Environment Configuration (z.ai API Mapping)

**Location**: `/home/dustin/projects/hacky-hack/src/config/environment.ts`

**Purpose**: Maps shell environment variables to SDK expectations

```typescript
// Module-level configuration (runs on import)
configureEnvironment();

export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = 'https://api.z.ai/api/anthropic';
  }
}
```

**Model Selection**:

```typescript
export function getModel(tier: ModelTier): string {
  const envVar = MODEL_ENV_VARS[tier]; // e.g., 'ANTHROPIC_DEFAULT_OPUS_MODEL'
  return process.env[envVar] ?? MODEL_NAMES[tier];
}

// Usage
const opusModel = getModel('opus'); // 'GLM-4.7' or env override
const sonnetModel = getModel('sonnet'); // 'GLM-4.7' or env override
const haikuModel = getModel('haiku'); // 'GLM-4.5-Air' or env override
```

**Environment Variables**:

```bash
# Required
ANTHROPIC_AUTH_TOKEN=sk-...      # Shell convention
ANTHROPIC_API_KEY=sk-...         # SDK convention (auto-mapped)

# Optional
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ANTHROPIC_DEFAULT_OPUS_MODEL=GLM-4.7
ANTHROPIC_DEFAULT_SONNET_MODEL=GLM-4.7
ANTHROPIC_DEFAULT_HAIKU_MODEL=GLM-4.5-Air
```

### 4.2 Cache Configuration (enableCache Patterns)

**Agent-level cache control**:

```typescript
// In agent-factory.ts
export function createBaseConfig(persona: AgentPersona): AgentConfig {
  return {
    name,
    system,
    model,
    enableCache: true,   // Enable LLM response caching
    enableReflection: true,
    maxTokens: PERSONA_TOKEN_LIMITS[persona],
    env: { ... }
  };
}
```

**PRP-level cache bypass**:

```typescript
// In PRPPipeline constructor
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false  // CLI --no-cache flag
) {
  this.#noCache = noCache;
}

// Pass to TaskOrchestrator
this.taskOrchestrator = new TaskOrchestratorClass(
  this.sessionManager,
  this.#scope,
  this.#noCache  // Bypasses PRP cache when true
);
```

**Cache implementation**: Located in PRPRuntime (see PRP disk-based caching)

### 4.3 State Persistence (@ObservedState Patterns)

**Workflow state**:

```typescript
export class PRPPipeline extends Workflow {
  // Public fields are automatically observed
  sessionManager: SessionManager;
  currentPhase: string = 'init';
  completedTasks: number = 0;

  async executeBacklog(): Promise<void> {
    // State changes trigger snapshots
    this.completedTasks++; // Observed
    this.currentPhase = 'executing'; // Observed
  }

  @Step({ trackTiming: true })
  async cleanup(): Promise<void> {
    // Flush pending updates before shutdown
    await this.sessionManager.flushUpdates();

    // Save current state
    await this.sessionManager.saveBacklog(backlog);
  }
}
```

**Session-level persistence**:

```typescript
// SessionManager handles state persistence
class SessionManager {
  async saveBacklog(backlog: Backlog): Promise<void> {
    const tasksPath = resolve(this.sessionPath, 'tasks.json');
    await writeFile(tasksPath, JSON.stringify(backlog, null, 2), 'utf-8');
  }

  async loadBacklog(): Promise<Backlog> {
    const tasksPath = resolve(this.sessionPath, 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    return JSON.parse(content) as Backlog;
  }
}
```

---

## 5. Future Extension Examples

### 5.1 Add a New Agent Persona (SecurityAuditor)

**Step 1**: Update agent-factory.ts

```typescript
// /home/dustin/projects/hacky-hack/src/agents/agent-factory.ts

export type AgentPersona =
  | 'architect'
  | 'researcher'
  | 'coder'
  | 'qa'
  | 'security_auditor';

const PERSONA_TOKEN_LIMITS = {
  architect: 8192,
  researcher: 4096,
  coder: 4096,
  qa: 4096,
  security_auditor: 6144,
} as const;

export function createSecurityAuditorAgent(): Agent {
  const baseConfig = createBaseConfig('security_auditor');
  const config = {
    ...baseConfig,
    system: SECURITY_AUDITOR_PROMPT,
    mcps: MCP_TOOLS,
  };
  logger.debug(
    { persona: 'security_auditor', model: config.model },
    'Creating agent'
  );
  return createAgent(config);
}
```

**Step 2**: Add system prompt

```typescript
// /home/dustin/projects/hacky-hack/src/agents/prompts.ts

export const SECURITY_AUDITOR_PROMPT = `
You are a Security Auditor agent specializing in application security.

Your responsibilities:
- Analyze code for security vulnerabilities
- Check for OWASP Top 10 issues (injection, broken auth, XSS, etc.)
- Verify input validation and output encoding
- Review authentication and authorization mechanisms
- Assess cryptographic implementations
- Identify dependency vulnerabilities
- Review error handling for information disclosure
- Check for insecure configurations

Report Format:
For each vulnerability found, provide:
1. Severity (Critical/High/Medium/Low)
2. CWE identifier
3. Description of the vulnerability
4. Proof of concept (if applicable)
5. Remediation recommendations
6. Code examples showing fixes

Be thorough but practical. Focus on exploitable vulnerabilities rather than theoretical issues.
`;
```

**Step 3**: Create security audit workflow

```typescript
// /home/dustin/projects/hacky-hack/src/workflows/security-audit-workflow.ts

import { Workflow, Step } from 'groundswell';
import { createSecurityAuditorAgent } from '../agents/agent-factory.js';
import { createSecurityAuditPrompt } from '../agents/prompts/security-audit-prompt.js';

export interface SecurityAuditResult {
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    cwe: string;
    title: string;
    description: string;
    location: string;
    recommendation: string;
  }>;
  summary: string;
  overallScore: number; // 0-100
}

export class SecurityAuditWorkflow extends Workflow {
  codebase: string;
  completedTasks: Task[];
  auditResults: SecurityAuditResult | null = null;

  constructor(codebase: string, completedTasks: Task[]) {
    super('SecurityAuditWorkflow');
    this.codebase = codebase;
    this.completedTasks = completedTasks;
  }

  @Step({ trackTiming: true })
  async analyzeCode(): Promise<SecurityAuditResult> {
    this.logger.info(
      '[SecurityAuditWorkflow] Analyzing code for vulnerabilities'
    );

    const agent = createSecurityAuditorAgent();
    const prompt = createSecurityAuditPrompt(
      this.codebase,
      this.completedTasks
    );
    const result = (await agent.prompt(prompt)) as SecurityAuditResult;

    this.auditResults = result;

    this.logger.info(
      `[SecurityAuditWorkflow] Found ${result.vulnerabilities.length} vulnerabilities`
    );
    this.logger.info(
      `[SecurityAuditWorkflow] Security score: ${result.overallScore}/100`
    );

    return result;
  }

  async run(): Promise<SecurityAuditResult> {
    this.setStatus('running');

    try {
      const result = await this.analyzeCode();
      this.setStatus('completed');
      return result;
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }
}
```

**Step 4**: Integrate into pipeline

```typescript
// In PRPPipeline.runQACycle()
async runQACycle(): Promise<void> {
  // ... existing QA cycle ...

  // Add security audit
  if (this.mode === 'security-audit') {
    const securityWorkflow = new SecurityAuditWorkflow(
      this.sessionManager.currentSession?.metadata.path ?? '',
      this.#extractCompletedTasks()
    );
    const securityResults = await securityWorkflow.run();
    // Write security report, etc.
  }
}
```

### 5.2 Add a New MCP Tool (DockerTool)

**File**: `/home/dustin/projects/hacky-hack/src/tools/docker-mcp.ts` (new)

```typescript
/**
 * Docker MCP Tool Module
 *
 * @module tools/docker-mcp
 *
 * @remarks
 * Provides MCP tools for Docker operations.
 * Implements build, run, ps, logs, stop, and rm commands.
 */

import { spawn } from 'node:child_process';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// ===== INPUT INTERFACES =====

interface DockerBuildInput {
  path: string;
  tag: string;
  dockerfile?: string;
  args?: Record<string, string>;
}

interface DockerRunInput {
  image: string;
  name?: string;
  ports?: string[]; // ['8080:80']
  environment?: Record<string, string>;
  detach?: boolean;
}

interface DockerPsInput {
  all?: boolean;
  filters?: Record<string, string>;
}

// ===== RESULT INTERFACES =====

interface DockerBuildResult {
  success: boolean;
  imageId?: string;
  error?: string;
}

interface DockerRunResult {
  success: boolean;
  containerId?: string;
  logs?: string;
  error?: string;
}

// ===== TOOL SCHEMAS =====

const dockerBuildTool: Tool = {
  name: 'docker_build',
  description: 'Build a Docker image from a Dockerfile',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to build context (directory containing Dockerfile)',
      },
      tag: {
        type: 'string',
        description: 'Image tag (e.g., myapp:v1.0)',
      },
      dockerfile: {
        type: 'string',
        description: 'Dockerfile name (default: Dockerfile)',
      },
      args: {
        type: 'object',
        description: 'Build arguments for ARG instruction',
      },
    },
    required: ['path', 'tag'],
  },
};

const dockerRunTool: Tool = {
  name: 'docker_run',
  description: 'Run a Docker container',
  input_schema: {
    type: 'object',
    properties: {
      image: {
        type: 'string',
        description: 'Image to run',
      },
      name: {
        type: 'string',
        description: 'Container name',
      },
      ports: {
        type: 'array',
        items: { type: 'string' },
        description: 'Port mappings (e.g., ["8080:80"])',
      },
      environment: {
        type: 'object',
        description: 'Environment variables',
      },
      detach: {
        type: 'boolean',
        description: 'Run in detached mode (default: true)',
      },
    },
    required: ['image'],
  },
};

// ===== TOOL EXECUTORS =====

async function dockerBuild(
  input: DockerBuildInput
): Promise<DockerBuildResult> {
  const { path, tag, dockerfile = 'Dockerfile', args } = input;

  try {
    const cmd = ['build', '-t', tag, '-f', dockerfile];

    // Add build args
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        cmd.push('--build-arg', `${key}=${value}`);
      }
    }

    cmd.push(path);

    const result = await spawnDocker(cmd);
    const imageId = parseImageId(result);

    return { success: true, imageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function dockerRun(input: DockerRunInput): Promise<DockerRunResult> {
  const { image, name, ports, environment, detach = true } = input;

  try {
    const cmd = ['run'];

    if (detach) cmd.push('-d');
    if (name) cmd.push('--name', name);

    if (ports) {
      for (const port of ports) {
        cmd.push('-p', port);
      }
    }

    if (environment) {
      for (const [key, value] of Object.entries(environment)) {
        cmd.push('-e', `${key}=${value}`);
      }
    }

    cmd.push(image);

    const result = await spawnDocker(cmd);
    const containerId = result.trim();

    return { success: true, containerId, logs: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===== HELPER FUNCTIONS =====

function spawnDocker(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', args);
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Docker command failed: ${stderr}`));
      }
    });
  });
}

function parseImageId(output: string): string {
  const match = output.match(/Successfully built ([a-f0-9]+)/);
  return match ? match[1] : '';
}

// ===== MCP SERVER =====

export class DockerMCP extends MCPHandler {
  constructor() {
    super();

    this.registerServer({
      name: 'docker',
      transport: 'inprocess',
      tools: [dockerBuildTool, dockerRunTool],
    });

    this.registerToolExecutor(
      'docker',
      'docker_build',
      dockerBuild as ToolExecutor
    );
    this.registerToolExecutor(
      'docker',
      'docker_run',
      dockerRun as ToolExecutor
    );
  }
}
```

**Integration**:

```typescript
// In agent-factory.ts
import { DockerMCP } from '../tools/docker-mcp.js';

const DOCKER_MCP = new DockerMCP();
const MCP_TOOLS = [BASH_MCP, FILESYSTEM_MCP, GIT_MCP, DOCKER_MCP] as const;
```

### 5.3 Create a Custom Workflow (DeployWorkflow)

**File**: `/home/dustin/projects/hacky-hack/src/workflows/deploy-workflow.ts`

```typescript
/**
 * Deploy workflow for containerized applications
 *
 * @module workflows/deploy-workflow
 *
 * @remarks
 * Orchestrates deployment to staging/production:
 * 1. Build Docker image
 * 2. Push to registry
 * 3. Deploy to environment
 * 4. Health check verification
 * 5. Rollback on failure
 */

import { Workflow, Step } from 'groundswell';
import { DockerMCP } from '../tools/docker-mcp.js';
import type { Logger } from '../utils/logger.js';
import { getLogger } from '../utils/logger.js';

export interface DeployConfig {
  environment: 'staging' | 'production';
  serviceName: string;
  dockerTag: string;
  registry: string;
  replicas: number;
}

export interface DeployResult {
  success: boolean;
  deploymentUrl?: string;
  deploymentId?: string;
  error?: string;
  rollbackPerformed?: boolean;
}

export class DeployWorkflow extends Workflow {
  // Public state fields
  config: DeployConfig;
  deployStatus:
    | 'pending'
    | 'building'
    | 'pushing'
    | 'deploying'
    | 'verifying'
    | 'complete'
    | 'failed'
    | 'rolling_back' = 'pending';
  deploymentUrl: string | null = null;
  deploymentId: string | null = null;
  imageId: string | null = null;

  private docker: DockerMCP;
  private correlationLogger: Logger;

  constructor(config: DeployConfig) {
    super('DeployWorkflow');

    if (!config.serviceName || !config.dockerTag) {
      throw new Error('serviceName and dockerTag are required');
    }

    this.config = config;
    this.docker = new DockerMCP();

    const correlationId = `deploy-${Date.now()}`;
    this.correlationLogger = getLogger('DeployWorkflow').child({
      correlationId,
    });

    this.correlationLogger.info('[DeployWorkflow] Initialized', {
      environment: config.environment,
      serviceName: config.serviceName,
      tag: config.dockerTag,
    });
  }

  @Step({ trackTiming: true })
  async buildImage(): Promise<string> {
    this.deployStatus = 'building';
    this.logger.info('[DeployWorkflow] Building Docker image...');

    const buildResult = await this.docker.executeTool('docker__docker_build', {
      path: process.cwd(),
      tag: `${this.config.registry}/${this.config.serviceName}:${this.config.dockerTag}`,
    });

    if (!buildResult.success || !buildResult.imageId) {
      throw new Error(`Build failed: ${buildResult.error}`);
    }

    this.imageId = buildResult.imageId;
    this.logger.info(`[DeployWorkflow] Built image: ${this.imageId}`);

    return this.imageId;
  }

  @Step({ trackTiming: true })
  async pushImage(): Promise<void> {
    this.deployStatus = 'pushing';
    this.logger.info('[DeployWorkflow] Pushing image to registry...');

    // Implementation would use docker push
    this.logger.info('[DeployWorkflow] Image pushed successfully');
  }

  @Step({ trackTiming: true })
  async deploy(): Promise<void> {
    this.deployStatus = 'deploying';
    this.logger.info(
      `[DeployWorkflow] Deploying to ${this.config.environment}...`
    );

    const deployResult = await this.docker.executeTool('docker__docker_run', {
      image: `${this.config.registry}/${this.config.serviceName}:${this.config.dockerTag}`,
      name: `${this.config.serviceName}-${this.config.environment}`,
      detach: true,
    });

    if (!deployResult.success || !deployResult.containerId) {
      throw new Error(`Deploy failed: ${deployResult.error}`);
    }

    this.deploymentId = deployResult.containerId;
    this.logger.info(
      `[DeployWorkflow] Deployed container: ${this.deploymentId}`
    );
  }

  @Step({ trackTiming: true })
  async verifyDeployment(): Promise<boolean> {
    this.deployStatus = 'verifying';
    this.logger.info('[DeployWorkflow] Verifying deployment health...');

    // Health check implementation
    // Would check service endpoints, metrics, etc.

    this.logger.info('[DeployWorkflow] Deployment verified healthy');
    return true;
  }

  @Step({ trackTiming: true })
  async rollback(): Promise<void> {
    this.deployStatus = 'rolling_back';
    this.logger.warn('[DeployWorkflow] Initiating rollback...');

    // Rollback implementation
    this.logger.warn('[DeployWorkflow] Rollback complete');
  }

  async run(): Promise<DeployResult> {
    this.setStatus('running');
    const startTime = Date.now();

    try {
      await this.buildImage();
      await this.pushImage();
      await this.deploy();

      const healthy = await this.verifyDeployment();

      if (!healthy) {
        throw new Error('Deployment health check failed');
      }

      this.deployStatus = 'complete';
      this.setStatus('completed');

      const duration = Date.now() - startTime;
      this.logger.info(
        `[DeployWorkflow] Deployment completed in ${duration}ms`
      );

      return {
        success: true,
        deploymentId: this.deploymentId ?? undefined,
        deploymentUrl: this.deploymentUrl ?? undefined,
      };
    } catch (error) {
      this.logger.error(`[DeployWorkflow] Deployment failed: ${error}`);

      // Attempt rollback
      try {
        await this.rollback();
      } catch (rollbackError) {
        this.logger.error(`[DeployWorkflow] Rollback failed: ${rollbackError}`);
      }

      this.deployStatus = 'failed';
      this.setStatus('failed');

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        rollbackPerformed: true,
      };
    }
  }
}
```

**Usage**:

```typescript
const deployWorkflow = new DeployWorkflow({
  environment: 'production',
  serviceName: 'myapp',
  dockerTag: 'v1.2.3',
  registry: 'ghcr.io/myorg',
  replicas: 3,
});

const result = await deployWorkflow.run();

if (result.success) {
  console.log(`Deployed: ${result.deploymentUrl}`);
} else {
  console.error(`Deployment failed: ${result.error}`);
  console.log(`Rollback performed: ${result.rollbackPerformed}`);
}
```

### 5.4 Extend the Data Model (New Task Types)

**Current Model**: Phase → Milestone → Task → Subtask (4 levels)

**Extension**: Add "Epic" level above Phase

**Step 1**: Update models.ts

```typescript
// /home/dustin/projects/hacky-hack/src/core/models.ts

export type ItemType = 'Epic' | 'Phase' | 'Milestone' | 'Task' | 'Subtask';

export interface Epic {
  readonly id: string;
  readonly type: 'Epic';
  readonly title: string;
  readonly description: string;
  readonly status: Status;
  readonly phases: Phase[];
}

export const EpicSchema: z.ZodType<Epic> = z.object({
  id: z.string(),
  type: z.literal('Epic'),
  title: z.string().min(1).max(200),
  description: z.string(),
  status: StatusEnum,
  phases: z.lazy(() => z.array(PhaseSchema)),
});

// Update Backlog to include epics
export interface Backlog {
  readonly epics: Epic[];
}

export const BacklogSchema: z.ZodType<Backlog> = z.object({
  epics: z.array(EpicSchema),
});
```

**Step 2**: Create EpicPrompt

```typescript
// /home/dustin/projects/hacky-hack/src/agents/prompts/epic-prompt.ts

import { createPrompt, type Prompt } from 'groundswell';
import { EpicSchema } from '../../core/models.js';

export const EPIC_GENERATION_PROMPT = `
You are an Epic Architect responsible for grouping related phases into epics.

An Epic is a large body of work that can be broken down into phases.
Epics represent major initiatives or features that span multiple phases.

When creating epics:
1. Group related phases by feature or initiative
2. Ensure epics have clear business value
3. Each epic should be independently deployable
4. Limit to 3-5 phases per epic for manageability
5. Name epics with clear, business-focused titles

Output format:
{
  "epics": [
    {
      "id": "E1",
      "type": "Epic",
      "title": "User Authentication System",
      "description": "Complete authentication and authorization infrastructure",
      "status": "Planned",
      "phases": [...]
    }
  ]
}
`;

export function createEpicPrompt(phases: Phase[]): Prompt<Backlog> {
  const phasesList = phases.map(p => `- ${p.id}: ${p.title}`).join('\n');

  return createPrompt({
    user: `Organize these phases into epics:\n\n${phasesList}`,
    system: EPIC_GENERATION_PROMPT,
    responseFormat: BacklogSchema,
    enableReflection: true,
  });
}
```

**Step 3**: Update TaskOrchestrator

```typescript
// Handle epics in task processing
class TaskOrchestrator {
  async processNextItem(): Promise<boolean> {
    const backlog = this.sessionManager.currentSession?.taskRegistry;

    for (const epic of backlog?.epics ?? []) {
      for (const phase of epic.phases) {
        for (const milestone of phase.milestones) {
          // ... existing logic
        }
      }
    }
  }
}
```

---

## Summary

### Key Extension Points

1. **Agent Personas**: Add to `AgentPersona` type, create factory function, define system prompt
2. **MCP Tools**: Create class extending `MCPHandler`, register server and executors
3. **Workflows**: Extend `Workflow`, use `@Step` decorators, implement `run()` method
4. **Data Models**: Extend with Zod schemas for validation
5. **Integration Points**: Environment config, cache config, state persistence

### Best Practices

1. **Use Zod schemas** for all structured data (validation + type safety)
2. **Follow factory pattern** for agent creation (consistency)
3. **Register MCP tools** in constructor via `MCPHandler`
4. **Mark workflow steps** with `@Step({ trackTiming: true })`
5. **Use public fields** for observable state (private fields not tracked)
6. **Call `setStatus()`** when workflow state changes
7. **Implement graceful shutdown** in `cleanup()` method
8. **Use correlation IDs** for distributed tracing

### File Locations Reference

| Component          | Location                       |
| ------------------ | ------------------------------ |
| Agent Factory      | `/src/agents/agent-factory.ts` |
| System Prompts     | `/src/agents/prompts.ts`       |
| Prompt Generators  | `/src/agents/prompts/*.ts`     |
| MCP Tools          | `/src/tools/*-mcp.ts`          |
| Workflows          | `/src/workflows/*.ts`          |
| Data Models        | `/src/core/models.ts`          |
| Environment Config | `/src/config/environment.ts`   |
| State Management   | `/src/core/session-manager.ts` |

### Groundswell Imports

```typescript
// Core framework
import { Workflow, Step, Task } from 'groundswell';
import { createAgent, type Agent } from 'groundswell';
import { createPrompt, type Prompt } from 'groundswell';
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

// Decorators (imported separately)
import { Step } from 'groundswell'; // @Step decorator
import { ObservedState } from 'groundswell'; // @ObservedState decorator
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
