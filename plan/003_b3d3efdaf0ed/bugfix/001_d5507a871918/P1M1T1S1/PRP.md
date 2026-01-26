# Product Requirement Prompt (PRP)

## Goal

**Feature Goal**: Verify TaskOrchestrator correctly instantiates ResearchQueue with all 4 required constructor parameters.

**Deliverable**: Verified TaskOrchestrator constructor implementation at `src/core/task-orchestrator.ts:161-166` that correctly passes all 4 parameters (sessionManager, maxSize, noCache, cacheTtlMs) to ResearchQueue.

**Success Definition**:
- ResearchQueue instantiation receives all 4 constructor parameters
- Parameters are correctly sourced from TaskOrchestrator constructor arguments
- Code compiles without TypeScript errors
- Unit tests pass for both TaskOrchestrator and ResearchQueue

## Why

**Business Value**: This bug fix ensures the ResearchQueue is properly configured with all required parameters, enabling:
- Correct cache TTL behavior for PRP caching
- Proper concurrency limits for parallel PRP generation
- Cache bypass functionality via `--no-cache` CLI flag

**Integration**: The TaskOrchestrator is a core component of the Four Core Processing Engines (PRD §5.1). Incorrect ResearchQueue instantiation would break parallel PRP generation and caching.

**Problems Solved**:
- Bug 001_d5507a871918 from TEST_RESULTS.md identified that TaskOrchestrator was missing the `cacheTtlMs` parameter
- Without this parameter, PRP caching would use incorrect TTL values
- Cache bypass functionality would not work correctly

## What

**User-Visible Behavior**: No direct user-visible behavior change. This is an internal bug fix ensuring correct constructor parameter passing.

**Technical Requirements**:
1. TaskOrchestrator must pass all 4 parameters to ResearchQueue constructor
2. Parameters must be sourced from TaskOrchestrator's constructor arguments
3. Default values must match: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

### Success Criteria

- [ ] TaskOrchestrator lines 161-166 pass all 4 parameters to ResearchQueue
- [ ] Parameters are: `this.sessionManager`, `this.#researchQueueConcurrency`, `this.#noCache`, `this.#cacheTtlMs`
- [ ] TypeScript compilation succeeds with no errors
- [ ] Unit tests pass: `npm test -- tests/unit/core/research-queue.test.ts`
- [ ] Integration tests pass: `npm test -- tests/integration/core/task-orchestrator.test.ts`

## All Needed Context

### Context Completeness Check

**Test**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes - this PRP provides:
- Exact file paths and line numbers for all relevant code
- Complete constructor signatures for ResearchQueue and PRPGenerator
- TaskOrchestrator's current implementation state
- Configuration sources and default values
- Test patterns and validation commands
- Code examples showing correct patterns

### Documentation & References

```yaml
# MUST READ - Core source files for this implementation

- file: src/core/task-orchestrator.ts
  lines: 132-180
  why: TaskOrchestrator constructor showing current ResearchQueue instantiation
  pattern: Constructor parameter declaration and ResearchQueue initialization
  gotcha: Lines 161-166 already pass all 4 parameters correctly (fixed in commit 6591868)

- file: src/core/research-queue.ts
  lines: 85-106
  why: ResearchQueue constructor signature showing all 4 required parameters
  pattern: Constructor with default parameters for backwards compatibility
  critical: ResearchQueue requires (sessionManager, maxSize, noCache, cacheTtlMs)

- file: src/agents/prp-generator.ts
  lines: 189-210
  why: PRPGenerator constructor signature (called by ResearchQueue)
  pattern: Constructor with 4 parameters including prpCompression
  gotcha: ResearchQueue calls PRPGenerator with 3 params (no prpCompression)

- file: tests/unit/core/research-queue.test.ts
  lines: 268-280
  why: Test that verifies PRPGenerator mock receives correct parameters
  pattern: Mock assertion for constructor call verification
  gotcha: Test expects 2 params but PRPGenerator receives 3 (cacheTtlMs has default)

- file: tests/unit/core/task-orchestrator.test.ts
  lines: 100-180
  why: TaskOrchestrator constructor test patterns
  pattern: Constructor testing with mock SessionManager
  gotcha: Tests verify readonly properties are correctly stored

- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/prd_snapshot.md
  lines: 11-33
  why: Bug report describing the ResearchQueue constructor signature mismatch issue
  critical: Original bug report - TaskOrchestrator was missing cacheTtlMs parameter
  section: Issue 1: ResearchQueue Constructor Signature Mismatch

- file: src/cli/index.ts
  lines: 50-80
  why: CLI option definitions for research-concurrency, no-cache, cache-ttl
  pattern: Command line option parsing with defaults
  gotcha: cache-ttl uses 'ms' package for duration parsing (e.g., "24h", "1d")
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── core/
│   ├── task-orchestrator.ts       # Lines 161-166: ResearchQueue instantiation
│   ├── research-queue.ts          # Lines 94-106: Constructor signature
│   ├── session-manager.ts         # Session state management
│   └── models.ts                  # Type definitions
├── agents/
│   └── prp-generator.ts           # Lines 194-199: PRPGenerator constructor
├── cli/
│   └── index.ts                   # CLI option definitions
└── utils/
    └── logger.ts                  # Logging utilities

tests/
├── unit/
│   └── core/
│       ├── task-orchestrator.test.ts   # TaskOrchestrator unit tests
│       └── research-queue.test.ts      # ResearchQueue unit tests
└── integration/
    └── core/
        └── task-orchestrator.test.ts   # Integration tests
```

