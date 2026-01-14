# Implementation Patterns & Best Practices

## Code Organization Patterns

### Directory Structure

```
src/
├── agents/              # Agent implementations
│   ├── prompts/        # Agent prompt templates
│   ├── agent-factory.ts
│   ├── prp-generator.ts
│   └── prp-executor.ts
├── workflows/          # Workflow definitions
│   ├── prp-pipeline.ts
│   ├── fix-cycle-workflow.ts
│   ├── bug-hunt-workflow.ts
│   └── delta-analysis-workflow.ts
├── tools/              # MCP tool wrappers
│   ├── bash-mcp.ts
│   ├── git-mcp.ts
│   └── filesystem-mcp.ts
├── core/               # Core utilities
│   ├── validators/     # PRD validation
│   ├── research-queue.ts
│   └── resource-monitor.ts
├── utils/              # General utilities
│   ├── logger.ts
│   └── errors.ts
└── cli/                # CLI interface
    └── index.ts

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
```

---

## Workflow Implementation Pattern

### Declarative Workflow Definition

**Template**:

```typescript
import { Workflow, Step } from 'groundswell';

const workflow = new Workflow({
  name: 'workflow-name',
  description: 'Human-readable description',
  steps: [
    {
      name: 'step-name',
      description: 'What this step does',
      execute: async context => {
        // Step implementation
        return result;
      },
    },
  ],
});

export default workflow;
```

**Best Practices**:

1. **Naming**: Use kebab-case for workflow names
2. **Description**: Provide clear descriptions for each step
3. **Error Handling**: Wrap step logic in try-catch
4. **Logging**: Use structured logging with context
5. **Return Values**: Return step results for next steps

**Example**: `src/workflows/prp-pipeline.ts`

```typescript
export default new Workflow({
  name: 'prp-pipeline',
  description: 'Generate PRP task breakdown from PRD',
  steps: [
    {
      name: 'validate-prd',
      description: 'Validate PRD structure and content',
      execute: async context => {
        const validator = new PRDValidator(context.prdPath);
        return await validator.validate();
      },
    },
    // ... more steps
  ],
});
```

---

## Agent Implementation Pattern

### Factory-Based Agent Creation

**Template**:

```typescript
import { createAgent, type Agent } from 'groundswell';
import { createPrompt } from 'groundswell';
import architectPrompt from './prompts/architect-prompt.js';

const agent: Agent = createAgent({
  role: 'architect',
  systemPrompt: createPrompt(architectPrompt),
  tools: [
    /* tool list */
  ],
  config: {
    temperature: 0.7,
    maxTokens: 4000,
  },
});

export default agent;
```

**Best Practices**:

1. **Role Definition**: Clear, specific role names
2. **Prompt Separation**: Keep prompts in separate files
3. **Tool Selection**: Only include necessary tools
4. **Configuration**: Document temperature and token choices
5. **Error Handling**: Handle agent failures gracefully

**Example**: `src/agents/agent-factory.ts`

```typescript
export function createPRPAgent(context: AgentContext): Agent {
  return createAgent({
    role: 'prp-architect',
    systemPrompt: createPrompt(architectPrompt),
    tools: [createBashTool(), createGitTool(), createFilesystemTool()],
    config: {
      temperature: 0.7,
      maxTokens: 4000,
    },
  });
}
```

---

## Prompt Engineering Pattern

### Prompt Template Structure

**Template**:

```typescript
import { createPrompt } from 'groundswell';

export default createPrompt(`
# Role

You are a [ROLE_NAME]...

# Context

{{CONTEXT_VARIABLE}}

# Task

1. First task
2. Second task
3. Third task

# Output Format

{{OUTPUT_FORMAT}}

# Constraints

- Constraint 1
- Constraint 2
`);
```

**Best Practices**:

1. **Clear Structure**: Use sections with headers
2. **Variable Placeholders**: Use `{{VARIABLE}}` for substitution
3. **Examples**: Provide input/output examples
4. **Constraints**: Explicitly list what NOT to do
5. **Output Format**: Specify exact JSON or text format

