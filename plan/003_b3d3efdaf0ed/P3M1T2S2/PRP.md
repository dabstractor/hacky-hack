# PRP: Make ResearchQueue Concurrency Configurable

---

## Goal

**Feature Goal**: Make ResearchQueue concurrency configurable via constructor parameter, environment variable (RESEARCH_QUEUE_CONCURRENCY), and CLI option (--research-concurrency <n>) to allow users to adjust parallel PRP generation based on their workload and API rate limits.

**Deliverable**: Configurable ResearchQueue with:

- Constructor parameter `maxSize` (already exists, just needs to be wired to configurable source)
- Environment variable support `RESEARCH_QUEUE_CONCURRENCY` (default: 3)
- CLI option `--research-concurrency <n>` for runtime override
- Updated TaskOrchestrator to pass configurable concurrency
- Tests for various concurrency levels
- Documentation of tradeoffs (higher concurrency = faster but more API usage)

**Success Definition**:

- ResearchQueue accepts `maxSize` from environment variable or CLI (default 3, range 1-10)
- CLI option `--research-concurrency <n>` allows runtime override (1-10, default: 3)
- TaskOrchestrator passes configurable concurrency to ResearchQueue
- All existing tests pass without modification (backward compatible)
- New tests verify various concurrency levels (1, 3, 5, 10)
- Documentation explains tradeoffs (higher concurrency = more API usage, potential rate limits)

## User Persona

**Target User**: Developer/DevOps Engineer running the PRP Pipeline for large-scale PRD processing.

**Use Case**: During pipeline execution with hundreds of subtasks, the user wants to:

1. Increase concurrency to speed up PRP generation (e.g., --research-concurrency 5)
2. Decrease concurrency to respect API rate limits (e.g., --research-concurrency 1)
3. Set default via environment variable for their deployment environment

**User Journey**:

1. User runs pipeline with default settings (concurrency=3)
2. User experiences API rate limiting or slow execution
3. User adjusts: `--research-concurrency 5` (for faster execution) or `--research-concurrency 1` (to respect rate limits)
4. User can set environment variable `RESEARCH_QUEUE_CONCURRENCY=5` for default behavior

**Pain Points Addressed**:

- **Hardcoded limit**: Current concurrency=3 is not configurable
- **Rate limiting**: Some API providers have strict rate limits
- **Performance tuning**: Different workloads benefit from different concurrency levels
- **No control**: Users cannot adjust for their specific environment

## Why

- **Performance**: Higher concurrency = faster PRP generation (more parallel API calls)
- **Rate Limiting**: Lower concurrency = avoid API rate limits
- **Resource control**: Different environments (dev, CI, production) need different settings
- **User control**: One-size-fits-all default (concurrency=3) doesn't work for all use cases
- **Consistency**: Task executor already has configurable parallelism (--parallelism), research queue should match

## What

Make ResearchQueue concurrency configurable through three levels:

1. **Constructor Parameter**: `maxSize` (already exists in ResearchQueue constructor)
2. **Environment Variable**: `RESEARCH_QUEUE_CONCURRENCY` (default: 3, range: 1-10)
3. **CLI Option**: `--research-concurrency <n>` (default: 3, range: 1-10)

Update TaskOrchestrator to:

- Accept `researchQueueConcurrency` parameter
- Pass value to ResearchQueue constructor
- Log the configured concurrency level

Add tests for:

- Different concurrency levels (1, 3, 5, 10)
- Environment variable loading
- CLI option parsing
- Validation (range 1-10)

Document tradeoffs:

- Higher concurrency = faster PRP generation but more API usage
- Lower concurrency = slower but respects rate limits
- Recommended values for different scenarios

### Success Criteria

