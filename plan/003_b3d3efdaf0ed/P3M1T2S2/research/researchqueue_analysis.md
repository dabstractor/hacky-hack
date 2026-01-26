# ResearchQueue Analysis Report

## Overview

This report provides a comprehensive analysis of the ResearchQueue implementation in the PRP Pipeline codebase, focusing on the hardcoded concurrency limit of 3 and patterns for making it configurable.

## Current Implementation

### File Locations

- **Main Implementation**: `/home/dustin/projects/hacky-hack/src/core/research-queue.ts` (lines 57-277)
- **Usage Location**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 132-138)
- **Export**: `/home/dustin/projects/hacky-hack/src/core/index.ts` (line 15)
- **CLI Configuration**: `/home/dustin/projects/hacky-hack/src/cli/index.ts` (lines 193-196)

### Constructor Signature

```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false
)
```

### Hardcoded Concurrency Issue

The concurrency is currently hardcoded in two places:

1. **TaskOrchestrator** (`src/core/task-orchestrator.ts:133-137`):

```typescript
this.researchQueue = new ResearchQueue(
  this.sessionManager,
  3, // Hardcoded value
  this.#noCache
);
```

2. **ResearchQueue Constructor Default** (`src/core/research-queue.ts:92`):

```typescript
maxSize: number = 3,   // Default value is hardcoded
```

## Current Usage Patterns

### Import Statements

- **TaskOrchestrator**: `import { ResearchQueue } from './research-queue.js';` (line 42)
- **Core Index**: `export { ResearchQueue } from './research-queue.js';` (line 15)
- **Tests**: Multiple imports in test files across the codebase

### Method Usage

The ResearchQueue provides these key methods:

- `enqueue(task, backlog)` - Add task to queue for PRP generation
- `processNext(backlog)` - Process next task if under capacity
- `waitForPRP(taskId)` - Wait for PRP generation to complete
- `getStats()` - Get queue statistics (queued, researching, cached)
- `isResearching(taskId)` - Check if task is being researched
- `getPRP(taskId)` - Get cached PRP
- `clearCache()` - Clear cached results

## Configuration Patterns Found

### Existing CLI Option Pattern

The codebase already implements a parallelism CLI option in the CLI parser:

```typescript
.option(
  '--parallelism <n>',
  'Max concurrent subtasks (1-10, default: 2)',
  '2'
)
```

This pattern shows:

1. Commander.js configuration
2. Parameter validation (1-10 range)
3. Resource warnings for high concurrency
4. Default value handling

### Environment Variable Patterns

The codebase uses environment variables in several places:

- API keys: `ANTHROPIC_API_KEY`
- Runtime checks: `PRP_PIPELINE_RUNNING`
- URL configuration: `ANTHROPIC_BASE_URL`

However, no existing environment variable for ResearchQueue concurrency was found.

## Related Configuration Code

### CLI Validation Pattern

From `src/cli/index.ts:354-386`:

```typescript
// Validate parallelism
const parallelismStr =
  typeof options.parallelism === 'string'
    ? options.parallelism
    : String(options.parallelism);
const parallelism = parseInt(parallelismStr, 10);

if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
  logger.error('--parallelism must be an integer between 1 and 10');
  process.exit(1);
}

// System resource warnings
const cpuCores = os.cpus().length;
if (parallelism > cpuCores) {
  logger.warn(
    `⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${cpuCores})`
  );
}

// Memory warning
const freeMemoryGB = os.freemem() / 1024 ** 3;
const estimatedMemoryGB = parallelism * 0.5;
if (estimatedMemoryGB > freeMemoryGB * 0.8) {
  logger.warn(`⚠️  Warning: High parallelism may exhaust free memory`);
}
```

### ResearchQueue Statistics Usage

The ResearchQueue is extensively tested with focus on concurrency:

- Integration tests verify `maxSize` constraint (line 143: `researching.size >= this.maxSize`)
- Tests validate behavior at different concurrency levels (1, 2, 3, 5, 0)
- Statistics tracking: queued, researching, cached

## Test References

- **Integration Tests**: `/tests/integration/core/research-queue.test.ts`
- **Unit Tests**: `/tests/unit/core/research-queue.test.ts`
- **TaskOrchestrator Tests**: `/tests/integration/core/task-orchestrator-runtime.test.ts`

## Key Findings

1. **Hardcoded Value**: Concurrency=3 is hardcoded in two locations
2. **Available Patterns**: CLI option and environment variable patterns exist
3. **Extensive Testing**: The ResearchQueue is well-tested with concurrency scenarios
4. **Resource Awareness**: CLI already includes resource warnings for parallelism
5. **No Prior Implementation**: No existing configurable concurrency for ResearchQueue

## Recommended Approach

Based on the existing patterns, the implementation should:

1. Add a new CLI option `--research-concurrency` (or similar)
2. Add environment variable support `RESEARCH_QUEUE_CONCURRENCY`
3. Update TaskOrchestrator to pass the configurable value
4. Maintain backward compatibility with default value of 3
5. Add similar resource validation/warnings as the parallelism option

The CLI should validate the range (1-10) and provide resource warnings similar to the existing `--parallelism` option.