**Example**: `src/agents/prompts/architect-prompt.ts`

```typescript
export default createPrompt(`
# Role

You are a Technical Architect responsible for...

# Task

Analyze the PRD and create a task breakdown...

# Output Format

Return a JSON object with the following structure:
{
  "backlog": [
    {
      "type": "Phase",
      "id": "P[#]",
      "title": "Phase Title",
      // ...
    }
  ]
}

# Constraints

- Every subtask MUST have context_scope
- Story points: 0.5, 1, or 2 only
- Dependencies must reference valid task IDs
`);
```

---

## Tool Implementation Pattern

### MCP Tool Wrapper

**Template**:

```typescript
import { MCPHandler, type Tool, type ToolExecutor } from 'groundswell';

const executor: ToolExecutor = new MCPHandler({
  name: 'tool-name',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-name'],
});

const tool: Tool = {
  name: 'tool-name',
  description: 'Human-readable description',
  executor: executor,
};

export default tool;
```

**Best Practices**:

1. **Error Handling**: Wrap MCP calls in try-catch
2. **Timeout**: Set reasonable timeouts for tool execution
3. **Logging**: Log tool execution with parameters
4. **Validation**: Validate tool inputs before execution
5. **Cleanup**: Clean up resources after tool use

**Example**: `src/tools/bash-mcp.ts`

```typescript
const bashExecutor = new MCPHandler({
  name: 'bash',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-bash'],
  env: {
    // Environment variables for MCP server
  },
});

export const bashTool: Tool = {
  name: 'bash',
  description: 'Execute bash commands',
  executor: bashExecutor,
};
```

---

## Validation Pattern

### Structured Validation

**Template**:

```typescript
export class Validator {
  validate(input: unknown): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check 1
    if (!condition1) {
      issues.push({
        severity: 'critical',
        message: 'Validation message',
        suggestion: 'How to fix',
        reference: 'PRD Section X',
      });
    }

    // Check 2
    // ...

    return {
      valid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      summary: {
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
      },
    };
  }
}
```

**Best Practices**:

1. **Severity Levels**: Use critical, warning, info
2. **Helpful Messages**: Explain what's wrong and how to fix
3. **References**: Link to PRD sections or documentation
4. **Batch Validation**: Collect all issues before failing
5. **Clear Summary**: Provide issue counts by severity

**Example**: `src/core/validators/prd-validator.ts`

```typescript
export class PRDValidator {
  async validate(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check file exists
    if (!(await fileExists(this.prdPath))) {
      issues.push({
        severity: 'critical',
        message: `PRD file not found: ${this.prdPath}`,
        suggestion: 'Create a PRD.md file in the project root',
        reference: 'PRD Section 1',
      });
    }

    // Check file not empty
    const content = await readFile(this.prdPath, 'utf-8');
    if (!content.trim()) {
      issues.push({
        severity: 'critical',
        message: 'PRD file is empty',
        suggestion: 'Add PRD content to the file',
        reference: 'PRD Section 1',
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      summary: this.summarizeIssues(issues),
    };
  }
}
```

---

## Error Handling Pattern

### Structured Error Handling

**Template**:

```typescript
import { getLogger, type Logger } from './utils/logger.js';

const logger = getLogger('ContextName');

try {
  // Operation
  const result = await riskyOperation();
  logger.info({ result }, 'Operation succeeded');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(
    {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    },
    'Operation failed'
  );

  // Re-throw or handle
  throw new Error(`Operation failed: ${errorMessage}`);
}
```

**Best Practices**:

1. **Type Guards**: Check `error instanceof Error`
2. **Structured Logging**: Log errors with context
3. **Stack Traces**: Include stack traces for debugging
4. **User-Friendly Messages**: Convert technical errors to helpful messages
5. **Error Propagation**: Re-throw when appropriate

**Example**: `src/core/research-queue.ts`

```typescript
this.processNext(backlog).catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.#logger.error(
    {
      taskId: task.id,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    },
    'Background task failed during chaining'
  );
});
```

