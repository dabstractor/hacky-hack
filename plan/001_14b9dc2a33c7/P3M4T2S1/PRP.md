# PRP for P3.M4.T2.S1: Create CLI argument parser

---

## Goal

**Feature Goal**: Create a comprehensive CLI argument parser using Commander.js that validates inputs, parses scope strings via ScopeResolver, and provides a typed configuration interface for the PRP Pipeline.

**Deliverable**:

- New CLI module `src/cli/index.ts` with argument parsing and validation
- TypeScript interface `CLIArgs` with all parsed options
- Unit tests achieving 100% coverage
- Integration with Commander.js library

**Success Definition**:

- CLI accepts all required arguments: `--prd`, `--scope`, `--mode`, `--continue`, `--dry-run`, `--verbose`
- PRD file path is validated to exist before pipeline execution
- Scope string is parsed using `ScopeResolver.parseScope()` with proper error handling
- Mode argument accepts only valid choices: `normal`, `bug-hunt`, `validate`
- Boolean flags (`--continue`, `--dry-run`, `--verbose`) are properly parsed
- Typed `CLIArgs` interface provides full type safety
- Help text is clear and comprehensive
- All tests pass with 100% coverage
- Exit codes are appropriate (0 for success, 1 for errors)

## User Persona

**Target User**: Developer running the PRP Pipeline for automated software development from command line

**Use Case**: Developer wants to execute the PRP Pipeline with various options:

- Run full pipeline: `npm run pipeline -- --prd ./PRD.md`
- Run specific scope: `npm run pipeline -- --prd ./PRD.md --scope P3.M4`
- Resume interrupted session: `npm run pipeline -- --prd ./PRD.md --continue`
- Validate without execution: `npm run pipeline -- --prd ./PRD.md --dry-run`
- Debug with verbose output: `npm run pipeline -- --prd ./PRD.md --verbose`

**User Journey**:

1. User invokes CLI: `npm run pipeline -- ./PRD.md --scope P3.M4`
2. Commander.js parses arguments from `process.argv`
3. CLI validates PRD file exists
4. CLI parses scope string using `ScopeResolver.parseScope()`
5. CLI returns typed `CLIArgs` object
6. Main entry point uses `CLIArgs` to configure `PRPPipeline`
7. Pipeline executes with specified configuration

**Pain Points Addressed**:

- No manual JSON editing required - all configuration via CLI flags
- Clear error messages when PRD file is missing
- Helpful error messages for invalid scope syntax
- Easy resumption of interrupted sessions with `--continue` flag
- Preview mode with `--dry-run` to see what will be executed
- Debug mode with `--verbose` for troubleshooting

## Why

- **PRD Requirement**: Section 5.2 explicitly requires CLI entry point for pipeline execution
- **User Experience**: CLI is the primary interface for running the pipeline - must be intuitive and robust
- **Type Safety**: Typed `CLIArgs` interface prevents configuration errors at compile time
- **Validation**: Early validation of PRD file and scope format prevents wasted execution time
- **Standards**: Commander.js is industry standard with ~24M weekly downloads and excellent TypeScript support
- **Scope Resolution**: Integration with existing `ScopeResolver` ensures consistent scope handling
- **Exit Codes**: Proper exit codes enable CI/CD integration and scripting

## What

### System Behavior

The CLI argument parser will:

1. **Create CLI Module** (`src/cli/index.ts`):
   - Export `parseCLIArgs(): CLIArgs` function
   - Use Commander.js for argument parsing
   - Define `CLIArgs` interface with all options
   - Validate PRD file exists (throw if missing)
   - Parse scope string using `ScopeResolver.parseScope()` (handle `ScopeParseError`)
   - Provide comprehensive help text

2. **Command-Line Arguments**:
   - `--prd <path>`: Path to PRD file (default: `./PRD.md`)
   - `--scope <scope>`: Scope identifier (optional, e.g., `P3.M4`)
   - `--mode <mode>`: Execution mode - choices: `normal`, `bug-hunt`, `validate` (default: `normal`)
   - `--continue`: Resume from previous session (boolean flag)
   - `--dry-run`: Show plan without executing (boolean flag)
   - `--verbose`: Enable debug logging (boolean flag)

