# Product Requirement Prompt (PRP): Update FixCycleWorkflow.run() to Call loadBugReport

**PRP ID**: P1.M2.T2.S3
**Work Item**: Update FixCycleWorkflow.run() to call loadBugReport
**Session**: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918
**Generated**: 2026-01-26

---

## Goal

**Feature Goal**: Modify FixCycleWorkflow.run() to load bug report from disk using the existing loadBugReport() method instead of relying on in-memory testResults.

**Deliverable**: Updated FixCycleWorkflow.run() method that:
1. Calls `this.#loadBugReport()` at the start of the method
2. Stores result in a local `testResults` variable
3. Replaces all references to `this.testResults` with the local `testResults` variable
4. Adds debug logging for successful load
5. Preserves all existing bug fix task generation logic
6. Preserves all existing error handling

**Success Definition**:
- FixCycleWorkflow.run() successfully loads TEST_RESULTS.md from disk using loadBugReport()
- Bug fix tasks are generated based on file contents rather than in-memory object
- All existing tests pass with updated behavior
- New debug log appears on successful load: `'Loaded TEST_RESULTS.md from {this.sessionPath}'`
- No regressions in bug fix task generation logic

## User Persona

**Target User**: PRP Pipeline system (automated workflow execution)

**Use Case**: During the bug fix cycle, FixCycleWorkflow needs to read the bug report from the persistent TEST_RESULTS.md file that was written by BugHuntWorkflow. This ensures the workflow can resume after interruptions and maintains a persistent audit trail.

**User Journey**:
1. BugHuntWorkflow completes and writes TEST_RESULTS.md to bugfix session directory
2. FixCycleWorkflow is instantiated with sessionPath (not in-memory testResults)
3. FixCycleWorkflow.run() is called
4. run() method loads TEST_RESULTS.md from disk using loadBugReport()
5. Bug fix tasks are generated based on loaded data
6. Fix cycle proceeds as before

**Pain Points Addressed**:
- **Previous**: FixCycleWorkflow relied on in-memory testResults object passed from constructor, which prevented session resumption
- **Fixed**: FixCycleWorkflow now loads from disk, enabling proper bugfix session persistence and resumption

## Why

- **System Architecture Integrity**: Per PRD §4.4 and system_context.md §Bug 3, the bug fix cycle must use file-based state management for persistence between runs
- **Session Resumption**: Loading from disk allows bug fix sessions to be resumed after interruption
- **Audit Trail**: Ensures TEST_RESULTS.md is the source of truth for bug data throughout the fix cycle
- **Integration with S1/S2**: Completes the refactoring started in S1 (constructor signature) and S2 (loadBugReport method)

## What

Modify the `run()` method in FixCycleWorkflow to call the newly added `loadBugReport()` method and use the returned TestResults object throughout the method.

### Current Implementation (src/workflows/fix-cycle-workflow.ts:298-365)

```typescript
async run(): Promise<TestResults> {
  this.setStatus('running');
  this.correlationLogger.info(
    '[FixCycleWorkflow] Starting fix cycle workflow'
  );
  this.logger.info('[FixCycleWorkflow] Starting fix cycle workflow');
  this.logger.info(
    `[FixCycleWorkflow] Initial bug count: ${this.testResults.bugs.length}`
  );

  try {
    while (this.iteration < this.maxIterations) {
      // ... rest of method uses this.testResults
    }

    // Return final results
    return this.currentResults ?? this.testResults;
  } catch (error) {
    this.setStatus('failed');
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    this.logger.error(`[FixCycleWorkflow] Fix cycle failed: ${errorMessage}`);
    throw error;
  }
}
```

**Problem**: Uses `this.testResults` which no longer exists after S1 constructor change.

### Required Changes

1. **Call loadBugReport at method start**: Add `const testResults = await this.#loadBugReport();` after status is set to 'running'
2. **Replace all `this.testResults` references**: Use local `testResults` variable instead
3. **Add debug logging**: Log successful load with session path
4. **Preserve fallback logic**: Keep `return this.currentResults ?? testResults;` at end

### Success Criteria