- [ ] ResearchQueue accepts maxSize from environment variable (RESEARCH_QUEUE_CONCURRENCY, default: 3)
- [ ] CLI option `--research-concurrency <n>` works (1-10, default: 3)
- [ ] CLI validates range (1-10) and shows error for invalid values
- [ ] TaskOrchestrator passes configurable concurrency to ResearchQueue
- [ ] All existing tests pass (backward compatible)
- [ ] New tests verify concurrency levels (1, 3, 5, 10)
- [ ] Documentation explains tradeoffs and recommended values

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete ResearchQueue source code (src/core/research-queue.ts:57-277)
- Complete TaskOrchestrator integration (src/core/task-orchestrator.ts:132-138)
- CLI option patterns from src/cli/index.ts (lines 192-196, 354-386)
- Existing test patterns for ResearchQueue
- Environment variable patterns from codebase
- External research on concurrency best practices

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary implementation files
- file: src/core/research-queue.ts
  why: Complete ResearchQueue implementation showing constructor (lines 90-100), maxSize usage (line 65, 97, 143), and class structure
  pattern: Constructor accepts maxSize parameter with default 3, uses this.maxSize for capacity checking
  gotcha: Line 143 checks `this.researching.size >= this.maxSize` - this is the concurrency limit enforcement

- file: src/core/task-orchestrator.ts
  why: Shows where ResearchQueue is instantiated (lines 132-138) and how to add parameter
  pattern: Constructor injection with sessionManager and noCache
  gotcha: Line 135 hardcodes `3` - this needs to be replaced with configurable value

- file: src/cli/index.ts
  why: Shows exact CLI option pattern for numeric validation (lines 192-196, 354-386)
  pattern: Commander.js option parsing with parseInt, range validation, resource warnings
  gotcha: parallelism validation (lines 354-386) is the exact pattern to follow for research-concurrency

# Test patterns
- file: tests/unit/core/research-queue.test.ts
  why: Shows existing test patterns for ResearchQueue constructor and maxSize
  pattern: Constructor tests verify maxSize is set correctly (around line 100-150)
  gotcha: Tests use createMockSessionManager, createTestBacklog helper functions

- file: tests/integration/core/research-queue.test.ts
  why: Shows concurrency testing patterns with maxSize limit enforcement
  pattern: Tests verify that concurrent operations never exceed maxSize
  gotcha: Uses trackConcurrency() helper for verification

# Environment variable patterns (for reference)
- file: src/cli/index.ts
  why: Shows pattern for reading environment variables as defaults
  pattern: `process.env.TASK_EXECUTOR_CONCURRENCY ?? '2'` fallback pattern
  gotcha: Environment variables are strings, need parseInt() for numeric values

# Research findings (stored in research/ subdirectory)
- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/research/researchqueue_analysis.md
  why: Complete analysis of ResearchQueue implementation, hardcoded values, and current usage patterns
  section: Current Implementation and Hardcoded Concurrency Issue

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/research/taskorchestrator_analysis.md
  why: Detailed analysis of TaskOrchestrator integration points and modification options
  section: Recommended Modifications

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/research/cli_patterns_analysis.md
  why: CLI option patterns, validation approach, and type definitions
  section: Recommended Pattern for --research-concurrency

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/research/test_patterns_analysis.md
  why: Test patterns for constructor parameters, concurrency testing, and mocking
  section: Test Patterns for Constructor Parameters and How to Test Different Concurrency Levels

- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/research/concurrency_best_practices.md
  why: Best practices for configurable concurrency, default values, trade-off documentation
  section: Default Concurrency Values and Rationale, Trade-off Documentation Patterns

# External documentation
- url: https://commander.js.org/
  why: Commander.js documentation for CLI option parsing
  section: Options with required values, validation examples

- url: https://nodejs.org/api/process.html#process_process_env
  why: Node.js process.env documentation for environment variable access
  section: Environment variables are always strings