3. **Validation Logic**:
   - Check PRD file exists using `fs.existsSync()`
   - Parse scope string if provided using `ScopeResolver.parseScope()`
   - Validate mode is one of the allowed choices
   - Provide clear error messages for all validation failures

4. **Type Safety**:
   - Export `CLIArgs` interface with all options typed
   - Use Commander.js's generic `opts<T>()` for type-safe option access

### Success Criteria

- [ ] `src/cli/index.ts` created with `parseCLIArgs()` function
- [ ] Commander.js installed and configured
- [ ] `CLIArgs` interface exported with all options typed
- [ ] `--prd <path>` option with default `./PRD.md`
- [ ] `--scope <scope>` option (optional)
- [ ] `--mode <mode>` option with choices: `normal`, `bug-hunt`, `validate`
- [ ] `--continue`, `--dry-run`, `--verbose` boolean flags
- [ ] PRD file existence validation
- [ ] Scope parsing via `ScopeResolver.parseScope()`
- [ ] Comprehensive help text
- [ ] Unit tests with 100% coverage
- [ ] All tests pass

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Yes** - This PRP provides:

- Complete Commander.js API reference from research document
- Exact `ScopeResolver.parseScope()` function signature and usage
- PRPPipeline constructor signature for integration
- TypeScript patterns from codebase (ES modules, .js imports, named exports)
- Test patterns from existing test files (Vitest, mocking patterns)
- File structure and placement conventions
- Validation commands specific to this project
- Code examples for all CLI patterns

### Documentation & References

