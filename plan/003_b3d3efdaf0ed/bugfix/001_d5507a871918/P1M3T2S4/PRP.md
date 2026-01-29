# Product Requirement Prompt (PRP): Set PRP_PIPELINE_RUNNING Environment Variable

---

## Goal

**Feature Goal**: Implement PID-based environment variable guard that prevents nested PRP Pipeline execution while allowing legitimate bug fix recursion.

**Deliverable**: Modified `PRPPipeline.run()` method that sets `PRP_PIPELINE_RUNNING` environment variable on entry and clears it on exit, even when errors occur.

**Success Definition**:

- Environment variable `PRP_PIPELINE_RUNNING` is set to current process PID after validation passes
- Environment variable is cleared in finally block, only if it matches our PID
- Debug logging occurs on both set and clear operations
- Cleanup happens even when errors or interruptions occur
- No regressions to existing functionality

## User Persona

**Target User**: System (PRP Pipeline infrastructure)

**Use Case**: Prevent infinite recursion when PRP Pipeline executes tasks that themselves trigger pipeline execution, while allowing legitimate bug fix workflows.

**User Journey**:

1. PRP Pipeline starts and validates nested execution (previous subtask)
2. After validation passes, set `PRP_PIPELINE_RUNNING=<PID>`
3. Execute pipeline workflow (decompose PRD, execute tasks, QA cycle)
4. In finally block, clear `PRP_PIPELINE_RUNNING` if we own it
5. Always run cleanup regardless of success/failure

**Pain Points Addressed**:

- Prevents infinite loops from recursive pipeline execution
- Allows controlled recursion for bug fix sessions
- Ensures cleanup happens even on crashes/errors

## Why

- **System Stability**: Prevents runaway recursion that could exhaust system resources
- **State Integrity**: Ensures only one pipeline instance modifies session state at a time
- **Debugging Support**: PID tracking helps identify which process owns the pipeline lock
- **Error Resilience**: Finally block ensures guard is cleared even on failures

## What

### User-Visible Behavior

**No direct user-visible changes** - this is infrastructure-level behavior.

**Observable behavior:**

- Environment variable `PRP_PIPELINE_RUNNING` appears during pipeline execution
- Debug logs show guard being set and cleared
- Nested execution is blocked with appropriate error message
- Bug fix sessions can still recurse when `SKIP_BUG_FINDING=true` and path contains 'bugfix'

### Success Criteria

- [ ] Guard is set to current PID after validation passes
- [ ] Guard is cleared in finally block if we own it
- [ ] Debug logging on set: `Set PRP_PIPELINE_RUNNING=<PID>`
- [ ] Debug logging on clear: `Cleared PRP_PIPELINE_RUNNING`
- [ ] Finally block executes even on errors
- [ ] All existing tests pass
- [ ] New tests cover guard set/clear behavior

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact file location and method to modify
- Specific line numbers and patterns to follow
- Complete code examples for implementation
- Test structure and validation commands
- All dependencies on previous subtasks are documented

### Documentation & References

