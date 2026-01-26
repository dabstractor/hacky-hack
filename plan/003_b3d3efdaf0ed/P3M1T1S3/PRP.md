# Product Requirement Prompt (PRP): Add Parallelism CLI Option and Validation

> Add `--parallelism <n>` CLI option to control concurrent subtask execution with range validation (1-10), conservative default (2), system resource warnings, and integration with ConcurrentTaskExecutor

**Status**: Ready for Implementation
**Last Updated**: 2026-01-24
**Work Item**: P3.M1.T1.S3 - Add parallelism CLI option and validation

---

## Goal

**Feature Goal**: Add `--parallelism <n>` CLI option that allows users to control the maximum number of concurrent subtask executions, with integer range validation (1-10), conservative default value of 2, system resource warnings when value exceeds available CPU/memory, and proper integration with the ConcurrentTaskExecutor from P3.M1.T1.S2.

**Deliverable**:
1. CLI option `--parallelism <n>` in `src/cli/index.ts` with validation
2. System resource detection and warning logic using `os.cpus()` and `os.freemem()`
3. Option propagation: CLI → main.ts → PRPPipeline → TaskOrchestrator
4. Integration test at `tests/integration/parallelism-option.test.ts`

**Success Definition**:
- `--parallelism` option accepts integers 1-10 (inclusive)
- Default value is 2 (conservative)
- Values outside range produce clear error messages
- System resource warnings display when parallelism exceeds CPU cores
- Option is properly passed through the execution chain
- All integration tests pass

## User Persona

**Target User**: Developer using the PRP Pipeline who wants to control parallelism for performance tuning

**Use Case**: User wants to:
- Increase parallelism on powerful machines (e.g., `--parallelism 8`)
- Decrease parallelism on resource-constrained systems
- Use conservative default on unknown systems
- Get warnings when settings exceed system capacity

**User Journey**:
1. User runs `prp-pipeline --parallelism 5`
2. CLI parses and validates the option (1-10 range check)
3. System checks CPU cores and displays warning if needed
4. Value is passed to PRPPipeline and TaskOrchestrator
5. ConcurrentTaskExecutor respects the parallelism limit
6. Subtasks execute with proper concurrency control

**Pain Points Addressed**:
- "How do I control parallelism?" - New `--parallelism` option
- "What's a safe value?" - Conservative default of 2
- "Will this overload my system?" - Resource warnings for CPU/memory
- "Why is it slow/fast?" - Explicit parallelism control

## Why

- **Performance Control**: Different systems have different capabilities - users need to tune parallelism
- **Resource Safety**: High parallelism on small systems causes thrashing/resource exhaustion
- **User Agency**: Advanced users want control over execution behavior
- **Completes P3.M1.T1**: P3.M1.T1.S1 designed it, P3.M1.T1.S2 implemented it, P3.M1.T1.S3 exposes it via CLI
- **Conservative Default**: Default of 2 is safe for most systems (prevents overload)
- **System Awareness**: Warnings guide users toward appropriate values

## What

Add `--parallelism <n>` CLI option with:

### Success Criteria

- [ ] `--parallelism <n>` option added to `src/cli/index.ts`
- [ ] Accepts integer values from 1 to 10 (inclusive)
- [ ] Default value is 2
- [ ] Clear error message for values outside range (uses `process.exit(1)`)
- [ ] System resource warning when value exceeds CPU cores (non-blocking)
- [ ] `parallelism` field added to `CLIArgs` interface
- [ ] Option passed from CLI → main.ts → PRPPipeline → TaskOrchestrator
- [ ] Integration test at `tests/integration/parallelism-option.test.ts`
- [ ] All tests pass: `npm run test:run tests/integration/parallelism-option.test.ts`
- [ ] TypeScript compilation passes: `npm run typecheck`

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to implement this successfully?_

**Yes** - This PRP provides:
- Exact file locations and line numbers for all modifications
- Complete code patterns for CLI option definition and validation
- System resource detection code using Node.js `os` module
- Integration test patterns and fixture functions
- Option propagation flow through the execution chain
- Validation commands for verification

### Documentation & References