---

## Testing Patterns

### Unit Test Structure

**Template**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from './module.js';

describe('functionToTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should handle errors', async () => {
    // Arrange
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));

    // Act & Assert
    await expect(functionToTest(mockFn)).rejects.toThrow('Test error');
  });
});
```

**Best Practices**:

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Should statements describe behavior
3. **Mock Cleanup**: Clear mocks in beforeEach
4. **Error Testing**: Test both success and failure cases
5. **Coverage**: Aim for 100% coverage

**Example**: `tests/unit/core/research-queue.test.ts`

```typescript
describe('ResearchQueue', () => {
  let queue: ResearchQueue;
  let mockPRPGenerator: MockPRPGenerator;

  beforeEach(() => {
    mockPRPGenerator = createMockPRPGenerator();
    queue = new ResearchQueue(mockPRPGenerator);
    vi.clearAllMocks();
  });

  it('should enqueue research task', async () => {
    // Arrange
    const task = createTestTask();

    // Act
    await queue.enqueue(task);

    // Assert
    expect(mockPRPGenerator.generate).toHaveBeenCalled();
  });
});
```

---

## Logging Pattern

### Structured Logging

**Template**:

```typescript
import { getLogger, type Logger } from './utils/logger.js';

const logger = getLogger('ComponentName', { verbose: true });

logger.info('Operation started');
logger.debug({ details: 'value' }, 'Detailed information');
logger.warn('Potential issue detected');
logger.error({ error: errorMessage }, 'Operation failed');
logger.info({ taskId: 'P1.M1.T1', status: 'completed' }, 'Task completed');
```

**Best Practices**:

1. **Context-Aware**: Create loggers with component names
2. **Structured Data**: Pass objects as first parameter
3. **Log Levels**: Use appropriate levels (debug, info, warn, error)
4. **User-Facing**: Use emojis and clear messages for CLI output
5. **No console.log**: Always use logger, never console.log

**Example**: `src/index.ts`

```typescript
const logger = getLogger('App', { verbose: args.verbose });

logger.info('🔍 Validating PRD...');
logger.info(`\n✅ Pipeline completed successfully`);
logger.info({ completedTasks, totalTasks }, '📊 Task completion summary');
logger.error({ error: errorMessage }, '❌ Pipeline failed');
```

---

## Type Safety Patterns

### TypeScript Best Practices

**1. Strict Type Checking**:

```typescript
// ❌ Bad - any type
function process(data: any) { ... }

// ✅ Good - specific type
function process(data: { id: string; name: string }) { ... }
```

**2. Nullable Handling**:

```typescript
// ❌ Bad - violates strict-boolean-expressions
if (nullableString) { ... }

// ✅ Good - explicit null check
if (nullableString && nullableString.trim()) { ... }
if (nullableString?.length) { ... }
if (nullableString ?? defaultValue) { ... }
```

**3. Type Guards**:

```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Usage
if (isError(error)) {
  console.log(error.message); // Type-safe
}
```

**4. Discriminated Unions**:

```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };

function handle(result: Result) {
  if (result.success) {
    console.log(result.data); // Type-safe
  } else {
    console.log(result.error); // Type-safe
  }
}
```

---

## Configuration Pattern

### Environment-Based Configuration

**Template**:

```typescript
interface Config {
  readonly nodeId: string;
  readonly maxTasks: number;
  readonly memoryThreshold: number;
}

function loadConfig(): Config {
  return {
    nodeId: process.env.NODE_ID ?? 'local',
    maxTasks: parseInt(process.env.MAX_TASKS ?? '10', 10),
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD ?? '1024', 10),
  };
}
```

**Best Practices**:

1. **Immutable**: Use `readonly` properties
2. **Default Values**: Provide sensible defaults
3. **Validation**: Validate configuration values
4. **Documentation**: Document all config options
5. **Type Safety**: Use TypeScript types for config

---

## Async/Await Patterns

### Promise Handling

**Template**:

```typescript
// Always use try-catch for async operations
async function operation(): Promise<Result> {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, 'Operation failed');
    throw new Error(`Operation failed: ${errorMessage}`);
  }
}