# Related work (parallel execution context)
- docfile: plan/003_b3d3efdaf0ed/P3M1T2S1/PRP.md
  why: Previous PRP for resource monitoring optimization - shows pattern for CLI options and environment variables
  section: Implementation Tasks and Validation Loop
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts                    # CLI option parsing (add --research-concurrency here)
│   ├── core/
│   │   ├── research-queue.ts           # MODIFICATION: Already accepts maxSize, just needs config
│   │   ├── task-orchestrator.ts        # MODIFICATION: Pass configurable maxSize
│   │   └── index.ts                    # Exports ResearchQueue
│   └── index.ts                        # Main entry point
├── tests/
│   ├── unit/
│   │   └── core/
│   │       └── research-queue.test.ts  # EXTENSION: Add concurrency config tests
│   └── integration/
│       └── core/
│           └── research-queue.test.ts  # EXTENSION: Add concurrency config tests
├── plan/
│   └── 003_b3d3efdaf0ed/
│       └── P3M1T2S2/
│           ├── PRP.md                  # This file
│           └── research/               # Research findings
└── package.json                        # No new dependencies needed
```

### Desired Codebase Tree (after implementation)

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── cli/
│   │   └── index.ts                    # ADD: --research-concurrency option, validation
│   └── core/
│       ├── research-queue.ts           # NO CHANGE: Already accepts maxSize parameter
│       └── task-orchestrator.ts        # MODIFY: Accept and pass researchQueueConcurrency
├── tests/
│   ├── unit/
│   │   └── core/
│   │       └── research-queue.test.ts  # EXTEND: Add constructor parameter tests
│   └── integration/
│       └── core/
│           └── research-queue.test.ts  # EXTEND: Add concurrency level tests
└── .env.example                        # ADD: RESEARCH_QUEUE_CONCURRENCY=3
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ResearchQueue constructor ALREADY accepts maxSize parameter
// File: src/core/research-queue.ts, lines 90-100
// NO CHANGES NEEDED to ResearchQueue - just need to wire up configuration

// GOTCHA: TaskOrchestrator hardcodes maxSize=3 at line 135
// File: src/core/task-orchestrator.ts
// BEFORE: this.researchQueue = new ResearchQueue(this.sessionManager, 3, this.#noCache);
// AFTER: this.researchQueue = new ResearchQueue(this.sessionManager, researchQueueConcurrency, this.#noCache);

// CRITICAL: Commander.js returns string for option values, not number
// File: src/cli/index.ts, lines 354-364 (parallelism validation pattern)
// Must use parseInt() to convert string to number
// Follow the exact pattern used for --parallelism validation

// GOTCHA: Environment variables are always strings in Node.js
// Use process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3' for default
// Parse with parseInt() before using as number

// CRITICAL: Validation pattern follows --parallelism exactly
// Range: 1-10 (not 1-20 - research queue is for API calls, 10 is safe max)
// Error message: '--research-concurrency must be an integer between 1 and 10'
// Resource warnings: Similar to parallelism warnings (lines 366-383)

// GOTCHA: TaskOrchestrator constructor signature (lines 111-115)
// Current: constructor(sessionManager, scope?, noCache = false)
// Add: researchQueueConcurrency = 3 as new parameter (after noCache, before scope for consistency)

// GOTCHA: Type definitions need two-tier approach (lines 100-114 of cli/index.ts)
// CLIArgs interface: parallelism: number | string (for Commander.js compatibility)
// ValidatedCLIArgs interface: parallelism: number (after validation)

// CRITICAL: Tests use vi.mock() for PRPGenerator
// File: tests/unit/core/research-queue.test.ts
// Mock setup: vi.mock('../../../src/agents/prp-generator.js')
// Need to mock generate method for concurrency testing

// GOTCHA: ResearchQueue uses this.maxSize for capacity checking (line 143)
// if (this.queue.length === 0 || this.researching.size >= this.maxSize)
// This is the enforcement point - tests should verify this limit is respected

// CRITICAL: No new dependencies needed
// ResearchQueue already accepts maxSize parameter
// Just need to wire up environment variable and CLI option
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed - ResearchQueue already accepts `maxSize` parameter.

Add to CLIArgs interface:

```typescript
export interface CLIArgs {
  // ... existing properties ...
  /** Max concurrent research tasks (1-10, default: 3) - may be string from commander */
  researchConcurrency: number | string;
}
```

Add to ValidatedCLIArgs interface:

```typescript
export interface ValidatedCLIArgs extends Omit<
  CLIArgs,
  'parallelism' | 'researchConcurrency'