```yaml
# MUST READ - Implementation specification
- url: file:///home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/002_external_dependencies.md
  why: Complete specification for environment variable guard implementation (Section 4)
  section: "4. Session Guard Patterns"
  critical: |
    - validateNestedExecutionGuard() function specification
    - clearNestedExecutionGuard() function specification
    - PID comparison patterns
    - Bug fix recursion allowance logic

# MUST READ - Implementation target
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Target file for modification - contains run() method that needs guard logic
  pattern: |
    - Lines 1665-1811: Complete run() method implementation
    - Lines 1807-1810: Existing finally block with cleanup() call
    - Lines 1807: Finally block structure to extend
  gotcha: |
    - run() method already has try-catch-finally structure
    - Finally block calls this.cleanup()
    - Must add guard clearing BEFORE cleanup() call
    - Use this.logger for debug logging

# MUST READ - Logger patterns
- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: Understand existing logging patterns in PRP Pipeline
  pattern: |
    - Lines 1678-1692: Correlation logger usage with child context
    - Lines 1685-1692: Debug logging with [PRPPipeline] prefix
    - Lines 1323-1410: Cleanup method logging patterns
    - Pattern: this.logger.debug(`[PRPPipeline] <message>`)
  gotcha: |
    - Always use [PRPPipeline] prefix
    - Use debug level for guard operations
    - Include PID in log message for debugging

# MUST READ - Test structure
- file: /home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts
  why: Existing test structure for guard functionality
  pattern: |
    - Lines 46-98: Basic guard functionality tests
    - Lines 55-57: afterEach with vi.unstubAllEnvs() for cleanup
    - Uses vi.stubEnv() for setting environment variables in tests
  gotcha: |
    - Tests are mocked (execution-guard.ts doesn't exist yet)
    - vi.unstubAllEnvs() must be called in afterEach
    - Tests use process.env direct access

# MUST READ - Environment variable patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S4/research/environment-variable-research.md
  why: Complete research on environment variable usage patterns in codebase
  section: "Key Findings from Codebase Analysis"

# MUST READ - Logger patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S4/research/codebase-logger-patterns.md
  why: Complete research on logging patterns in PRP Pipeline
  section: "Implementation Guidance for PRP_PIPELINE_RUNNING Logging"

# REFERENCE - Node.js documentation
- url: https://nodejs.org/docs/latest-v20.x/api/process.html#processenv
  why: Official documentation on process.env behavior
  critical: process.env always stores strings, never numbers

- url: https://nodejs.org/docs/latest-v20.x/api/process.html#processpid
  why: Official documentation on process.pid
  critical: process.pid is number, must convert to string for env var

# REFERENCE - Try-finally patterns
- file: /home/dustin/projects/hacky-hack/src/utils/token-counter.ts
  why: Example of try-finally for resource cleanup
  pattern: Lines 321-323: dispose() in finally block
  gotcha: Finally always executes, even on return/throw

- file: /home/dustin/projects/hacky-hack/src/core/concurrent-executor.ts
  why: Example of try-finally with semaphore release
  pattern: Lines 350-361: Release in finally with debug logging
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── workflows/
│   └── prp-pipeline.ts          # TARGET FILE - Modify run() method
│       ├── run()                 # Lines 1665-1811 - Add guard logic here
│       ├── #cleanup()            # Lines 1323-1410 - Called by finally
│       ├── this.logger           # Base logger instance
│       └── this.correlationLogger # Child logger with correlation ID
├── utils/
│   ├── errors.ts                 # Error hierarchy (may need NestedExecutionError)
│   └── logger.ts                 # Logger implementation
└── core/
    └── session-manager.ts        # Used by run() method

tests/
├── unit/
│   ├── nested-execution-guard.test.ts  # Guard tests (already exist)
│   └── workflows/
│       └── prp-pipeline.test.ts        # Pipeline tests (may need updates)
└── integration/
    └── prp-pipeline-integration.test.ts # Integration tests
```

### Desired Codebase Tree (No New Files)

```bash
# No new files needed - only modification to existing file

src/
└── workflows/
    └── prp-pipeline.ts          # MODIFIED - Add guard set/clear logic
        ├── run()                 # Add PID tracking and finally block logic
        │   ├── Store currentPid before try block
        │   ├── Set PRP_PIPELINE_RUNNING after SessionManager creation
        │   ├── Clear PRP_PIPELINE_RUNNING in finally block (before cleanup)
        │   └── Add debug logging for set/clear operations
        └── #cleanup()            # UNCHANGED
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: process.env always stores strings, never numbers
// WRONG:
process.env.PRP_PIPELINE_RUNNING = process.pid; // Stores number as string

// RIGHT:
const currentPid = process.pid.toString();
process.env.PRP_PIPELINE_RUNNING = currentPid;

// CRITICAL: Only clear guard if we own it (same PID)
// WRONG:
delete process.env.PRP_PIPELINE_RUNNING; // Clears even if different process set it

// RIGHT:
if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
  delete process.env.PRP_PIPELINE_RUNNING;
}

// GOTCHA: Existing finally block calls this.cleanup()
// Must add guard clearing BEFORE cleanup() call
// finally {
//   if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
//     delete process.env.PRP_PIPELINE_RUNNING;
//     this.logger.debug(`[PRPPipeline] Cleared PRP_PIPELINE_RUNNING`);
//   }
//   await this.cleanup(); // Must be after guard clearing
// }

// PATTERN: Debug logging uses [PRPPipeline] prefix
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${process.pid}`);
this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');