```yaml
# MUST READ - Critical dependencies and patterns

- docfile: plan/001_14b9dc2a33c7/P3M4T2S1/research/cli-libraries.md
  why: Complete Commander.js research with code examples, TypeScript patterns
  critical: Lines 450-514 show complete Commander.js implementation example
  critical: Lines 827-855 show Commander.js quick reference
  section: "Commander.js Implementation"
  pattern: |
    import { Command } from 'commander';
    const program = new Command();
    program.option('--prd <path>', 'PRD file path', './PRD.md');
    const options = program.opts<CliOptions>();

- file: src/core/scope-resolver.ts
  why: ScopeResolver.parseScope() function for parsing scope strings
  critical: Lines 1-50 show Scope type definition and parseScope() signature
  critical: Lines 60-120 show ScopeParseError handling
  pattern: |
    import { parseScope, ScopeParseError } from './core/scope-resolver.js';
    try {
      const scope = parseScope(scopeArg);
    } catch (error) {
      if (error instanceof ScopeParseError) {
        console.error(`Invalid scope: ${error.message}`);
        process.exit(1);
      }
    }
  gotcha: parseScope() throws ScopeParseError for invalid scope strings

- file: src/workflows/prp-pipeline.ts
  why: PRPPipeline class that CLI will instantiate
  critical: Lines 154-181 show constructor signature
  critical: Lines 568-636 show run() method signature and return type
  pattern: |
    import { PRPPipeline } from './workflows/prp-pipeline.js';
    const pipeline = new PRPPipeline(prdPath, scope);
    const result = await pipeline.run();
  gotcha: PRPPipeline constructor throws if prdPath is empty

- file: src/index.ts
  why: Current entry point pattern for reference
  critical: Lines 1-30 show module import and main() function pattern
  critical: Lines 35-45 show error handling and exit code pattern
  pattern: |
    import { configureEnvironment } from './config/environment.js';
    async function main() {
      await configureEnvironment();
      // ... application logic
    }
    void main().catch(error => {
      console.error(error);
      process.exit(1);
    });
  gotcha: Use void main() for top-level await pattern

- file: package.json
  why: Project scripts and dependencies
  critical: Lines showing npm scripts: `dev`, `build`, `test`
  pattern: Scripts use `tsx` for direct TypeScript execution
  gotcha: CLI will be invoked via `npm run pipeline --` pattern

- url: https://github.com/tj/commander.js/blob/master/Readme.md
  why: Official Commander.js documentation
  critical: Options API, TypeScript integration, help generation
  section: "Options"
  note: Use .option() for basic options, .createOption().choices() for mode validation

- url: https://www.npmjs.com/package/commander
  why: Commander.js NPM package page
  critical: Version 14.0.2, installation instructions
  note: npm install commander

- file: tests/unit/core/task-orchestrator.test.ts
  why: Test patterns for async functions and error handling
  critical: Lines 1-20 show import patterns
  critical: Lines 80-120 show async test structure
  pattern: |
    import { describe, expect, it, vi } from 'vitest';
    describe('parseCLIArgs', () => {
      it('should parse valid arguments', async () => {
        // SETUP
        vi.mock('node:fs', () => ({ existsSync: vi.fn() }));
        // EXECUTE
        const args = parseCLIArgs();
        // VERIFY
        expect(args.prd).toBe('./PRD.md');
      });
    });
  gotcha: Mock node:fs for file existence tests

- file: tests/unit/agents/prp-generator.test.ts
  why: Comprehensive test patterns with 100% coverage
  critical: Lines showing mock setup and factory functions
  pattern: Factory functions for test data, comprehensive edge case coverage
  gotcha: Test all error paths to achieve 100% coverage

- file: src/config/environment.ts
  why: Pattern for module-level JSDoc and exports
  critical: Lines 1-40 show comprehensive JSDoc header pattern
  pattern: |
    /**
     * Module description
     * @module module-name
     * @remarks
     * Detailed explanation
     * @example
     * Code example
     */
  gotcha: All public exports must have JSDoc

- docfile: plan/001_14b9dc2a33c7/P3M4T1S3/PRP.md
  why: Previous PRP for context on smart commit integration
  note: CLI is independent of smart commit - separate concerns
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts       # Agent creation utilities
│   ├── prp-generator.ts       # PRPGenerator (from P3.M3.T1.S1)
│   ├── prp-executor.ts        # PRPExecutor (from P3.M3.T1.S2)
│   └── prp-runtime.ts         # PRPRuntime (from P3.M3.T1.S3)
├── config/
│   ├── constants.ts           # Project constants
│   ├── environment.ts         # Environment configuration
│   └── types.ts               # Type definitions
├── core/
│   ├── index.ts               # Core module exports
│   ├── models.ts              # Backlog, Phase, Status types
│   ├── scope-resolver.ts      # ScopeResolver and parseScope()
│   ├── session-manager.ts     # SessionManager class
│   └── task-orchestrator.ts   # TaskOrchestrator class
├── index.ts                   # Main application entry point
├── tools/
│   ├── bash-mcp.ts            # Bash MCP tool
│   ├── filesystem-mcp.ts      # Filesystem MCP tool
│   └── git-mcp.ts             # Git MCP tool
├── utils/
│   ├── task-utils.ts          # Task hierarchy utilities
│   └── git-commit.ts          # Smart commit utility (from P3.M4.T1.S3)
└── workflows/
    ├── hello-world.ts         # Simple workflow example
    └── prp-pipeline.ts        # Main PRP Pipeline workflow

tests/
├── unit/
│   ├── agents/
│   ├── core/
│   │   ├── scope-resolver.test.ts  # ScopeResolver tests
│   │   ├── session-manager.test.ts
│   │   └── task-orchestrator.test.ts
│   └── utils/
└── integration/

package.json                  # NPM scripts and dependencies
tsconfig.json                 # TypeScript configuration
vitest.config.ts              # Vitest configuration
```

### Desired Codebase Tree with Files to be Added

