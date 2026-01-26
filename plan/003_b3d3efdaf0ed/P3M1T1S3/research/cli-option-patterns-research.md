# CLI Option Patterns Research

## Codebase Analysis Summary

### Existing CLI Options (src/cli/index.ts)

**Numeric Options with Validation:**

- `--max-tasks <number>` (lines 167, 294-299)
- `--max-duration <ms>` (lines 168, 302-307)

**Validation Pattern:**

```typescript
// Validate maxTasks
if (options.maxTasks !== undefined) {
  if (!Number.isInteger(options.maxTasks) || options.maxTasks <= 0) {
    logger.error('--max-tasks must be a positive integer');
    process.exit(1);
  }
}
```

**CLIArgs Interface** (lines 56-95):

```typescript
export interface CLIArgs {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
  machineReadable: boolean;
  noCache: boolean;
  continueOnError: boolean;
  validatePrd: boolean;
  maxTasks?: number;
  maxDuration?: number;
  progressMode?: 'auto' | 'always' | 'never';
}
```

### Option Flow: CLI → PRPPipeline → TaskOrchestrator

**src/cli/index.ts → src/index.ts → src/workflows/prp-pipeline.ts:**

```typescript
// In main.ts (lines 198-212)
const pipeline = new PRPPipeline(
  args.prd,
  scope,
  args.mode,
  args.noCache,
  args.continueOnError,
  args.maxTasks,
  args.maxDuration,
  undefined,
  args.progressMode ?? 'auto'
);
```

**PRPPipeline Constructor** (prp-pipeline.ts lines 250-260):

```typescript
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false,
  continueOnError: boolean = false,
  maxTasks?: number,
  maxDuration?: number,
  planDir?: string,
  progressMode: 'auto' | 'always' | 'never' = 'auto'
)
```

## Key Patterns to Follow

1. **Integer Validation:** Use `Number.isInteger()` with positive check
2. **Error Messages:** Clear error messages with `process.exit(1)`
3. **Help Text:** Include range and default value in description
4. **Type Safety:** Add field to CLIArgs interface
5. **Option Propagation:** CLI → main → PRPPipeline → TaskOrchestrator

## Files to Modify

1. **src/cli/index.ts**
   - Add `--parallelism <n>` option (around line 168)
   - Add validation (around line 307)
   - Add to CLIArgs interface (around line 94)

2. **src/index.ts**
   - Pass parallelism to PRPPipeline (around line 198-212)

3. **src/workflows/prp-pipeline.ts**
   - Add parallelism to constructor (around line 250)
   - Store as private field
   - Pass to TaskOrchestrator when calling executeParallel()

4. **tests/integration/parallelism-option.test.ts**
   - Create new integration test file
   - Test CLI parsing, validation, resource warnings