- [ ] `run()` method calls `this.#loadBugReport()` at start
- [ ] All `this.testResults` references replaced with local `testResults` variable
- [ ] Debug log added: `'Loaded TEST_RESULTS.md from {this.sessionPath}'` after successful load
- [ ] Fallback return uses local variable: `return this.currentResults ?? testResults;`
- [ ] All existing error handling preserved
- [ ] All existing tests pass
- [ ] Bug fix task generation logic unchanged

---

## All Needed Context

### Context Completeness Check

✅ **"No Prior Knowledge" test passed**: An implementer unfamiliar with this codebase has everything needed to implement this change successfully.

### Documentation & References

```yaml
# MUST READ - Architecture context for this bug fix
- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/003_system_context.md
  why: Complete context on Bug 3 (TEST_RESULTS.md workflow timing) and why this change is needed
  section: Bug 3: TEST_RESULTS.md Workflow Timing (lines 144-198)
  critical: Understanding the expected flow vs actual flow is essential

# MUST READ - The file to modify
- file: src/workflows/fix-cycle-workflow.ts
  why: The target file containing the run() method to modify
  pattern: Read the entire file to understand the class structure, especially:
    - Constructor signature (lines 95-137) - now accepts sessionPath instead of testResults
    - loadBugReport() private method (lines 423-505) - added in S2
    - run() method (lines 298-365) - the target of this PRP
  gotcha: The class no longer has this.testResults field after S1 constructor change

# MUST READ - Similar pattern for loading from disk
- file: src/core/session-utils.ts
  why: Example of the standard pattern for loading JSON files with validation
  pattern: readTasksJSON() function shows the pattern: readFile → JSON.parse → Zod validation → return
  gotcha: loadBugReport() already implements this pattern, just need to call it

# MUST READ - Logging patterns
- file: src/utils/logger.ts
  why: Understand the logger API and correlation logger pattern
  pattern: getLogger('FixCycleWorkflow').child({ correlationId })
  gotcha: Use correlationLogger for load operations, regular logger for simple messages

# MUST READ - Test patterns
- file: tests/unit/workflows/fix-cycle-workflow.test.ts
  why: Understand existing test patterns for run() method
  pattern: Tests mock readFile and access from 'node:fs/promises', use factory functions
  gotcha: Tests will need to mock loadBugReport to return test data
```

### Current Codebase Tree