```bash
src/
└── cli/
    └── index.ts              # NEW - CLI argument parser

tests/
└── unit/
    └── cli/
        └── index.test.ts     # NEW - CLI parser tests

package.json                  # MODIFY - Add commander dependency
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Commander.js option names with dashes become camelCase in TypeScript
// --dry-run becomes options.dryRun (not options['dry-run'])
interface CLIArgs {
  dryRun: boolean;  // not 'dry-run'
}

// CRITICAL: Use .js extension for ES module imports
import { parseScope } from './core/scope-resolver.js';  // Note .js

// CRITICAL: parseScope() throws ScopeParseError for invalid input
// Must catch and handle with helpful error message
try {
  const scope = parseScope(scopeArg);
} catch (error) {
  if (error instanceof ScopeParseError) {
    console.error(`Invalid scope "${scopeArg}": ${error.message}`);
    console.error(`Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all`);
    process.exit(1);
  }
}

// CRITICAL: Scope is optional - only parse if scopeArg is provided
const scope = scopeArg ? parseScope(scopeArg) : undefined;

// CRITICAL: PRD file must exist before proceeding
import { existsSync } from 'node:fs';
if (!existsSync(prdPath)) {
  console.error(`PRD file not found: ${prdPath}`);
  process.exit(1);
}

// CRITICAL: Use program.opts<T>() for type-safe option access
const options = program.opts<CLIArgs>();  // Fully typed

// CRITICAL: Boolean flags default to false when not provided
// --verbose flag sets options.verbose = true, absence = false

// CRITICAL: Commander.js automatically generates help from option descriptions
// Provide clear, concise descriptions for good UX

// CRITICAL: Choices must be defined using .createOption().choices()
program.createOption('--mode <mode>', 'Execution mode')
  .choices(['normal', 'bug-hunt', 'validate'])
  .default('normal');

// CRITICAL: Default values are set in .option() third parameter
program.option('--prd <path>', 'Path to PRD file', './PRD.md');

// CRITICAL: process.argv contains [node, script, ...args]
// Commander.js handles this automatically - just call program.parse()

// CRITICAL: Test file existence by mocking node:fs
// Don't use real file system in tests
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

// GOTCHA: TypeScript requires type assertion for Commander.js Option
// Use .createOption() for complex options like choices

// GOTCHA: Commander.js doesn't exit on error by default
// Must call process.exit(1) explicitly after validation failures

// PATTERN: Use named exports, no default exports
export function parseCLIArgs(): CLIArgs { ... }
export type { CLIArgs };

// PATTERN: Comprehensive JSDoc on all exports
/**
 * Parses CLI arguments into typed configuration
 * @remarks
 * Uses Commander.js for argument parsing and validation
 * @example
 * const args = parseCLIArgs();
 * console.log(`PRD: ${args.prd}`);
 */

// GOTCHA: PRPPipeline constructor will throw if prdPath is empty
// Validate before passing to constructor

// GOTCHA: Scope type from scope-resolver uses 'all' for no scope limit
// When --scope is not provided, pass undefined (not { type: 'all' })
```

## Implementation Blueprint

### Data Models and Structure

Create the core CLI data model for type safety:

```typescript
/**
 * Parsed CLI arguments
 *
 * @remarks
 * All options are fully typed for compile-time safety.
 * Defaults are applied for unspecified options.
 */
export interface CLIArgs {
  /** Path to PRD markdown file */
  prd: string;

  /** Optional scope to limit execution (e.g., "P3.M4") */
  scope?: string;

  /** Execution mode: normal, bug-hunt, or validate */
  mode: 'normal' | 'bug-hunt' | 'validate';

  /** Resume from previous session */
  continue: boolean;

  /** Show plan without executing */
  dryRun: boolean;

  /** Enable debug logging */
  verbose: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL Commander.js dependency
  - RUN: npm install commander
  - VERIFY: package.json includes "commander" in dependencies
  - VERSION: 14.0.2 or later

Task 2: CREATE src/cli/index.ts - CLI argument parser module
  - IMPORT: Command from 'commander'
  - IMPORT: parseScope, ScopeParseError from '../core/scope-resolver.js'
  - IMPORT: existsSync from 'node:fs'
  - DEFINE: CLIArgs interface with all options
  - IMPLEMENT: parseCLIArgs(): CLIArgs function
  - CONFIGURE: Commander.js program with all options
  - VALIDATE: PRD file exists (throw if missing)
  - VALIDATE: Scope string format (handle ScopeParseError)
  - EXPORT: parseCLIArgs function and CLIArgs type
  - JSDOC: Comprehensive module and function documentation
  - PLACEMENT: src/cli/index.ts (new file)

Task 3: IMPLEMENT parseCLIArgs() function
  - CREATE: new Command() instance
  - SET: program.name('prp-pipeline')
  - SET: program.description('PRD to PRP Pipeline')
  - SET: program.version('1.0.0')
  - ADD: --prd <path> option with default './PRD.md'
  - ADD: --scope <scope> option (no default, optional)
  - ADD: --mode <mode> option with choices and default 'normal'
  - ADD: --continue boolean flag
  - ADD: --dry-run boolean flag
  - ADD: --verbose boolean flag
  - CALL: program.parse(process.argv)
  - EXTRACT: options using program.opts<CLIArgs>()
  - VALIDATE: PRD file exists using existsSync()
  - VALIDATE: Parse scope if provided using parseScope()
  - RETURN: CLIArgs object

Task 4: IMPLEMENT validation logic
  - CHECK: existsSync(options.prd) - throw if false
  - ERROR: "PRD file not found: {prdPath}"
  - PARSE: scope string if provided (options.scope)
  - CATCH: ScopeParseError and provide helpful message
  - ERROR: "Invalid scope '{scope}': {error.message}"
  - ERROR: "Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all"
  - EXIT: process.exit(1) on validation failures

Task 5: ADD comprehensive help text
  - DESCRIPTION: Clear program description
  - OPTION DESCRIPTIONS: Concise but informative
    - --prd: "Path to PRD markdown file"
    - --scope: "Scope identifier (e.g., P3.M4, P3.M4.T2)"
    - --mode: "Execution mode"
    - --continue: "Resume from previous session"
    - --dry-run: "Show plan without executing"
    - --verbose: "Enable debug logging"
  - EXAMPLES: Add usage examples in help text

Task 6: CREATE tests/unit/cli/index.test.ts
  - IMPORT: parseCLIArgs, CLIArgs from src/cli/index.js
  - MOCK: process.argv for test scenarios
  - MOCK: node:fs existsSync for file validation
  - TEST: All default values are applied correctly
  - TEST: All options are parsed correctly
  - TEST: Mode choices are validated
  - TEST: PRD file existence is checked
  - TEST: Scope parsing is called when scope provided
  - TEST: ScopeParseError is handled with helpful message
  - TEST: Help text is generated
  - TEST: Exit code 1 on validation failure
  - COVERAGE: Achieve 100% coverage

Task 7: UPDATE package.json scripts
  - ADD: "pipeline": "tsx src/index.ts" script
  - ADD: "pipeline:dev": "nodemon --exec tsx src/index.ts" for development
  - VERIFY: Scripts work with CLI arguments
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// File: src/cli/index.ts
// =============================================================================

/**
 * CLI argument parser for PRP Pipeline
 *
 * @module cli/index
 *
 * @remarks
 * Provides command-line argument parsing and validation for the PRP Pipeline.
 * Uses Commander.js for robust parsing with type safety via TypeScript.
 *
 * Validates:
 * - PRD file exists before execution
 * - Scope string format (if provided)
 * - Mode is one of allowed choices
 *
 * @example
 * ```typescript
 * import { parseCLIArgs } from './cli/index.js';
 *
 * const args = parseCLIArgs();
 * console.log(`PRD: ${args.prd}`);
 * console.log(`Mode: ${args.mode}`);
 * if (args.scope) {
 *   console.log(`Scope: ${args.scope}`);
 * }
 * ```
 */

import { Command } from 'commander';
import { parseScope, ScopeParseError } from '../core/scope-resolver.js';
import { existsSync } from 'node:fs';

// ===== TYPE DEFINITIONS =====

/**
 * Parsed CLI arguments
 *
 * @remarks
 * All options are fully typed for compile-time safety.
 * Defaults are applied for unspecified options.
 *
 * @property prd - Path to PRD markdown file (required)
 * @property scope - Optional scope identifier (e.g., "P3.M4")
 * @property mode - Execution mode: normal, bug-hunt, or validate
 * @property continue - Resume from previous session
 * @property dryRun - Show plan without executing
 * @property verbose - Enable debug logging
 */
export interface CLIArgs {
  /** Path to PRD markdown file */
  prd: string;

  /** Optional scope to limit execution (e.g., "P3.M4") */
  scope?: string;

  /** Execution mode */
  mode: 'normal' | 'bug-hunt' | 'validate';

  /** Resume from previous session */
  continue: boolean;

  /** Show plan without executing */
  dryRun: boolean;

  /** Enable debug logging */
  verbose: boolean;
}

// ===== MAIN FUNCTION =====

/**
 * Parses CLI arguments into typed configuration
 *
 * @returns Parsed and validated CLI arguments
 * @throws {Error} If PRD file doesn't exist
 * @throws {ScopeParseError} If scope string is invalid
 *
 * @remarks
 * Uses Commander.js to parse process.argv and validate options.
 * Performs additional validation:
 * - Checks PRD file exists
 * - Parses scope string using ScopeResolver
 *
 * Exits with code 1 on validation failures.
 *
 * @example
 * ```typescript
 * const args = parseCLIArgs();
 * const pipeline = new PRPPipeline(args.prd);
 * await pipeline.run();
 * ```
 */
export function parseCLIArgs(): CLIArgs {
  const program = new Command();

  // Configure program
  program
    .name('prp-pipeline')
    .description('PRD to PRP Pipeline - Automated software development')
    .version('1.0.0')
    // Required options
    .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
    // Optional options
    .option('--scope <scope>', 'Scope identifier (e.g., P3.M4, P3.M4.T2)')
    // Mode with choices
    .addOption(
      program
        .createOption('--mode <mode>', 'Execution mode')
        .choices(['normal', 'bug-hunt', 'validate'])
        .default('normal')
    )
    // Boolean flags
    .option('--continue', 'Resume from previous session')
    .option('--dry-run', 'Show plan without executing')
    .option('--verbose', 'Enable debug logging')
    .parse(process.argv);

  // Get typed options
  const options = program.opts<CLIArgs>();

  // Validate PRD file exists
  if (!existsSync(options.prd)) {
    console.error(`Error: PRD file not found: ${options.prd}`);
    console.error('Please provide a valid PRD file path using --prd');
    process.exit(1);
  }

  // Validate scope format if provided
  if (options.scope) {
    try {
      parseScope(options.scope);
      // Scope is valid, continue
    } catch (error) {
      if (error instanceof ScopeParseError) {
        console.error(`Error: Invalid scope "${options.scope}"`);
        console.error(
          `Expected format: P1, P1.M1, P1.M1.T1, P1.M1.T1.S1, or all`
        );
        console.error(`Details: ${error.message}`);
        process.exit(1);
      }
      // Re-throw unexpected errors
      throw error;
    }
  }

  return options;
}

// =============================================================================
// Example: src/index.ts (modified to use CLI)
// =============================================================================

// import { configureEnvironment } from './config/environment.js';
// import { PRPPipeline } from './workflows/prp-pipeline.js';
// import { parseCLIArgs } from './cli/index.js';
//
// async function main() {
//   await configureEnvironment();
//
//   const args = parseCLIArgs();
//
//   if (args.verbose) {
//     console.log('CLI Arguments:', args);
//   }
//
//   if (args.dryRun) {
//     console.log('DRY RUN: Would execute pipeline with:');
//     console.log(`  PRD: ${args.prd}`);
//     console.log(`  Mode: ${args.mode}`);
//     if (args.scope) console.log(`  Scope: ${args.scope}`);
//     return;
//   }
//
//   // Parse scope if provided
//   const scope = args.scope ? parseScope(args.scope) : undefined;
//
//   const pipeline = new PRPPipeline(args.prd, scope);
//   const result = await pipeline.run();
//
//   if (!result.success) {
//     process.exit(1);
//   }
// }
//
// void main().catch(error => {
//   console.error(error);
//   process.exit(1);
// });
````

### Integration Points

```yaml
COMMANDER_JS:
  - install: "npm install commander"
  - version: "14.0.2 or later"
  - import: "import { Command } from 'commander'"