```yaml
# MUST READ - CLI Option Definition Pattern
- file: /home/dustin/projects/hacky-hack/src/cli/index.ts
  why: Reference for adding new CLI option following existing patterns
  pattern: Commander.js .option() with validation
  lines: 145-175 (option definitions), 293-307 (validation pattern)
  critical:
    - Line 145: .option('--prd <path>', 'Path to PRD markdown file', './PRD.md')
    - Line 167: .option('--max-tasks <number>', 'Maximum number of tasks to execute')
    - Line 294-299: Number.isInteger() validation pattern
    - Line 56-95: CLIArgs interface definition

# MUST READ - ConcurrentTaskExecutor Integration
- file: /home/dustin/projects/hacky-hack/src/core/concurrent-executor.ts
  why: Target of parallelism option - understand ParallelismConfig interface
  pattern: ParallelismConfig with maxConcurrency field
  lines: 41-53 (ParallelismConfig interface)
  critical:
    - Line 41-53: ParallelismConfig interface definition
    - Line 46: maxConcurrency: number field

# MUST READ - TaskOrchestrator executeParallel()
- file: /home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts
  why: Where parallelism config is passed to ConcurrentTaskExecutor
  pattern: executeParallel(config: ParallelismConfig) method
  lines: 879-903 (executeParallel method)
  critical:
    - Line 879: public async executeParallel(config: ParallelismConfig)
    - Line 899: new ConcurrentTaskExecutor(this, config)

# MUST READ - PRPPipeline Constructor
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Where CLI options are received and stored
  pattern: Constructor parameters stored as private fields
  lines: 250-303 (constructor)
  critical:
    - Line 250-260: Constructor parameter list
    - Line 275: this.#maxTasks = maxTasks (store pattern)

# MUST READ - Option Propagation Pattern
- file: /home/dustin/projects/hacky-hack/src/index.ts
  why: How CLI args are passed to PRPPipeline
  pattern: new PRPPipeline(args.prd, ..., args.maxTasks, ...)
  lines: 198-212 (pipeline instantiation)
  critical:
    - Line 198-212: All CLI options passed to PRPPipeline constructor

# MUST READ - Integration Test Pattern
- file: /home/dustin/projects/hacky-hack/tests/integration/prd-task-command.test.ts
  why: Reference for integration test structure and mocking
  pattern: beforeEach/afterEach, mock setup, process.argv mocking
  lines: 265-325 (describe block setup), 152-231 (fixture functions)
  critical:
    - Line 271-305: beforeEach/afterEach pattern
    - Line 152-165: createTestSubtask() factory function
    - Line 283-286: process.exit mock pattern

# DOCFILE - Design Document
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/parallel-execution-design.md
  why: Complete design specification for parallel execution
  section: "Default Values" (lines 867-874)
  critical:
    - Lines 867-874: Default value recommendations (conservative 2-3)

# DOCFILE - Testing Patterns
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/docs/testing-concurrent-operations-vitest-typescript.md
  why: Testing patterns for concurrent operations
  section: "Testing CLI Options" (custom for this PRP)

# DOCFILE - Research Notes
- docfile: /home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/P3M1T1S3/research/
  why: Complete research for this implementation
  critical:
    - cli-option-patterns-research.md: Existing CLI patterns in codebase
    - commander-js-research.md: Commander.js numeric option patterns
    - system-resource-detection-research.md: Node.js os module usage
    - integration-test-patterns-research.md: Test patterns to follow
    - phase3-context-research.md: Phase 3 architecture context
    - QUICK_REFERENCE.md: Quick reference for implementation

# EXTERNAL - Commander.js Documentation
- url: https://tj.github.io/commander.js/#/options
  why: Official Commander.js options API documentation
  critical: .option() syntax, custom validation functions

# EXTERNAL - Node.js OS Module
- url: https://nodejs.org/api/os.html
  why: CPU and memory detection for resource warnings
  critical: os.cpus(), os.totalmem(), os.freemem()
```

### Current Codebase Tree (Relevant Files)