> {
  /** Max concurrent research tasks (1-10, default: 3) - validated as number */
  researchConcurrency: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/core/task-orchestrator.ts - Add researchQueueConcurrency parameter
  IMPLEMENT: Add researchQueueConcurrency parameter to TaskOrchestrator constructor
  FOLLOW pattern: Lines 111-115 (constructor signature)
  NAMING: researchQueueConcurrency (camelCase)
  DEFAULT: 3 (maintains current behavior)
  LOGIC:
    - Add parameter after noCache: researchQueueConcurrency: number = 3
    - Store as private readonly: #researchQueueConcurrency
    - Pass to ResearchQueue: new ResearchQueue(this.sessionManager, this.#researchQueueConcurrency, this.#noCache)
    - Update debug log to show configured value
  PLACEMENT: Modify constructor (line 111)
  DEPENDENCIES: None (first task)

Task 2: MODIFY src/cli/index.ts - Add researchConcurrency to CLIArgs interface
  IMPLEMENT: Add researchConcurrency property to CLIArgs interface
  FOLLOW pattern: Lines 100-101 (parallelism property)
  NAMING: researchConcurrency (camelCase)
  TYPE: number | string (for Commander.js compatibility)
  PLACEMENT: After parallelism property (after line 101)
  DEPENDENCIES: None (interface addition)

Task 3: MODIFY src/cli/index.ts - Add to ValidatedCLIArgs interface
  IMPLEMENT: Add researchConcurrency to ValidatedCLIArgs with proper typing
  FOLLOW pattern: Lines 111-114 (ValidatedCLIArgs interface)
  NAMING: researchConcurrency: number (validated as number)
  PLACEMENT: After parallelism property (after line 113)
  DEPENDENCIES: Task 2 (CLIArgs interface)

Task 4: MODIFY src/cli/index.ts - Add --research-concurrency CLI option
  IMPLEMENT: Add Commander.js option for --research-concurrency
  FOLLOW pattern: Lines 192-196 (parallelism option)
  NAMING: --research-concurrency <n> (kebab-case for CLI)
  DEFAULT: '3' (string default for Commander.js)
  HELP TEXT: 'Max concurrent research tasks (1-10, default: 3)'
  LOGIC:
    - Add option definition (after line 196)
    - Use environment variable fallback: process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
  PLACEMENT: src/cli/index.ts (after --parallelism option)
  DEPENDENCIES: Task 2 (CLIArgs interface)

Task 5: MODIFY src/cli/index.ts - Add validation for research-concurrency
  IMPLEMENT: Validate research-concurrency range (1-10)
  FOLLOW pattern: Lines 354-364 (parallelism validation)
  NAMING: researchConcurrency (camelCase for variable)
  VALIDATION:
    - parseInt() to convert string to number
    - Check range: 1-10
    - Error message: '--research-concurrency must be an integer between 1 and 10'
  LOGIC:
    - Parse string to number
    - Validate range
    - Exit with error if invalid
    - Store validated number back to options
  PLACEMENT: After parallelism validation (after line 364)
  DEPENDENCIES: Task 4 (CLI option exists)

Task 6: MODIFY src/cli/index.ts - Add resource warnings for research-concurrency
  IMPLEMENT: Add warnings similar to parallelism (CPU cores, memory)
  FOLLOW pattern: Lines 366-383 (parallelism warnings)
  WARNING TRIGGERS:
    - researchConcurrency > cpuCores: warn about context switching
    - Estimated memory > freeMemory * 0.8: warn about memory exhaustion
  LOGIC:
    - Use os.cpus().length to get CPU cores
    - Estimate memory: researchConcurrency * 0.3 GB (lighter than task executor)
    - Log non-blocking warnings
  PLACEMENT: After research-concurrency validation (after Task 5)
  DEPENDENCIES: Task 5 (validation exists)

Task 7: MODIFY pipeline wiring - Pass researchConcurrency to TaskOrchestrator
  IMPLEMENT: Find where TaskOrchestrator is instantiated and pass researchConcurrency
  FOLLOW pattern: Search for "new TaskOrchestrator(" in codebase
  NAMING: researchConcurrency: args.researchConcurrency
  LOGIC:
    - Find TaskOrchestrator instantiation point
    - Add researchConcurrency parameter
    - Use validated value from args
  PLACEMENT: TBD (search for TaskOrchestrator instantiation)
  DEPENDENCIES: Task 1 (TaskOrchestrator accepts parameter), Task 5 (validation complete)

Task 8: CREATE .env.example - Add RESEARCH_QUEUE_CONCURRENCY
  IMPLEMENT: Add environment variable to .env.example
  FOLLOW pattern: Existing .env.example format
  NAMING: RESEARCH_QUEUE_CONCURRENCY=3
  COMMENT: "# Max concurrent research tasks (1-10, default: 3)"
  PLACEMENT: .env.example (root of project)
  DEPENDENCIES: None (independent)

Task 9: EXTEND tests/unit/core/research-queue.test.ts - Add constructor parameter tests
  IMPLEMENT: Tests for different concurrency levels
  FOLLOW pattern: Existing constructor tests (around line 100-150)
  TEST CASES:
    - Test 1: Constructor with maxSize=1 sets maxSize correctly
    - Test 2: Constructor with maxSize=5 sets maxSize correctly
    - Test 3: Constructor with maxSize=10 sets maxSize correctly
    - Test 4: Default maxSize=3 when not specified
  MOCKING: Use existing createMockSessionManager helper
  PLACEMENT: tests/unit/core/research-queue.test.ts
  DEPENDENCIES: Task 1 (TaskOrchestrator accepts parameter)

Task 10: EXTEND tests/integration/core/research-queue.test.ts - Add concurrency behavior tests
  IMPLEMENT: Tests verifying concurrency limit enforcement
  FOLLOW pattern: Existing concurrency tests (around line 400-500)
  TEST CASES:
    - Test 1: Concurrency=1 executes tasks serially
    - Test 2: Concurrency=3 executes up to 3 tasks simultaneously
    - Test 3: Concurrency=5 executes up to 5 tasks simultaneously
    - Test 4: Concurrency limit is never exceeded
  MOCKING:
    - Track concurrency with helper function
    - Mock PRPGenerator.generate with delays
  PLACEMENT: tests/integration/core/research-queue.test.ts
  DEPENDENCIES: Task 1 (TaskOrchestrator accepts parameter)
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: TaskOrchestrator constructor modification

// BEFORE (src/core/task-orchestrator.ts:111-143):
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false
) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;

  // ... session validation ...

  // Initialize ResearchQueue with concurrency limit of 3
  this.researchQueue = new ResearchQueue(
    this.sessionManager,
    3,  // HARDCODED - needs to be configurable
    this.#noCache
  );
  this.#logger.debug({ maxSize: 3 }, 'ResearchQueue initialized');

  // ... rest of constructor ...
}

