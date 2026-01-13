# PRP for P3.M4.T2.S2: Create main entry point

---

## Goal

**Feature Goal**: Transform `src/index.ts` from a placeholder HelloWorld workflow to a full-featured CLI entry point that initializes the environment, parses CLI arguments, creates the PRPPipeline, handles errors gracefully, and manages complete application lifecycle from start to exit.

**Deliverable**:

- Modified `src/index.ts` with complete PRPPipeline integration
- Global error handlers (uncaughtException, unhandledRejection)
- Verbose logging support based on `--verbose` flag
- Dry-run mode support
- Comprehensive result display (success, failure, interruption)
- Proper exit codes (0=success, 1=error, 130=SIGINT)

**Success Definition**:

- CLI accepts all arguments defined in P3.M4.T2.S1 (prd, scope, mode, continue, dry-run, verbose)
- Environment is configured before any API operations
- PRPPipeline is created with correct prdPath and optional scope
- Global error handlers catch unexpected errors
- Verbose flag controls debug output
- Dry-run mode shows what would be executed without running
- Pipeline results are displayed with clear summaries
- Exit code 0 on success, 1 on error, 130 on SIGINT
- All async operations complete before process exit
- State is preserved when pipeline is interrupted

## User Persona

**Target User**: Developer running the PRP Pipeline for automated software development from command line

**Use Case**: Developer wants to execute the complete PRD-to-PRP-to-implementation pipeline with various options:

- Full pipeline run: `npm run dev -- --prd ./PRD.md`
- Scoped execution: `npm run dev -- --prd ./PRD.md --scope P3.M4`
- Resume session: `npm run dev -- --prd ./PRD.md --continue`
- Debug mode: `npm run dev -- --prd ./PRD.md --verbose`
- Preview mode: `npm run dev -- --prd ./PRD.md --dry-run`

**User Journey**:

1. User invokes CLI: `npm run dev -- --prd ./PRD.md --scope P3.M4 --verbose`
2. Entry point configures environment (API keys, base URLs)
3. Entry point parses CLI arguments using `parseCLIArgs()`
4. Entry point creates PRPPipeline with prdPath and scope
5. Entry point runs pipeline: `await pipeline.run()`
6. Pipeline executes tasks according to scope
7. On success: Entry point displays summary, exits with code 0
8. On error: Entry point logs error, exits with code 1
9. On interruption (Ctrl+C): Entry point shows progress, exits with code 130

**Pain Points Addressed**:

- Single command to run entire pipeline - no manual configuration
- Clear error messages with actionable information
- Verbose mode for debugging when things go wrong
- Dry-run mode to preview what will be executed
- Resume capability for interrupted sessions
- Proper exit codes for CI/CD integration

## Why

- **Contract Requirement**: P3.M4.T2 explicitly requires CLI entry point creation
- **End-to-End Execution**: Completes the pipeline implementation by wiring all components together
- **User Interface**: CLI is the primary interface for running the pipeline
- **Error Handling**: Global handlers prevent silent failures and provide debugging information
- **Graceful Shutdown**: Ensures state is preserved when user interrupts execution
- **Standards**: Follows Node.js CLI best practices (exit codes, error handlers, async patterns)
- **Integration**: Consumes output from P3.M4.T2.S1 (CLI parser) and existing PRPPipeline

## What

### System Behavior

The main entry point will:

1. **Modify `src/index.ts`** (replace existing HelloWorld implementation):
   - Add shebang for executable: `#!/usr/bin/env node`
   - Register global error handlers (uncaughtException, unhandledRejection)
   - Parse CLI arguments using `parseCLIArgs()` from src/cli/index.js
   - Call `configureEnvironment()` before any operations
   - Set up verbose logging wrapper based on `args.verbose`
   - Parse scope string if provided: `args.scope ? parseScope(args.scope) : undefined`
   - Create `PRPPipeline` instance with `prdPath` and `scope`
   - Handle `--dry-run` mode by displaying configuration without executing
   - Run pipeline: `await pipeline.run()`
   - Handle result based on `PipelineResult` fields
   - Display success/failure/interruption summary
   - Exit with appropriate code: 0 (success), 1 (error), 130 (SIGINT)

2. **Global Error Handlers**:
   - `uncaughtException`: Log error, set exit code 1
   - `unhandledRejection`: Log rejection, set exit code 1
   - Both provide stack traces when `--verbose` is enabled

