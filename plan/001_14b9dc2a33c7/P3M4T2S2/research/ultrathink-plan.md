# ULTRATHINK Plan for P3.M4.T2.S2: Create Main Entry Point

## Research Summary Compilation

### Key Findings from Research

#### 1. Previous PRP (P3.M4.T2.S1) - CONTRACT INPUT

- Creates `src/cli/index.ts` with `parseCLIArgs(): CLIArgs` function
- `CLIArgs` interface provides: `prd: string`, `scope?: string`, `mode: 'normal'|'bug-hunt'|'validate'`, `continue: boolean`, `dryRun: boolean`, `verbose: boolean`
- Validates PRD file exists (throws process.exit(1) if not)
- Validates scope format using `parseScope()` (throws process.exit(1) if invalid)

#### 2. PRPPipeline Class (src/workflows/prp-pipeline.ts)

- Constructor: `constructor(prdPath: string, scope?: Scope)`
- Run method: `async run(): Promise<PipelineResult>`
- Returns `PipelineResult` interface with success, sessionPath, stats, shutdown info
- **Has built-in graceful shutdown** - SIGINT/SIGTERM handlers already implemented
- Uses Groundswell Workflow's built-in logger

#### 3. ScopeResolver (src/core/scope-resolver.ts)

- `parseScope(scopeArg: string): Scope` converts CLI string to Scope type
- Scope type: `interface Scope { readonly type: ScopeType; readonly id?: string; }`
- CLIArgs.scope is a string that needs conversion

#### 4. configureEnvironment (src/config/environment.ts)

- Function signature: `configureEnvironment(): void`
- Maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY
- Sets default ANTHROPIC_BASE_URL
- **Must be called before any API operations**

#### 5. Current Entry Point (src/index.ts)

- Currently runs HelloWorldWorkflow (placeholder)
- Has basic try-catch with process.exit(0/1)
- Uses console.log/error for logging
- **Missing**: global error handlers, signal handlers, verbose support, PRPPipeline integration

#### 6. Graceful Shutdown Patterns

- PRPPipeline already implements comprehensive graceful shutdown
- Returns `shutdownInterrupted` and `shutdownReason` in PipelineResult
- Cleanup happens in finally block, saves state to session
- Entry point should handle result display, not implement shutdown logic

#### 7. CLI Best Practices (External Research)

- Register uncaughtException and unhandledRejection handlers
- Use exit codes: 0 (success), 1 (error), 130 (SIGINT)
- Handle --verbose flag for debug logging
- Use process.exitCode instead of immediate process.exit() when possible
- Ensure async operations complete before exit

## PRP Structure Plan

### Goal Section

- Feature Goal: Transform src/index.ts from placeholder to full CLI entry point
- Deliverable: Modified src/index.ts with complete PRPPipeline integration
- Success Definition: All CLI commands work, pipeline runs end-to-end, proper exit codes

### User Persona Section

- Target User: Developer running automated PRD-to-PRP pipeline
- Use Case: Execute pipeline with various CLI options (scope, mode, verbose, dry-run)
- User Journey: CLI parse → Environment configure → Pipeline run → Result display
- Pain Points: Manual configuration, unclear errors, no resume capability

### Why Section

- Contract requirement from P3.M4.T2
- Enables end-to-end pipeline execution
- Provides clean interface to existing PRPPipeline

### What Section

- Modify src/index.ts to use parseCLIArgs(), configureEnvironment(), PRPPipeline
- Add global error handlers (uncaughtException, unhandledRejection)
- Implement verbose logging based on CLI flag
- Handle dry-run mode
- Display pipeline results based on success/failure/interruption
- Proper exit codes

### Context Section (CRITICAL)

All references with specific file paths and line numbers:

- CLI parser: src/cli/index.ts (parseCLIArgs, CLIArgs)
- PRPPipeline: src/workflows/prp-pipeline.ts (constructor, run(), PipelineResult)
- Environment: src/config/environment.ts (configureEnvironment())
- Scope: src/core/scope-resolver.ts (parseScope, Scope type)
- Current entry: src/index.ts (existing pattern to follow)
- Node docs: https://nodejs.org/api/process.html#process_exit_codes
- CLI patterns: From research in /research/ultrathink-plan.md

### Implementation Blueprint

- Data models: Use existing CLIArgs, Scope, PipelineResult (no new models)
- Tasks:
  1. Modify src/index.ts - keep file, completely replace content
  2. Add global error handlers
  3. Add verbose logging wrapper
  4. Integrate parseCLIArgs()
  5. Integrate configureEnvironment()
  6. Create PRPPipeline instance
  7. Run pipeline and handle results
  8. Implement dry-run mode
  9. Add result summary display

### Implementation Patterns

- Use void main().catch() pattern from current src/index.ts
- Follow Groundswell logging pattern: [Component] message
- Use process.exitCode for graceful exit
- Handle shutdownInterrupted from PipelineResult
- Parse scope only if provided: args.scope ? parseScope(args.scope) : undefined

### Integration Points

- parseCLIArgs() from src/cli/index.js
- PRPPipeline from src/workflows/prp-pipeline.js
- configureEnvironment from src/config/environment.js
- parseScope from src/core/scope-resolver.js

### Validation Loop

- Level 1: TypeScript check, ESLint, Prettier
- Level 2: Test CLI argument combinations
- Level 3: Integration test with real PRD
- Level 4: Test error scenarios, shutdown, resume

### Final Checklist

- All CLI options work
- Proper exit codes
- Verbose logging functional
- Dry-run mode works
- State preserved on interruption
- Error messages helpful

## Anti-Patterns to Avoid

- Don't duplicate PRPPipeline's signal handling
- Don't skip configureEnvironment()
- Don't use console.log directly (use stderr for debug, stdout for results)
- Don't exit immediately without cleanup
- Don't ignore PipelineResult fields
