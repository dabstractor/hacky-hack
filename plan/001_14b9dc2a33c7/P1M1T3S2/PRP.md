# Product Requirement Prompt (PRP): Entry Point and Hello-World Workflow

---

## Goal

**Feature Goal**: Create the application entry point (`src/index.ts`) that validates the Groundswell library integration and establishes the foundational workflow pattern for the entire PRP Pipeline system.

**Deliverable**: An executable TypeScript application entry point with a `HelloWorldWorkflow` class that extends Groundswell's `Workflow` class and successfully runs end-to-end.

**Success Definition**:

- Application runs via `npm run dev` without errors
- "PRP Pipeline initialized" message is logged
- Workflow completes with status 'completed'
- Proper error handling and exit codes (0 for success, 1 for failure)
- TypeScript compilation succeeds without type errors

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Yes - This PRP provides:**

- Exact file paths and import patterns to follow
- Groundswell library documentation with local paths
- Environment configuration integration patterns
- Existing codebase structure and conventions
- Complete validation commands

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Groundswell Library Core API
- url: https://github.com/groundswell-ai/groundswell
  why: Official Groundswell repository with workflow examples and API reference
  critical: The local path is ~/projects/groundswell - this is where the library is developed

- docfile: plan/001_14b9dc2a33c7/P1M1T3S2/research/groundswell_docs.md
  why: Comprehensive documentation on Workflow class, @Step decorator, and all usage patterns
  section: "@Step Decorator Documentation" and "TypeScript Examples"
  critical: Contains working examples of extending Workflow class

- url: https://github.com/groundswell-ai/groundswell/blob/main/examples/examples/01-basic-workflow.ts
  why: Simplest complete example of Workflow class extension pattern
  pattern: Class extends Workflow, has async run() method, uses setStatus('running'/'completed')
  gotcha: Must call this.setStatus() explicitly, status does not auto-transition

- url: https://github.com/groundswell-ai/groundswell/blob/main/docs/workflow.md#basic-usage
  why: Core workflow concepts - lifecycle, status transitions, logger usage
  critical: Status flow: idle -> running -> completed/failed

# Environment Configuration (Already Implemented)
- file: src/config/environment.ts
  why: Must be imported and invoked before creating any workflows
  pattern: configureEnvironment() must be called at startup to map ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY
  gotcha: This function modifies process.env in place - side effect is intentional

- file: src/config/constants.ts
  why: Contains DEFAULT_BASE_URL and MODEL_NAMES used for z.ai API configuration
  pattern: Constants follow UPPER_SNAKE_CASE convention

- file: src/config/types.ts
  why: Contains ModelTier type and EnvironmentValidationError class
  pattern: Type exports at bottom of file for convenience

# Existing Build Configuration
- file: package.json
  why: Shows npm scripts including "dev": "tsx src/index.ts" that runs our entry point
  pattern: All scripts use -- flags for cli tools
  gotcha: src/index.ts does NOT exist yet - this is what we're creating

- file: tsconfig.json
  why: TypeScript compilation settings - ES2022 target, NodeNext module, strict mode enabled
  pattern: Output directory is ./dist, rootDir is .
  gotcha: "module": "NodeNext" requires .js extensions in import statements

- file: vitest.config.ts
  why: Test configuration with 100% coverage thresholds
  pattern: Test files in tests/**/*.{test,spec}.ts, globals enabled
  gotcha: Coverage thresholds are strict - all code must be tested

# Linting and Formatting (P1.M1.T3.S1 - Already Complete)
- file: .eslintrc.json
  why: ESLint rules including TypeScript strict checking, no unused vars, no explicit any
  pattern: Extends: eslint:recommended, plugin:@typescript-eslint/recommended, prettier

- file: .prettierrc
  why: Code formatting rules - semicolons, single quotes, 80 char width, 2-space tabs
  pattern: Prettier settings must match or lint will fail