3. **Verbose Logging**:
   - When `--verbose` is set: display debug information, show parsed CLI args
   - When `--verbose` is not set: only display essential output
   - Use stderr for debug logs, stdout for results

4. **Result Display**:
   - **Success**: Show completed tasks, duration, session path, bugs found
   - **Failure**: Show error message, failed tasks, session path for resume
   - **Interrupted**: Show progress, session path, resume command

5. **Dry-Run Mode**:
   - Display PRD path, mode, scope (if provided)
   - Show session path that would be created
   - Display "DRY RUN - would execute" message
   - Exit with code 0

### Success Criteria

- [ ] `src/index.ts` modified with complete PRPPipeline integration
- [ ] Global error handlers registered (uncaughtException, unhandledRejection)
- [ ] CLI arguments parsed using `parseCLIArgs()`
- [ ] `configureEnvironment()` called before pipeline creation
- [ ] Verbose logging controlled by `--verbose` flag
- [ ] Scope parsed using `parseScope()` when provided
- [ ] PRPPipeline instantiated with correct parameters
- [ ] Dry-run mode displays configuration without executing
- [ ] Success result shows summary with key metrics
- [ ] Failure result shows error and resume information
- [ ] Interruption result shows progress and resume command
- [ ] Exit code 0 on success
- [ ] Exit code 1 on error
- [ ] Exit code 130 on SIGINT interruption
- [ ] All async operations complete before exit
- [ ] Manual testing validates all CLI options

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete `parseCLIArgs()` function signature and `CLIArgs` interface from P3.M4.T2.S1
- Exact `PRPPipeline` constructor signature and `run()` method signature
- Exact `configureEnvironment()` function signature and behavior
- Exact `parseScope()` function signature for scope conversion
- Current `src/index.ts` pattern to follow (async main, void wrapper)
- Complete `PipelineResult` interface with all fields
- Groundswell logging pattern used in codebase
- Node.js CLI best practices from external research
- Graceful shutdown behavior already in PRPPipeline
- Exit code conventions (0, 1, 130)
- File paths with .js extension for ES modules

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- docfile: plan/001_14b9dc2a33c7/P3M4T2S1/PRP.md
  why: Previous PRP that defines CLI parser output
  critical: Lines 9-26 show CLI parser deliverable and success definition
  critical: Lines 409-431 show CLIArgs interface definition
  critical: Lines 609-662 show parseCLIArgs() implementation
  section: "Goal"
  note: This PRP's output is this PRP's input

- file: src/cli/index.ts
  why: CLI argument parser from P3.M4.T2.S1
  critical: parseCLIArgs() function returns CLIArgs
  critical: CLIArgs interface with all options: prd, scope, mode, continue, dryRun, verbose
  pattern: |
    import { parseCLIArgs, type CLIArgs } from './cli/index.js';
    const args: CLIArgs = parseCLIArgs();
  gotcha: parseCLIArgs() calls process.exit(1) on validation failure

- file: src/workflows/prp-pipeline.ts
  why: PRPPipeline class that entry point will instantiate and run
  critical: Lines 154-181 show constructor signature: constructor(prdPath: string, scope?: Scope)
  critical: Lines 568-636 show run() method signature: async run(): Promise<PipelineResult>
  critical: Lines 43-80 show PipelineResult interface definition
  pattern: |
    import { PRPPipeline } from './workflows/prp-pipeline.js';
    const pipeline = new PRPPipeline(args.prd, scope);
    const result = await pipeline.run();
  gotcha: PRPPipeline has built-in graceful shutdown - don't duplicate signal handlers
  gotcha: PipelineResult.shutdownInterrupted indicates if Ctrl+C was pressed

- file: src/config/environment.ts
  why: Environment configuration that MUST be called first
  critical: Lines 1-40 show configureEnvironment() function
  pattern: |
    import { configureEnvironment } from './config/environment.js';
    configureEnvironment(); // Must be before any API operations
  gotcha: Maps ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY, sets default BASE_URL
  gotcha: Must be called before any API operations or API key validation will fail

- file: src/core/scope-resolver.ts
  why: Scope parsing for converting CLI string to Scope type
  critical: Lines 1-50 show Scope type definition and parseScope() signature
  critical: Lines 60-120 show parseScope() implementation and ScopeParseError
  pattern: |
    import { parseScope, type Scope } from './core/scope-resolver.js';
    const scope: Scope | undefined = args.scope ? parseScope(args.scope) : undefined;
  gotcha: Only parse scope if args.scope is provided (undefined means "all")
  gotcha: parseScope() throws ScopeParseError for invalid format

