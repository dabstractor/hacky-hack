# CLI Argument Patterns Research

## Current CLI Architecture (src/cli/index.ts)

### CLIArgs Interface (Lines 52-82)

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
}
```

### parseCLIArgs() Pattern (Lines 108-171)

```typescript
export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  program
    .name('prp-pipeline')
    .description('PRD to PRP Pipeline - Automated software development')
    .version('1.0.0')
    .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
    .option('--scope <scope>', 'Scope identifier (e.g., P3.M4, P3.M4.T2)')
    .addOption(
      program
        .createOption('--mode <mode>', 'Execution mode')
        .choices(['normal', 'bug-hunt', 'validate'])
        .default('normal')
    )
    .option('--continue', 'Resume from previous session', false)
    .option('--dry-run', 'Show plan without executing', false)
    .option('--verbose', 'Enable debug logging', false)
    .option('--machine-readable', 'Enable machine-readable JSON output', false)
    .option('--no-cache', 'Bypass cache and regenerate all PRPs', false)
    .option('--continue-on-error', 'Treat all errors as non-fatal', false)
    .option(
      '--validate-prd',
      'Validate PRD and exit without running pipeline',
      false
    )
    .parse(process.argv);

  const options = program.opts<CLIArgs>();

  // Validation
  if (!existsSync(options.prd)) {
    logger.error(`PRD file not found: ${options.prd}`);
    process.exit(1);
  }

  return options;
}
```

## Pattern for Adding --max-tasks N

```typescript
// 1. Add to CLIArgs interface
export interface CLIArgs {
  // ... existing properties
  maxTasks?: number;
}

// 2. Add option in parseCLIArgs()
.option('--max-tasks <number>', 'Maximum number of tasks to execute')

// 3. Validate after parsing
if (options.maxTasks !== undefined) {
  if (!Number.isInteger(options.maxTasks) || options.maxTasks <= 0) {
    logger.error('--max-tasks must be a positive integer');
    process.exit(1);
  }
}
```

## Pattern for Adding --max-duration N

```typescript
// 1. Add to CLIArgs interface
export interface CLIArgs {
  // ... existing properties
  maxDuration?: number;
}

// 2. Add option in parseCLIArgs()
.option('--max-duration <ms>', 'Maximum execution duration in milliseconds')

// 3. Validate after parsing
if (options.maxDuration !== undefined) {
  if (!Number.isInteger(options.maxDuration) || options.maxDuration <= 0) {
    logger.error('--max-duration must be a positive integer (milliseconds)');
    process.exit(1);
  }
}
```

## Flow: CLI → PRPPipeline

```typescript
// src/index.ts
const args = parseCLIArgs();

const pipeline = new PRPPipeline(
  args.prd,
  scope,
  args.mode,
  args.noCache,
  args.continueOnError,
  args.maxTasks, // NEW
  args.maxDuration // NEW
);
```
