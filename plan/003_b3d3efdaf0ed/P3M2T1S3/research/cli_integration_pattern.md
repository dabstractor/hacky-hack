# CLI to TaskOrchestrator Integration Pattern Research

## Summary

This document describes how CLI options are passed through to TaskOrchestrator in the hacky-hack codebase.

## Flow Chain

```
CLI (src/cli/index.ts)
  -> parseCLIArgs() returns ValidatedCLIArgs
  -> src/index.ts (main entry point)
  -> PRPPipeline constructor (src/workflows/prp-pipeline.ts)
  -> PRPPipeline.initializeSession()
  -> TaskOrchestrator constructor
```

## Key Files and Line Numbers

### 1. CLI Definition (`src/cli/index.ts`)

**Lines 192-210**: CLI option definitions for similar options
```typescript
.option(
  '--parallelism <n>',
  'Max concurrent subtasks (1-10, default: 2)',
  '2'
)
.option(
  '--research-concurrency <n>',
  'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
  process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
)
```

**Lines 57-105**: CLIArgs interface definition
```typescript
export interface CLIArgs {
  parallelism: number | string;  // May be string from commander
  researchConcurrency: number | string;
  // ...
}
```

**Lines 368-436**: Validation and conversion to number
```typescript
// Validate parallelism
const parallelism = parseInt(parallelismStr, 10);
if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
  logger.error('--parallelism must be an integer between 1 and 10');
  process.exit(1);
}
options.parallelism = parallelism;  // Store validated number
```

### 2. Main Entry Point (`src/index.ts`)

**Lines 202-215**: PRPPipeline instantiation with CLI args
```typescript
const pipeline = new PRPPipeline(
  args.prd,
  scope,
  args.mode,
  args.noCache,
  args.continueOnError,
  args.maxTasks,
  args.maxDuration,
  args.monitorInterval,
  undefined, // planDir - use default
  args.progressMode ?? 'auto',
  args.parallelism,        // Passed to PRPPipeline
  args.researchConcurrency
);
```

### 3. PRPPipeline (`src/workflows/prp-pipeline.ts`)

**Lines 235-239**: Private properties for config
```typescript
/** Parallelism limit for concurrent subtask execution */
readonly #parallelism: number = 2;

/** Research queue concurrency limit for parallel PRP generation */
readonly #researchQueueConcurrency: number = 3;
```

**Lines 261-274**: Constructor parameters
```typescript
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false,
  continueOnError: boolean = false,
  maxTasks?: number,
  maxDuration?: number,
  monitorInterval?: number,
  planDir?: string,
  progressMode: 'auto' | 'always' | 'never' = 'auto',
  parallelism: number = 2,
  researchQueueConcurrency: number = 3
)
```

**Lines 294-295**: Store values
```typescript
this.#parallelism = parallelism;
this.#researchQueueConcurrency = researchQueueConcurrency;
```

**Lines 468-473**: TaskOrchestrator instantiation in `initializeSession()`
```typescript
this.taskOrchestrator = new TaskOrchestratorClass(
  this.sessionManager,
  this.#scope,
  this.#noCache,
  this.#researchQueueConcurrency  // Only researchQueueConcurrency passed
);
```

**IMPORTANT**: The `parallelism` value is stored in PRPPipeline but NOT passed to TaskOrchestrator.

### 4. TaskOrchestrator (`src/core/task-orchestrator.ts`)