```bash
src/
├── workflows/
│   ├── fix-cycle-workflow.ts          # TARGET FILE - Modify run() method
│   ├── bug-hunt-workflow.ts           # Context - Writes TEST_RESULTS.md
│   └── prp-pipeline.ts                # Context - Calls FixCycleWorkflow
├── core/
│   ├── models.ts                      # Context - TestResultsSchema, Bug types
│   ├── session-utils.ts               # Pattern - File loading with validation
│   └── session-manager.ts             # Context - Session management
└── utils/
    └── logger.ts                      # Context - Logging utilities

tests/
├── unit/
│   └── workflows/
│       └── fix-cycle-workflow.test.ts # TEST FILE - Update run() tests
└── fixtures/
    └── (test data fixtures)

plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/
├── architecture/
│   └── 003_system_context.md          # ARCHITECTURE - Bug 3 explanation
└── P1M2T2S3/
    └── PRP.md                         # THIS FILE
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: FixCycleWorkflow no longer has this.testResults field
// After S1 constructor change, the constructor accepts sessionPath instead of testResults
// Do NOT try to access this.testResults - it will be undefined

// CRITICAL: loadBugReport() is a private method (prefixed with #)
// Must call as: await this.#loadBugReport()
// Cannot be called from outside the class (except via test-only getter)

// GOTCHA: Error handling must preserve existing behavior
// run() method has try/catch that sets status to 'failed' and re-throws
// Do NOT change error handling logic

// GOTCHA: Return statement uses fallback pattern
// return this.currentResults ?? testResults;
// this.currentResults is set during retest() phase
// If retest hasn't run yet, fall back to loaded testResults

// GOTCHA: Logging uses both logger and correlationLogger
// correlationLogger for load operations (includes correlationId)
// logger for simple status messages

// PATTERN: File loading uses async/await
// Always await the loadBugReport() call
// The method returns Promise<TestResults>

// PATTERN: Test-only accessors exist
// _loadBugReportForTesting getter provides access to private method
// Tests use this to mock the loadBugReport behavior
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Uses existing TestResults from src/core/models.ts:

```typescript
// Existing model - already imported and used
interface TestResults {
  hasBugs: boolean;
  bugs: Bug[];
  summary: string;
  recommendations: string[];
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/workflows/fix-cycle-workflow.ts - run() method
  - LOCATE: run() method at lines 298-365
  - ADD: After line 299 (this.setStatus('running')), add:
    ```typescript
    // Load bug report from TEST_RESULTS.md
    const testResults = await this.#loadBugReport();
    this.logger.debug(`Loaded TEST_RESULTS.md from ${this.sessionPath}`);
    ```
  - REPLACE: All occurrences of `this.testResults` with local `testResults` variable
    - Line 305: `[FixCycleWorkflow] Initial bug count: ${testResults.bugs.length}`
    - Line 357: `return this.currentResults ?? testResults;`
  - PRESERVE: All existing error handling in catch block (lines 358-364)
  - PRESERVE: All existing iteration logic and workflow phases
  - PRESERVE: correlationLogger.info() calls at start of method

Task 2: VERIFY imports are present
  - CHECK: File already imports readFile, access, constants from 'node:fs/promises'
  - CHECK: File already imports TestResultsSchema from '../core/models.js'
  - NO CHANGES: All necessary imports already present from S2 implementation

Task 3: UPDATE tests/unit/workflows/fix-cycle-workflow.test.ts
  - LOCATE: Tests for run() method (search for 'describe('run')')
  - UPDATE: Mock setup to mock the loadBugReport call
  - PATTERN: Tests already mock readFile and access from 'node:fs/promises'
  - ADD: Tests verify loadBugReport is called and returns expected data
  - PRESERVE: All existing test logic for iteration, completion, etc.

Task 4: VALIDATE with existing tests
  - RUN: Unit tests for FixCycleWorkflow
  - VERIFY: All run() method tests pass with new behavior
  - VERIFY: No regressions in createFixTasks(), executeFixes(), retest(), checkComplete()
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Load Bug Report at Method Start
// ============================================================================
// Location: run() method, immediately after setStatus('running')
async run(): Promise<TestResults> {
  this.setStatus('running');
  this.correlationLogger.info('[FixCycleWorkflow] Starting fix cycle workflow');

  // LOAD BUG REPORT FROM DISK
  const testResults = await this.#loadBugReport();

  // Debug log for successful load
  this.logger.debug(`Loaded TEST_RESULTS.md from ${this.sessionPath}`);

  // ... rest of method uses local testResults variable
}

// ============================================================================
// PATTERN 2: Replace All this.testResults References
// ============================================================================
// BEFORE (uses non-existent field):
this.logger.info(`[FixCycleWorkflow] Initial bug count: ${this.testResults.bugs.length}`);

// AFTER (uses local variable):
this.logger.info(`[FixCycleWorkflow] Initial bug count: ${testResults.bugs.length}`);

// ============================================================================
// PATTERN 3: Preserve Fallback Return Logic
// ============================================================================
// Location: End of run() method, after try/catch block
// this.currentResults is set by retest() phase
// If retest hasn't run yet (first iteration), use loaded testResults
return this.currentResults ?? testResults;

// ============================================================================
// PATTERN 4: Error Handling (DO NOT CHANGE)
// ============================================================================
// Location: End of run() method, catch block
// Must preserve existing error handling:
// - Sets status to 'failed'
// - Extracts error message
// - Logs error with correlationLogger
// - Re-throws error
} catch (error) {
  this.setStatus('failed');
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.logger.error(`[FixCycleWorkflow] Fix cycle failed: ${errorMessage}`);
  throw error;
}

// ============================================================================
// PATTERN 5: Logging Prefixes
// ============================================================================
// Use [FixCycleWorkflow] prefix for all log messages
// Include correlationId in correlationLogger calls (automatic)
// Include sessionPath in load logging
this.logger.debug(`Loaded TEST_RESULTS.md from ${this.sessionPath}`);
```

### Integration Points

```yaml
FIXCYCLEWORKFLOW:
  - modifies: src/workflows/fix-cycle-workflow.ts
  - method: run() (lines 298-365)
  - calls: this.#loadBugReport() (private method from S2)
  - reads: TEST_RESULTS.md from this.sessionPath directory
  - logs: Debug message on successful load