```bash
src/
├── cli/
│   └── index.ts                  # ADD: --parallelism option, CLIArgs field, validation
├── core/
│   ├── task-orchestrator.ts      # REFERENCE: executeParallel() method
│   └── concurrent-executor.ts    # REFERENCE: ParallelismConfig interface
├── workflows/
│   └── prp-pipeline.ts           # MODIFY: Add parallelism parameter, field, pass to executor
└── index.ts                      # MODIFY: Pass parallelism to PRPPipeline

tests/
└── integration/
    └── parallelism-option.test.ts  # CREATE: Integration tests for CLI option

plan/003_b3d3efdaf0ed/
├── P3M1T1S3/
│   ├── PRP.md                    # This file
│   └── research/
│       ├── cli-option-patterns-research.md
│       ├── commander-js-research.md
│       ├── system-resource-detection-research.md
│       ├── integration-test-patterns-research.md
│       ├── phase3-context-research.md
│       └── QUICK_REFERENCE.md
└── docs/
    └── parallel-execution-design.md
```

### Desired Codebase Tree (Changes)

```bash
src/cli/index.ts
├── [ADD] parallelism: number to CLIArgs interface (line ~94)
├── [ADD] .option('--parallelism <n>', ...) (line ~168)
└── [ADD] Validation logic with resource warnings (line ~307)

src/index.ts
└── [MODIFY] Pass args.parallelism to PRPPipeline (line ~198-212)

src/workflows/prp-pipeline.ts
├── [ADD] readonly #parallelism: number = 2; (line ~230)
├── [MODIFY] Add parallelism parameter to constructor (line ~259)
└── [MODIFY] Use this.#parallelism in executeParallel() call

tests/integration/parallelism-option.test.ts
└── [CREATE] Complete integration test suite
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use parseInt() with radix 10 for numeric parsing
// Pattern from existing maxTasks validation (line 295)
const num = parseInt(value, 10);
if (isNaN(num) || num < 1 || num > 10) {
  logger.error('--parallelism must be an integer between 1 and 10');
  process.exit(1);
}

// CRITICAL: Existing options use default values via Commander.js third parameter
// Pattern from line 145: .option('--prd <path>', 'description', './PRD.md')
.option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')

// GOTCHA: CLI options are strings from Commander.js - must parse to int
// The validator function receives string, must return number
(value: string): number => {
  const num = parseInt(value, 10);
  // ... validation
  return num;
}

// PATTERN: Error logging uses logger.error() then process.exit(1)
// From line 296-297:
logger.error('--max-tasks must be a positive integer');
process.exit(1);

// CRITICAL: os.cpus() returns array of CPU info - use .length for core count
import * as os from 'node:os';
const cpuCores = os.cpus().length;

// GOTCHA: File handle monitoring on macOS is slow - skip for CLI validation
// Use CPU cores and memory only for warnings

// PATTERN: Resource warnings use logger.warn() (non-blocking)
// Don't throw or exit for warnings - just inform user
logger.warn(`⚠️  Parallelism (${num}) exceeds CPU cores (${cpuCores})`);
logger.warn(`   Recommended: --parallelism ${cpuCores - 1}`);

// CRITICAL: ParallelismConfig interface uses 'maxConcurrency' field
// From concurrent-executor.ts line 46:
// maxConcurrency: number

// PATTERN: PRPPipeline stores options as private readonly fields
// From prp-pipeline.ts line 275:
// this.#maxTasks = maxTasks;

// GOTCHA: TaskOrchestrator.executeParallel() takes full ParallelismConfig
// Must construct object with all required fields:
await this.#taskOrchestrator.executeParallel({
  enabled: true,
  maxConcurrency: this.#parallelism,
  prpGenerationLimit: 3,  // Fixed value
  resourceThreshold: 0.8  // Fixed value
});

// TESTING PATTERN: Mock process.exit to capture exit calls
const mockExit = vi.fn((code: number) => {
  throw new Error(`process.exit(${code})`);
});
process.exit = mockExit as any;

// TESTING PATTERN: Restore originals in afterEach
process.argv = originalArgv;
process.exit = originalExit;

// GOTCHA: Commander.js parses options before action() is called
// Validation happens in parseCLIArgs() after program.parse()
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - use existing:

```typescript
// Existing CLIArgs interface (src/cli/index.ts lines 56-95)
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
  parallelism: number;  // NEW - Add this field
}

