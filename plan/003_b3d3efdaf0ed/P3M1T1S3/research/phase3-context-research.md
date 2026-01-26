# Phase 3 Architecture Context Research

## Work Item Context

**P3.M1.T1.S3: Add parallelism CLI option and validation**

### Position in Phase 3

```
P3: Phase 3: Performance & Reliability Enhancements
└── P3.M1: Milestone 3.1: Concurrency Improvements
    └── P3.M1.T1: Task 3.1.1: Parallel Subtask Execution
        ├── P3.M1.T1.S1: Design parallel execution strategy [COMPLETE]
        ├── P3.M1.T1.S2: Implement concurrent task executor [COMPLETE]
        └── P3.M1.T1.S3: Add parallelism CLI option and validation [IN PROGRESS]
```

### Contract Definition

1. **INPUT:** CLI parsing from `src/cli/index.ts`, concurrent executor configuration
2. **LOGIC:** Add `--parallelism <n>` CLI option that:
   - Accepts integer from 1 to 10
   - Defaults to 2 (conservative)
   - Validates against system resources (warns if too high for available CPU/memory)
   - Passes to ConcurrentTaskExecutor
3. **OUTPUT:** CLI option in `src/cli/index.ts`, validation logic, integration test

## Dependencies

### P3.M1.T1.S1 (Design Document - Complete)

**Key Design Decisions:**

- Conservative default (2-3) for safety
- Range limit 1-10 to prevent resource exhaustion
- Semaphore pattern for concurrency control
- Resource-aware backpressure

**Reference:** `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/parallel-execution-design.md`

### P3.M1.T1.S2 (Concurrent Task Executor - Complete)

**Key Interface:**

```typescript
// src/core/concurrent-executor.ts (lines 41-53)
export interface ParallelismConfig {
  enabled: boolean;
  maxConcurrency: number;
  prpGenerationLimit: number;
  resourceThreshold: number;
}

// Integration in TaskOrchestrator (lines 879-903)
public async executeParallel(config: ParallelismConfig): Promise<void>
```

**Default Values from Tests:**

- maxConcurrency: 3
- prpGenerationLimit: 3
- resourceThreshold: 0.8

## Integration Points

### 1. CLI Parser (`src/cli/index.ts`)

**Add after line 168 (after `--max-duration`):**

```typescript
.option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')
```

**Add validation after line 307 (after maxDuration validation):**

```typescript
// Validate parallelism
if (options.parallelism !== undefined) {
  const num = parseInt(options.parallelism, 10);
  if (isNaN(num) || num < 1 || num > 10) {
    logger.error('--parallelism must be an integer between 1 and 10');
    process.exit(1);
  }
  // Resource warnings...
}
```

**Add to CLIArgs interface (after line 94):**

```typescript
/** Max concurrent subtasks (1-10) */
parallelism: number;
```

### 2. Main Entry (`src/index.ts`)

**Pass to PRPPipeline (around line 198-212):**

```typescript
const pipeline = new PRPPipeline(
  args.prd,
  scope,
  args.mode,
  args.noCache,
  args.continueOnError,
  args.maxTasks,
  args.maxDuration,
  undefined,
  args.progressMode ?? 'auto',
  args.parallelism // NEW
);
```

### 3. PRPPipeline (`src/workflows/prp-pipeline.ts`)

**Add to constructor (after line 259):**

```typescript
constructor(
  // ... existing params
  progressMode: 'auto' | 'always' | 'never' = 'auto',
  parallelism: number = 2  // NEW
) {
  // ...
  this.#parallelism = parallelism;
}
```

**Store as private field (around line 230):**

```typescript
readonly #parallelism: number = 2;
```

**Pass to TaskOrchestrator when calling executeParallel():**

```typescript
// Find where executeParallel() is called
await this.#taskOrchestrator.executeParallel({
  enabled: true,
  maxConcurrency: this.#parallelism,
  prpGenerationLimit: 3,
  resourceThreshold: 0.8,
});
```

## Key Constraints

1. **DO NOT modify:** `PRD.md`, `tasks.json`, `.gitignore`
2. **DO NOT create:** new source files beyond the test
3. **Follow existing patterns:** Numeric option validation like `--max-tasks`
4. **Preserve backward compatibility:** Default to 2, optional parameter
5. **System resource validation:** Use `os.cpus()` for warnings (not blocking)

## Testing Requirements

**New test file:** `tests/integration/parallelism-option.test.ts`

**Test coverage:**

1. Default value (2)
2. Custom values (1, 5, 10)
3. Range validation (rejects 0, 11)
4. Type validation (rejects non-integers)
5. Resource warnings (CPU, memory)
6. Integration with TaskOrchestrator

## Related Documents

- Design: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/parallel-execution-design.md`
- Testing: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/testing-concurrent-operations-vitest-typescript.md`
- System Context: `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/system_context.md`
