# TypeScript Factory Pattern Best Practices

> Research compiled: January 12, 2026
> Focus: Factory function patterns, type-safe factories, configuration objects, agent factories, and environment-aware factories

---

## Table of Contents

1. [Factory Function Patterns](#factory-function-patterns)
2. [Type-Safe Factories with Generics](#type-safe-factories-with-generics)
3. [Configuration Object Patterns](#configuration-object-patterns)
4. [Agent Factory Patterns](#agent-factory-patterns)
5. [Environment-Aware Factories](#environment-aware-factories)
6. [Groundswell Factory Patterns](#groundswell-factory-patterns)
7. [Complete Examples](#complete-examples)
8. [References and Resources](#references)

---

## Factory Function Patterns

### 1. Basic Factory Function

A factory function is a function that returns an object without using the `new` keyword.

````typescript
/**
 * Creates a configured task object.
 *
 * @param config - Task configuration
 * @returns A new task instance
 *
 * @example
 * ```typescript
 * const task = createTask({
 *   title: 'Complete documentation',
 *   priority: 1,
 * });
 * ```
 */
function createTask(config: { title: string; priority?: number }): {
  readonly id: string;
  title: string;
  priority: number;
  readonly createdAt: Date;
} {
  return {
    id: crypto.randomUUID(),
    title: config.title,
    priority: config.priority ?? 3,
    createdAt: new Date(),
  };
}
````

### 2. Factory with Default Values

```typescript
interface TaskConfig {
  title: string;
  description?: string;
  priority?: number;
  assignee?: string;
}

const DEFAULT_TASK_CONFIG: Required<Pick<TaskConfig, 'priority'>> = {
  priority: 3,
};

function createTask(config: TaskConfig) {
  return {
    ...DEFAULT_TASK_CONFIG,
    ...config,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
}

// Usage
const task = createTask({ title: 'New Task' }); // priority defaults to 3
```

### 3. Factory with Validation

```typescript
function createTask(config: TaskConfig) {
  // Validate required fields
  if (!config.title || config.title.trim().length === 0) {
    throw new Error('Task title is required');
  }

  if (config.priority && (config.priority < 1 || config.priority > 5)) {
    throw new Error('Priority must be between 1 and 5');
  }

  return {
    id: crypto.randomUUID(),
    title: config.title.trim(),
    description: config.description?.trim() ?? '',
    priority: config.priority ?? 3,
    assignee: config.assignee ?? null,
    createdAt: new Date(),
  };
}
```

### 4. Curried Factory Pattern

````typescript
/**
 * Creates a factory function with pre-configured defaults.
 *
 * @param defaults - Default values for all created tasks
 * @returns A factory function that accepts overrides
 *
 * @example
 * ```typescript
 * const createUrgentTask = createTaskFactory({ priority: 1 });
 * const task = createUrgentTask({ title: 'Fix bug' });
 * // task.priority === 1
 * ```
 */
function createTaskFactory(defaults: Partial<TaskConfig>) {
  return (overrides: Partial<TaskConfig>) => {
    return createTask({ ...defaults, ...overrides });
  };
}

// Usage
const createHighPriorityTask = createTaskFactory({ priority: 1 });
const createLowPriorityTask = createTaskFactory({ priority: 5 });

const urgentTask = createHighPriorityTask({ title: 'Critical bug' });
const backgroundTask = createLowPriorityTask({ title: 'Documentation' });
````

---

## Type-Safe Factories with Generics

### 1. Generic Factory with Type Parameters

```typescript
/**
 * Generic factory for creating entities with ID and timestamp.
 *
 * @template T - The base entity type
 * @template C - Configuration type for creation
 */
interface Entity {
  readonly id: string;
  readonly createdAt: Date;
}

function createEntity<T extends Entity, C = Omit<T, 'id' | 'createdAt'>>(
  defaults: C,
  Constructor: new (config: C) => T
): T {
  return new Constructor({
    ...defaults,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  } as C);
}
```

### 2. Factory with Discriminated Unions

````typescript
type TaskKind = 'simple' | 'recurring' | 'milestone';

interface BaseTaskConfig {
  title: string;
  priority?: number;
}

interface SimpleTaskConfig extends BaseTaskConfig {
  kind: 'simple';
  dueDate?: Date;
}

interface RecurringTaskConfig extends BaseTaskConfig {
  kind: 'recurring';
  frequency: 'daily' | 'weekly' | 'monthly';
  endDate?: Date;
}

interface MilestoneTaskConfig extends BaseTaskConfig {
  kind: 'milestone';
  targetDate: Date;
}

type TaskConfig = SimpleTaskConfig | RecurringTaskConfig | MilestoneTaskConfig;

/**
 * Type-safe factory that creates different task types based on config.
 *
 * @example
 * ```typescript
 * const simple = createTask({ kind: 'simple', title: 'One-time task' });
 * const recurring = createTask({ kind: 'recurring', title: 'Daily standup', frequency: 'daily' });
 * ```
 */
function createTask<T extends TaskConfig>(
  config: T
): Task & { readonly kind: T['kind'] } {
  const base = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    priority: config.priority ?? 3,
  };

  switch (config.kind) {
    case 'simple':
      return { ...base, ...config, kind: 'simple' } as Task & {
        readonly kind: 'simple';
      };
    case 'recurring':
      return { ...base, ...config, kind: 'recurring' } as Task & {
        readonly kind: 'recurring';
      };
    case 'milestone':
      return { ...base, ...config, kind: 'milestone' } as Task & {
        readonly kind: 'milestone';
      };
    default:
      // Exhaustive check - TypeScript will error if new kinds are added
      const _exhaustiveCheck: never = config;
      throw new Error(`Unknown task kind: ${_exhaustiveCheck}`);
  }
}

// Type narrowing works automatically
const simpleTask = createTask({ kind: 'simple', title: 'Fix bug' });
// simpleTask.kind === 'simple' (TypeScript knows this)
````

### 3. Factory with Type Guards

```typescript
/**
 * Type guard to check if a task is a recurring task.
 */
function isRecurringTask(task: Task): task is Task & { kind: 'recurring' } {
  return task.kind === 'recurring';
}

/**
 * Factory that uses type guards for conditional logic.
 */
function createTaskWithAlert<T extends TaskConfig>(
  config: T
): Task & { readonly kind: T['kind'] } {
  const task = createTask(config);

  if (isRecurringTask(task)) {
    // TypeScript knows task has 'frequency' property
    console.log(`Created recurring task with frequency: ${task.frequency}`);
  }

  return task;
}
```

### 4. Generic Builder Factory

```typescript
/**
 * Generic builder factory for complex object construction.
 *
 * @template T - The type being built
 */
class Builder<T> {
  private parts: Partial<T> = {};

  constructor(private defaults: Partial<T> = {}) {}

  /**
   * Sets a property on the object being built.
   *
   * @param key - Property name
   * @param value - Property value
   * @returns This builder for chaining
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.parts[key] = value;
    return this;
  }

  /**
   * Sets multiple properties at once.
   *
   * @param values - Properties to set
   * @returns This builder for chaining
   */
  setMany<K extends keyof T>(values: Pick<T, K>): this {
    Object.assign(this.parts, values);
    return this;
  }

  /**
   * Builds the final object.
   *
   * @param required - Required fields that must be set
   * @returns The built object
   * @throws {Error} If required fields are missing
   */
  build<K extends keyof T>(required: K[]): T {
    for (const key of required) {
      if (!(key in this.parts)) {
        throw new Error(`Missing required field: ${String(key)}`);
      }
    }

    return {
      ...this.defaults,
      ...this.parts,
    } as T;
  }
}

// Usage
interface Task {
  readonly id: string;
  title: string;
  description: string;
  priority: number;
}

const taskBuilder = new Builder<Task>({ id: crypto.randomUUID() });

const task = taskBuilder
  .set('title', 'New Task')
  .set('priority', 1)
  .setMany({ description: 'Important task' })
  .build(['title', 'priority']);
```

---

## Configuration Object Patterns

### 1. Interface-Based Configuration

```typescript
/**
 * Configuration interface for task creation.
 */
interface TaskConfig {
  // Required fields
  title: string;

  // Optional fields
  description?: string;
  priority?: number;
  assignee?: string;

  // Nested configuration
  metadata?: {
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
}
```

### 2. Builder Pattern for Configuration

```typescript
/**
 * Fluent builder for task configuration.
 */
class TaskConfigBuilder {
  private config: Partial<TaskConfig> = {};

  /**
   * Sets the task title.
   */
  title(title: string): this {
    this.config.title = title;
    return this;
  }

  /**
   * Sets the task description.
   */
  description(description: string): this {
    this.config.description = description;
    return this;
  }

  /**
   * Sets the task priority.
   */
  priority(priority: number): this {
    this.config.priority = priority;
    return this;
  }

  /**
   * Sets the assignee.
   */
  assignee(assignee: string): this {
    this.config.assignee = assignee;
    return this;
  }

  /**
   * Adds metadata tags.
   */
  addTag(...tags: string[]): this {
    if (!this.config.metadata) {
      this.config.metadata = {};
    }
    if (!this.config.metadata.tags) {
      this.config.metadata.tags = [];
    }
    this.config.metadata.tags.push(...tags);
    return this;
  }

  /**
   * Builds the configuration object.
   */
  build(): TaskConfig {
    if (!this.config.title) {
      throw new Error('Title is required');
    }
    return this.config as TaskConfig;
  }
}

// Usage
const config = new TaskConfigBuilder()
  .title('Complete documentation')
  .description('Write comprehensive docs')
  .priority(1)
  .addTag('documentation', 'urgent')
  .build();
```

### 3. Configuration with Zod Validation

```typescript
import { z } from 'zod';

/**
 * Zod schema for task configuration.
 * Provides runtime validation and TypeScript type inference.
 */
const TaskConfigSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(5).optional().default(3),
  assignee: z.string().uuid().optional(),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.unknown()).optional(),
    })
    .optional(),
});

/**
 * Infer TypeScript type from Zod schema.
 */
type TaskConfig = z.infer<typeof TaskConfigSchema>;

/**
 * Factory function with runtime validation.
 *
 * @param rawConfig - Unvalidated configuration
 * @returns Validated task configuration
 * @throws {ZodError} If configuration is invalid
 */
function createValidatedTaskConfig(rawConfig: unknown): TaskConfig {
  return TaskConfigSchema.parse(rawConfig);
}

// Usage - both validates and types
const config = createValidatedTaskConfig({
  title: 'New Task',
  priority: 1,
  // TypeScript and Zod enforce correctness
});
```

### 4. Configuration Composition

```typescript
/**
 * Base configuration shared across all task types.
 */
interface BaseTaskConfig {
  title: string;
  priority: number;
  createdAt: Date;
}

/**
 * Configurable options for tasks.
 */
interface TaskOptions {
  description?: string;
  assignee?: string;
  tags?: string[];
}

/**
 * Composed configuration type.
 */
type ComposedTaskConfig = BaseTaskConfig & TaskOptions;

/**
 * Factory that accepts composed configuration.
 */
function createTaskFromComposition(config: ComposedTaskConfig) {
  return {
    id: crypto.randomUUID(),
    ...config,
  };
}

// Usage
const task = createTaskFromComposition({
  // Base config
  title: 'New Task',
  priority: 1,
  createdAt: new Date(),
  // Options
  description: 'Important',
  tags: ['urgent'],
});
```

---

## Agent Factory Patterns

### 1. Basic Agent Factory

````typescript
/**
 * Configuration for creating an AI agent.
 */
interface AgentConfig<T = unknown> {
  name: string;
  system: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  enableCache?: boolean;
  enableReflection?: boolean;
  tools?: Tool[];
  responseFormat?: z.ZodType<T>;
}

/**
 * Factory function for creating AI agents.
 *
 * @param config - Agent configuration
 * @returns Configured agent instance
 *
 * @example
 * ```typescript
 * const coderAgent = createAgent({
 *   name: 'Coder',
 *   system: 'You are an expert programmer...',
 *   model: 'claude-sonnet-4-20250514',
 *   temperature: 0.1,
 * });
 * ```
 */
function createAgent<T = unknown>(config: AgentConfig<T>): Agent<T> {
  return new Agent({
    name: config.name,
    systemPrompt: config.system,
    model: config.model,
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
    enableCache: config.enableCache ?? true,
    enableReflection: config.enableReflection ?? false,
    tools: config.tools ?? [],
    responseValidator: config.responseFormat,
  });
}
````

### 2. Specialized Agent Factories

```typescript
/**
 * Factory for creating a coding-focused agent.
 */
function createCoderAgent(config: Pick<AgentConfig, 'name'>): Agent<void> {
  return createAgent({
    ...config,
    system: CODER_SYSTEM_PROMPT,
    model: 'claude-sonnet-4-20250514',
    temperature: 0.1,
    enableCache: true,
    tools: [bashTool, fileTool, gitTool],
  });
}

/**
 * Factory for creating an architect agent.
 */
function createArchitectAgent<T = ArchitectureResult>(
  config: Pick<AgentConfig, 'name'>
): Agent<T> {
  return createAgent<T>({
    ...config,
    system: ARCHITECT_SYSTEM_PROMPT,
    model: 'claude-opus-4-20250514',
    temperature: 0.2,
    enableCache: true,
    enableReflection: true,
    responseFormat: ArchitectureSchema,
  });
}

// Usage
const coder = createCoderAgent({ name: 'MainCoder' });
const architect = createArchitectAgent({ name: 'MainArchitect' });
```

### 3. Agent Factory with Discriminated Models

```typescript
type ModelTier = 'opus' | 'sonnet' | 'haiku';

interface ModelConfig {
  tier: ModelTier;
  model: string;
  maxTokens: number;
  temperature: number;
}

const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  opus: {
    tier: 'opus',
    model: 'claude-opus-4-20250514',
    maxTokens: 8192,
    temperature: 0.2,
  },
  sonnet: {
    tier: 'sonnet',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.1,
  },
  haiku: {
    tier: 'haiku',
    model: 'claude-haiku-4-20250514',
    maxTokens: 2048,
    temperature: 0.0,
  },
};

/**
 * Factory that creates agents based on model tier.
 */
function createAgentByTier<T = unknown>(
  name: string,
  tier: ModelTier,
  system: string,
  responseFormat?: z.ZodType<T>
): Agent<T> {
  const config = MODEL_CONFIGS[tier];

  return createAgent<T>({
    name,
    system,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    responseFormat,
  });
}

// Usage
const fastAgent = createAgentByTier('FastAgent', 'haiku', 'Quick tasks');
const qualityAgent = createAgentByTier(
  'QualityAgent',
  'opus',
  'Complex reasoning'
);
```

### 4. Agent Factory Registry

```typescript
/**
 * Registry of agent factory functions.
 */
class AgentFactoryRegistry {
  private factories = new Map<
    string,
    <T = unknown>(config: AgentConfig<T>) => Agent<T>
  >();

  /**
   * Registers a new agent factory.
   */
  register(
    type: string,
    factory: <T = unknown>(config: AgentConfig<T>) => Agent<T>
  ): void {
    this.factories.set(type, factory);
  }

  /**
   * Creates an agent using a registered factory.
   */
  create<T = unknown>(type: string, config: AgentConfig<T>): Agent<T> {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    return factory<T>(config);
  }

  /**
   * Lists all registered agent types.
   */
  listTypes(): string[] {
    return Array.from(this.factories.keys());
  }
}

// Usage
const registry = new AgentFactoryRegistry();

registry.register('coder', createCoderAgent);
registry.register('architect', createArchitectAgent);

const coder = registry.create('coder', { name: 'MainCoder' });
```

---

## Environment-Aware Factories

### 1. Environment-Based Factory

```typescript
/**
 * Environment types for factory configuration.
 */
type Environment = 'development' | 'staging' | 'production';

/**
 * Gets the current environment from process.env.
 */
function getEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) ?? 'development';
}

/**
 * Creates configuration based on environment.
 */
function createConfigForEnvironment<T>(configs: {
  development: T;
  staging: T;
  production: T;
}): T {
  const env = getEnvironment();
  return configs[env];
}

// Usage
const dbConfig = createConfigForEnvironment({
  development: {
    host: 'localhost',
    port: 5432,
    ssl: false,
  },
  staging: {
    host: 'staging-db.example.com',
    port: 5432,
    ssl: true,
  },
  production: {
    host: 'production-db.example.com',
    port: 5432,
    ssl: true,
  },
});
```

### 2. Environment-Dependent Agent Factory

```typescript
/**
 * Creates an agent with environment-specific configuration.
 */
function createEnvironmentAwareAgent<T = unknown>(
  name: string,
  system: string,
  responseFormat?: z.ZodType<T>
): Agent<T> {
  const env = getEnvironment();

  // Use cheaper/faster models in development
  const model =
    env === 'development'
      ? 'claude-haiku-4-20250514'
      : 'claude-sonnet-4-20250514';

  // Disable caching in development for faster iteration
  const enableCache = env !== 'development';

  // Enable reflection in production for reliability
  const enableReflection = env === 'production';

  return createAgent<T>({
    name,
    system,
    model,
    enableCache,
    enableReflection,
    responseFormat,
  });
}
```

### 3. Configuration Loader with Environment Mapping

```typescript
/**
 * Configuration loader that maps environment variables.
 */
class ConfigLoader {
  /**
   * Maps shell environment to SDK expectations.
   */
  static mapEnvironment(): void {
    // Map from shell environment to SDK expectations
    if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
    }

    // Set defaults if not provided
    process.env.ANTHROPIC_BASE_URL =
      process.env.ANTHROPIC_BASE_URL ?? 'https://api.z.ai/api/anthropic';
  }

  /**
   * Gets model configuration for a tier.
   */
  static getModelTier(): Record<'opus' | 'sonnet' | 'haiku', string> {
    return {
      opus: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL ?? 'GLM-4.7',
      sonnet: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ?? 'GLM-4.7',
      haiku: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? 'GLM-4.5-Air',
    };
  }

  /**
   * Creates agent configuration from environment.
   */
  static createAgentConfigFromEnv(): Pick<AgentConfig, 'env'> {
    return {
      env: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
      },
    };
  }
}

// Usage
ConfigLoader.mapEnvironment();

const agent = createAgent({
  name: 'MyAgent',
  system: 'You are a helpful assistant',
  model: ConfigLoader.getModelTier().sonnet,
  ...ConfigLoader.createAgentConfigFromEnv(),
});
```

### 4. Factory with Environment Validation

```typescript
/**
 * Validates that required environment variables are set.
 */
function validateEnvironment(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Creates a factory that validates environment before creation.
 */
function createValidatedAgentFactory<T = unknown>(
  requiredEnvVars: string[]
): (config: AgentConfig<T>) => Agent<T> {
  return (config: AgentConfig<T>) => {
    validateEnvironment(requiredEnvVars);
    return createAgent(config);
  };
}

// Usage
const createAgentWithValidation = createValidatedAgentFactory([
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_BASE_URL',
]);

const agent = createAgentWithValidation({
  name: 'ValidatedAgent',
  system: 'You are helpful',
  model: 'GLM-4.7',
});
```

---

## Groundswell Factory Patterns

Based on the Groundswell library research, here are the factory patterns used in the project.

### 1. Workflow Factory

````typescript
/**
 * Creates a functional workflow with the given configuration.
 *
 * @param config - Workflow configuration
 * @param executor - Async function that receives workflow context
 * @returns Configured workflow instance
 *
 * @example
 * ```typescript
 * const workflow = createWorkflow(
 *   { name: 'DataPipeline', enableReflection: true },
 *   async ctx => {
 *     const loaded = await ctx.step('load', async () => fetchData());
 *     const processed = await ctx.step('process', async () => transform(loaded));
 *     return processed;
 *   }
 * );
 * ```
 */
function createWorkflow<T>(
  config: { name: string; enableReflection?: boolean },
  executor: (ctx: WorkflowContext) => Promise<T>
): Workflow<T> {
  return new Workflow(config, executor);
}

/**
 * Quick one-liner workflow factory.
 *
 * @param name - Workflow name
 * @param executor - Workflow executor function
 * @returns Workflow result
 *
 * @example
 * ```typescript
 * const result = await quickWorkflow('MyWorkflow', async ctx => {
 *   await ctx.step('step1', async () => {
 *     return 'data';
 *   });
 *   return 'done';
 * });
 * ```
 */
async function quickWorkflow<T>(
  name: string,
  executor: (ctx: WorkflowContext) => Promise<T>
): Promise<WorkflowResult<T>> {
  const workflow = createWorkflow({ name }, executor);
  return await workflow.run();
}
````

### 2. Agent Factory

````typescript
/**
 * Creates an AI agent with the specified configuration.
 *
 * @param config - Agent configuration
 * @returns Configured agent instance
 *
 * @example
 * ```typescript
 * const agent = createAgent({
 *   name: 'PRPAgent',
 *   system: 'You are a PRP pipeline expert...',
 *   model: 'GLM-4.7',
 *   enableCache: true,
 *   enableReflection: true,
 *   maxTokens: 4096,
 *   temperature: 0.1,
 * });
 * ```
 */
function createAgent<T = unknown>(config: {
  name: string;
  system: string;
  model: string;
  enableCache?: boolean;
  enableReflection?: boolean;
  maxTokens?: number;
  temperature?: number;
  mcps?: MCP[];
  tools?: Tool[];
  hooks?: AgentHooks;
  env?: Record<string, string>;
  responseFormat?: z.ZodType<T>;
}): Agent<T> {
  return new Agent(config);
}
````

### 3. Prompt Factory

````typescript
/**
 * Creates a type-safe prompt with Zod schema validation.
 *
 * @param config - Prompt configuration
 * @returns Configured prompt instance
 *
 * @example
 * ```typescript
 * const analysisPrompt = createPrompt({
 *   user: 'Analyze this codebase for security vulnerabilities',
 *   data: { codebasePath: './src' },
 *   responseFormat: z.object({
 *     vulnerabilities: z.array(z.object({
 *       severity: z.enum(['low', 'medium', 'high', 'critical']),
 *       description: z.string(),
 *     })),
 *   }),
 * });
 *
 * const result = await agent.prompt(analysisPrompt);
 * // Result is fully typed based on the Zod schema
 * ```
 */
function createPrompt<T>(config: {
  user: string;
  system?: string;
  data?: Record<string, unknown>;
  responseFormat: z.ZodType<T>;
  enableReflection?: boolean;
}): Prompt<T> {
  return new Prompt(config);
}
````

### 4. Factory Integration Example

```typescript
/**
 * Complete example of factory integration in Groundswell.
 */
class PRPPipeline extends Workflow {
  @ObservedState()
  sessionPath: string = '';

  @Step({ snapshotState: true })
  async initializeSession(): Promise<void> {
    const hash = this.hashPRD(this.prdPath);
    this.sessionPath = `plan/001_${hash}`;
    await this.createSessionDirectory();
  }

  @Task({ concurrent: true })
  async executeBacklog(): Promise<TaskWorkflow[]> {
    // Create agent using factory
    const agent = createAgent({
      name: 'TaskExecutor',
      system: TASK_EXECUTOR_SYSTEM_PROMPT,
      model: 'GLM-4.7',
      enableCache: true,
      enableReflection: true,
    });

    // Get tasks from registry
    const tasks = this.taskRegistry.getPendingTasks();

    // Create child workflows with agent
    return tasks.map(task => new TaskWorkflow(task, this, agent));
  }

  async run(): Promise<ExecutionResult> {
    this.setStatus('running');

    await this.initializeSession();
    const phases = await this.executeBacklog();

    this.setStatus('completed');
    return { phases };
  }
}
```

---

## Complete Examples

### Example 1: Complete Agent Factory System

```typescript
/**
 * Complete agent factory system with type safety and environment awareness.
 */

// 1. Define configuration interfaces
interface AgentConfig<T = unknown> {
  name: string;
  system: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  enableCache?: boolean;
  enableReflection?: boolean;
  tools?: Tool[];
  responseFormat?: z.ZodType<T>;
}

type AgentType = 'coder' | 'architect' | 'reviewer' | 'tester';

type ModelTier = 'opus' | 'sonnet' | 'haiku';

// 2. Create configuration registry
const AGENT_CONFIGS: Record<
  AgentType,
  Omit<AgentConfig, 'name' | 'system' | 'responseFormat'>
> = {
  coder: {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.1,
    maxTokens: 4096,
    enableCache: true,
    enableReflection: false,
  },
  architect: {
    model: 'claude-opus-4-20250514',
    temperature: 0.2,
    maxTokens: 8192,
    enableCache: true,
    enableReflection: true,
  },
  reviewer: {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.0,
    maxTokens: 4096,
    enableCache: true,
    enableReflection: true,
  },
  tester: {
    model: 'claude-haiku-4-20250514',
    temperature: 0.0,
    maxTokens: 2048,
    enableCache: true,
    enableReflection: false,
  },
};

// 3. Create specialized factories
function createAgentByType<T = unknown>(
  type: AgentType,
  name: string,
  system: string,
  responseFormat?: z.ZodType<T>
): Agent<T> {
  const baseConfig = AGENT_CONFIGS[type];
  const env = getEnvironment();

  // Override model in development for faster iteration
  const model =
    env === 'development' ? 'claude-haiku-4-20250514' : baseConfig.model;

  return createAgent<T>({
    name,
    system,
    model,
    temperature: baseConfig.temperature,
    maxTokens: baseConfig.maxTokens,
    enableCache: baseConfig.enableCache && env !== 'test',
    enableReflection: baseConfig.enableReflection && env === 'production',
    responseFormat,
  });
}

// 4. Create domain-specific factories
const agentFactories = {
  createCoder: (name: string) =>
    createAgentByType('coder', name, CODER_SYSTEM_PROMPT),

  createArchitect: <T = ArchitectureResult>(name: string) =>
    createAgentByType<T>(
      'architect',
      name,
      ARCHITECT_SYSTEM_PROMPT,
      ArchitectureSchema
    ),

  createReviewer: (name: string) =>
    createAgentByType('reviewer', name, REVIEWER_SYSTEM_PROMPT),

  createTester: (name: string) =>
    createAgentByType('tester', name, TESTER_SYSTEM_PROMPT),
};

// 5. Usage
const coderAgent = agentFactories.createCoder('MainCoder');
const architectAgent = agentFactories.createArchitect('MainArchitect');
const reviewerAgent = agentFactories.createReviewer('MainReviewer');

// 6. Factory registry for dynamic creation
class AgentFactoryRegistry {
  private factories = new Map<
    AgentType,
    (typeof agentFactories)[keyof typeof agentFactories]
  >();

  constructor() {
    this.factories.set('coder', agentFactories.createCoder);
    this.factories.set('architect', agentFactories.createArchitect);
    this.factories.set('reviewer', agentFactories.createReviewer);
    this.factories.set('tester', agentFactories.createTester);
  }

  create(type: AgentType, name: string): Agent {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    return factory(name);
  }
}

const registry = new AgentFactoryRegistry();
const dynamicAgent = registry.create('coder', 'DynamicCoder');
```

### Example 2: Configuration Factory with Validation

```typescript
/**
 * Complete configuration factory with Zod validation and environment awareness.
 */

import { z } from 'zod';

// 1. Define Zod schemas
const TaskConfigSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(5).optional().default(3),
  assignee: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  recurrence: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: z.number().int().min(1),
      endDate: z.date().optional(),
    })
    .optional(),
});

type TaskConfig = z.infer<typeof TaskConfigSchema>;

// 2. Create configuration factory
class TaskConfigFactory {
  private env: Environment;

  constructor() {
    this.env = getEnvironment();
  }

  /**
   * Creates and validates task configuration.
   */
  create(rawConfig: unknown): TaskConfig {
    // Add environment-specific defaults
    const envDefaults: Partial<TaskConfig> = {
      priority: this.env === 'production' ? 3 : 5,
    };

    // Parse and validate
    const config = TaskConfigSchema.parse(rawConfig);

    // Apply environment defaults
    return {
      ...envDefaults,
      ...config,
    };
  }

  /**
   * Creates a batch of configurations.
   */
  createBatch(rawConfigs: unknown[]): TaskConfig[] {
    return rawConfigs.map(config => this.create(config));
  }

  /**
   * Creates configuration from environment variables.
   */
  createFromEnv(): Partial<TaskConfig> {
    return {
      title: process.env.TASK_TITLE ?? '',
      description: process.env.TASK_DESCRIPTION,
      priority: process.env.TASK_PRIORITY
        ? parseInt(process.env.TASK_PRIORITY, 10)
        : undefined,
      assignee: process.env.TASK_ASSIGNEE,
    };
  }
}

// 3. Usage
const factory = new TaskConfigFactory();

const taskConfig = factory.create({
  title: 'Complete documentation',
  description: 'Write comprehensive factory pattern docs',
  priority: 1,
  tags: ['documentation', 'typescript'],
});

// Batch creation
const batchConfigs = factory.createBatch([
  { title: 'Task 1', priority: 1 },
  { title: 'Task 2', priority: 2 },
  { title: 'Task 3', priority: 3 },
]);

// From environment
process.env.TASK_TITLE = 'Env Task';
process.env.TASK_PRIORITY = '2';
const envConfig = factory.createFromEnv();
```

---

## References and Resources

### Official TypeScript Documentation

- **TypeScript Handbook - Generics**: https://www.typescriptlang.org/docs/handbook/2/generics.html
- **TypeScript Handbook - Type Narrowing**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **TypeScript Handbook - Discriminated Unions**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
- **TypeScript Handbook - Utility Types**: https://www.typescriptlang.org/docs/handbook/utility-types.html
- **TypeScript 5.2 Release Notes**: https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/

### Factory Pattern Resources

1. **Refactoring Guru - Factory Pattern**
   - https://refactoring.guru/design-patterns/factory-method
   - Comprehensive explanation with diagrams

2. **Addison Wesley - Design Patterns**
   - Gang of Four book chapter on creational patterns

3. **Martin Fowler - Factory Pattern**
   - https://martinfowler.com/bliki/Factory.html

### TypeScript Best Practices

1. **Effective TypeScript by Dan Vanderkam**
   - Blog: https://effectivetypescript.com/
   - Book: https://www.oreilly.com/library/view/effective-typescript/9781492053736/

2. **TypeScript Deep Dive by Basarat Ali Syed**
   - https://basarat.gitbook.io/typescript/

3. **React TypeScript Cheatsheet**
   - https://react-typescript-cheatsheet.netlify.app/

### Groundswell Documentation

1. **Groundswell GitHub Repository**
   - https://github.com/groundswell-ai/groundswell
   - Source: `/home/dustin/projects/groundswell`

2. **Groundswell Factory Functions**
   - `createWorkflow(config, executor)`
   - `createAgent(config)`
   - `createPrompt(config)`
   - Source: `/home/dustin/projects/groundswell/src/core/factory.ts`

3. **Groundswell Examples**
   - `/home/dustin/projects/groundswell/examples/examples/01-basic-workflow.ts`
   - `/home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts`
   - `/home/dustin/projects/groundswell/examples/examples/07-agent-loops.ts`

### Zod Validation

1. **Zod Documentation**
   - https://zod.dev/
   - Schema validation with TypeScript type inference

2. **Zod GitHub**
   - https://github.com/colinhacks/zod

### Node.js and TypeScript

1. **Node.js 20+ Documentation**
   - https://nodejs.org/docs/latest-v20.x/api/
   - ESM support, test runner, performance improvements

2. **tsx - TypeScript Executor**
   - https://tsx.is/
   - Fast TypeScript execution using esbuild

### Community Resources

1. **TypeScript Discord Server**: https://discord.com/invite/typescript
2. **Reddit r/typescript**: https://reddit.com/r/typescript
3. **Stack Overflow TypeScript Tag**: https://stackoverflow.com/questions/tagged/typescript
4. **Total TypeScript**: https://totaltypescript.com/
5. **Matt Pocock's TypeScript Tips**: https://www.youtube.com/@mattpocockuk

---

## Summary of Key Best Practices

### Factory Function Design

1. **Use factory functions** over constructors for flexible object creation
2. **Provide sensible defaults** but allow override
3. **Validate inputs** and throw descriptive errors
4. **Support currying** for pre-configured factories
5. **Return immutable objects** where possible

### Type Safety

1. **Use generics** for flexible, type-safe factories
2. **Leverage discriminated unions** for type narrowing
3. **Infer types from Zod schemas** for runtime validation
4. **Use utility types** (Partial, Omit, Extract) effectively
5. **Write type guards** for custom type predicates

### Configuration Objects

1. **Use interfaces** for configuration shapes
2. **Support builder patterns** for complex configuration
3. **Validate with Zod** for runtime type checking
4. **Support composition** of configuration objects
5. **Provide clear JSDoc** for all configuration options

### Agent Factories

1. **Create specialized factories** for different agent types
2. **Support model tiers** (opus, sonnet, haiku)
3. **Enable environment-aware** configuration
4. **Use factory registries** for dynamic creation
5. **Integrate with tools** and MCP servers

### Environment Awareness

1. **Detect environment** from process.env
2. **Adjust models** based on environment (dev vs prod)
3. **Map environment variables** to SDK expectations
4. **Validate required** environment variables
5. **Support environment-specific** defaults

### Groundswell Integration

1. **Use `createWorkflow`** for functional workflows
2. **Use `createAgent`** for agent creation
3. **Use `createPrompt`** with Zod schemas
4. **Leverage decorators** (@Step, @Task, @ObservedState)
5. **Support hierarchical** workflows with parent-child relationships

---

_This research document was compiled to inform the design of factory patterns for the hacky-hack PRP Pipeline project, combining best practices from TypeScript, Node.js, Groundswell, and the broader developer community._