// Existing ParallelismConfig interface (src/core/concurrent-executor.ts lines 41-53)
export interface ParallelismConfig {
  enabled: boolean;
  maxConcurrency: number;  // This receives the parallelism value
  prpGenerationLimit: number;
  resourceThreshold: number;
}
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: MODIFY src/cli/index.ts - Add parallelism to CLIArgs interface
  - ADD: parallelism: number field to CLIArgs interface
  - LOCATION: After line 94 (after progressMode field)
  - PATTERN: Follow existing field documentation style
  - IMPLEMENT:
    ```
    /** Max concurrent subtasks (1-10) */
    parallelism: number;
    ```

Task 2: MODIFY src/cli/index.ts - Add --parallelism CLI option
  - ADD: .option() call for --parallelism
  - LOCATION: After line 168 (after --max-duration option)
  - PATTERN: Follow existing numeric option pattern from line 167
  - IMPLEMENT:
    ```
    .option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')
    ```
  - GOTCHA: Third parameter '2' sets default value

Task 3: MODIFY src/cli/index.ts - Add validation logic
  - ADD: Validation and resource warning code
  - LOCATION: After line 307 (after maxDuration validation)
  - PATTERN: Follow maxTasks validation from lines 294-299
  - IMPLEMENT:
    ```
    // Validate parallelism
    const parallelismStr = options.parallelism;
    const parallelism = parseInt(parallelismStr, 10);

    if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
      logger.error('--parallelism must be an integer between 1 and 10');
      process.exit(1);
    }

    // System resource warnings
    const cpuCores = os.cpus().length;
    if (parallelism > cpuCores) {
      logger.warn(`⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${cpuCores})`);
      logger.warn(`   This may cause context switching overhead.`);
      logger.warn(`   Recommended: --parallelism ${cpuCores - 1}`);
    }

    // Store validated value
    options.parallelism = parallelism;
    ```
  - CRITICAL: Import os module at top of file
  - CRITICAL: Use parseInt() with radix 10

Task 4: MODIFY src/cli/index.ts - Add os module import
  - ADD: import * as os from 'node:os';
  - LOCATION: Top of file, with other imports (around line 31)
  - IMPLEMENT:
    ```
    import * as os from 'node:os';
    ```

Task 5: MODIFY src/index.ts - Pass parallelism to PRPPipeline
  - ADD: args.parallelism parameter to PRPPipeline constructor
  - LOCATION: Lines 198-212 (PRPPipeline instantiation)
  - CURRENT CODE:
    ```
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
  - MODIFY TO:
    ```
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
      args.parallelism
    );
    ```

Task 6: MODIFY src/workflows/prp-pipeline.ts - Add parallelism field
  - ADD: Private readonly field for parallelism
  - LOCATION: Around line 230 (with other private fields)
  - PATTERN: Follow existing field style from line 275
  - IMPLEMENT:
    ```
    /** Parallelism limit for concurrent subtask execution */
    readonly #parallelism: number = 2;
    ```

Task 7: MODIFY src/workflows/prp-pipeline.ts - Add constructor parameter
  - ADD: parallelism parameter to constructor
  - LOCATION: Line 259 (after progressMode parameter)
  - CURRENT:
    ```
    progressMode: 'auto' | 'always' | 'never' = 'auto'
    ```
  - MODIFY TO:
    ```
    progressMode: 'auto' | 'always' | 'never' = 'auto',
    parallelism: number = 2
    ```
  - ASSIGN: Add line after line 278: `this.#parallelism = parallelism;`

Task 8: MODIFY src/workflows/prp-pipeline.ts - Pass to executeParallel()
  - FIND: Location where executeParallel() is called
  - MODIFY: Use this.#parallelism for maxConcurrency
  - PATTERN:
    ```
    await this.#taskOrchestrator.executeParallel({
      enabled: true,
      maxConcurrency: this.#parallelism,
      prpGenerationLimit: 3,
      resourceThreshold: 0.8
    });
    ```
  - GOTCHA: Must provide all ParallelismConfig fields