// AFTER:
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3  // NEW: Configurable parameter
) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;
  this.#researchQueueConcurrency = researchQueueConcurrency;  // NEW: Store value

  // ... session validation ...

  // Initialize ResearchQueue with configurable concurrency
  this.researchQueue = new ResearchQueue(
    this.sessionManager,
    this.#researchQueueConcurrency,  // FIXED: Use configured value
    this.#noCache
  );
  this.#logger.debug(
    { maxSize: this.#researchQueueConcurrency },
    'ResearchQueue initialized'
  );

  // ... rest of constructor ...
}

// Add private field declaration:
readonly #researchQueueConcurrency: number;

// Pattern 2: CLI option definition (src/cli/index.ts)

// Add to CLIArgs interface (after line 101):
export interface CLIArgs {
  // ... existing properties ...
  /** Max concurrent research tasks (1-10, default: 3) */
  researchConcurrency: number | string;
}

// Add to ValidatedCLIArgs interface (after line 113):
export interface ValidatedCLIArgs extends Omit<CLIArgs, 'parallelism' | 'researchConcurrency'> {
  // ... existing properties ...
  /** Max concurrent research tasks (1-10, default: 3) - validated as number */
  researchConcurrency: number;
}

// Add CLI option (after line 196):
program
  .option(
    '--research-concurrency <n>',
    'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
    process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
  )