- file: src/index.ts
  why: Current entry point pattern to follow
  critical: Lines 1-30 show module imports and async main() pattern
  critical: Lines 35-45 show void main().catch() pattern
  pattern: |
    async function main(): Promise<void> {
      try {
        // Application logic
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    }
    void main().catch(error => {
      console.error(error);
      process.exit(1);
    });
  gotcha: Use void main().catch() pattern for top-level error handling
  gotcha: Current implementation uses HelloWorldWorkflow - replace completely

- docfile: plan/001_14b9dc2a33c7/P3M4T2S2/research/ultrathink-plan.md
  why: Complete research summary and ULTRATHINK planning
  critical: Lines 1-50 summarize key findings from all research agents
  critical: Lines 51-100 show PRP structure plan
  section: "Research Summary Compilation"

- url: https://nodejs.org/api/process.html#process_exit_codes
  why: Official Node.js exit code documentation
  critical: Exit codes: 0 (success), 1 (general error), 130 (SIGINT)
  section: "Exit codes"

- url: https://nodejs.org/api/process.html#process_event_uncaughtexception
  why: Uncaught exception handler documentation
  critical: Must register handler to prevent silent failures
  section: "Event: 'uncaughtException'"

- url: https://nodejs.org/api/process.html#process_event_unhandledrejection
  why: Unhandled rejection handler documentation
  critical: Must register handler for promise rejections
  section: "Event: 'unhandledRejection'"
```

### Current Codebase Tree

```bash
src/
├── index.ts                   # CURRENT: Placeholder with HelloWorldWorkflow
├── cli/
│   └── index.ts              # FROM P3.M4.T2.S1: parseCLIArgs(), CLIArgs
├── config/
│   ├── constants.ts          # DEFAULT_BASE_URL constant
│   ├── environment.ts        # configureEnvironment() function
│   └── types.ts              # Type definitions
├── core/
│   ├── index.ts              # Core module exports
│   ├── scope-resolver.ts     # parseScope(), Scope, ScopeParseError
│   ├── session-manager.ts    # SessionManager class
│   └── task-orchestrator.ts  # TaskOrchestrator class
├── agents/
│   ├── prp-generator.ts      # PRPGenerator class
│   ├── prp-executor.ts       # PRPExecutor class
│   └── prp-runtime.ts        # PRPRuntime class
├── workflows/
│   ├── hello-world.ts        # Current placeholder workflow
│   └── prp-pipeline.ts       # PRPPipeline class with graceful shutdown
└── utils/
    ├── task-utils.ts         # Task utilities
    └── git-commit.ts         # Smart commit utility

package.json                  # npm scripts: dev, build, test
tsconfig.json                 # TypeScript configuration
```

### Desired Codebase Tree with Files Modified

```bash
src/
├── index.ts                   # MODIFY: Replace HelloWorld with PRPPipeline integration
├── cli/
│   └── index.ts              # FROM P3.M4.T2.S1: parseCLIArgs(), CLIArgs (no changes)
├── config/
│   └── environment.ts        # configureEnvironment() (no changes)
├── core/
│   └── scope-resolver.ts     # parseScope() (no changes)
└── workflows/
    └── prp-pipeline.ts       # PRPPipeline class (no changes)

# All other files remain unchanged
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: configureEnvironment() MUST be called before any API operations
// Without this, API key validation will fail
import { configureEnvironment } from './config/environment.js';
configureEnvironment(); // Do this FIRST

// CRITICAL: parseScope() only if scope is provided
// If scope is undefined, PRPPipeline treats it as "all"
import { parseScope } from './core/scope-resolver.js';
const scope: Scope | undefined = args.scope
  ? parseScope(args.scope)
  : undefined;

// CRITICAL: parseCLIArgs() calls process.exit(1) on validation failure
// Don't wrap in try-catch - it exits directly
import { parseCLIArgs } from './cli/index.js';
const args = parseCLIArgs(); // Exits on error

// CRITICAL: PRPPipeline has built-in signal handlers
// DO NOT register additional SIGINT/SIGTERM handlers in entry point
// The pipeline handles graceful shutdown internally
const pipeline = new PRPPipeline(args.prd, scope);
const result = await pipeline.run();

// CRITICAL: Check result.shutdownInterrupted for user interruption
if (result.shutdownInterrupted) {
  console.log(`Interrupted by ${result.shutdownReason}`);
  // Exit with 130 for SIGINT
  process.exit(130);
}

// CRITICAL: Use .js extension for ES module imports
import { configureEnvironment } from './config/environment.js'; // Note .js

// CRITICAL: CLIArgs.scope is a string, not Scope type
// Must convert using parseScope()
const scope = args.scope ? parseScope(args.scope) : undefined;

// CRITICAL: void main().catch() pattern for top-level error handling
async function main(): Promise<number> {
  // ... implementation
  return 0; // Exit code
}
void main().then(code => process.exit(code));

// CRITICAL: Use process.exitCode for graceful exit
// Allows cleanup to run before process terminates
process.exitCode = 1; // Instead of process.exit(1) when possible

// CRITICAL: Exit codes follow conventions
// 0 = Success
// 1 = General error
// 130 = SIGINT (Ctrl+C)
process.exit(result.success ? 0 : 1);

// CRITICAL: Verbose logging to stderr, results to stdout
// This allows piping results to other commands
if (args.verbose) {
  console.error('[DEBUG] Verbose output'); // stderr
}
console.log('Result: success'); // stdout

// CRITICAL: PipelineResult has many fields - use them for summary
// result.success, result.sessionPath, result.totalTasks, result.completedTasks
// result.failedTasks, result.duration, result.bugsFound, result.shutdownInterrupted

// CRITICAL: Dry-run mode should not create PRPPipeline
// Just display configuration and exit
if (args.dryRun) {
  console.log('DRY RUN - would execute:');
  console.log(`  PRD: ${args.prd}`);
  if (args.scope) console.log(`  Scope: ${args.scope}`);
  process.exit(0);
}

// GOTCHA: HelloWorldWorkflow is placeholder - completely replace
// Don't import or use it in new implementation

// GOTCHA: PRPPipeline constructor throws if prdPath is empty
// But parseCLIArgs() already validates this, so it won't happen

// PATTERN: Groundswell Workflow logger uses bracketed format
// But entry point uses console.log/error since it's not a Workflow class
// Use [Entry] prefix for consistency
console.log('[Entry] Pipeline starting...');

// PATTERN: Named exports, no default exports
import { configureEnvironment } from './config/environment.js';
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Use existing types:

```typescript
// FROM: src/cli/index.ts (P3.M4.T2.S1)
export interface CLIArgs {
  prd: string;
  scope?: string;
  mode: 'normal' | 'bug-hunt' | 'validate';
  continue: boolean;
  dryRun: boolean;
  verbose: boolean;
}

// FROM: src/core/scope-resolver.ts
export interface Scope {
  readonly type: ScopeType;
  readonly id?: string;
}

// FROM: src/workflows/prp-pipeline.ts
export interface PipelineResult {
  success: boolean;
  sessionPath: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  finalPhase: string;
  duration: number;
  phases: PhaseSummary[];
  bugsFound: number;
  error?: string;
  shutdownInterrupted: boolean;
  shutdownReason?: 'SIGINT' | 'SIGTERM';
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD shebang and module documentation to src/index.ts
  - ADD: #!/usr/bin/env node at top of file
  - ADD: Module JSDoc with description, remarks, example
  - PRESERVE: ES module format
  - PATTERN: Follow src/config/environment.ts JSDoc style

Task 2: REGISTER global error handlers
  - IMPLEMENT: uncaughtException handler
  - IMPLEMENT: unhandledRejection handler
  - LOG: Error messages with stack trace when verbose
  - SET: process.exitCode = 1 on errors
  - PATTERN: Follow Node.js best practices from research

Task 3: IMPORT required modules
  - IMPORT: configureEnvironment from './config/environment.js'
  - IMPORT: parseCLIArgs, CLIArgs from './cli/index.js'
  - IMPORT: PRPPipeline from './workflows/prp-pipeline.js'
  - IMPORT: parseScope, Scope from './core/scope-resolver.js'
  - PATTERN: Use .js extension for ES modules

Task 4: IMPLEMENT main() function with environment setup
  - DEFINE: async function main(): Promise<number>
  - CALL: configureEnvironment() FIRST (before any other operations)
  - PARSE: CLI arguments using parseCLIArgs()
  - DEBUG: Log parsed args when verbose
  - RETURN: Exit code (0, 1, or 130)

Task 5: IMPLEMENT scope parsing
  - CHECK: if args.scope is provided
  - PARSE: scope string using parseScope(args.scope)
  - ASSIGN: to scope variable (Scope | undefined)
  - GOTCHA: Only parse if provided, undefined means "all"

Task 6: IMPLEMENT dry-run mode
  - CHECK: if args.dryRun is true
  - DISPLAY: PRD path, mode, scope (if provided)
  - DISPLAY: "DRY RUN - would execute" message
  - EXIT: with code 0
  - GOTCHA: Do not create PRPPipeline in dry-run mode

Task 7: CREATE PRPPipeline instance
  - INSTANTIATE: new PRPPipeline(args.prd, scope)
  - PASS: prdPath from args.prd
  - PASS: optional scope from Task 5
  - GOTCHA: Constructor throws if prdPath is empty (already validated by CLI)

Task 8: RUN pipeline and handle result
  - CALL: await pipeline.run()
  - ASSIGN: result to PipelineResult variable
  - CHECK: result.shutdownInterrupted for user interruption
  - CHECK: result.success for completion status
  - DISPLAY: Appropriate summary based on result

Task 9: IMPLEMENT success summary display
  - DISPLAY: Success message with emoji
  - DISPLAY: Completed/total tasks count
  - DISPLAY: Duration in seconds
  - DISPLAY: Session path
  - DISPLAY: Bugs found (if any)
  - RETURN: exit code 0

Task 10: IMPLEMENT failure summary display
  - DISPLAY: Error message from result.error
  - DISPLAY: Failed tasks count
  - DISPLAY: Session path for resume
  - SUGGEST: Resume command if --continue flag exists
  - RETURN: exit code 1

Task 11: IMPLEMENT interruption summary display
  - CHECK: result.shutdownInterrupted flag
  - DISPLAY: Interruption reason (SIGINT/SIGTERM)
  - DISPLAY: Progress: completed/total tasks
  - DISPLAY: Session path
  - SUGGEST: Resume command with --continue flag
  - RETURN: exit code 130 (SIGINT convention)

Task 12: IMPLEMENT verbose logging wrapper
  - CHECK: args.verbose flag
  - LOG: Debug messages to stderr when verbose
  - LOG: Parsed CLI arguments
  - LOG: Pipeline creation
  - LOG: Pipeline start/finish
  - PATTERN: Use [Entry] prefix for consistency

Task 13: IMPLEMENT top-level error handling
  - WRAP: main() call in try-catch
  - CATCH: Unexpected errors
  - LOG: Error message to console.error
  - EXIT: with code 1

Task 14: IMPLEMENT void main().catch() pattern
  - CALL: void main() at bottom of file
  - CHAIN: .then((code) => process.exit(code))
  - CATCH: Top-level unhandled errors
  - PATTERN: Follow current src/index.ts pattern
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// File: src/index.ts
// =============================================================================

#!/usr/bin/env node
/**
 * Main entry point for PRP Pipeline CLI application
 *
 * @module index
 *
 * @remarks
 * This is the primary entry point for the PRD-to-PRP Pipeline application.
 * It configures the environment, parses CLI arguments, creates the pipeline,
 * and manages the complete application lifecycle from start to exit.
 *
 * Exit codes:
 * - 0: Success
 * - 1: Error (general)
 * - 130: SIGINT (Ctrl+C)
 *
 * @example
 * ```bash
 * # Run full pipeline
 * npm run dev -- --prd ./PRD.md
 *
 * # Run with scope
 * npm run dev -- --prd ./PRD.md --scope P3.M4
 *
 * # Resume interrupted session
 * npm run dev -- --prd ./PRD.md --continue
 *
 * # Debug mode
 * npm run dev -- --prd ./PRD.md --verbose
 *
 * # Preview mode
 * npm run dev -- --prd ./PRD.md --dry-run
 * ```
 */

import { configureEnvironment } from './config/environment.js';
import { parseCLIArgs, type CLIArgs } from './cli/index.js';
import { PRPPipeline } from './workflows/prp-pipeline.js';
import { parseScope, type Scope } from './core/scope-resolver.js';

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Sets up global error handlers for uncaught exceptions and rejections
 *
 * @remarks
 * These handlers prevent silent failures and provide debugging information.
 * They set process.exitCode but don't exit immediately to allow cleanup.
 */
function setupGlobalHandlers(verbose: boolean): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('\n❌ UNCAUGHT EXCEPTION');
    console.error(`Message: ${error.message}`);
    if (verbose && error.stack) {
      console.error(`Stack:\n${error.stack}`);
    }
    process.exitCode = 1;
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('\n❌ UNHANDLED PROMISE REJECTION');
    console.error(`Reason: ${reason}`);
    process.exitCode = 1;
  });
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main application entry point
 *
 * @returns Exit code (0=success, 1=error, 130=SIGINT)
 *
 * @remarks
 * Executes the complete PRP Pipeline workflow:
 * 1. Configures environment
 * 2. Parses CLI arguments
 * 3. Creates pipeline instance
 * 4. Runs pipeline
 * 5. Displays results
 *
 * Environment configuration MUST happen first to ensure API keys are set.
 */
async function main(): Promise<number> {
  // Parse CLI arguments first (this may exit on validation failure)
  const args: CLIArgs = parseCLIArgs();

  // Setup global error handlers
  setupGlobalHandlers(args.verbose);

  // CRITICAL: Configure environment before any API operations
  configureEnvironment();

  // Verbose logging
  if (args.verbose) {
    console.error('[Entry] Verbose mode enabled');
    console.error('[Entry] Parsed CLI arguments:', JSON.stringify(args, null, 2));
  }

  // Handle dry-run mode
  if (args.dryRun) {
    console.log('🔍 DRY RUN - would execute with:');
    console.log(`  PRD: ${args.prd}`);
    console.log(`  Mode: ${args.mode}`);
    if (args.scope) {
      console.log(`  Scope: ${args.scope}`);
    }
    if (args.continue) {
      console.log(`  Resume: enabled`);
    }
    return 0;
  }

  // Parse scope if provided
  const scope: Scope | undefined = args.scope
    ? parseScope(args.scope)
    : undefined;

  if (args.verbose && scope) {
    console.error('[Entry] Parsed scope:', JSON.stringify(scope));
  }

  // Create pipeline instance
  if (args.verbose) {
    console.error('[Entry] Creating PRPPipeline instance');
  }
  const pipeline = new PRPPipeline(args.prd, scope);

  // Run pipeline
  if (args.verbose) {
    console.error('[Entry] Starting pipeline execution');
  }
  const result = await pipeline.run();

  // Handle result based on state
  if (result.shutdownInterrupted) {
    // User interrupted with Ctrl+C
    console.log(`\n⚠️  Pipeline interrupted by ${result.shutdownReason}`);
    console.log(`📊 Progress: ${result.completedTasks}/${result.totalTasks} tasks completed`);
    console.log(`💾 State saved to: ${result.sessionPath}`);
    console.log(`\n🚀 To resume, run:`);
    console.log(`   npm run dev -- --prd ${args.prd} --continue`);
    return 130; // SIGINT exit code
  }

  if (!result.success) {
    // Pipeline failed
    console.log(`\n❌ Pipeline failed`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    console.log(`📊 Failed tasks: ${result.failedTasks}/${result.totalTasks}`);
    console.log(`💾 Session: ${result.sessionPath}`);
    if (args.continue) {
      console.log(`\n🚀 To retry, run:`);
      console.log(`   npm run dev -- --prd ${args.prd} --continue`);
    }
    return 1;
  }

  // Pipeline succeeded
  console.log(`\n✅ Pipeline completed successfully`);
  console.log(`📊 Tasks: ${result.completedTasks}/${result.totalTasks} completed`);
  console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`💾 Session: ${result.sessionPath}`);
  if (result.bugsFound > 0) {
    console.log(`🐛 Bugs found: ${result.bugsFound}`);
  }

  return 0;
}

// ============================================================================
// ENTRY POINT INVOCATION
// ============================================================================

/**
 * Application entry point
 *
 * @remarks
 * Uses the void main().catch() pattern for proper top-level error handling.
 * The promise result is used as the exit code.
 */
void main().catch((error: unknown) => {
  console.error('\n❌ Fatal error in main():', error);
  process.exit(1);
});
````

### Integration Points

```yaml
ENVIRONMENT_CONFIG:
  - import: "import { configureEnvironment } from './config/environment.js'"
  - call: "configureEnvironment()" must be FIRST operation
  - purpose: "Maps ANTHROPIC_AUTH_TOKEN to API_KEY, sets BASE_URL"

CLI_PARSER:
  - import: "import { parseCLIArgs, type CLIArgs } from './cli/index.js'"
  - call: "const args: CLIArgs = parseCLIArgs()"
  - purpose: "Parse and validate CLI arguments"

SCOPE_RESOLVER:
  - import: "import { parseScope, type Scope } from './core/scope-resolver.js'"
  - call: "const scope: Scope | undefined = args.scope ? parseScope(args.scope) : undefined"
  - purpose: "Convert CLI scope string to Scope type"

PRP_PIPELINE:
  - import: "import { PRPPipeline } from './workflows/prp-pipeline.js'"
  - create: "const pipeline = new PRPPipeline(args.prd, scope)"
  - run: "const result = await pipeline.run()"
  - purpose: "Execute the PRD-to-PRP pipeline"

GLOBAL_HANDLERS:
  - register: "process.on('uncaughtException', handler)"
  - register: "process.on('unhandledRejection', handler)"
  - purpose: "Catch unexpected errors"

EXIT_CODES:
  - success: "return 0" or "process.exit(0)"
  - error: "return 1" or "process.exit(1)"
  - sigint: "return 130" for Ctrl+C
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying src/index.ts - fix before proceeding
npm run lint -- src/index.ts          # ESLint with auto-fix
npm run format -- src/index.ts        # Prettier formatting
npm run check -- src/index.ts         # TypeScript type checking

# Project-wide validation
npm run lint                          # Check all files
npm run format                        # Format all files
npm run check                         # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Manual Testing (Component Validation)

```bash
# Test 1: Help output
npm run dev -- --help

# Expected: Commander.js help with all options

# Test 2: Version output
npm run dev -- --version

# Expected: Version 1.0.0

# Test 3: Dry-run mode
npm run dev -- --prd ./PRD.md --dry-run

# Expected: DRY RUN message with PRD path, exit code 0

# Test 4: Dry-run with scope
npm run dev -- --prd ./PRD.md --scope P3.M4 --dry-run

# Expected: DRY RUN with scope displayed

# Test 5: Dry-run with verbose
npm run dev -- --prd ./PRD.md --dry-run --verbose

# Expected: DRY RUN with debug messages to stderr

# Test 6: Missing PRD file
npm run dev -- --prd ./nonexistent.md --dry-run

# Expected: Error "PRD file not found", exit code 1

# Test 7: Invalid scope
npm run dev -- --prd ./PRD.md --scope INVALID --dry-run

# Expected: Error "Invalid scope", exit code 1

# Test 8: All flags together
npm run dev -- --prd ./PRD.md --scope P3.M4 --mode bug-hunt --continue --dry-run --verbose

# Expected: All flags parsed, verbose output, dry-run message
```

### Level 3: Integration Testing (System Validation)

```bash
# Test 1: Run with minimal test PRD (requires PRD to exist)
cat > /tmp/test-prd.md << 'EOF'
# Test PRD

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Subtask 1
Test entry point integration
EOF

npm run dev -- --prd /tmp/test-prd.md --scope P1.M1.T1.S1 --verbose

# Expected: Pipeline runs, shows verbose output, completes or fails gracefully

# Test 2: Test verbose mode
npm run dev -- --prd /tmp/test-prd.md --verbose 2>&1 | grep '\[Entry\]'

# Expected: Debug messages with [Entry] prefix

# Test 3: Test non-verbose mode
npm run dev -- --prd /tmp/test-prd.md 2>&1 | grep '\[Entry\]' && echo "FAIL: Should not show debug" || echo "PASS: No debug output"

# Expected: No debug messages, only essential output

# Test 4: Test exit codes
npm run dev -- --prd /tmp/test-prd.md; echo "Exit code: $?"
npm run dev -- --prd ./nonexistent.md; echo "Exit code: $?"

# Expected: Exit code 0 on success, 1 on error

# Test 5: Test interruption (manual)
# Run: npm run dev -- --prd /tmp/test-prd.md
# Press: Ctrl+C
# Expected: Graceful shutdown message, progress shown, exit code 130
```

### Level 4: Domain-Specific Validation

```bash
# CLI Entry Point Validation

# Test: All argument combinations
for scope in "" "P1" "P1.M1" "P1.M1.T1" "P1.M1.T1.S1"; do
  npm run dev -- --prd ./PRD.md --scope "$scope" --dry-run
done

# Expected: All scope formats accepted

# Test: All modes
for mode in "normal" "bug-hunt" "validate"; do
  npm run dev -- --mode "$mode" --dry-run
done

# Expected: All modes accepted

# Test: Boolean flag combinations
npm run dev -- --dry-run
npm run dev -- --verbose
npm run dev -- --continue
npm run dev -- --dry-run --verbose
npm run dev -- --continue --verbose --dry-run

# Expected: All combinations work

# Test: Verbose output format
npm run dev -- --prd ./PRD.md --dry-run --verbose 2>&1

# Expected: Debug messages to stderr, results to stdout

# Test: Stdout vs stderr separation
npm run dev -- --prd ./PRD.md --dry-run --verbose 1>stdout.txt 2>stderr.txt
echo "=== STDOUT ==="
cat stdout.txt
echo "=== STDERR ==="
cat stderr.txt

# Expected: Results in stdout, debug in stderr

# Real-World Scenario Test
# Create realistic PRD and run full pipeline
cat > /tmp/realistic-prd.md << 'EOF'
# Realistic Test PRD

## P1: Foundation
### P1.M1: Setup
#### P1.M1.T1: Initialize
##### P1.M1.T1.S1: Create project
Initialize project structure
EOF

# Run with all options
npm run dev -- --prd /tmp/realistic-prd.md --scope P1.M1.T1.S1 --verbose --continue

# Expected: Pipeline runs, shows progress, saves state
```

## Final Validation Checklist

### Technical Validation

- [ ] All Level 1-4 validations completed successfully
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`
- [ ] Shebang line present: `#!/usr/bin/env node`
- [ ] Module JSDoc complete with @remarks, @example

### Feature Validation

- [ ] CLI arguments parsed using `parseCLIArgs()`
- [ ] `configureEnvironment()` called before any operations
- [ ] Verbose logging controlled by `--verbose` flag
- [ ] Scope parsed using `parseScope()` when provided
- [ ] PRPPipeline instantiated with correct parameters
- [ ] Dry-run mode displays configuration without executing
- [ ] Success summary shows key metrics (tasks, duration, bugs)
- [ ] Failure summary shows error and resume information
- [ ] Interruption summary shows progress and resume command
- [ ] Exit code 0 on success
- [ ] Exit code 1 on error
- [ ] Exit code 130 on SIGINT
- [ ] Global error handlers registered
- [ ] All async operations complete before exit

### Code Quality Validation

- [ ] Follows existing codebase patterns (ES modules, .js imports)
- [ ] Comprehensive JSDoc with @module, @remarks, @example
- [ ] Named exports only (no default exports)
- [ ] Uses .js extension for imports
- [ ] Proper error handling with try-catch
- [ ] Type-safe throughout (CLIArgs, Scope, PipelineResult)
- [ ] No signal handlers (PRPPipeline handles them)
- [ ] Console.error for debug, console.log for results
- [ ] void main().catch() pattern for top-level error handling

### Documentation & Deployment

- [ ] Module-level JSDoc complete
- [ ] Function JSDoc with @remarks for main()
- [ ] @example blocks showing usage
- [ ] Exit codes documented in JSDoc
- [ ] Help text is clear (from CLI parser)
- [ ] Resume command shown on interruption/failure

---

## Anti-Patterns to Avoid

- ❌ Don't call `configureEnvironment()` after API operations - must be FIRST
- ❌ Don't register SIGINT/SIGTERM handlers - PRPPipeline already has them
- ❌ Don't skip scope parsing - use `parseScope()` when `args.scope` is provided
- ❌ Don't use `console.log` for debug - use `console.error` for stderr
- ❌ Don't exit immediately without checking result - handle all result states
- ❌ Don't ignore `shutdownInterrupted` flag - check for user interruption
- ❌ Don't forget `.js` extension in imports - ES modules require it
- ❌ Don't use default exports - use named exports only
- ❌ Don't skip JSDoc - all public exports must have documentation
- ❌ Don't hardcode exit codes - use result state to determine exit code
- ❌ Don't create PRPPipeline in dry-run mode - just display and exit
- ❌ Don't use HelloWorldWorkflow - completely replace with PRPPipeline
- ❌ Don't swallow errors - log them with context
- ❌ Don't use `process.exit()` in error handlers - set `process.exitCode` instead
- ❌ Don't forget to handle scope as optional - undefined means "all"