SCOPE_RESOLVER:
  - import: "import { parseScope, ScopeParseError } from '../core/scope-resolver.js'"
  - usage: "parseScope(scopeString)" - throws ScopeParseError on invalid
  - note: Only call if scope arg is provided

PRP_PIPELINE:
  - import: "import { PRPPipeline } from './workflows/prp-pipeline.js'"
  - constructor: "new PRPPipeline(prdPath: string, scope?: Scope)"
  - usage: "const result = await pipeline.run()"

FILE_SYSTEM:
  - import: "import { existsSync } from 'node:fs'"
  - usage: "existsSync(prdPath)" - returns boolean

PACKAGE_JSON:
  - add script: "pipeline": "tsx src/index.ts"
  - usage: "npm run pipeline -- --prd ./PRD.md --scope P3.M4"

PROCESS_EXIT:
  - success: "process.exit(0)" or let main return
  - error: "process.exit(1)" after validation failure
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npm run lint -- src/cli/index.ts                 # ESLint with auto-fix
npm run format -- src/cli/index.ts               # Prettier formatting
npm run check -- src/cli/index.ts                # TypeScript type checking

# Project-wide validation
npm run lint                                     # Check all files
npm run format                                   # Format all files
npm run check                                    # Type check all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test CLI parser
npm test -- tests/unit/cli/index.test.ts -v

