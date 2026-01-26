# PRP: Add Retry Configuration Options

---

## Goal

**Feature Goal**: Add CLI options for configuring task retry behavior, allowing users to customize max retry attempts, backoff delay, and enable/disable retry without modifying code.

**Deliverable**:
1. CLI options in `src/cli/index.ts`: `--task-retry <n>`, `--retry-backoff <ms>`, `--no-retry`
2. Updated `CLIArgs` and `ValidatedCLIArgs` interfaces with new properties
3. CLI option validation (range checking, type conversion)
4. Environment variable support (`HACKY_TASK_RETRY_MAX_ATTEMPTS`)
5. Integration in `src/index.ts` to pass retry config to PRPPipeline
6. PRPPipeline modifications to accept and store retry config
7. PRPPipeline passes retry config to TaskOrchestrator (which was modified in P3.M2.T1.S2)
8. Integration test in `tests/integration/retry-options.test.ts`

**Success Definition**:
- CLI options `--task-retry`, `--retry-backoff`, `--no-retry` are parsed and validated
- Environment variable `HACKY_TASK_RETRY_MAX_ATTEMPTS` is respected
- Retry configuration flows from CLI → PRPPipeline → TaskOrchestrator → TaskRetryManager
- Integration tests verify option parsing, validation, and integration
- Help text clearly documents defaults, ranges, and environment variables

## User Persona

**Target User**: DevOps engineer, developer running the PRP Pipeline who needs to customize retry behavior for their environment.

**Use Case**: A user experiencing frequent transient failures (e.g., unstable network, rate-limited API) wants to increase retry attempts or adjust backoff delay without modifying source code.

**User Journey**:
1. User runs pipeline with default retry settings (3 attempts, 1000ms base delay)
2. User experiences transient failures and wants to retry more aggressively
3. User runs: `npm run dev -- --task-retry 5 --retry-backoff 2000`
4. Pipeline respects the custom retry configuration
5. User can also set environment variable: `export HACKY_TASK_RETRY_MAX_ATTEMPTS=5`

**Pain Points Addressed**:
- **No runtime configuration**: Users previously had to modify code to change retry behavior
- **Environment variability**: Different environments (dev, staging, prod) may need different retry settings
- **Debugging**: Users may want to disable retry (`--no-retry`) for faster failure detection during debugging

## Why

- **Flexibility**: Different environments have different reliability characteristics (dev vs prod)
- **Operational control**: Operators can tune retry behavior without code changes
- **Debugging**: Fast-fail mode (`--no-retry`) helps identify issues quickly
- **Industry standard**: Popular CLI tools (AWS CLI, curl, npm) provide retry configuration options

## What

Add CLI options for retry configuration with the following behavior:

### Success Criteria

- [ ] `--task-retry <n>` option accepted (0-10, default: 3)
- [ ] `--retry-backoff <ms>` option accepted (100-60000, default: 1000)
- [ ] `--no-retry` flag accepted to disable retry
- [ ] Environment variable `HACKY_TASK_RETRY_MAX_ATTEMPTS` supported
- [ ] Range validation rejects invalid values (with clear error messages)
- [ ] Retry config flows through to TaskRetryManager
- [ ] Integration tests cover all options and edge cases
- [ ] Help text documents defaults, ranges, and environment variables

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:
- Complete CLI option patterns from existing codebase (`--parallelism`, `--research-concurrency`)
- Full integration flow from CLI → PRPPipeline → TaskOrchestrator
- TaskRetryConfig interface from P3.M2.T1.S2 PRP (CONTRACT)
- Integration test patterns from existing tests
- Industry best practices for naming and defaults
- Exact file locations and line numbers for modifications

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# CONTRACT: TaskRetryManager from P3.M2.T1.S2
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/PRP.md
  why: Defines TaskRetryConfig interface and TaskRetryManager integration contract
  section: Data Models and Structure (TaskRetryConfig interface), Implementation Tasks (Task 3: TaskOrchestrator Integration)
  critical:
    - TaskRetryConfig has: maxAttempts, baseDelay, maxDelay, backoffFactor, jitterFactor, enabled
    - TaskOrchestrator constructor accepts: retryConfig?: Partial<TaskRetryConfig>
    - TaskRetryManager uses DEFAULT_TASK_RETRY_CONFIG for fallback values