# Groundswell API Architecture (Internal Documentation)
- docfile: plan/001_14b9dc2a33c7/architecture/groundswell_api.md
  why: Internal architecture documentation showing exports and patterns
  section: "Core Exports" and "Main Classes"
  critical: Shows @Step, @Task, @ObservedState decorator usage
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── package.json                    # Project configuration, "dev" script points to src/index.ts
├── tsconfig.json                   # TypeScript: ES2022, NodeNext, strict mode
├── .eslintrc.json                  # ESLint: TypeScript + Prettier
├── .prettierrc                     # Prettier: single quotes, 2-space tabs
├── vitest.config.ts                # Vitest: 100% coverage thresholds
├── src/
│   ├── index.ts                    # MISSING - This is what we're creating
│   ├── config/
│   │   ├── constants.ts            # DEFAULT_BASE_URL, MODEL_NAMES
│   │   ├── environment.ts          # configureEnvironment(), getModel(), validateEnvironment()
│   │   └── types.ts                # ModelTier, EnvironmentValidationError
│   ├── agents/                     # Empty - for future agent implementations
│   ├── core/                       # Empty - for future core functionality
│   ├── utils/                      # Empty - for future utilities
│   └── workflows/                  # Empty - for future workflow implementations
├── tests/
│   ├── unit/                       # Unit tests directory
│   ├── integration/                # Integration tests directory
│   └── validation/                 # Validation test scripts
└── plan/001_14b9dc2a33c7/          # Current project session
```

### Desired Codebase Tree with Files to be Added

```bash
/home/dustin/projects/hacky-hack/
├── src/
│   ├── index.ts                    # CREATE - Main entry point with HelloWorldWorkflow
│   └── workflows/
│       └── hello-world.ts          # CREATE - HelloWorldWorkflow class
└── tests/
    └── integration/
        └── hello-world.test.ts     # CREATE - Integration test for workflow
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Groundswell must be linked locally before running
// Run: cd ~/projects/groundswell && npm link
// Then: cd /home/dustin/projects/hacky-hack && npm link groundswell
// The package.json does NOT include groundswell - it's linked for development

// CRITICAL: TypeScript NodeNext module requires .js extensions in imports
// Even though we write .ts files, imports must use .js extension:
import { Workflow } from 'groundswell'; // Correct
import { Workflow } from 'groundswell/index.ts'; // WRONG - will fail at runtime

// CRITICAL: configureEnvironment() modifies process.env in place
// This is intentional - the ANTHROPIC_AUTH_TOKEN -> ANTHROPIC_API_KEY mapping
// must happen before any agent/workflow creation
configureEnvironment(); // Call at startup

// GOTCHA: Workflow.setStatus() is NOT automatic
// You must explicitly call this.setStatus('running'), this.setStatus('completed'), etc.
// The workflow will remain in 'idle' status until you change it

// GOTCHA: @Step decorator options have defaults
// @Step() automatically tracks timing (trackTiming: true is default)
// Use @Step({ logStart: true, logFinish: true }) for console logging

// GOTCHA: this.logger is a structured logger built into Workflow
// Use: this.logger.info(), this.logger.debug(), this.logger.warn(), this.logger.error()

// GOTCHA: Workflow.run() returns Promise<T | WorkflowResult<T>>
// When extending Workflow class, your run() method return type becomes the result
// The WorkflowResult wrapper includes .data and .duration properties

// CRITICAL: Exit code convention
// Use process.exit(0) for success, process.exit(1) for errors
// Catch all errors and exit with proper code
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models are required for this task. We use:

- Existing `ModelTier` type from `src/config/types.ts`
- Groundswell's built-in `Workflow` class and decorators

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY Groundswell Link
  - EXECUTE: cd ~/projects/groundswell && npm link
  - EXECUTE: cd /home/dustin/projects/hacky-hack && npm link groundswell
  - VERIFY: Check that groundswell appears in npm ls or package-lock.json
  - BLOCKER: Cannot proceed without successful link

Task 2: CREATE src/workflows/hello-world.ts
  - IMPLEMENT: HelloWorldWorkflow class extending Workflow
  - IMPORT: { Workflow, Step } from 'groundswell'
  - NAMING: PascalCase for class (HelloWorldWorkflow), camelCase for methods
  - PATTERN: Follow example at ~/projects/groundswell/examples/examples/01-basic-workflow.ts
  - IMPLEMENT: async run(): Promise<void> method
  - IMPLEMENT: @Step decorated method that logs 'PRP Pipeline initialized'
  - USE: this.setStatus('running') and this.setStatus('completed')
  - USE: this.logger.info() for logging
  - PLACEMENT: src/workflows/ directory (create if not exists)
  - DEPENDENCIES: Groundswell link from Task 1

Task 3: CREATE src/index.ts
  - IMPLEMENT: Top-level await to configure environment
  - IMPORT: { configureEnvironment } from './config/environment.js'
  - IMPORT: { HelloWorldWorkflow } from './workflows/hello-world.js'
  - NOTE: Use .js extensions due to NodeNext module resolution
  - INVOKE: configureEnvironment() before creating workflow
  - IMPLEMENT: try/catch block around workflow execution
  - IMPLEMENT: Process.exit(0) on success, process.exit(1) on error
  - LOG: Success message on completion
  - PLACEMENT: src/ root directory (entry point expected by npm dev script)
  - DEPENDENCIES: Task 2 (HelloWorldWorkflow class)