### Known Gotchas of our Codebase & Library Quirks

```typescript
// CRITICAL: ResearchQueue constructor parameter order is strict
// Order: (sessionManager, maxSize, noCache, cacheTtlMs)
// Do not reorder - TypeScript's positional parameters must match

// CRITICAL: Default parameters allow backwards compatibility
// maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000
// Tests may call with fewer parameters due to defaults

// GOTCHA: PRPGenerator constructor has 4th parameter (prpCompression)
// ResearchQueue does NOT pass prpCompression to PRPGenerator
// PRPGenerator uses default 'standard' compression

// GOTCHA: TaskOrchestrator has 7 constructor parameters total
// Order: (sessionManager, scope?, noCache, researchQueueConcurrency, cacheTtlMs, prpCompression, retryConfig?)
// Parameters 3-6 are used for ResearchQueue instantiation

// PATTERN: Private fields use # syntax (class private fields)
// this.#researchQueueConcurrency, this.#noCache, this.#cacheTtlMs
// These are readonly and set in constructor

// CRITICAL: Duration parsing uses 'ms' package
// CLI --cache-ttl accepts: "30s", "5m", "1h", "12h", "1d", "24h", "1w"
// Stored internally as milliseconds (number)

// TESTING: Vitest is the test framework
// Use vi.mock() for mocking, vi.fn() for mock functions
// Test pattern: SETUP, EXECUTE, VERIFY
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. This PRP verifies existing implementation.

**TaskOrchestrator Constructor Parameters** (already defined):
```typescript
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
)
```

**ResearchQueue Constructor Signature** (already defined):
```typescript
constructor(
  sessionManager: SessionManager,
  maxSize: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY TaskOrchestrator ResearchQueue Instantiation
  - LOCATION: src/core/task-orchestrator.ts lines 161-166
  - VERIFY: ResearchQueue instantiation passes all 4 parameters
  - EXPECTED:
    this.researchQueue = new ResearchQueue(
      this.sessionManager,           # Parameter 1: SessionManager instance
      this.#researchQueueConcurrency, # Parameter 2: Max concurrent tasks (default 3)
      this.#noCache,                 # Parameter 3: Cache bypass flag (default false)
      this.#cacheTtlMs              # Parameter 4: Cache TTL in ms (default 24h)
    );
  - GOTCHA: Current implementation (as of commit 6591868) already has this correct
  - ACTION: If incorrect, update to match expected code above

Task 2: VERIFY TaskOrchestrator Constructor Parameter Mapping
  - LOCATION: src/core/task-orchestrator.ts lines 132-146
  - VERIFY: Constructor parameters are correctly stored as private fields
  - EXPECTED:
    this.#noCache = noCache;
    this.#researchQueueConcurrency = researchQueueConcurrency;
    this.#cacheTtlMs = cacheTtlMs;
  - PATTERN: Use same naming for constructor params and private fields
  - GOTCHA: Parameters must be stored before ResearchQueue instantiation (line 161)

Task 3: UPDATE ResearchQueue Unit Test Mock Assertion (if needed)
  - LOCATION: tests/unit/core/research-queue.test.ts line 278
  - VERIFY: Mock assertion matches actual PRPGenerator call
  - EXPECTED: expect(MockPRPGenerator).toHaveBeenCalledWith(mockManager, false, <cacheTtlMs>);
  - GOTCHA: PRPGenerator is called with 3 params (sessionManager, noCache, cacheTtlMs)
  - ACTION: Update test to expect 3 parameters or use partial matching
  - ALTERNATIVE: Use .toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything())

Task 4: VERIFY TaskOrchestrator Unit Tests
  - LOCATION: tests/unit/core/task-orchestrator.test.ts
  - VERIFY: Tests create TaskOrchestrator with correct parameters
  - PATTERN: Follow existing test patterns in research-queue.test.ts
  - ACTION: Ensure tests pass constructor parameters correctly