Task 9: CREATE tests/integration/parallelism-option.test.ts
  - CREATE: Complete integration test file
  - IMPLEMENT: Test cases for default, custom values, validation, warnings
  - FOLLOW: Pattern from tests/integration/prd-task-command.test.ts
  - MOCK: node:os module for CPU detection tests
  - MOCK: process.exit for validation error tests
  - MOCK: console.warn for warning verification tests
  - COVERAGE: Default value, min/max, invalid input, resource warnings
  - SEE: Implementation Patterns section for complete test code

Task 10: VALIDATE implementation
  - VERIFY: TypeScript compilation (npm run typecheck)
  - VERIFY: Linting (npm run lint)
  - VERIFY: Integration tests pass (npm run test:run tests/integration/parallelism-option.test.ts)
  - VERIFY: All tests pass (npm run test:run)
  - VERIFY: Manual testing with --parallelism flag
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PARALLELISM CLI OPTION IMPLEMENTATION PATTERNS
// ============================================================================

// PATTERN 1: CLIArgs Interface Addition (src/cli/index.ts)
export interface CLIArgs {
  // ... existing fields
  /** Maximum execution duration in milliseconds (optional) */
  maxDuration?: number;

  /** Progress display mode (auto/always/never) */
  progressMode?: 'auto' | 'always' | 'never';

  /** Max concurrent subtasks (1-10, default: 2) */
  parallelism: number;  // NEW FIELD
}

// PATTERN 2: CLI Option Definition (src/cli/index.ts)
// Location: After line 168 (after --max-duration)
program
  .option('--max-duration <ms>', 'Maximum execution duration in milliseconds')
  .option('--parallelism <n>', 'Max concurrent subtasks (1-10, default: 2)', '2')
  // '2' as third parameter sets the default value

// PATTERN 3: Validation with Resource Warnings (src/cli/index.ts)
// Location: After line 307 (after maxDuration validation)
import * as os from 'node:os';  // Add to imports at top

// In parseCLIArgs() function, after program.parse():
const parallelismStr = options.parallelism as string;
const parallelism = parseInt(parallelismStr, 10);

// Range validation
if (isNaN(parallelism) || parallelism < 1 || parallelism > 10) {
  logger.error('--parallelism must be an integer between 1 and 10');
  process.exit(1);
}

// System resource warnings (non-blocking)
const cpuCores = os.cpus().length;
if (parallelism > cpuCores) {
  logger.warn(`⚠️  Warning: Parallelism (${parallelism}) exceeds CPU cores (${cpuCores})`);
  logger.warn(`   This may cause context switching overhead.`);
  logger.warn(`   Recommended: --parallelism ${Math.max(1, cpuCores - 1)}`);
}

// Memory warning (optional but recommended)
const freeMemoryGB = os.freemem() / (1024 ** 3);
const estimatedMemoryGB = parallelism * 0.5;  // Assume 500MB per worker
if (estimatedMemoryGB > freeMemoryGB * 0.8) {
  logger.warn(`⚠️  Warning: High parallelism may exhaust free memory (${freeMemoryGB.toFixed(1)}GB available)`);
}

// Store validated number value
(options as any).parallelism = parallelism;

// PATTERN 4: Pass to PRPPipeline (src/index.ts)
// Lines 198-212
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
  args.parallelism  // NEW: Pass parallelism value
);

// PATTERN 5: PRPPipeline Constructor (src/workflows/prp-pipeline.ts)
// Lines 250-260
constructor(
  prdPath: string,
  scope?: Scope,
  mode?: 'normal' | 'bug-hunt' | 'validate',
  noCache: boolean = false,
  continueOnError: boolean = false,
  maxTasks?: number,
  maxDuration?: number,
  planDir?: string,
  progressMode: 'auto' | 'always' | 'never' = 'auto',
  parallelism: number = 2  // NEW: Add parameter with default
) {
  // ...
  this.#parallelism = parallelism;  // NEW: Store as field
}

// PATTERN 6: PRPPipeline Private Field (src/workflows/prp-pipeline.ts)
// Around line 230
readonly #parallelism: number = 2;

// PATTERN 7: Pass to TaskOrchestrator (src/workflows/prp-pipeline.ts)
// Find where executeParallel() is called
await this.#taskOrchestrator.executeParallel({
  enabled: true,
  maxConcurrency: this.#parallelism,  // Use the field value
  prpGenerationLimit: 3,
  resourceThreshold: 0.8
});