// Pattern 3: Validation (src/cli/index.ts, after line 364)

// Validate research-concurrency
const researchConcurrencyStr =
  typeof options.researchConcurrency === 'string'
    ? options.researchConcurrency
    : String(options.researchConcurrency);
const researchConcurrency = parseInt(researchConcurrencyStr, 10);

if (isNaN(researchConcurrency) || researchConcurrency < 1 || researchConcurrency > 10) {
  logger.error('--research-concurrency must be an integer between 1 and 10');
  process.exit(1);
}

// System resource warnings (non-blocking)
const cpuCores = os.cpus().length;
if (researchConcurrency > cpuCores) {
  logger.warn(
    `⚠️  Warning: Research concurrency (${researchConcurrency}) exceeds CPU cores (${cpuCores})`
  );
  logger.warn(`   This may cause context switching overhead.`);
}

// Memory warning (lighter than task executor - 300MB per task)
const freeMemoryGB = os.freemem() / 1024 ** 3;
const estimatedMemoryGB = researchConcurrency * 0.3;
if (estimatedMemoryGB > freeMemoryGB * 0.8) {
  logger.warn(
    `⚠️  Warning: High research concurrency may exhaust free memory (${freeMemoryGB.toFixed(1)}GB available)`
  );
}

// Store validated number value
options.researchConcurrency = researchConcurrency;

// Pattern 4: Environment variable (.env.example)

# Add to .env.example:
# Concurrency Configuration
RESEARCH_QUEUE_CONCURRENCY=3  # Max concurrent research tasks (1-10, default: 3)

// Pattern 5: Test constructor with different concurrency

describe('constructor with configurable concurrency', () => {
  it('should set maxSize from constructor parameter', () => {
    const mockManager = createMockSessionManager(createMockSession());
    const queue = new ResearchQueue(mockManager, 5);
    expect(queue.maxSize).toBe(5);
  });

  it('should use default maxSize of 3 when not specified', () => {
    const mockManager = createMockSessionManager(createMockSession());
    const queue = new ResearchQueue(mockManager);
    expect(queue.maxSize).toBe(3);
  });

  it('should handle minimum concurrency of 1', () => {
    const mockManager = createMockSessionManager(createMockSession());
    const queue = new ResearchQueue(mockManager, 1);
    expect(queue.maxSize).toBe(1);
  });

  it('should handle maximum concurrency of 10', () => {
    const mockManager = createMockSessionManager(createMockSession());
    const queue = new ResearchQueue(mockManager, 10);
    expect(queue.maxSize).toBe(10);
  });
});

// Pattern 6: Test concurrency behavior