// GOTCHA: Tests use vi.unstubAllEnvs() in afterEach
// Must restore environment between tests to prevent test pollution
afterEach(() => {
  vi.unstubAllEnvs();
});

// GOTCHA: Logger has two instances
// this.logger - base logger from Workflow class
// this.correlationLogger - child logger with correlation ID
// Use this.logger for guard operations (not critical path)
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Implementation uses:

- `process.env.PRP_PIPELINE_RUNNING` - String environment variable
- `process.pid` - Number, converted to string
- `this.logger` - Logger instance from base Workflow class

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: MODIFY src/workflows/prp-pipeline.ts run() method signature
  - ADD: const currentPid = process.pid.toString() at start of run() method
  - LOCATION: After line 1666 (this.#startTime = performance.now())
  - PATTERN: Store PID before try block for use in finally
  - NAMING: Use camelCase 'currentPid' for consistency

Task 2: MODIFY src/workflows/prp-pipeline.ts run() try block
  - ADD: Set PRP_PIPELINE_RUNNING after SessionManager creation
  - LOCATION: After line 1700 (SessionManager constructor)
  - PATTERN: process.env.PRP_PIPELINE_RUNNING = currentPid
  - LOGGING: this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`)
  - NOTE: This happens AFTER validateNestedExecution() is called (previous subtask)

Task 3: MODIFY src/workflows/prp-pipeline.ts run() finally block
  - ADD: Clear guard if we own it, BEFORE cleanup() call
  - LOCATION: Before line 1809 (await this.cleanup())
  - PATTERN:
    if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
      delete process.env.PRP_PIPELINE_RUNNING;
      this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');
    }
  - CRITICAL: Must be before cleanup() call
  - CRITICAL: Use exact string comparison (currentPid is already string)

Task 4: UPDATE tests/unit/workflows/prp-pipeline.test.ts
  - ADD: Test that guard is set during pipeline execution
  - ADD: Test that guard is cleared after pipeline completion
  - ADD: Test that guard is cleared even on error
  - FOLLOW: Existing test patterns in prp-pipeline.test.ts
  - CLEANUP: Use vi.unstubAllEnvs() in afterEach

Task 5: RUN validation
  - EXECUTE: npm test -- tests/unit/workflows/prp-pipeline.test.ts
  - VERIFY: All tests pass
  - CHECK: No regressions in other test files
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: PID Storage at Method Entry
// Location: src/workflows/prp-pipeline.ts run() method
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  // ADD THIS: Store current PID as string for guard operations
  const currentPid = process.pid.toString();

  // ... rest of method ...

  try {
    // ... workflow steps ...
  } catch (error) {
    // ... error handling ...
  } finally {
    // ADD THIS: Clear guard if we own it
    if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
      delete process.env.PRP_PIPELINE_RUNNING;
      this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');
    }
    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}

// Pattern 2: Setting the Guard After Validation
// Location: After SessionManager creation in try block
try {
  // Create SessionManager (may throw if PRD doesn't exist)
  this.sessionManager = new SessionManagerClass(
    this.#prdPath,
    this.#planDir,
    this.#flushRetries
  );

  // ADD THIS: Set guard after validation passes (validateNestedExecution called in S3)
  process.env.PRP_PIPELINE_RUNNING = currentPid;
  this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

  // Execute workflow steps
  await this.initializeSession();
  // ... rest of workflow ...
}

// Pattern 3: Debug Logging Format
// Follow existing patterns in PRP Pipeline
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);
this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');

// GOTCHA: Use this.logger, not this.correlationLogger
// Guard operations are not critical path, use base logger

// Pattern 4: PID Ownership Check
// CRITICAL: Only clear if we own the guard
if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
  delete process.env.PRP_PIPELINE_RUNNING;
  // This prevents clearing a guard set by a different process
}

// Pattern 5: Test Environment Cleanup
// Location: tests/unit/workflows/prp-pipeline.test.ts
describe('PRPPipeline Guard Behavior', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // CRITICAL: Restore environment between tests
  });

  it('should set PRP_PIPELINE_RUNNING during execution', async () => {
    delete process.env.PRP_PIPELINE_RUNNING;
    const pipeline = new PRPPipeline('./test/PRD.md');

    await pipeline.run();

    // Guard should be cleared after completion
    expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();
  });
});
```

### Integration Points

```yaml
PRP_PIPELINE_RUN:
  - variable: process.env.PRP_PIPELINE_RUNNING
  - value: process.pid.toString() (string, not number)
  - lifecycle: Set after validation, cleared in finally

LOGGING:
  - logger: this.logger (base logger, not correlationLogger)
  - level: debug
  - format: `[PRPPipeline] Set PRP_PIPELINE_RUNNING=<pid>`
  - format: `[PRPPipeline] Cleared PRP_PIPELINE_RUNNING`

VALIDATION_ORDER:
  - depends_on: P1.M3.T2.S3 (validateNestedExecution function)
  - sequence: validateNestedExecution() -> set guard -> run workflow -> clear guard
  - location: Guard set after SessionManager creation

TEST_INFRASTRUCTURE:
  - framework: Vitest
  - cleanup: vi.unstubAllEnvs() in afterEach
  - mock: vi.stubEnv() for setting environment variables
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run lint                 # Check for linting errors
npm run format               # Format with Prettier
npm run type-check           # TypeScript type checking

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific file
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Test all guard-related tests
npm test -- tests/unit/nested-execution-guard.test.ts

# Run all unit tests
npm test -- tests/unit/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite
npm test

# Expected: All tests pass, no regressions

# Manual verification (if needed)
# Check that guard is set during execution
# Check that guard is cleared after completion
# Check that guard is cleared even on error
```

### Level 4: Guard-Specific Validation

```bash
# Test guard set behavior
node -e "
  const pid = process.pid.toString();
  process.env.PRP_PIPELINE_RUNNING = pid;
  console.log('Guard set:', process.env.PRP_PIPELINE_RUNNING);
  console.log('PID match:', process.env.PRP_PIPELINE_RUNNING === pid);
  delete process.env.PRP_PIPELINE_RUNNING;
  console.log('Guard cleared:', process.env.PRP_PIPELINE_RUNNING);
"

# Expected output:
# Guard set: <pid>
# PID match: true
# Guard cleared: undefined
```

## Final Validation Checklist

### Technical Validation

- [ ] Guard is set to current PID after SessionManager creation
- [ ] Guard is cleared in finally block before cleanup() call
- [ ] Guard is only cleared if PID matches currentPid
- [ ] Debug logging occurs on set: `Set PRP_PIPELINE_RUNNING=<pid>`
- [ ] Debug logging occurs on clear: `Cleared PRP_PIPELINE_RUNNING`
- [ ] Finally block executes even on errors/interruptions
- [ ] All existing tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

### Feature Validation

- [ ] Guard prevents nested execution (when combined with S3 validation)
- [ ] Guard allows bug fix recursion (when combined with S3 validation)
- [ ] Guard is cleared on successful completion
- [ ] Guard is cleared on error/exception
- [ ] Guard is cleared on interruption (SIGINT/SIGTERM)
- [ ] Multiple sequential executions work (guard is cleared between runs)

### Code Quality Validation

- [ ] Follows existing PRP Pipeline logging patterns
- [ ] Uses this.logger (not this.correlationLogger)
- [ ] PID stored as string, not number
- [ ] Ownership check before clearing guard
- [ ] Guard clearing happens before cleanup() call
- [ ] No new files created (only modification to existing file)

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] Debug logs are informative but not verbose
- [ ] Test environment is properly cleaned up between tests

## Anti-Patterns to Avoid

- ❌ Don't set guard before validateNestedExecution() is called
- ❌ Don't use process.pid directly without .toString()
- ❌ Don't clear guard without PID ownership check
- ❌ Don't clear guard after cleanup() call (must be before)
- ❌ Don't use correlationLogger for guard operations (use base logger)
- ❌ Don't forget debug logging for set/clear operations
- ❌ Don't skip vi.unstubAllEnvs() in test afterEach
- ❌ Don't assume guard is set (always check before clearing)

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Reasoning**:

- Exact file location and line numbers provided
- Complete code examples with proper patterns
- All dependencies documented
- Test structure already exists
- Clear anti-patterns to avoid
- Comprehensive validation steps

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement the guard variable successfully using only the PRP content and codebase access.