// Parallel operations with Promise.all
async function parallelOperations(): Promise<Result[]> {
  const operations = [op1(), op2(), op3()];
  return Promise.all(operations);
}

// Parallel operations with error handling
async function parallelOperationsWithErrorHandling(): Promise<Result[]> {
  const operations = [op1(), op2(), op3()];
  const results = await Promise.allSettled(operations);

  return results
    .filter(
      (r): r is PromiseFulfilledResult<Result> => r.status === 'fulfilled'
    )
    .map(r => r.value);
}
```

---

## File I/O Patterns

### File Operations

**Template**:

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Read file with error handling
async function readConfig(path: string): Promise<Config> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ path, error: errorMessage }, 'Failed to read config');
    throw new Error(`Config read failed: ${errorMessage}`);
  }
}

// Write file with error handling
async function writeResult(path: string, data: unknown): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await writeFile(path, content, 'utf-8');
    logger.info({ path }, 'Result written successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ path, error: errorMessage }, 'Failed to write result');
    throw new Error(`Result write failed: ${errorMessage}`);
  }
}
```

---

## Resource Management Patterns

### Cleanup & Disposal

**Template**:

```typescript
export class ResourceManager {
  #resources: Set<Resource> = new Set();

  acquire(resource: Resource): void {
    this.#resources.add(resource);
  }

  dispose(): void {
    for (const resource of this.#resources) {
      try {
        resource.close();
      } catch (error) {
        logger.error({ error }, 'Failed to close resource');
      }
    }
    this.#resources.clear();
  }
}

// Usage
const manager = new ResourceManager();
try {
  // Use resources
} finally {
  manager.dispose();
}
```

---

## Documentation Patterns

### Code Documentation

**Template**:

````typescript
/**
 * Validates a PRD file against required structure and content.
 *
 * @param prdPath - Path to the PRD markdown file
 * @returns Promise<ValidationResult> - Validation result with issues
 *
 * @throws {Error} If file cannot be read
 *
 * @example
 * ```typescript
 * const validator = new PRDValidator('PRD.md');
 * const result = await validator.validate();
 * if (result.valid) {
 *   console.log('PRD is valid');
 * }
 * ```
 */
export class PRDValidator {
  // ...
}
````

**Best Practices**:

1. **JSDoc Comments**: Document public APIs
2. **Type Comments**: Explain complex types
3. **Examples**: Provide usage examples
4. **Parameters**: Document all parameters
5. **Return Values**: Document return types and possible errors

---

## Performance Patterns

### Optimization Techniques

**1. Lazy Loading**:

```typescript
// Load resources only when needed
function getValidator() {
  if (!cachedValidator) {
    cachedValidator = new PRDValidator();
  }
  return cachedValidator;
}
```

**2. Batching**:

```typescript
// Batch multiple operations
async function processFiles(paths: string[]): Promise<Result[]> {
  const batchSize = 10;
  const results: Result[] = [];

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFile));
    results.push(...batchResults);
  }

  return results;
}
```

**3. Caching**:

```typescript
const cache = new Map<string, Result>();

async function getCachedResult(key: string): Promise<Result> {
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const result = await computeResult(key);
  cache.set(key, result);
  return result;
}
```

---

## Security Patterns

### Input Validation

**Template**:

```typescript
function sanitizePath(path: string): string {
  // Remove directory traversal attempts
  const sanitized = path.replace(/\.\./g, '');

  // Ensure path is within allowed directory
  const resolved = resolve(sanitized);
  if (!resolved.startsWith(allowedDirectory)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}

function validateCommand(command: string): void {
  // Block dangerous commands
  const dangerous = ['rm -rf', 'format', 'mkfs'];
  if (dangerous.some(d => command.includes(d))) {
    throw new Error('Dangerous command blocked');
  }
}
```

---

## Testing Anti-Patterns to Avoid

### Common Mistakes

**1. Testing Implementation Details**:

```typescript
// ❌ Bad - tests internal structure
it('should set internal flag', () => {
  expect(obj.internalFlag).toBe(true);
});

// ✅ Good - tests behavior
it('should return processed result', () => {
  expect(obj.process()).toBe('expected');
});
```

**2. Fragile Tests**:

```typescript
// ❌ Bad - depends on exact order
it('should call functions in order', () => {
  expect(mockFn1).toHaveBeenCalledBefore(mockFn2);
});

// ✅ Good - tests outcome
it('should produce correct result', () => {
  expect(result).toEqual(expected);
});
```

**3. Missing Cleanup**:

```typescript
// ❌ Bad - no cleanup
afterEach(() => {
  // Tests leave state behind
});

// ✅ Good - proper cleanup
afterEach(() => {
  vi.clearAllMocks();
  queue.clearCache();
});
```

---

## Git Integration Patterns

### Git Operations

**Template**:

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function getGitDiff(): Promise<string> {
  try {
    const { stdout } = await execAsync('git diff');
    return stdout;
  } catch (error) {
    logger.error({ error }, 'Failed to get git diff');
    throw new Error('Git diff failed');
  }
}

async function getGitStatus(): Promise<GitStatus> {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    return parseGitStatus(stdout);
  } catch (error) {
    logger.error({ error }, 'Failed to get git status');
    throw new Error('Git status failed');
  }
}
```

---

## CLI Interface Patterns

### Command-Line Argument Handling

**Template**:

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('hacky-hack')
  .description('PRP Pipeline Automation')
  .version('1.0.0')
  .option('--prd <path>', 'Path to PRD file')
  .option('--verbose', 'Enable verbose logging')
  .option('--scope <scope>', 'Limit execution scope')
  .action(async options => {
    try {
      await runPipeline(options);
    } catch (error) {
      console.error('Pipeline failed:', error);
      process.exit(1);
    }
  });

program.parse();
```

**Best Practices**:

1. **Help Text**: Provide clear help messages
2. **Defaults**: Use sensible defaults for options
3. **Validation**: Validate command-line arguments
4. **Error Handling**: Catch and report errors clearly
5. **Exit Codes**: Use appropriate exit codes

---

## Concurrency Patterns

### Async Task Queue

**Template**:

```typescript
export class TaskQueue<T> {
  #queue: Array<T> = [];
  #processing = false;
  #maxConcurrency = 5;

  async enqueue(task: T): Promise<void> {
    this.#queue.push(task);

    if (!this.#processing) {
      this.#processing = true;
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    while (this.#queue.length > 0) {
      const batch = this.#queue.splice(0, this.#maxConcurrency);
      await Promise.all(batch.map(task => this.process(task)));
    }

    this.#processing = false;
  }

  private async process(task: T): Promise<void> {
    // Process task
  }
}
```

---

## Monitoring & Observability

### Health Checks

**Template**:

```typescript
export class HealthMonitor {
  async check(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkMemory(),
      this.checkFileHandles(),
      this.checkDiskSpace(),
    ]);

    const healthy = checks.every(c => c.status === 'ok');

    return {
      status: healthy ? 'ok' : 'degraded',
      checks,
    };
  }

  private async checkMemory(): Promise<CheckResult> {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    return {
      status: heapUsedMB < 1024 ? 'ok' : 'warning',
      metric: 'memory',
      value: heapUsedMB,
      unit: 'MB',
    };
  }
}
```

---

## Migration & Upgrade Patterns

### Backward Compatibility

**Template**:

```typescript
function migrateConfig(oldConfig: unknown): Config {
  if (isOldConfigFormat(oldConfig)) {
    return {
      ...oldConfig,
      newField: oldConfig.oldField ?? defaultValue,
    };
  }

  return oldConfig as Config;
}

function isOldConfigFormat(config: unknown): config is OldConfig {
  return typeof config === 'object' && config !== null && 'oldField' in config;
}
```

---

This patterns guide should be referenced when implementing bug fixes to ensure consistency with the existing codebase architecture and best practices.