**Lines 119-124**: Current constructor (from P3.M2.T1.S2 PRP)
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  retryConfig?: Partial<TaskRetryConfig>  // NEW from P3.M2.T1.S2
)
```

## Pattern for Adding Retry CLI Options

Following the existing pattern, to add retry configuration options:

### Step 1: Add CLI Options (`src/cli/index.ts`)

```typescript
.option(
  '--task-retry <n>',
  'Max retry attempts for transient errors (0-10, default: 3, env: HACKY_TASK_RETRY_MAX_ATTEMPTS)',
  process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS ?? '3'
)
.option(
  '--retry-backoff <ms>',
  'Base delay before first retry in ms (100-60000, default: 1000)',
  '1000'
)
.option(
  '--no-retry',
  'Disable automatic retry for all tasks'
)
```

### Step 2: Add to CLIArgs Interface

```typescript
export interface CLIArgs {
  // ... existing properties
  taskRetry?: number | string;
  retryBackoff?: number | string;
  noRetry: boolean;
}
```

### Step 3: Validate and Convert

```typescript
// Validate task-retry
if (options.taskRetry !== undefined) {
  const taskRetry = parseInt(String(options.taskRetry), 10);
  if (isNaN(taskRetry) || taskRetry < 0 || taskRetry > 10) {
    logger.error('--task-retry must be an integer between 0 and 10');
    process.exit(1);
  }
  options.taskRetry = taskRetry;
}

// Validate retry-backoff
if (options.retryBackoff !== undefined) {
  const retryBackoff = parseInt(String(options.retryBackoff), 10);
  if (isNaN(retryBackoff) || retryBackoff < 100 || retryBackoff > 60000) {
    logger.error('--retry-backoff must be an integer between 100 and 60000');
    process.exit(1);
  }
  options.retryBackoff = retryBackoff;
}
```

### Step 4: Pass to PRPPipeline (`src/index.ts`)

```typescript
const pipeline = new PRPPipeline(
  args.prd,
  scope,
  args.mode,
  args.noCache,
  args.continueOnError,
  args.maxTasks,
  args.maxDuration,
  args.monitorInterval,
  undefined,
  args.progressMode ?? 'auto',
  args.parallelism,
  args.researchConcurrency,
  args.taskRetry,       // NEW
  args.retryBackoff,    // NEW
  args.noRetry          // NEW
);
```

### Step 5: PRPPipeline Constructor and Storage

```typescript
// Add private properties
readonly #taskRetry?: number;
readonly #retryBackoff?: number;
readonly #noRetry: boolean = false;

// Add constructor parameters
constructor(
  // ... existing parameters
  parallelism: number = 2,
  researchQueueConcurrency: number = 3,
  taskRetry?: number,
  retryBackoff?: number,
  noRetry: boolean = false
)

// Store values
this.#taskRetry = taskRetry;
this.#retryBackoff = retryBackoff;
this.#noRetry = noRetry;
```

### Step 6: Pass to TaskOrchestrator (`src/workflows/prp-pipeline.ts`, line 468-473)

```typescript
// Build retry config from CLI options
const retryConfig: Partial<TaskRetryConfig> = {
  maxAttempts: this.#taskRetry,
  baseDelay: this.#retryBackoff,
  enabled: !this.#noRetry,
};

this.taskOrchestrator = new TaskOrchestratorClass(
  this.sessionManager,
  this.#scope,
  this.#noCache,
  this.#researchQueueConcurrency,
  retryConfig  // NEW: Pass retry config
);
```

## Key Gotchas

1. **Type conversion**: Commander returns string values, must `parseInt()` to convert to number
2. **Environment variables**: Support env var fallback with `process.env.VAR ?? 'default'`
3. **Validation**: Always validate range before using value
4. **Optional values**: Use `undefined` for "not specified" to allow TaskRetryManager defaults
5. **Boolean flags**: Use negated flag name pattern (`--no-retry` for disabling)
6. **Partial config**: Build `Partial<TaskRetryConfig>` object from CLI options, let TaskRetryManager apply defaults

## Integration Test Pattern

From `tests/integration/parallelism-option.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('CLI Retry Options', () => {
  let originalArgv: string[];
  let mockExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalArgv = process.argv;
    mockExit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    });
    process.exit = mockExit as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it('should parse --task-retry option', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '5'];
    const args = parseCLIArgs();

    if (isCLIArgs(args)) {
      expect(args.taskRetry).toBe(5);
    }
  });

  it('should reject task-retry of 11 (above maximum)', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '11'];
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });

  it('should accept environment variable override', () => {
    process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS = '7';
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
    const args = parseCLIArgs();

    if (isCLIArgs(args)) {
      expect(args.taskRetry).toBe(7);
    }
    delete process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS;
  });
});
```