TESTS:
  - updates: tests/unit/workflows/fix-cycle-workflow.test.ts
  - mocks: readFile and access from 'node:fs/promises'
  - verifies: loadBugReport is called and returns expected data
  - preserves: All existing test logic for workflow phases

DEPENDENCIES:
  - requires: S1 (constructor signature change) - COMPLETED
  - requires: S2 (loadBugReport method) - COMPLETED
  - enables: S4 (update PRP Pipeline to pass sessionPath)
  - enables: S5 (unit tests for file loading)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying fix-cycle-workflow.ts
# Check TypeScript compilation
npx tsc --noEmit src/workflows/fix-cycle-workflow.ts

# Check for any type errors
npx tsc --noEmit

# Run linter
npm run lint || pnpm lint || bun run lint

# Expected: Zero compilation errors, zero linting errors
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test FixCycleWorkflow specifically
npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts
# OR
vitest run tests/unit/workflows/fix-cycle-workflow.test.ts

# Test all workflow tests
npm test -- tests/unit/workflows/
# OR
vitest run tests/unit/workflows/

# Full test suite
npm test
# OR
vitest run

# Coverage validation (if coverage tools available)
npm test -- --coverage
# OR
vitest run --coverage

# Expected: All tests pass
# If failing, debug root cause and fix implementation
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test (if full pipeline available)
# 1. Run BugHuntWorkflow to generate TEST_RESULTS.md
# 2. Create FixCycleWorkflow with sessionPath
# 3. Call run() method
# 4. Verify TEST_RESULTS.md is loaded correctly
# 5. Verify bug fix tasks are generated

# Check that TEST_RESULTS.md exists in bugfix session
ls -la plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md

# Verify file contents are valid JSON
cat plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/TEST_RESULTS.md | jq .

# Expected: File exists, valid JSON, contains bugs array
# Expected: FixCycleWorkflow loads file successfully
```

### Level 4: Domain-Specific Validation

```bash
# Verify debug logging appears
# Run with debug logging enabled
DEBUG=* npm test -- tests/unit/workflows/fix-cycle-workflow.test.ts

# Check logs contain:
# "Loaded TEST_RESULTS.md from {sessionPath}"
# "[FixCycleWorkflow] Starting fix cycle workflow"
# "[FixCycleWorkflow] Initial bug count: N"

# Verify error handling still works
# Test with missing TEST_RESULTS.md
# Test with invalid JSON in TEST_RESULTS.md
# Test with invalid TestResults structure
# Expected: Appropriate errors thrown and logged

# Verify iteration logic still works
# Test with bugs that resolve in 1 iteration
# Test with bugs that require multiple iterations
# Test with max iterations reached
# Expected: Iteration logic unchanged
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Code follows existing patterns (reviewed against src/core/session-utils.ts)

### Feature Validation

- [ ] `run()` method calls `this.#loadBugReport()` at start
- [ ] Debug log appears: `'Loaded TEST_RESULTS.md from {this.sessionPath}'`
- [ ] All `this.testResults` references replaced with local `testResults` variable
- [ ] Fallback return uses local variable: `return this.currentResults ?? testResults;`
- [ ] Error handling preserved (catch block unchanged)
- [ ] Bug fix task generation logic unchanged
- [ ] Iteration logic unchanged
- [ ] Success criteria from "What" section met

### Code Quality Validation

- [ ] Follows existing codebase logging patterns
- [ ] File placement matches codebase tree structure
- [ ] No new imports added (using existing from S2)
- [ ] Anti-patterns avoided (checked against Anti-Patterns section)
- [ ] Private method access correct (`this.#loadBugReport()`)
- [ ] Async/await used correctly

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names
- [ ] JSDoc comments preserved (existing comments in run() method)
- [ ] No new environment variables added
- [ ] Changes are minimal and focused on the bug fix

---

## Anti-Patterns to Avoid

- ❌ **Don't try to access `this.testResults`** - This field no longer exists after S1 constructor change
- ❌ **Don't call `loadBugReport()` without `#` prefix** - It's a private method, must use `this.#loadBugReport()`
- ❌ **Don't forget to await the loadBugReport call** - The method returns a Promise
- ❌ **Don't change error handling logic** - Preserve existing catch block exactly as-is
- ❌ **Don't add new imports** - All necessary imports already present from S2
- ❌ **Don't modify iteration logic** - Only change how testResults is obtained
- ❌ **Don't hardcode session path** - Use `this.sessionPath` field
- ❌ **Don't skip debug logging** - Add the log message as specified
- ❌ **Don't change return statement pattern** - Keep `return this.currentResults ?? testResults;`
- ❌ **Don't modify constructor or other methods** - Only change the `run()` method