Task 4: CREATE tests/integration/hello-world.test.ts
  - IMPLEMENT: Integration test using Vitest describe/it pattern
  - IMPORT: { describe, it, expect, beforeEach, afterEach } from 'vitest'
  - IMPORT: { HelloWorldWorkflow } from '../../src/workflows/hello-world.js'
  - IMPLEMENT: Test case for successful workflow execution
  - IMPLEMENT: Test case for error handling
  - MOCK: Environment variables if needed (vi.stubEnv)
  - VERIFY: Workflow completes with 'completed' status
  - COVERAGE: Achieve 100% coverage for new files
  - PLACEMENT: tests/integration/ directory
  - DEPENDENCIES: Task 2 (HelloWorldWorkflow class)

Task 5: VALIDATE TypeScript Compilation
  - EXECUTE: npm run build (runs tsc)
  - VERIFY: Zero type errors
  - VERIFY: Output appears in dist/
  - FIX: Any type errors before proceeding

Task 6: VALIDATE Linting and Formatting
  - EXECUTE: npm run lint
  - EXECUTE: npm run format:check
  - FIX: Any linting or formatting errors

Task 7: RUN Application End-to-End
  - EXECUTE: npm run dev
  - VERIFY: "PRP Pipeline initialized" appears in output
  - VERIFY: Application exits with code 0
  - VERIFY: No console errors or warnings
```

### Implementation Patterns & Key Details

```typescript
// ============================================
// PATTERN 1: Workflow Class Extension
// src/workflows/hello-world.ts
// ============================================
import { Workflow, Step } from 'groundswell';

/**
 * Hello-world workflow for validating Groundswell integration
 *
 * @remarks
 * This is the simplest possible workflow to validate that Groundswell
 * is properly linked and the basic workflow pattern works.
 */
export class HelloWorldWorkflow extends Workflow {
  /**
   * Run the workflow
   *
   * @remarks
   * This is the main entry point for workflow execution.
   * Must explicitly set status to track workflow lifecycle.
   */
  async run(): Promise<void> {
    this.setStatus('running');
    this.logger.info('Starting Hello-World Workflow');

    await this.logInitialization();

    this.setStatus('completed');
    this.logger.info('Hello-World Workflow completed successfully');
  }

  /**
   * Log initialization message
   *
   * @remarks
   * This @Step decorated method validates the decorator pattern works.
   * Step decorator adds event emission and error wrapping automatically.
   */
  @Step({ logStart: true, logFinish: true })
  private async logInitialization(): Promise<void> {
    this.logger.info('PRP Pipeline initialized');
  }
}

// ============================================
// PATTERN 2: Entry Point with Error Handling
// src/index.ts
// ============================================
import { configureEnvironment } from './config/environment.js';
import { HelloWorldWorkflow } from './workflows/hello-world.js';

/**
 * Main entry point for PRP Pipeline application
 *
 * @remarks
 * Configures environment and runs the hello-world workflow to validate
 * Groundswell integration. Exit codes: 0 = success, 1 = failure.
 */
async function main(): Promise<void> {
  try {
    // CRITICAL: Configure environment before any workflow operations
    configureEnvironment();

    // Create and run workflow
    const workflow = new HelloWorldWorkflow('HelloWorld');
    await workflow.run();

    // Success exit
    console.log('PRP Pipeline entry point: Execution complete');
    process.exit(0);
  } catch (error) {
    // Error exit with details
    console.error('PRP Pipeline entry point: Fatal error');
    console.error(error);
    process.exit(1);
  }
}

// Start the application
main();
```

### Integration Points

```yaml
ENVIRONMENT:
  - add to: src/index.ts (top-level)
  - pattern: "configureEnvironment() must be called before workflow creation"

PACKAGE_JSON:
  - already has: "dev": "tsx src/index.ts"
  - no changes needed - script points to our new entry point

WORKFLOWS_DIRECTORY:
  - create: src/workflows/ if not exists
  - pattern: Each workflow in its own file, PascalCase filename matching class name

TESTS_DIRECTORY:
  - create: tests/integration/ if not exists
  - pattern: Test files named *.test.ts alongside source structure
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint -- src/workflows/hello-world.ts src/index.ts    # Check new files
npm run format -- src/workflows/hello-world.ts src/index.ts  # Format new files

# Project-wide validation
npm run lint       # ESLint check all files
npm run format     # Prettier format all files

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: TypeScript Compilation (Type Validation)