// PATTERN 8: Integration Test - Default Value
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { parseCLIArgs } from '../../src/cli/index.js';
import * as os from 'node:os';

describe('Parallelism CLI Option', () => {
  let originalArgv: string[];
  let originalExit: any;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExit = process.exit;
    process.exit = vi.fn((code: number) => {
      throw new Error(`process.exit(${code})`);
    }) as any;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.clearAllMocks();
  });

  it('should use default parallelism of 2 when not specified', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md'];
    const args = parseCLIArgs() as CLIArgs;
    expect(args.parallelism).toBe(2);
  });

  it('should accept custom parallelism value', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--parallelism', '5'];
    const args = parseCLIArgs() as CLIArgs;
    expect(args.parallelism).toBe(5);
  });

  it('should reject parallelism < 1', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--parallelism', '0'];
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });

  it('should reject parallelism > 10', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--parallelism', '11'];
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });

  it('should reject non-integer parallelism', () => {
    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--parallelism', 'abc'];
    expect(() => parseCLIArgs()).toThrow('process.exit(1)');
  });

  it('should warn when parallelism exceeds CPU cores', () => {
    // Mock os.cpus() to return 4 cores
    vi.spyOn(os, 'cpus').mockReturnValue(Array(4).fill({}));
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    process.argv = ['node', 'cli.js', '--prd', 'PRD.md', '--parallelism', '8'];
    parseCLIArgs();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('exceeds CPU cores')
    );

    consoleWarnSpy.mockRestore();
  });
});

// GOTCHA: Commander.js returns string from options - must parse to number
// The default value '2' is a string, use parseInt() to convert

// GOTCHA: Type assertion needed when storing validated number
// Commander.js types the option as string, but we validate it's a number
// Use (options as any).parallelism = parallelism; or redeclare type

// CRITICAL: Always use parseInt(value, 10) with radix parameter
// Prevents octal interpretation (e.g., "010" -> 8 instead of 10)

// CRITICAL: Logger mock must be hoisted before vi.mock()
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
}));
```

### Integration Points

```yaml
CLI_MODULE:
  - file: src/cli/index.ts
  - integration: Add --parallelism option to existing CLI parser
  - location_add_field: Line ~94 (add to CLIArgs interface)
  - location_add_option: Line ~168 (add .option() call)
  - location_add_validation: Line ~307 (add validation code)
  - location_add_import: Line ~31 (import os module)
  - pattern: Follow existing numeric option pattern (--max-tasks)

MAIN_ENTRY:
  - file: src/index.ts
  - integration: Pass parallelism to PRPPipeline constructor
  - location: Lines 198-212
  - pattern: Add args.parallelism as 9th parameter