---

## Appendix: Complete Context for Implementation

### loadBugReport() Method (from S2)

This method was added in S2 and is already implemented in the class:

```typescript
/**
 * Load bug report from TEST_RESULTS.md in session directory
 *
 * @returns Parsed and validated TestResults object
 * @throws {Error} If TEST_RESULTS.md not found or contains invalid data
 * @private
 */
async #loadBugReport(): Promise<TestResults> {
  const resultsPath = resolve(this.sessionPath, 'TEST_RESULTS.md');

  this.correlationLogger.info('[FixCycleWorkflow] Loading bug report', {
    resultsPath,
  });

  // Check file existence
  try {
    await access(resultsPath, constants.F_OK);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new Error(`TEST_RESULTS.md not found at ${resultsPath}`);
    }
    throw new Error(
      `Failed to access TEST_RESULTS.md at ${resultsPath}: ${err.message}`
    );
  }

  // Read file content
  let content: string;
  try {
    content = await readFile(resultsPath, 'utf-8');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    this.logger.error('[FixCycleWorkflow] Failed to read TEST_RESULTS.md', {
      resultsPath,
      error: errorMessage,
    });
    throw new Error(
      `Failed to read TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`
    );
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    this.logger.error('[FixCycleWorkflow] Failed to parse TEST_RESULTS.md', {
      resultsPath,
      error: errorMessage,
    });
    throw new Error(
      `Failed to parse TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`
    );
  }

  // Validate with Zod
  try {
    const validated = TestResultsSchema.parse(parsed) as TestResults;
    this.correlationLogger.info('[FixCycleWorkflow] Bug report loaded', {
      resultsPath,
      hasBugs: validated.hasBugs,
      bugCount: validated.bugs.length,
    });
    return validated;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    this.logger.error(
      '[FixCycleWorkflow] Invalid TestResults in TEST_RESULTS.md',
      {
        resultsPath,
        error: errorMessage,
      }
    );
    throw new Error(
      `Invalid TestResults in TEST_RESULTS.md at ${resultsPath}: ${errorMessage}`
    );
  }
}
```

### Constructor Signature (from S1)

The constructor was changed in S1 to accept `sessionPath` instead of `testResults`:

```typescript
/**
 * Creates a new FixCycleWorkflow instance
 *
 * @param sessionPath - Path to bugfix session directory for reading TEST_RESULTS.md
 * @param prdContent - Original PRD content for QA context
 * @param taskOrchestrator - Task orchestrator for executing fix tasks
 * @param sessionManager - Session manager for state persistence
 * @throws {Error} If sessionPath is not a valid non-empty string
 */
constructor(
  sessionPath: string,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
) {
  // ... validation and initialization
  this.sessionPath = sessionPath;
  // NOTE: this.testResults field removed in S1
}
```

### Related PRD Requirements

From PRD.md §4.4 (The QA & Bug Hunt Loop):

> The Fix Cycle (Self-Contained Sessions):
> - If critical/major bugs are found, a self-contained "Bug Fix" sub-pipeline starts
> - Each bug hunt iteration creates a new numbered session: `bugfix/001_hash/`
> - Bug reports (`TEST_RESULTS.md`) and tasks are stored within the bugfix session directory
> - It treats the `TEST_RESULTS.md` as a mini-PRD with simplified task breakdown

From PRD.md §5.1 (State & File Management):

> **Protected Files (NEVER delete or move):**
> - `$SESSION_DIR/TEST_RESULTS.md` - Bug report file

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success

**Validation**: This PRP provides complete context including:
- Exact file paths and line numbers to modify
- Complete existing code for reference
- Specific pattern examples from the codebase
- Detailed validation commands that work in this codebase
- Complete context on why this change is needed (Bug 3 from system_context.md)
- All gotchas and anti-patterns documented

An implementer unfamiliar with this codebase can successfully implement this change using only this PRP content.