```bash
# Compile TypeScript to verify types
npm run build      # Runs tsc with project configuration

# Verify output was created
ls -la dist/workflows/hello-world.js
ls -la dist/index.js

# Expected: Zero type errors. dist/ directory contains compiled .js files.
```

### Level 3: Unit Tests (Component Validation)

```bash
# Run the integration test
npm test -- tests/integration/hello-world.test.ts

# Run all tests with coverage
npm run test:coverage

# Expected: All tests pass, 100% coverage for new files
```

### Level 4: Integration Testing (System Validation)

```bash
# Run the application end-to-end
npm run dev

# Expected output:
# "Starting Hello-World Workflow"
# "PRP Pipeline initialized"
# "Hello-World Workflow completed successfully"
# "PRP Pipeline entry point: Execution complete"
# Exit code: 0

# Manual verification commands:
npm run dev; echo "Exit code: $?"  # Should print "Exit code: 0"

# With invalid environment (test error handling):
unset ANTHROPIC_API_KEY
npm run dev; echo "Exit code: $?"  # Should print "Exit code: 1"
```

### Level 5: Groundswell Validation

```bash
# Verify Groundswell link is active
npm ls groundswell

# Expected: groundswell@0.0.1 -> link:/home/dustin/projects/groundswell

# If not linked, re-link:
cd ~/projects/groundswell && npm link
cd /home/dustin/projects/hacky-hack && npm link groundswell
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 5 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run build`
- [ ] No formatting issues: `npm run format:check`
- [ ] Groundswell linked: `npm ls groundswell` shows link

### Feature Validation

- [ ] Application runs via `npm run dev` without errors
- [ ] "PRP Pipeline initialized" message appears in output
- [ ] Workflow completes with 'completed' status
- [ ] Exit code 0 on success, 1 on error
- [ ] configureEnvironment() called before workflow creation
- [ ] @Step decorator logs step execution

### Code Quality Validation

- [ ] Follows existing codebase patterns (camelCase, PascalCase)
- [ ] File placement matches desired codebase tree
- [ ] JSDoc comments follow src/config/environment.ts pattern
- [ ] Error handling with try/catch and proper exit codes
- [ ] .js extensions used in imports (NodeNext requirement)

### Documentation & Deployment

- [ ] Code is self-documenting with clear class/method names
- [ ] JSDoc comments explain purpose and usage
- [ ] Logger messages are informative but not verbose
- [ ] No hardcoded values (all from environment or constants)

---

## Anti-Patterns to Avoid

- ❌ Don't create src/index.ts with async/await at top level without try/catch
- ❌ Don't forget to call configureEnvironment() before creating workflows
- ❌ Don't use .ts extensions in imports (NodeNext requires .js)
- ❌ Don't skip calling this.setStatus() in workflow.run()
- ❌ Don't throw errors without catching them in main()
- ❌ Don't use process.exit() without setting proper exit code
- ❌ Don't create tests without achieving 100% coverage (project requirement)
- ❌ Don't skip @Step decorator on workflow methods (breaks observability)
- ❌ Don't use console.log() instead of this.logger.info() in workflows
- ❌ Don't forget to link groundswell locally before running

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:

- Comprehensive Groundswell documentation provided with local examples
- Environment configuration pattern is already established
- Clear validation steps at each level
- All gotchas documented
- Only risk is if Groundswell link fails (covered in Task 1)

**Validation**: The completed implementation should enable an AI agent unfamiliar with the codebase to:

1. Link the local Groundswell package
2. Create a workflow class with proper @Step decorator usage
3. Create an entry point that handles errors and exit codes
4. Run tests achieving 100% coverage
5. Execute the application end-to-end successfully

---

## Additional Notes

### Scope Boundaries

This task is intentionally minimal:

- **IN SCOPE**: Basic workflow, entry point, error handling
- **OUT OF SCOPE**: Agent creation, PRP generation, task orchestration (these are future work items)

### Relationship to Future Work Items

This hello-world workflow establishes the pattern for:

- P1.M1.T3.\*: Build tooling validation
- P2.M1.T1: Agent Factory (will create agents within workflows)
- P3.M4.T1: Main PRP Pipeline Workflow (will extend this pattern)

### Testing Philosophy

The 100% coverage requirement ensures:

- All code paths are exercised
- Error conditions are tested
- Future refactoring is safe
- Documentation matches implementation

---

_PRP Version: 1.0_
_Created: 2026-01-12_
_For: Subtask P1.M1.T3.S2 - Create entry point and hello-world workflow_