PIPELINE_WORKFLOW:
  - file: src/workflows/prp-pipeline.ts
  - integration: Receive, store, and pass parallelism value
  - location_add_field: Line ~230 (add #parallelism field)
  - location_add_param: Line ~259 (add constructor parameter)
  - location_assign: Line ~278 (assign this.#parallelism = parallelism)
  - location_use: Find executeParallel() call, use this.#parallelism
  - pattern: Follow existing field pattern (this.#maxTasks)

TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - integration: Receives ParallelismConfig with maxConcurrency
  - location: Lines 879-903 (executeParallel method)
  - pattern: No changes needed - already accepts ParallelismConfig

CONCURRENT_EXECUTOR:
  - file: src/core/concurrent-executor.ts
  - integration: Receives ParallelismConfig
  - location: Lines 41-53 (ParallelismConfig interface)
  - pattern: No changes needed - already has maxConcurrency field

INTEGRATION_TESTS:
  - file: tests/integration/parallelism-option.test.ts (CREATE)
  - integration: Test CLI option parsing and validation
  - pattern: Follow tests/integration/prd-task-command.test.ts
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npm run typecheck

# Expected: Zero type errors
# If errors exist related to CLIArgs interface, verify parallelism field was added

# Run linting
npm run lint -- src/cli/index.ts src/index.ts src/workflows/prp-pipeline.ts

# Expected: Zero linting errors
# If errors exist, check for unused imports or formatting issues

# Run format check
npm run format:check -- src/cli/index.ts src/index.ts src/workflows/prp-pipeline.ts

# Expected: Zero formatting issues

# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new integration test file
npm run test:run tests/integration/parallelism-option.test.ts

# Expected: All tests pass
# Look for test coverage:
# - Default value test (should default to 2)
# - Custom value tests (1, 5, 10)
# - Range validation tests (rejects 0, 11)
# - Type validation tests (rejects non-integers)
# - Resource warning tests (CPU, memory)

# Run related CLI tests to ensure no regression
npm run test:run tests/unit/cli/index.test.ts

# Expected: All existing tests still pass

# If tests fail, READ error output and fix implementation
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI option parsing manually
tsx src/index.ts --help

# Expected: --parallelism option appears in help text

# Test with default value
tsx src/index.ts --prd PRD.md

# Expected: No error, parallelism defaults to 2

# Test with custom value
tsx src/index.ts --prd PRD.md --parallelism 5

# Expected: No error, parallelism set to 5

# Test with invalid value (should error)
tsx src/index.ts --prd PRD.md --parallelism 15

# Expected: Error message "must be between 1 and 10"

# Test resource warning on machine with limited cores
tsx src/index.ts --prd PRD.md --parallelism 16

# Expected: Warning about exceeding CPU cores (if < 16 cores available)
```

### Level 4: End-to-End Validation

```bash
# Full pipeline test with parallelism option
# Create test PRD with multiple independent subtasks
tsx src/index.ts --prd test-prd.md --parallelism 3

# Expected:
# - Subtasks execute with max 3 concurrent
# - No resource exhaustion
# - Pipeline completes successfully

# Verify ConcurrentTaskExecutor receives correct config
# Add temporary logging in concurrent-executor.ts line 192:
// this.#logger.info({ maxConcurrency: config.maxConcurrency }, 'Config received');

# Expected: Logs show maxConcurrency matches --parallelism value

# Performance comparison (optional)
# Time execution with --parallelism 1 vs --parallelism 4
# Expected: Higher parallelism completes faster (for independent tasks)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `src/cli/index.ts` modified with parallelism field, option, and validation
- [ ] `src/index.ts` passes parallelism to PRPPipeline
- [ ] `src/workflows/prp-pipeline.ts` stores and uses parallelism
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting passes: `npm run format:check`
- [ ] Integration tests pass: `npm run test:run tests/integration/parallelism-option.test.ts`
- [ ] All existing tests still pass: `npm run test:run`

### Feature Validation

- [ ] `--parallelism` option accepts 1-10 (inclusive)
- [ ] Default value is 2 when option not specified
- [ ] Values < 1 produce error and exit
- [ ] Values > 10 produce error and exit
- [ ] Non-integer values produce error and exit
- [ ] Resource warnings display when parallelism > CPU cores
- [ ] Parallelism value is passed to ConcurrentTaskExecutor
- [ ] Help text displays correctly with `--help`

### Code Quality Validation

- [ ] Follows existing CLI option patterns
- [ ] Uses parseInt() with radix 10
- [ ] Clear error messages with context
- [ ] Non-blocking resource warnings
- [ ] No anti-patterns from template are present
- [ ] No modifications to protected files (PRD.md, tasks.json, .gitignore)

### Documentation & Deployment

- [ ] Code is self-documenting with clear field names
- [ ] Help text describes range and default
- [ ] Error messages are actionable
- [ ] Warnings provide recommended values

---

## Anti-Patterns to Avoid

- Don't skip validation - always validate range (1-10)
- Don't skip parseInt() - Commander.js returns strings
- Don't use sync operations in validation - keep it fast
- Don't throw on resource warnings - use logger.warn()
- Don't hardcode parallelism in executor - use CLI value
- Don't forget to import os module at top of file
- Don't use parseInt() without radix 10 parameter
- Don't modify existing default values (keep backward compatibility)
- Don't make validation blocking for resource warnings
- Don't skip tests - integration tests are required
- Don't forget to store parallelism as private field in PRPPipeline
- Don't pass undefined to PRPPipeline - provide default value