# Existing CLI Option Patterns (FOLLOW THIS PATTERN)
- file: src/cli/index.ts
  why: Complete pattern for CLI options, validation, and help text
  pattern:
    - Lines 192-210: Option definitions with .option(), .createOption()
    - Lines 57-105: CLIArgs interface (add taskRetry, retryBackoff, noRetry)
    - Lines 114-123: ValidatedCLIArgs interface (add validated types)
    - Lines 368-436: Validation pattern for numeric options (parseInt, range check, error logging)
  gotcha:
    - Commander returns string values, must parseInt() to convert to number
    - Use process.env.VAR ?? 'default' for environment variable fallback
    - Range validation before storing value

# Integration Flow: CLI to TaskOrchestrator
- file: src/index.ts
  why: Main entry point that passes CLI args to PRPPipeline
  pattern:
    - Lines 202-215: PRPPipeline instantiation with all CLI args
    - Add: args.taskRetry, args.retryBackoff, args.noRetry to PRPPipeline constructor call
  gotcha:
    - PRPPipeline is instantiated here, not TaskOrchestrator directly
    - TaskOrchestrator is created inside PRPPipeline.initializeSession()

# PRPPipeline: Stores and Passes Config to TaskOrchestrator
- file: src/workflows/prp-pipeline.ts
  why: Pipeline orchestrator that creates TaskOrchestrator
  pattern:
    - Lines 235-239: Private properties for config (add #taskRetry, #retryBackoff, #noRetry)
    - Lines 261-274: Constructor parameters (add taskRetry, retryBackoff, noRetry)
    - Lines 294-295: Store values (assign to private properties)
    - Lines 468-473: TaskOrchestrator instantiation (build retryConfig object, pass as 5th parameter)
  gotcha:
    - TaskOrchestrator is created in initializeSession() method, not constructor
    - Must build Partial<TaskRetryConfig> object from CLI options
    - Use undefined for unspecified values to allow TaskRetryManager defaults

# TaskOrchestrator: Receives Retry Config
- file: src/core/task-orchestrator.ts
  why: Target integration point for retry config (modified in P3.M2.T1.S2)
  pattern:
    - Lines 119-124: Constructor signature (will have retryConfig parameter from P3.M2.T1.S2)
    - Passes retryConfig to TaskRetryManager constructor
  gotcha:
    - This file is being modified in P3.M2.T1.S2 (parallel work item)
    - Assume retryConfig parameter exists and is passed correctly to TaskRetryManager

# Integration Test Patterns
- file: tests/integration/parallelism-option.test.ts
  why: Reference implementation for CLI option testing
  pattern:
    - beforeEach/afterEach for process.argv management
    - Mock logger for error message verification
    - Test groups: validation, defaults, environment variables, resource warnings
    - vi.hoisted() for mock definitions before vi.mock()
    - process.exit mocking for validation tests
  gotcha:
    - Must restore process.argv after each test
    - Use isCLIArgs() type guard before accessing properties

- file: tests/integration/research-concurrency-option.test.ts
  why: Shows environment variable testing pattern
  pattern:
    - process.env.VAR = 'value' before test
    - delete process.env.VAR after test
    - Test CLI option takes precedence over env var

# Research: CLI Integration Pattern
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S3/research/cli_integration_pattern.md
  why: Detailed step-by-step integration pattern
  section: Pattern for Adding Retry CLI Options, Key Gotchas

# Research: CLI Option Naming
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S3/research/cli_option_naming_research.md
  why: Industry best practices for naming, defaults, and help text
  section: Recommended Flag Names for Retry, Help Text Patterns, Default Values

# Research: Integration Test Patterns
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S3/research/integration_test_patterns.md
  why: Complete testing patterns and coverage checklist
  section: Mock Patterns, Test Structure Pattern, Coverage Checklist

# External Research: Industry Best Practices
- url: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-retries.html
  why: AWS CLI retry configuration reference (max-attempts, retry-mode)

- url: https://curl.se/docs/manpage.html
  why: curl retry options reference (--retry, --retry-delay)

- url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  why: Exponential backoff and jitter best practices (already implemented in TaskRetryManager)
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts               # CLI option definitions and validation
│   ├── workflows/
│   │   └── prp-pipeline.ts        # PRPPipeline (creates TaskOrchestrator)
│   ├── core/
│   │   ├── task-orchestrator.ts   # TaskOrchestrator (receives retry config)
│   │   ├── task-retry-manager.ts  # TaskRetryManager (uses retry config)
│   │   └── models.ts              # Type definitions
│   └── index.ts                   # Main entry point
├── tests/
│   └── integration/
│       ├── parallelism-option.test.ts      # Reference for numeric option tests
│       └── research-concurrency-option.test.ts  # Reference for env var tests
└── plan/
    └── 003_b3d3efdaf0ed/
        ├── P3M2T1S2/
        │   └── PRP.md             # CONTRACT: TaskRetryConfig interface
        └── P3M2T1S3/
            ├── PRP.md             # This file
            └── research/          # Research findings
```

### Desired Codebase Tree with Files to be Modified

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts               # MODIFY: Add --task-retry, --retry-backoff, --no-retry options
│   ├── workflows/
│   │   └── prp-pipeline.ts        # MODIFY: Add retry config parameters and pass to TaskOrchestrator
│   ├── core/
│   │   ├── task-orchestrator.ts   # CONTRACT: Accepts retryConfig from P3.M2.T1.S2
│   │   ├── task-retry-manager.ts  # CONTRACT: Uses TaskRetryConfig from P3.M2.T1.S2
│   │   └── models.ts              # (no change needed)
│   └── index.ts                   # MODIFY: Pass retry options to PRPPipeline
├── tests/
│   └── integration/
│       └── retry-options.test.ts  # NEW: Integration tests for retry CLI options
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M2T1S3/
            └── PRP.md             # This file
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// GOTCHA: Commander returns string values for options
// File: src/cli/index.ts
// Must parseInt() before using as number
const taskRetry = parseInt(String(options.taskRetry), 10);
if (isNaN(taskRetry)) {
  logger.error('--task-retry must be a valid integer');
  process.exit(1);
}

// GOTCHA: Environment variables should be used as fallback
// Pattern: process.env.VAR ?? 'default'
// But CLI option takes precedence over env var
.option(
  '--task-retry <n>',
  'Max retry attempts (0-10, default: 3, env: HACKY_TASK_RETRY_MAX_ATTEMPTS)',
  process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS ?? '3'  // Env var as fallback
)

// GOTCHA: PRPPipeline creates TaskOrchestrator in initializeSession(), not constructor
// File: src/workflows/prp-pipeline.ts, lines 468-473
// Must store retry config in private properties, then use when creating TaskOrchestrator

// GOTCHA: Use undefined for unspecified values to allow TaskRetryManager defaults
// Don't use default values in PRPPipeline, let TaskRetryManager apply them
const retryConfig: Partial<TaskRetryConfig> = {
  maxAttempts: this.#taskRetry,  // undefined if not specified (TaskRetryManager uses default)
  baseDelay: this.#retryBackoff, // undefined if not specified
  enabled: !this.#noRetry,       // Always specified (true or false)
};

// GOTCHA: TaskOrchestrator is being modified in P3.M2.T1.S2 (parallel work)
// Contract from P3.M2.T1.S2 PRP:
// - constructor accepts: retryConfig?: Partial<TaskRetryConfig>
// - Passes retryConfig to TaskRetryManager constructor
// Don't modify TaskOrchestrator directly, assume P3.M2.T1.S2 changes exist

// GOTCHA: Test environment variables must be cleaned up
// Use delete process.env.VAR after test to avoid interference
afterEach(() => {
  delete process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS;
  process.argv = originalArgv;
});

// GOTCHA: Type guard needed before accessing CLIArgs properties
// Use isCLIArgs() to narrow type
const args = parseCLIArgs();
if (isCLIArgs(args)) {
  expect(args.taskRetry).toBe(5);  // TypeScript knows this is CLIArgs
}

// GOTCHA: process.exit mocking pattern for validation tests
const mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;

expect(() => parseCLIArgs()).toThrow('process.exit(1)');
```

## Implementation Blueprint

### Data Models and Structure

**1. TaskRetryConfig Interface (CONTRACT from P3.M2.T1.S2)**

Already defined in P3.M2.T1.S2 PRP:

```typescript
interface TaskRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Base delay before first retry in milliseconds (default: 1000) */
  baseDelay: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay: number;

  /** Exponential backoff multiplier (default: 2) */
  backoffFactor: number;

  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitterFactor: number;

  /** Enable/disable retry globally (default: true) */
  enabled: boolean;
}
```

**2. CLIArgs Interface (Modify in src/cli/index.ts)**

```typescript
export interface CLIArgs {
  // ... existing properties ...

  /** Max retry attempts for transient errors (0-10) - may be string from commander */
  taskRetry?: number | string;

  /** Base delay before first retry in ms (100-60000) - may be string from commander */
  retryBackoff?: number | string;

  /** Disable automatic retry for all tasks */
  noRetry: boolean;
}
```

**3. ValidatedCLIArgs Interface (Modify in src/cli/index.ts)**

```typescript
export interface ValidatedCLIArgs extends Omit<
  CLIArgs,
  'taskRetry' | 'retryBackoff'  // Omit string versions
> {
  /** Max retry attempts for transient errors (0-10) - validated as number or undefined */
  taskRetry?: number;

  /** Base delay before first retry in ms (100-60000) - validated as number or undefined */
  retryBackoff?: number;

  /** Disable automatic retry for all tasks */
  noRetry: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
# DEPENDENCY ORDER: CLI Options → Main Entry → PRPPipeline → Tests

Task 1: MODIFY src/cli/index.ts - Add CLI Options and Validation
  IMPLEMENT: Add --task-retry, --retry-backoff, --no-retry options
  MODIFY:
    - Lines 57-105: Add taskRetry, retryBackoff, noRetry to CLIArgs interface
    - Lines 114-123: Add to ValidatedCLIArgs interface (omit string versions)
    - Lines 192-210: Add .option() calls for new options (after --research-concurrency)
    - Lines 335-366: Add validation after maxDuration validation
  FOLLOW pattern: --parallelism and --research-concurrency validation (lines 368-436)
  NAMING: camelCase for interface properties, kebab-case for CLI flags
  VALIDATION:
    - taskRetry: 0-10 range (0 = disable, 10 = max)
    - retryBackoff: 100-60000 range (100ms min, 60s max)
    - parseInt() for type conversion
    - Clear error messages on validation failure
  HELP TEXT:
    - Show range: (0-10, default: 3)
    - Show env var: env: HACKY_TASK_RETRY_MAX_ATTEMPTS
    - Clear description: "Max retry attempts for transient errors"
  ENVIRONMENT VARIABLES:
    - HACKY_TASK_RETRY_MAX_ATTEMPTS for taskRetry
    - No env var for retryBackoff (keep simple)
  PLACEMENT: src/cli/index.ts

Task 2: MODIFY src/index.ts - Pass Retry Options to PRPPipeline
  IMPLEMENT: Add retry options to PRPPipeline constructor call
  MODIFY:
    - Lines 202-215: Add args.taskRetry, args.retryBackoff, args.noRetry to constructor
  DEPENDENCIES: Task 1 (options must be defined in CLIArgs)
  FOLLOW pattern: Existing args passed to PRPPipeline (parallelism, researchConcurrency)
  GOTCHA: Use optional chaining for undefined values
  PLACEMENT: src/index.ts

Task 3: MODIFY src/workflows/prp-pipeline.ts - Store and Forward Retry Config
  IMPLEMENT: Accept, store, and pass retry config to TaskOrchestrator
  MODIFY:
    - Lines 235-239: Add private properties #taskRetry, #retryBackoff, #noRetry
    - Lines 261-274: Add constructor parameters taskRetry, retryBackoff, noRetry
    - Lines 294-295: Store values in constructor
    - Lines 468-473: Build retryConfig object and pass to TaskOrchestrator
  DEPENDENCIES: Task 2 (values passed from src/index.ts)
  PATTERN:
    private: readonly #taskRetry?: number;
    constructor parameter: taskRetry?: number
    store: this.#taskRetry = taskRetry;
    pass to TaskOrchestrator:
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
        retryConfig  // 5th parameter (from P3.M2.T1.S2 contract)
      );
  CONTRACT: TaskOrchestrator constructor accepts retryConfig from P3.M2.T1.S2
  PLACEMENT: src/workflows/prp-pipeline.ts

Task 4: CREATE tests/integration/retry-options.test.ts - Integration Tests
  IMPLEMENT: Comprehensive integration tests for retry options
  DEPENDENCIES: Task 1, 2, 3 (all modifications complete)
  TEST CASES:
    - Validation: accept valid values, reject out-of-range values, reject non-numeric
    - Defaults: use default when not specified
    - Environment variables: HACKY_TASK_RETRY_MAX_ATTEMPTS respected
    - CLI precedence: CLI option overrides env var
    - Boolean flag: --no-retry sets noRetry to true
    - Integration: works with other CLI options
  FOLLOW pattern: tests/integration/parallelism-option.test.ts
  MOCKING:
    - process.argv manipulation in beforeEach/afterEach
    - process.exit mocking for validation tests
    - Logger mocking for error message verification
    - OS module mocking if needed
  COVERAGE: All success criteria from "What" section
  PLACEMENT: tests/integration/retry-options.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: CLI Option Definition (src/cli/index.ts)
// ================================================================
// Location: After line 210 (after --research-concurrency option)

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

// ================================================================
// PATTERN 2: CLIArgs Interface (src/cli/index.ts)
// ================================================================
// Location: Lines 57-105 (add to existing interface)

export interface CLIArgs {
  // ... existing properties ...

  /** Max retry attempts for transient errors (0-10, default: 3) */
  taskRetry?: number | string;

  /** Base delay before first retry in ms (100-60000, default: 1000) */
  retryBackoff?: number | string;

  /** Disable automatic retry for all tasks */
  noRetry: boolean;
}

// ================================================================
// PATTERN 3: Validation Logic (src/cli/index.ts)
// ================================================================
// Location: After maxDuration validation (after line 366)

// Validate task-retry
if (options.taskRetry !== undefined) {
  const taskRetryStr = String(options.taskRetry);
  const taskRetry = parseInt(taskRetryStr, 10);

  if (isNaN(taskRetry) || taskRetry < 0 || taskRetry > 10) {
    logger.error('--task-retry must be an integer between 0 and 10');
    process.exit(1);
  }

  // Convert to number
  options.taskRetry = taskRetry;
}

// Validate retry-backoff
if (options.retryBackoff !== undefined) {
  const retryBackoffStr = String(options.retryBackoff);
  const retryBackoff = parseInt(retryBackoffStr, 10);

  if (isNaN(retryBackoff) || retryBackoff < 100 || retryBackoff > 60000) {
    logger.error('--retry-backoff must be an integer between 100 and 60000');
    process.exit(1);
  }

  // Convert to number
  options.retryBackoff = retryBackoff;
}

// ================================================================
// PATTERN 4: ValidatedCLIArgs Interface (src/cli/index.ts)
// ================================================================
// Location: Lines 114-123

export interface ValidatedCLIArgs extends Omit<
  CLIArgs,
  'parallelism' | 'researchConcurrency' | 'taskRetry' | 'retryBackoff'
> {
  parallelism: number;
  researchConcurrency: number;
  taskRetry?: number;      // Always number or undefined
  retryBackoff?: number;   // Always number or undefined
  noRetry: boolean;
}

// ================================================================
// PATTERN 5: Main Entry Point (src/index.ts)
// ================================================================
// Location: Lines 202-215 (PRPPipeline instantiation)

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
  args.parallelism,
  args.researchConcurrency,
  args.taskRetry,       // NEW
  args.retryBackoff,    // NEW
  args.noRetry          // NEW
);

// ================================================================
// PATTERN 6: PRPPipeline Private Properties (src/workflows/prp-pipeline.ts)
// ================================================================
// Location: Lines 235-239

/** Parallelism limit for concurrent subtask execution */
readonly #parallelism: number = 2;

/** Research queue concurrency limit for parallel PRP generation */
readonly #researchQueueConcurrency: number = 3;

/** Max retry attempts for tasks (from CLI) */
readonly #taskRetry?: number;

/** Base delay before first retry in ms (from CLI) */
readonly #retryBackoff?: number;

/** Disable automatic retry for all tasks (from CLI) */
readonly #noRetry: boolean = false;

// ================================================================
// PATTERN 7: PRPPipeline Constructor (src/workflows/prp-pipeline.ts)
// ================================================================
// Location: Lines 261-274

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
  researchQueueConcurrency: number = 3,
  taskRetry?: number,      // NEW
  retryBackoff?: number,   // NEW
  noRetry: boolean = false // NEW
) {
  // ... existing constructor code ...

  // Store retry config
  this.#taskRetry = taskRetry;
  this.#retryBackoff = retryBackoff;
  this.#noRetry = noRetry;
}

// ================================================================
// PATTERN 8: Pass to TaskOrchestrator (src/workflows/prp-pipeline.ts)
// ================================================================
// Location: Lines 468-473 (initializeSession method)

// Build retry config from CLI options
// Use undefined for unspecified values to allow TaskRetryManager defaults
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
  retryConfig  // NEW: 5th parameter (from P3.M2.T1.S2 contract)
);

// ================================================================
// PATTERN 9: Integration Test Structure (tests/integration/retry-options.test.ts)
// ================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCLIArgs, isCLIArgs } from '../../src/cli/index.js';

describe('CLI Retry Options', () => {
  let originalArgv: string[];
  const { mockLogger } = vi.hoisted(() => ({
    mockLogger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }));

  beforeEach(() => {
    originalArgv = process.argv;
    vi.mock('../../src/utils/logger.js', () => ({
      getLogger: () => mockLogger,
    }));
  });

  afterEach(() => {
    process.argv = originalArgv;
    delete process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS;
    vi.restoreAllMocks();
  });

  describe('--task-retry', () => {
    it('should accept valid task-retry value', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '5'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(5);
      }
    });

    it('should use default value of 3 when not specified', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(3);
      }
    });

    it('should accept 0 to disable retry', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '0'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(0);
      }
    });

    it('should reject task-retry of -1 (below minimum)', () => {
      const mockExit = vi.fn((code: number) => {
        throw new Error(`process.exit(${code})`);
      });
      process.exit = mockExit as any;

      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '-1'];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '--task-retry must be an integer between 0 and 10'
      );
    });

    it('should reject task-retry of 11 (above maximum)', () => {
      const mockExit = vi.fn((code: number) => {
        throw new Error(`process.exit(${code})`);
      });
      process.exit = mockExit as any;

      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '11'];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });

    it('should reject non-numeric task-retry', () => {
      const mockExit = vi.fn((code: number) => {
        throw new Error(`process.exit(${code})`);
      });
      process.exit = mockExit as any;

      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', 'abc'];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });

    it('should use HACKY_TASK_RETRY_MAX_ATTEMPTS environment variable', () => {
      process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS = '7';
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];

      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(7);
      }
    });

    it('should prefer CLI option over environment variable', () => {
      process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS = '7';
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--task-retry', '5'];

      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(5);  // CLI wins
      }
    });
  });

  describe('--retry-backoff', () => {
    it('should accept valid retry-backoff value', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--retry-backoff', '2000'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.retryBackoff).toBe(2000);
      }
    });

    it('should use default value of 1000 when not specified', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.retryBackoff).toBe(1000);
      }
    });

    it('should reject retry-backoff of 99 (below minimum)', () => {
      const mockExit = vi.fn((code: number) => {
        throw new Error(`process.exit(${code})`);
      });
      process.exit = mockExit as any;

      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--retry-backoff', '99'];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '--retry-backoff must be an integer between 100 and 60000'
      );
    });

    it('should reject retry-backoff of 60001 (above maximum)', () => {
      const mockExit = vi.fn((code: number) => {
        throw new Error(`process.exit(${code})`);
      });
      process.exit = mockExit as any;

      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--retry-backoff', '60001'];
      expect(() => parseCLIArgs()).toThrow('process.exit(1)');
    });
  });

  describe('--no-retry', () => {
    it('should set noRetry to true when flag is present', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--no-retry'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.noRetry).toBe(true);
      }
    });

    it('should default noRetry to false when flag not present', () => {
      process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.noRetry).toBe(false);
      }
    });
  });

  describe('integration', () => {
    it('should work correctly with other CLI options', () => {
      process.argv = [
        'node', 'cli.js',
        '--prd', 'PRD.md',
        '--task-retry', '5',
        '--retry-backoff', '2000',
        '--parallelism', '3',
        '--research-concurrency', '5'
      ];

      const args = parseCLIArgs();

      if (isCLIArgs(args)) {
        expect(args.taskRetry).toBe(5);
        expect(args.retryBackoff).toBe(2000);
        expect(args.parallelism).toBe(3);
        expect(args.researchConcurrency).toBe(5);
      }
    });
  });
});
```

### Integration Points

```yaml
CLI PARSER:
  - modify: src/cli/index.ts
  - add options: .option() calls for --task-retry, --retry-backoff, --no-retry
  - add interfaces: CLIArgs and ValidatedCLIArgs properties
  - add validation: parseInt(), range checking, error messages
  - pattern: Follow existing --parallelism, --research-concurrency patterns

MAIN ENTRY POINT:
  - modify: src/index.ts
  - add parameters: args.taskRetry, args.retryBackoff, args.noRetry
  - pass to: PRPPipeline constructor
  - pattern: Add after args.researchConcurrency (line 213)

PIPELINE ORCHESTRATOR:
  - modify: src/workflows/prp-pipeline.ts
  - add properties: #taskRetry, #retryBackoff, #noRetry (lines 235-239)
  - add constructor parameters: taskRetry, retryBackoff, noRetry (lines 261-274)
  - store values: Assign to private properties (lines 294-295)
  - pass to TaskOrchestrator: Build retryConfig object, pass as 5th parameter (lines 468-473)
  - pattern: Follow existing parallelism, researchConcurrency patterns

TASK ORCHESTRATOR:
  - uses: src/core/task-orchestrator.ts (modified in P3.M2.T1.S2)
  - contract: Accepts retryConfig?: Partial<TaskRetryConfig> as 5th parameter
  - passes: retryConfig to TaskRetryManager constructor
  - gotcha: Don't modify directly - assume P3.M2.T1.S2 changes exist

TASK RETRY MANAGER:
  - uses: src/core/task-retry-manager.ts (created in P3.M2.T1.S2)
  - receives: Partial<TaskRetryConfig> from TaskOrchestrator
  - applies: DEFAULT_TASK_RETRY_CONFIG fallback for undefined values
  - gotcha: Don't modify - assume P3.M2.T1.S2 implementation exists

TESTS:
  - create: tests/integration/retry-options.test.ts
  - framework: vitest (existing)
  - patterns: Follow parallelism-option.test.ts, research-concurrency-option.test.ts
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type checking with TypeScript
npx tsc --noEmit src/cli/index.ts
npx tsc --noEmit src/index.ts
npx tsc --noEmit src/workflows/prp-pipeline.ts

# Expected: Zero type errors. If errors exist, READ output and fix before proceeding.

# Note: TaskOrchestrator and TaskRetryManager type errors may occur if P3.M2.T1.S2 is not complete
# These are expected and will be resolved when P3.M2.T1.S2 is finished
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run integration tests for retry options
vitest run tests/integration/retry-options.test.ts

# Run all integration tests to ensure no regressions
vitest run tests/integration/

# Expected: All tests pass. If failing, debug root cause and fix implementation.

# Common test failures and fixes:
# - "taskRetry is not a number" -> Check parseInt() conversion in validation
# - "Property 'taskRetry' does not exist" -> Add to CLIArgs interface
# - "Type 'string' is not assignable to type 'number'" -> Check ValidatedCLIArgs interface (should omit string versions)
```

### Level 3: Integration Testing (System Validation)

```bash
# Test 1: Verify CLI options are parsed correctly
node src/index.js --prd PRD.md --task-retry 5 --retry-backoff 2000 --dry-run

# Expected: No errors, options parsed successfully

# Test 2: Verify environment variable works
export HACKY_TASK_RETRY_MAX_ATTEMPTS=7
node src/index.js --prd PRD.md --dry-run
unset HACKY_TASK_RETRY_MAX_ATTEMPTS

# Expected: Uses 7 for taskRetry

# Test 3: Verify validation works
node src/index.js --prd PRD.md --task-retry 11 --dry-run

# Expected: Error message "--task-retry must be an integer between 0 and 10"

# Test 4: Verify help text
node src/index.js --help | grep -A 1 "task-retry"

# Expected: Shows help text with defaults and env var

# Test 5: Verify retry config flows through (when P3.M2.T1.S2 is complete)
# Add temporary logging in PRPPipeline to verify:
# console.log('Retry config:', retryConfig);
# node src/index.js --prd PRD.md --task-retry 5 --dry-run
# Expected: Logs { maxAttempts: 5, enabled: true }
```

### Level 4: Manual Validation

```bash
# Test with actual pipeline (if P3.M2.T1.S2 is complete)

# 1. Test default retry behavior
npm run dev -- --prd PRD.md

# Expected: Uses default retry (3 attempts, 1000ms base delay)

# 2. Test custom retry attempts
npm run dev -- --prd PRD.md --task-retry 5

# Expected: Uses 5 retry attempts

# 3. Test custom backoff delay
npm run dev -- --prd PRD.md --retry-backoff 2000

# Expected: Uses 2000ms base delay (2s -> 4s -> 8s backoff)

# 4. Test disable retry
npm run dev -- --prd PRD.md --no-retry

# Expected: No retry, tasks fail immediately on error

# 5. Test environment variable
export HACKY_TASK_RETRY_MAX_ATTEMPTS=7
npm run dev -- --prd PRD.md
unset HACKY_TASK_RETRY_MAX_ATTEMPTS

# Expected: Uses 7 retry attempts

# 6. Monitor logs for retry configuration
# Expected logs (if verbose):
# [TaskRetryManager] Using retry config: maxAttempts=5, baseDelay=2000, enabled=true
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] CLI options defined in src/cli/index.ts (--task-retry, --retry-backoff, --no-retry)
- [ ] CLIArgs and ValidatedCLIArgs interfaces updated
- [ ] Validation logic implemented (range checking, type conversion)
- [ ] src/index.ts passes retry options to PRPPipeline
- [ ] PRPPipeline accepts and stores retry config
- [ ] PRPPipeline passes retry config to TaskOrchestrator
- [ ] All integration tests pass: `vitest run tests/integration/retry-options.test.ts`
- [ ] No type errors in modified files: `npx tsc --noEmit`

### Feature Validation

- [ ] `--task-retry <n>` accepts values 0-10
- [ ] `--retry-backoff <ms>` accepts values 100-60000
- [ ] `--no-retry` flag disables retry
- [ ] Environment variable `HACKY_TASK_RETRY_MAX_ATTEMPTS` works
- [ ] CLI option takes precedence over environment variable
- [ ] Validation rejects invalid values with clear error messages
- [ ] Help text shows defaults, ranges, and environment variables
- [ ] Works correctly with other CLI options (parallelism, research-concurrency)

### Code Quality Validation

- [ ] Follows existing CLI option patterns (parallelism, research-concurrency)
- [ ] File placement matches desired codebase tree structure
- [ ] Naming conventions consistent (camelCase properties, kebab-case flags)
- [ ] Anti-patterns avoided (see below)
- [ ] Dependencies properly imported
- [ ] Code is self-documenting with clear variable names

### Documentation & Deployment

- [ ] Help text is clear and informative
- [ ] Error messages are actionable
- [ ] Environment variable documented in help text
- [ ] No breaking changes to existing functionality

---

## Anti-Patterns to Avoid

- **Don't** hardcode retry defaults in PRPPipeline - let TaskRetryManager apply them
- **Don't** use `0` as default for numeric options - use `undefined` to allow TaskRetryManager defaults
- **Don't** forget to `parseInt()` Commander string values before using as numbers
- **Don't** modify TaskOrchestrator or TaskRetryManager directly - they're being modified in P3.M2.T1.S2
- **Don't** add environment variables for all options - only for high-value config (maxAttempts)
- **Don't** use `--disable-retry` - use `--no-retry` (Commander negation pattern)
- **Don't** skip validation - always check range before using values
- **Don't** forget to clean up environment variables in tests - use `delete process.env.VAR`
- **Don't** use type assertions - use proper interfaces and type guards
- **Don't** assume P3.M2.T1.S2 is complete - use `Partial<TaskRetryConfig>` and undefined for flexibility
- **Don't** create a separate config object for retry - use TaskRetryConfig from P3.M2.T1.S2

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:
- Complete integration flow documented (CLI → PRPPipeline → TaskOrchestrator)
- Existing patterns to follow (parallelism, research-concurrency)
- Contract from P3.M2.T1.S2 PRP clearly defines TaskRetryConfig interface
- Integration test patterns well-established in codebase
- Industry best practices researched and documented
- All file locations and line numbers specified

**Risk Areas**:
- Dependency on P3.M2.T1.S2 completion (TaskOrchestrator must accept retryConfig)
- Integration testing may reveal issues with option passing through layers
- Environment variable cleanup in tests may be overlooked

**Mitigation**:
- Use `undefined` for unspecified values to gracefully handle missing P3.M2.T1.S2 changes
- Step-by-step validation ensures each layer works before proceeding
- Test patterns prevent environment variable leakage between tests
- Clear contract in PRP enables parallel development

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Related Documents**:
- Design Document: plan/003_b3d3efdaf0ed/docs/retry-strategy-design.md
- Previous PRP: plan/003_b3d3efdaf0ed/P3M2T1S2/PRP.md (Task Retry Mechanism)
- Next PRP: plan/003_b3d3efdaf0ed/P3M2T1S3/PRP.md (This file)