Task 5: RUN TypeScript Compilation Check
  - COMMAND: npm run typecheck
  - VERIFY: No TypeScript errors related to ResearchQueue instantiation
  - EXPECTED: Zero errors
  - ACTION: Fix any type errors before proceeding

Task 6: RUN Unit Tests
  - COMMAND: npm test -- tests/unit/core/research-queue.test.ts
  - COMMAND: npm test -- tests/unit/core/task-orchestrator.test.ts
  - VERIFY: All tests pass
  - EXPECTED: Zero failures
  - ACTION: Fix any failing tests

Task 7: RUN Integration Tests
  - COMMAND: npm test -- tests/integration/core/task-orchestrator.test.ts
  - VERIFY: Integration tests pass
  - EXPECTED: Zero failures
  - ACTION: Fix any failing tests
```

### Implementation Patterns & Key Details

```typescript
// Pattern: TaskOrchestrator ResearchQueue instantiation (lines 161-166)
// This is the CORRECT pattern that should be in place

this.researchQueue = new ResearchQueue(
  this.sessionManager,           // Pass SessionManager instance
  this.#researchQueueConcurrency, // Pass configurable concurrency (default 3)
  this.#noCache,                 // Pass cache bypass flag (default false)
  this.#cacheTtlMs              // Pass cache TTL in milliseconds (default 24h)
);

// CRITICAL: Parameter order must match ResearchQueue constructor signature
// constructor(sessionManager, maxSize, noCache, cacheTtlMs)

// Pattern: Constructor parameter to private field mapping (lines 141-146)
constructor(
  sessionManager: SessionManager,
  scope?: Scope,
  noCache: boolean = false,
  researchQueueConcurrency: number = 3,
  cacheTtlMs: number = 24 * 60 * 60 * 1000,
  prpCompression: PRPCompressionLevel = 'standard',
  retryConfig?: Partial<TaskRetryConfig>
) {
  this.#logger = getLogger('TaskOrchestrator');
  this.sessionManager = sessionManager;
  this.#noCache = noCache;
  this.#researchQueueConcurrency = researchQueueConcurrency;
  this.#cacheTtlMs = cacheTtlMs;
  this.#prpCompression = prpCompression;
  // ... rest of constructor

  // CRITICAL: Private fields must be set BEFORE ResearchQueue instantiation
  // because ResearchQueue uses this.#noCache and this.#cacheTtlMs
}

// Pattern: Debug logging after instantiation (lines 167-170)
this.#logger.debug(
  { maxSize: this.#researchQueueConcurrency, cacheTtlMs: this.#cacheTtlMs },
  'ResearchQueue initialized'
);
// This logging pattern provides visibility into configuration values

// GOTCHA: PRPGenerator called by ResearchQueue with 3 params
// ResearchQueue line 105: new PRPGenerator(sessionManager, noCache, cacheTtlMs)
// PRPGenerator has 4th param (prpCompression) but ResearchQueue doesn't pass it
// PRPGenerator uses default 'standard' for prpCompression
```

### Integration Points

```yaml
TASK_ORCHESTRATOR_CONSTRUCTOR:
  - file: src/core/task-orchestrator.ts
  - lines: 132-180
  - parameters:
    - noCache: from CLI --no-cache flag
    - researchQueueConcurrency: from CLI --research-concurrency flag
    - cacheTtlMs: from CLI --cache-ttl flag (parsed by 'ms' package)

RESEARCH_QUEUE_CONSTRUCTOR:
  - file: src/core/research-queue.ts
  - lines: 94-106
  - signature: (sessionManager, maxSize, noCache, cacheTtlMs)
  - defaults: maxSize=3, noCache=false, cacheTtlMs=24*60*60*1000

PRP_GENERATOR_CONSTRUCTOR:
  - file: src/core/research-queue.ts
  - line: 105
  - call: new PRPGenerator(sessionManager, noCache, cacheTtlMs)
  - note: Does NOT pass prpCompression parameter

CLI_INTEGRATION:
  - file: src/cli/index.ts
  - options: --research-concurrency, --no-cache, --cache-ttl
  - defaults: 3, false, "24h"
  - env_vars: HACKY_PRP_CACHE_TTL

TESTING:
  - framework: Vitest
  - mock_pattern: vi.mock(), vi.fn(), expect().toHaveBeenCalledWith()
  - test_structure: SETUP, EXECUTE, VERIFY
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npm run typecheck

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Run ESLint to check code style
npm run lint

# Expected: Zero linting errors
# If errors exist, run npm run lint:fix to auto-fix