# Test with coverage
npm test -- tests/unit/cli/index.test.ts --coverage

# Run all tests
npm test

# Coverage validation (must achieve 100%)
npm run test:coverage

# Expected: All tests pass, 100% coverage for src/cli/index.ts
# If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# 1. Test help output
npm run pipeline -- --help

# Expected output:
# Usage: prp-pipeline [options]
#
# Options:
#   --prd <path>          Path to PRD markdown file (default: "./PRD.md")
#   --scope <scope>       Scope identifier (e.g., P3.M4, P3.M4.T2)
#   --mode <mode>         Execution mode (choices: "normal", "bug-hunt", "validate")
#   --continue            Resume from previous session
#   --dry-run             Show plan without executing
#   --verbose             Enable debug logging
#   -h, --help            display help for command
#   -V, --version         output version number

# 2. Test version output
npm run pipeline -- --version

# Expected: 1.0.0

# 3. Test default PRD path
npm run pipeline -- --verbose

# Expected: Should attempt to use ./PRD.md, show verbose output

# 4. Test custom PRD path
npm run pipeline -- --prd ./test-prd.md --dry-run

# Expected: DRY RUN message with test-prd.md path

# 5. Test scope parsing (valid)
npm run pipeline -- --prd ./PRD.md --scope P3.M4 --dry-run

# Expected: No errors, shows scope P3.M4

# 6. Test scope parsing (invalid)
npm run pipeline -- --prd ./PRD.md --scope INVALID --dry-run

# Expected: Error "Invalid scope 'INVALID'", exit code 1

# 7. Test mode choices
npm run pipeline -- --mode bug-hunt --dry-run

# Expected: No errors, mode set to bug-hunt

# 8. Test mode validation
npm run pipeline -- --mode invalid-mode --dry-run

# Expected: Error "Invalid choice: invalid-mode", exit code 1

# 9. Test PRD file not found
npm run pipeline -- --prd ./nonexistent.md --dry-run

# Expected: Error "PRD file not found: ./nonexistent.md", exit code 1

# 10. Test boolean flags
npm run pipeline -- --continue --dry-run --verbose

# Expected: All flags set to true, shows verbose output

# 11. Test all options together
npm run pipeline -- --prd ./PRD.md --scope P3.M4 --mode bug-hunt --continue --dry-run --verbose

# Expected: All options parsed correctly, shows verbose dry-run output
```

### Level 4: Domain-Specific Validation

```bash
# CLI Interface Validation
# Test all argument combinations and edge cases

# Test: Empty arguments (should use defaults)
npm run pipeline

# Expected: Uses ./PRD.md, mode: normal, scope: undefined

# Test: Only PRD specified
npm run pipeline -- --prd ./custom/PRD.md

# Expected: Uses custom PRD path, other defaults

# Test: Scope only (valid format)
npm run pipeline -- --scope P1.M1.T1.S1 --dry-run

# Expected: Parses scope correctly

# Test: Scope with various valid formats
for scope in "all" "P1" "P1.M1" "P1.M1.T1" "P1.M1.T1.S1"; do
  npm run pipeline -- --scope "$scope" --dry-run
done

# Expected: All parse successfully

# Test: Scope with invalid formats
for scope in "invalid" "P1.X1" "P1.M1.X1" "p1.m1" "P1.M1.T1.S1.S2"; do
  npm run pipeline -- --scope "$scope" --dry-run || echo "Correctly rejected: $scope"
done

# Expected: All rejected with helpful error messages

# Test: Mode choices
for mode in "normal" "bug-hunt" "validate"; do
  npm run pipeline -- --mode "$mode" --dry-run
done

# Expected: All modes accepted

# Test: Invalid mode
npm run pipeline -- --mode invalid --dry-run

# Expected: Error "Invalid choice: invalid", exit code 1

# Test: Boolean flag combinations
npm run pipeline -- --dry-run
npm run pipeline -- --verbose
npm run pipeline -- --continue
npm run pipeline -- --dry-run --verbose
npm run pipeline -- --continue --verbose --dry-run