describe('concurrency limit enforcement', () => {
  it('should only execute maxSize tasks simultaneously', async () => {
    const tracker = trackConcurrency();
    const mockManager = createMockSessionManager(createMockSession());

    // Mock PRP generation with delay
    const mockGenerate = vi.fn().mockImplementation(async (task: Subtask) => {
      tracker.trackStart(task.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      tracker.trackEnd();
      return createTestPRPDocument(task.id);
    });

    // Mock PRPGenerator
    vi.mock('../../../src/agents/prp-generator.js');
    const { PRPGenerator } = await import('../../../src/agents/prp-generator.js');
    PRPGenerator.prototype.generate = mockGenerate;

    const queue = new ResearchQueue(mockManager, 3);
    const backlog = createTestBacklog([]);

    // Enqueue 5 tasks
    for (let i = 1; i <= 5; i++) {
      const task = createTestSubtask(`P1.M1.T1.S${i}`, `Task ${i}`, 'Planned');
      await queue.enqueue(task, backlog);
    }

    // Wait for all to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify concurrency limit was never exceeded
    expect(tracker.getState().max).toBeLessThanOrEqual(3);
  });
});

// Helper function for concurrency tracking
function trackConcurrency() {
  const state = { active: 0, max: 0 };
  return {
    trackStart: (id: string) => {
      state.active++;
      state.max = Math.max(state.max, state.active);
    },
    trackEnd: () => {
      state.active--;
    },
    getState: () => state,
  };
}
```

### Integration Points

```yaml
CODEBASE:
  - modify: src/core/task-orchestrator.ts
    changes:
      - Add researchQueueConcurrency parameter to constructor (line 111)
      - Add private readonly field #researchQueueConcurrency
      - Pass researchQueueConcurrency to ResearchQueue (line 135)
      - Update debug log to show configured value (line 138)

  - modify: src/cli/index.ts
    changes:
      - Add researchConcurrency to CLIArgs interface (after line 101)
      - Add researchConcurrency to ValidatedCLIArgs interface (after line 113)
      - Add --research-concurrency CLI option (after line 196)
      - Add validation logic (after line 364)
      - Add resource warnings (after validation)

  - modify: [FIND WHERE TaskOrchestrator IS INSTANTIATED]
    changes:
      - Pass researchConcurrency to TaskOrchestrator constructor
    search: 'new TaskOrchestrator('

CONFIGURATION:
  - add to: .env.example
    pattern: 'RESEARCH_QUEUE_CONCURRENCY=3  # Max concurrent research tasks (1-10, default: 3)'

TESTS:
  - extend: tests/unit/core/research-queue.test.ts
    changes:
      - Add describe block for constructor with configurable concurrency
      - Test maxSize values: 1, 3, 5, 10

  - extend: tests/integration/core/research-queue.test.ts
    changes:
      - Add describe block for concurrency limit enforcement
      - Test that actual concurrency never exceeds maxSize
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint                     # ESLint check
npm run lint:fix                 # Auto-fix linting issues
npm run typecheck                # TypeScript type checking
npm run format                   # Prettier formatting

# Project-wide validation
npm run validate                 # Runs lint, format:check, typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm run test -- tests/unit/core/research-queue.test.ts

# Full test suite for affected areas
npm run test:run

# Coverage validation
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI option parsing
npm run dev -- --help | grep research-concurrency

# Test with custom research concurrency
npm run dev -- --prd ./PRD.md --research-concurrency 5 --dry-run

# Test validation (should fail with error)
npm run dev -- --prd ./PRD.md --research-concurrency 15
# Expected: Error message "must be between 1 and 10"

# Test environment variable
RESEARCH_QUEUE_CONCURRENCY=5 npm run dev -- --prd ./PRD.md --dry-run

# Expected: CLI parses correctly, TaskOrchestrator receives correct concurrency, ResearchQueue uses configured value
```

### Level 4: Behavior Validation (Concurrency Testing)

```bash
# Test different concurrency levels
npm run test -- tests/integration/core/research-queue.test.ts --grep "concurrency"

# Expected output:
# - Concurrency=1: Serial execution (1 task at a time)
# - Concurrency=3: Up to 3 tasks simultaneously
# - Concurrency=5: Up to 5 tasks simultaneously
# - Concurrency=10: Up to 10 tasks simultaneously

# Verify concurrency limits are enforced
# All tests should pass, confirming maxSize is respected
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] ResearchQueue accepts maxSize from environment variable (RESEARCH_QUEUE_CONCURRENCY)
- [ ] CLI option `--research-concurrency <n>` works (1-10, default: 3)
- [ ] CLI validates range (1-10) and shows error for invalid values
- [ ] TaskOrchestrator passes configurable concurrency to ResearchQueue
- [ ] All existing tests pass (backward compatible)
- [ ] New tests verify concurrency levels (1, 3, 5, 10)
- [ ] Environment variable RESEARCH_QUEUE_CONCURRENCY is documented in .env.example