# Run Prettier to check formatting
npm run format:check

# Expected: Zero formatting issues
# If issues exist, run npm run format to fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test ResearchQueue unit tests
npm test -- tests/unit/core/research-queue.test.ts

# Expected: All tests pass
# Key tests to verify:
# - "should create PRPGenerator with sessionManager" (line 268)
# - "should set maxSize from constructor parameter" (line 153)
# - "should use default maxSize when not provided" (line 239)

# Test TaskOrchestrator unit tests
npm test -- tests/unit/core/task-orchestrator.test.ts

# Expected: All tests pass
# Key tests to verify:
# - Constructor stores parameters correctly
# - ResearchQueue is initialized with correct parameters

# Run all core unit tests
npm test -- tests/unit/core/

# Expected: All tests pass
# Coverage: 100% for modified files
```

### Level 3: Integration Testing (System Validation)

```bash
# Test TaskOrchestrator integration
npm test -- tests/integration/core/task-orchestrator.test.ts

# Expected: All tests pass
# Verifies: Real ResearchQueue instantiation works correctly

# Test ResearchQueue integration
npm test -- tests/integration/core/research-queue.test.ts

# Expected: All tests pass
# Verifies: ResearchQueue works with real SessionManager

# Run full integration test suite
npm test -- tests/integration/

# Expected: All integration tests pass
```

### Level 4: End-to-End Validation

```bash
# Run complete test suite
npm test

# Expected: All tests pass (unit + integration + e2e)
# Coverage thresholds met (100% statements, branches, functions, lines)

# Manual verification: Check constructor call in source
grep -A 5 "new ResearchQueue" src/core/task-orchestrator.ts

# Expected output:
# this.researchQueue = new ResearchQueue(
#   this.sessionManager,
#   this.#researchQueueConcurrency,
#   this.#noCache,
#   this.#cacheTtlMs
# );

# Verify all 4 parameters are present
```

## Final Validation Checklist

### Technical Validation

- [ ] TaskOrchestrator lines 161-166 pass all 4 parameters to ResearchQueue
- [ ] Parameters are in correct order: sessionManager, maxSize, noCache, cacheTtlMs
- [ ] TypeScript compilation succeeds: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] ResearchQueue unit tests pass: `npm test -- tests/unit/core/research-queue.test.ts`
- [ ] TaskOrchestrator unit tests pass: `npm test -- tests/unit/core/task-orchestrator.test.ts`
- [ ] Integration tests pass: `npm test -- tests/integration/core/task-orchestrator.test.ts`
- [ ] All tests pass: `npm test`
- [ ] Constructor parameter mapping is correct (noCache, researchQueueConcurrency, cacheTtlMs)

### Code Quality Validation

- [ ] Code follows existing TaskOrchestrator patterns
- [ ] Debug logging present for ResearchQueue initialization
- [ ] Private field naming matches constructor parameters
- [ ] Default values match documentation (3, false, 24*60*60*1000)
- [ ] No breaking changes to external interfaces

### Documentation & Deployment

- [ ] JSDoc comments are accurate (if updated)
- [ ] Cache behavior is correctly configured with cacheTtlMs
- [ ] Concurrency limits are correctly configured with maxSize
- [ ] Cache bypass works correctly with noCache parameter

---

## Anti-Patterns to Avoid

- **Don't change ResearchQueue constructor signature** - It's already correct with 4 parameters
- **Don't change TaskOrchestrator constructor signature** - It's already correct with 7 parameters
- **Don't skip verification** - Even if code looks correct, run all tests to confirm
- **Don't ignore test failures** - If tests fail, investigate the root cause
- **Don't modify default values** - Defaults are production-tested (3, false, 24h)
- **Don't break parameter order** - Positional parameters must match constructor signature exactly
- **Don't forget to test** - Unit tests are critical for catching regressions
- **Don't skip TypeScript compilation** - Type errors indicate real problems

## Notes

**Current State Analysis**:
As of commit `6591868` (Add configurable PRP cache TTL with CLI support and validation), the TaskOrchestrator ResearchQueue instantiation at lines 161-166 **already passes all 4 parameters correctly**. This PRP serves as verification documentation and ensures tests are updated to match the correct implementation.

**Git History**:
- Commit `6591868`: Added cacheTtlMs parameter support
- Commit `dcc3b9b`: Added researchQueueConcurrency parameter support
- Commit `bb642bc`: Initial ResearchQueue implementation

**Related Work Items**:
- P1.M1.T1.S2: Update ResearchQueue unit tests for full constructor signature
- P1.M1.T1.S3: Update ResearchQueue integration tests for constructor consistency

**Confidence Score**: 10/10 - The implementation is straightforward verification with clear success criteria.