# Expected: All combinations work correctly

# Test: Help text includes all options
npm run pipeline -- --help | grep -E "prd|scope|mode|continue|dry-run|verbose"

# Expected: All options documented

# Test: Version output
npm run pipeline -- --version

# Expected: Outputs version 1.0.0

# Real-World Simulation Test
# Create a test PRD and run pipeline with all options
cat > /tmp/test-cli-prd.md << 'EOF'
# Test PRD for CLI Validation

## P1: Phase 1
### P1.M1: Milestone 1
#### P1.M1.T1: Task 1
##### P1.M1.T1.S1: Subtask 1
Test CLI argument parsing
EOF

# Run pipeline with scope
npm run pipeline -- --prd /tmp/test-cli-prd.md --scope P1.M1.T1.S1 --dry-run --verbose

# Expected: Shows PRD path, scope, mode, dry-run message, verbose output

# Exit Code Validation
# Test that validation failures produce exit code 1
npm run pipeline -- --prd ./nonexistent.md --dry-run; echo "Exit code: $?"

# Expected: Exit code: 1

# Test that dry-run produces exit code 0
npm run pipeline -- --dry-run; echo "Exit code: $?"

# Expected: Exit code: 0
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] 100% coverage for src/cli/index.ts: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format -- --check`
- [ ] Commander.js installed in package.json

### Feature Validation

- [ ] `src/cli/index.ts` created with `parseCLIArgs()` function
- [ ] `CLIArgs` interface exported with all options typed
- [ ] `--prd <path>` option with default `./PRD.md`
- [ ] `--scope <scope>` option (optional)
- [ ] `--mode <mode>` option with choices: `normal`, `bug-hunt`, `validate`
- [ ] `--continue` boolean flag
- [ ] `--dry-run` boolean flag
- [ ] `--verbose` boolean flag
- [ ] PRD file existence validation
- [ ] Scope parsing via `ScopeResolver.parseScope()`
- [ ] Helpful error messages for validation failures
- [ ] Exit code 1 on validation failure
- [ ] Comprehensive help text
- [ ] Unit tests with 100% coverage
- [ ] All test scenarios pass

### Code Quality Validation

- [ ] Follows existing codebase patterns (ES modules, .js imports, named exports)
- [ ] Comprehensive JSDoc with @module, @remarks, @example
- [ ] Named exports only (no default exports)
- [ ] Uses .js extension for imports
- [ ] Proper error handling with try/catch
- [ ] Type-safe throughout (CLIArgs interface)
- [ ] File placement matches desired codebase tree
- [ ] No duplication of existing code
- [ ] Commander.js configured correctly
- [ ] Option names follow CLI conventions (--kebab-case)

### Documentation & Deployment

- [ ] Module-level JSDoc complete
- [ ] Function JSDoc with @remarks for parseCLIArgs
- [ ] @example blocks showing usage
- [ ] CLIArgs interface fully documented
- [ ] Error handling documented
- [ ] Help text is clear and comprehensive
- [ ] package.json scripts updated if needed

---

## Anti-Patterns to Avoid

- ❌ Don't use yargs - use Commander.js (better TypeScript support)
- ❌ Don't skip PRD file validation - check existsSync() before proceeding
- ❌ Don't skip scope validation - use parseScope() with error handling
- ❌ Don't use process.exit(0) on success - let main return naturally
- ❌ Don't forget .js extension in imports - ES modules require it
- ❌ Don't use default exports - use named exports only
- ❌ Don't create CLI commands (subcommands) - simple options only for now
- ❌ Don't hardcode option values - use Commander.js's option API
- ❌ Don't ignore ScopeParseError - catch and provide helpful message
- ❌ Don't skip JSDoc - all public exports must have documentation
- ❌ Don't use sync file operations in main flow - existsSync() is OK for validation
- ❌ Don't forget to call program.parse() - no options extracted without it
- ❌ Don't use options.dryRun in TypeScript interface - options.dryRun correct (not options['dry-run'])
- ❌ Don't skip type safety - use program.opts<CLIArgs>() for typed access
- ❌ Don't parse scope if not provided - check if options.scope exists first
- ❌ Don't forget exit code 1 on validation failure - process.exit(1)