### Code Quality Validation

- [ ] Follows existing codebase patterns (parallelism option pattern)
- [ ] File placement matches desired codebase tree structure
- [ ] No new dependencies added
- [ ] TypeScript types are correct and exported properly
- [ ] JSDoc comments added for new parameters

### Documentation & Deployment

- [ ] .env.example includes RESEARCH_QUEUE_CONCURRENCY=3
- [ ] Tradeoffs are documented (higher concurrency = more API usage)
- [ ] Recommended values provided (1 for rate limiting, 3-5 for normal use, 1 for CI/CD)
- [ ] Code is self-documenting with clear variable names

---

## Anti-Patterns to Avoid

- **Don't** modify ResearchQueue constructor or implementation (it already accepts maxSize)
- **Don't** use range 1-20 (use 1-10 to match parallelism pattern and stay safe)
- **Don't** skip validation (always validate CLI input and environment variables)
- **Don't** forget to log the configured concurrency level (for debugging)
- **Don't** hardcode the value in TaskOrchestrator (use the parameter)
- **Don't** use different naming than parallelism (keep consistency)
- **Don't** forget to update .env.example (document the environment variable)
- **Don't** use parseInt() without checking for NaN (always validate the result)
- **Don't** make the validation blocking for warnings (warnings should be non-blocking)
- **Don't** forget to pass the parameter through the entire call chain (CLI -> Pipeline -> TaskOrchestrator -> ResearchQueue)

## Trade-off Documentation

### Concurrency Level Recommendations

| Concurrency | Use Case             | API Usage | Speed   | Recommended For                                 |
| ----------- | -------------------- | --------- | ------- | ----------------------------------------------- |
| 1           | Sequential debugging | Minimal   | Slowest | Rate-limited APIs, debugging                    |
| 2           | Conservative         | Low       | Slow    | Resource-constrained environments               |
| 3 (default) | Balanced             | Moderate  | Medium  | Most development environments                   |
| 5           | Fast                 | High      | Fast    | Powerful workstations                           |
| 10          | Maximum              | Very High | Fastest | High-performance builds (risk of rate limiting) |

### Resource Requirements

| Concurrency | Min RAM | Min CPU Cores | API Calls/Minute |
| ----------- | ------- | ------------- | ---------------- |
| 1           | 2GB     | 2             | ~5-10            |
| 2           | 4GB     | 4             | ~10-20           |
| 3 (default) | 4GB     | 4             | ~15-30           |
| 5           | 8GB     | 8             | ~25-50           |
| 10          | 16GB    | 12+           | ~50-100          |

### Warnings

- Concurrency > 5 may trigger API rate limits
- Concurrency > CPU cores may cause context switching overhead
- Higher concurrency = more API costs (if using paid API)
- Monitor API usage when increasing concurrency

### Example Usage

```bash
# Default (concurrency=3)
npm run dev -- --prd ./PRD.md

# Fast execution (concurrency=5)
npm run dev -- --prd ./PRD.md --research-concurrency 5

# Respect rate limits (concurrency=1)
npm run dev -- --prd ./PRD.md --research-concurrency 1

# Environment variable
export RESEARCH_QUEUE_CONCURRENCY=5
npm run dev -- --prd ./PRD.md
```
