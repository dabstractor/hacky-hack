# PRP: Investigate Promise Rejection Warnings - P4.M2.T1.S1

## Goal

**Feature Goal**: Eliminate `PromiseRejectionHandledWarning` messages that appear during integration test execution by identifying and fixing unhandled promise rejections in test fixtures and test code.

**Deliverable**: Analysis document identifying all sources of unhandled promise rejections, plus code fixes adding proper `.catch()` handlers and error boundaries to affected test files.

**Success Definition**:
- Integration tests run with zero `PromiseRejectionHandledWarning` messages
- Stack trace preservation test passes ("should preserve stack trace through error wrapping")
- All integration tests pass with clean output
- Global promise rejection tracking added to test setup for early detection
- Async operations in test hooks have proper error boundaries

## User Persona

**Target User**: Developer implementing Phase P4 (Minor Bug Fixes - Polish) who needs to eliminate promise rejection warnings that clutter test output and may mask real test failures.

**Use Case**: During test execution, `PromiseRejectionHandledWarning` messages appear, indicating that promise rejections are being handled asynchronously. The developer needs to identify which tests or setup code causes unhandled rejections and add proper handlers.

**User Journey**:
1. Developer reads this PRP to understand the investigation approach
2. Developer runs integration tests with rejection tracking enabled
3. Developer identifies which tests/operations cause unhandled rejections
4. Developer adds proper `.catch()` handlers and error boundaries
5. Developer verifies fixes with test suite runs
6. Developer confirms all warnings are eliminated

**Pain Points Addressed**:
- **Noisy test output**: PromiseRejectionHandledWarning messages clutter test results
- **Masked failures**: Real issues may be hidden among warnings
- **Test reliability**: Async handlers may not complete before test ends
- **Debugging difficulty**: Warnings make it hard to identify actual problems

## Why

- **Business Value**: Clean test output improves developer productivity and ensures test failures are immediately visible. Promise rejection warnings can indicate timing issues or error handling bugs that should be fixed.
- **Integration**: This investigation resolves PRD Issue 7 identified in the bug analysis. The warnings indicate unhandled promise rejections that should be caught and handled properly.
- **Problem Solved**:
  - Eliminates `PromiseRejectionHandledWarning` messages from test output
  - Fixes stack trace preservation test that currently fails
  - Adds global promise rejection tracking for early detection
  - Ensures all async operations in tests have proper error boundaries
  - Improves test reliability and debugging experience

## What

Investigate and fix all sources of unhandled promise rejections in integration tests by running tests with rejection tracking, identifying problematic patterns, and adding proper `.catch()` handlers and error boundaries.

### Success Criteria

- [ ] No `PromiseRejectionHandledWarning` messages during integration test execution
- [ ] Stack trace preservation test passes (`tests/integration/utils/error-handling.test.ts:344-367`)
- [ ] Global rejection tracking added to `tests/setup.ts`
- [ ] All affected test files have proper error boundaries
- [ ] Async operations in test hooks have `.catch()` handlers
- [ ] All integration tests pass with clean output

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
1. Exact test files and line numbers to investigate
2. Specific promise handling patterns causing issues
3. Complete code examples showing problematic vs. correct patterns
4. Global rejection tracking implementation
5. Validation commands and expected output
6. Research findings from external sources
7. Understanding of PRD Issue 7 and related work
8. Parallel execution context from P4.M1.T1.S1

### Documentation & References

```yaml
# PRIMARY: Parallel execution context - understand what P4.M1.T1.S1 produces
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M1T1S1/PRP.md
  why: P4.M1.T1.S1 adds { quiet: true } to dotenv.config() in tests/setup.ts
  contract: tests/setup.ts will have quiet dotenv loading when this task starts
  integration: This PRP builds on that by adding promise rejection tracking to same file
  evidence: P4.M1.T1.S1 modifies only line 23 (dotenv.config call), this PRP adds hooks

# PRIMARY: Stack trace preservation test - the failing test to fix
- file: tests/integration/utils/error-handling.test.ts
  why: Contains the failing "should preserve stack trace through error wrapping" test
  lines: 344-367 - Test that expects PipelineError.cause to be TaskError instance
  pattern: Test creates async inner/outer functions to verify error chain preservation
  gotcha: Currently fails with "expected undefined to be an instance of TaskError"
  critical: This is the primary test affected by promise rejection handling issues

# PRIMARY: Integration test files with problematic patterns
- file: tests/integration/core/task-orchestrator-e2e.test.ts
  why: Contains uncaught promise rejection in beforeEach (line 266)
  lines: 259-267 - beforeEach with await sessionManager.loadSession() without .catch()
  pattern: Async operation in test hook without error handler
  fix: Add .catch() handler to loadSession call

# PRIMARY: Process signal handling without cleanup
- file: tests/integration/prp-pipeline-shutdown.test.ts
  why: Tests emit process signals that may trigger async operations
  lines: 307-311, 380-383 - process.emit('SIGTERM') calls
  pattern: Signal emission without waiting for async handlers to complete
  fix: Add setImmediate delays after signal emission to allow handlers to complete

# PRIMARY: Mock timers with dangling promises
- file: tests/e2e/pipeline.test.ts
  why: Mock child process uses setTimeout without cleanup mechanism
  lines: 151-165 - setTimeout callbacks in mock implementations
  pattern: Timer callbacks that may create dangling promises if test ends early
  fix: Store timeout IDs and clear them in afterEach

# PRIMARY: Global test setup file - modification target
- file: tests/setup.ts
  why: Target file for adding global promise rejection tracking
  lines: 40-50 - Existing beforeEach/afterEach hooks
  pattern: Currently has vi.clearAllMocks() and vi.unstubAllEnvs()
  integration: Add unhandledRejection tracking alongside existing hooks
  gotcha: Must not interfere with dotenv quiet mode from P4.M1.T1.S1

# PRIMARY: Vitest configuration
- file: vitest.config.ts
  why: Confirms Vitest is the test framework and shows global setup configuration
  lines: 19 - setupFiles: ['./tests/setup.ts']
  pattern: Global setup file runs before all tests
  critical: Any additions to tests/setup.ts affect all test files

# PRIMARY: Error handling implementation
- file: src/core/errors.ts
  why: Contains error classes that should preserve prototype chains and cause
  lines: 67-101 - TaskError class definition
  lines: 150-174 - PipelineError class definition
  pattern: Error classes using Object.setPrototypeOf and cause option
  critical: Stack trace preservation depends on correct error construction

# EXTERNAL: Node.js unhandledRejection documentation
- url: https://nodejs.org/api/process.html#event-unhandledrejection
  why: Official documentation for unhandledRejection event
  section: Event: 'unhandledRejection'
  critical: Explains when and why Node.js emits PromiseRejectionHandledWarning

# EXTERNAL: Node.js rejectionHandled documentation
- url: https://nodejs.org/api/process.html#event-rejectionhandled
  why: Official documentation for rejectionHandled event
  section: Event: 'rejectionHandled'
  note: Explains the async handling race condition

# EXTERNAL: Vitest async testing guide
- url: https://vitest.dev/guide/advanced/
  why: Official Vitest documentation for async testing patterns
  section: Testing Async Code
  critical: Shows best practices for async test hooks and cleanup

# EXTERNAL: MDN Promise guide
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  why: Comprehensive guide to promise usage and error handling
  section: Error handling with promises
  note: Shows correct patterns for .catch() handlers

# RESEARCH: Stored research findings
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M2T1S1/research/
  why: Comprehensive research on promise rejection handling and integration test analysis
  files:
    - 01-integration-test-analysis.md - Detailed analysis of problematic test patterns
    - 02-prd-issue-7-context.md - PRD Issue 7 context and success criteria
    - 03-nodejs-promise-rejection-handling.md - Node.js promise handling best practices

# INPUT: Work item definition
- docfile: plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  why: Contains the original work item description for P4.M2.T1.S1
  section: P4.M2.T1 - "Add proper promise rejection handlers"
  contract: Defines input (test output), logic (investigation approach), output (analysis + fixes)

# REFERENCE: Existing promise rejection handler test
- file: tests/unit/utils/promise-handling-validator.test.ts
  why: Shows existing pattern for tracking unhandled rejections in tests
  lines: 599-669 - PromiseRejectionHandledWarning detection test suite
  pattern: Uses process.on('unhandledRejection') with beforeEach/afterEach cleanup
  critical: Demonstrates the pattern to use in global test setup

# REFERENCE: Main application global handlers
- file: src/index.ts
  why: Shows production global rejection handling pattern
  lines: 56-73 - setupGlobalHandlers() function
  pattern: process.on('unhandledRejection', ...) with console.error
  note: Test environment needs similar but stricter handling (fail tests)
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack/
├── tests/
│   ├── setup.ts                          # MODIFY: Add promise rejection tracking
│   ├── integration/
│   │   ├── prp-pipeline-integration.test.ts       # REVIEW: Async cleanup
│   │   ├── prp-pipeline-shutdown.test.ts          # MODIFY: Signal handler cleanup
│   │   ├── core/
│   │   │   ├── task-orchestrator-e2e.test.ts     # MODIFY: Add .catch() to beforeEach
│   │   │   ├── session-manager.test.ts            # REVIEW: Promise.all patterns
│   │   │   └── task-orchestrator-runtime.test.ts  # REVIEW: Async operations
│   │   ├── utils/
│   │   │   └── error-handling.test.ts            # FIX: Stack trace preservation test
│   │   └── fix-cycle-workflow-integration.test.ts # REVIEW: Async workflow
│   ├── e2e/
│   │   ├── pipeline.test.ts                       # MODIFY: Mock timer cleanup
│   │   └── delta.test.ts                          # REVIEW: Async patterns
│   └── unit/
│       └── utils/
│           └── promise-handling-validator.test.ts # REFERENCE: Rejection tracking pattern
├── src/
│   ├── index.ts                         # REFERENCE: Global handlers pattern
│   └── core/
│       └── errors.ts                    # REFERENCE: Error class definitions
├── vitest.config.ts                     # REFERENCE: Test framework configuration
└── plan/
    └── 002_1e734971e481/bugfix/001_8d809cc989b9/
        └── P4M2T1S1/
            ├── PRP.md                   # This document
            └── research/                # Research findings directory
                ├── 01-integration-test-analysis.md
                ├── 02-prd-issue-7-context.md
                └── 03-nodejs-promise-rejection-handling.md
```

### Desired Codebase Tree (After Implementation)

```bash
# No new files - modifications to existing test files and tests/setup.ts
# Key changes:
# - tests/setup.ts: Enhanced with global unhandledRejection tracking
# - tests/integration/core/task-orchestrator-e2e.test.ts: .catch() added to beforeEach
# - tests/integration/prp-pipeline-shutdown.test.ts: Async cleanup for signal handlers
# - tests/e2e/pipeline.test.ts: Mock timer cleanup mechanism
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest is the testing framework, NOT Jest or Mocha
// Global setup: tests/setup.ts (configured in vitest.config.ts line 19)
// Test hooks: beforeEach, afterEach, beforeAll, afterAll
// Mock clearing: vi.clearAllMocks(), vi.unstubAllEnvs()

// CRITICAL: P4.M1.T1.S1 (parallel execution) modifies tests/setup.ts line 23
// It adds { quiet: true } to dotenv.config() call
// This PRP modifies the same file (adds promise rejection tracking)
// Changes are independent - either can complete first
// Do NOT modify the dotenv.config() call - that's P4.M1.T1.S1's domain

// CRITICAL: The stack trace preservation test failure is a symptom, not root cause
// Test at tests/integration/utils/error-handling.test.ts:344-367
// Expects: PipelineError.cause instanceof TaskError === true
// Actual: PipelineError.cause is undefined
// Root cause: Promise rejection in async operation breaks error chain
// Fix: Proper error boundaries in test prevent unhandled rejections

// GOTCHA: process.emit('SIGTERM') in tests may trigger async handlers
// File: tests/integration/prp-pipeline-shutdown.test.ts
// Lines: 307-311, 380-383
// Signal handlers may return promises that reject after test ends
// Fix: Add setImmediate delays after signal emission to allow handlers to complete

// GOTCHA: setTimeout in mock child_process can create dangling promises
// File: tests/e2e/pipeline.test.ts
// Lines: 151-165 (setTimeout callbacks in mock implementations)
// Line 264: vi.useRealTimers() - switches to real timers during test
// Line 272: vi.useFakeTimers() - switches back after test
// Problem: If test ends before setTimeout callbacks complete, promises dangle
// Fix: Store timeout IDs and clear them in afterEach

// CRITICAL: Vitest handles unhandled rejections differently than Jest
// Vitest: May fail tests with unhandled rejections
// Jest: Typically shows warnings but continues
// This PRP adds explicit tracking to ensure consistent behavior

// CRITICAL: Global rejection tracking must not interfere with test assertions
// If a test EXPECTS a rejection to be unhandled (rare), tracking may break it
// Pattern: Store rejections in array, check in afterEach
// Only fail if rejections exist AND test didn't already fail

// GOTCHA: Error class construction MUST use Object.setPrototypeOf
// File: src/core/errors.ts
// All error classes use: Object.setPrototypeOf(this, ClassName.prototype)
// This preserves prototype chain for instanceof checks
// PipelineError and TaskError both follow this pattern correctly
// The issue is in test code, not error class implementation

// CRITICAL: Test hooks run sequentially, not in parallel
// beforeEach in parent runs before child
// afterEach in child runs before parent
// Async operations in hooks must complete before next hook starts
// Use await or return promises to ensure proper sequencing

// CRITICAL: vi.clearAllMocks() may interrupt pending async operations
// If a mock is called asynchronously and cleared before completion, may cause issues
// Consider using vi.fn().mockClear() for individual mocks instead
// Or ensure all async operations complete before clearing

// GOTCHA: setImmediate vs process.nextTick for cleanup delays
// setImmediate: Runs after I/O events (better for cleanup)
// process.nextTick: Runs before I/O events (may be too early)
// Use setImmediate for allowing async handlers to complete

// CRITICAL: Global gc() call in existing afterEach
// Line: if (typeof global.gc === 'function') { global.gc(); }
// This forces garbage collection if available
// May help clean up promise references
// Keep this call when adding rejection tracking
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is an investigation and fix task for existing test code. The primary artifact is an analysis document identifying all sources of unhandled promise rejections.

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: RUN integration tests with rejection tracking enabled
  - COMMAND: npm run test:run -- tests/integration/ 2>&1 | tee /tmp/test-output-with-warnings.txt
  - PURPOSE: Capture current state of PromiseRejectionHandledWarning messages
  - SAVE: Output to /tmp/test-output-with-warnings.txt for comparison
  - EXPECTED: Multiple PromiseRejectionHandledWarning messages in output
  - OUTPUT: Baseline test output showing warnings

Task 2: ADD global promise rejection tracking to tests/setup.ts
  - FILE: tests/setup.ts
  - ACTION: Add unhandledRejection listener in beforeEach
  - ACTION: Remove listener and check for rejections in afterEach
  - PRESERVE: Existing dotenv.config() call (P4.M1.T1.S1's domain)
  - PRESERVE: Existing vi.clearAllMocks() and vi.unstubAllEnvs()
  - PATTERN: Follow tests/unit/utils/promise-handling-validator.test.ts pattern
  - OUTPUT: Global rejection tracking that fails tests with unhandled rejections

Task 3: FIX uncaught promise in task-orchestrator-e2e.test.ts beforeEach
  - FILE: tests/integration/core/task-orchestrator-e2e.test.ts
  - LINES: 259-267
  - ISSUE: await sessionManager.loadSession(sessionPath) without .catch()
  - FIX: Add .catch() handler to loadSession call
  - PATTERN: await operation.catch(err => { console.error(...); throw err; })
  - OUTPUT: beforeEach hook with proper error handling

Task 4: FIX process signal handler async cleanup in prp-pipeline-shutdown.test.ts
  - FILE: tests/integration/prp-pipeline-shutdown.test.ts
  - LINES: 307-311, 380-383 (process.emit calls)
  - LINES: 116-130 (afterEach cleanup)
  - ISSUE: Signal handlers may trigger async operations that outlive test
  - FIX: Add setImmediate delays after signal emission
  - FIX: Add setImmediate delays at start of afterEach
  - PATTERN: await new Promise(resolve => setImmediate(resolve)); (repeat 2-3 times)
  - OUTPUT: Proper async cleanup for signal handlers

Task 5: FIX mock timer cleanup in pipeline.test.ts
  - FILE: tests/e2e/pipeline.test.ts
  - LINES: 151-165 (setTimeout in mock child_process)
  - ISSUE: No cleanup for setTimeout callbacks if test ends early
  - FIX: Store timeout IDs in array, clear in afterEach
  - PATTERN:
    - let mockTimeouts: NodeJS.Timeout[] = [];
    - In beforeEach: mockTimeouts = [];
    - In mock: const id = setTimeout(...); mockTimeouts.push(id);
    - In afterEach: mockTimeouts.forEach(clearTimeout);
  - OUTPUT: Mock timer cleanup mechanism

Task 6: INVESTIGATE stack trace preservation test failure
  - FILE: tests/integration/utils/error-handling.test.ts
  - LINES: 344-367
  - TEST: "should preserve stack trace through error wrapping"
  - ISSUE: PipelineError.cause is undefined (expected TaskError instance)
  - ACTION: Run this test in isolation with verbose output
  - COMMAND: npm run test:run -- tests/integration/utils/error-handling.test.ts -t "should preserve stack trace through error wrapping"
  - ANALYZE: Determine if unhandled rejection causes cause to be lost
  - OUTPUT: Understanding of why test fails and fix if needed

Task 7: VERIFY all changes with integration test suite
  - COMMAND: npm run test:run -- tests/integration/
  - EXPECTED: No PromiseRejectionHandledWarning messages
  - EXPECTED: Stack trace preservation test passes
  - EXPECTED: All integration tests pass
  - OUTPUT: Clean test output with no warnings

Task 8: VERIFY no regressions in unit and e2e tests
  - COMMAND: npm run test:run -- tests/unit/ tests/e2e/
  - EXPECTED: No new warnings introduced
  - EXPECTED: All tests pass
  - OUTPUT: Confirmation that fixes don't break other tests

Task 9: CREATE analysis document
  - FILE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/P4M2T1S1/research/analysis.md
  - CONTENT: List all sources of unhandled promise rejections found
  - CONTENT: Description of fixes applied to each file
  - CONTENT: Before/after comparison of test output
  - CONTENT: Any remaining issues or recommendations
  - OUTPUT: Complete analysis of promise rejection investigation

Task 10: VALIDATE final state with full test suite
  - COMMAND: npm run test:run 2>&1 | tee /tmp/test-output-final.txt
  - COMPARE: diff /tmp/test-output-with-warnings.txt /tmp/test-output-final.txt
  - EXPECTED: No PromiseRejectionHandledWarning in final output
  - EXPECTED: All tests pass
  - OUTPUT: Final validation and success confirmation
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Global Promise Rejection Tracking in tests/setup.ts
// ============================================================================

// File: tests/setup.ts
// Location: After existing imports (around line 15-20)

import { beforeEach, afterEach, vi } from 'vitest';

let unhandledRejections: unknown[] = [];

beforeEach(() => {
  // Existing: Clear mock call histories
  vi.clearAllMocks();

  // NEW: Track unhandled promise rejections
  unhandledRejections = [];

  const handler = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  process.on('unhandledRejection', handler);

  // Store handler reference for cleanup
  (globalThis as any).__unhandledRejectionHandler = handler;
});

afterEach(() => {
  // NEW: Clean up rejection handler and check for unhandled rejections
  const handler = (globalThis as any).__unhandledRejectionHandler;
  if (handler) {
    process.removeListener('unhandledRejection', handler);
    delete (globalThis as any).__unhandledRejectionHandler;
  }

  // NEW: Fail test if there were unhandled rejections
  if (unhandledRejections.length > 0) {
    const errorMessages = unhandledRejections.map(r =>
      r instanceof Error ? r.message : String(r)
    ).join('; ');
    throw new Error(
      `Test had ${unhandledRejections.length} unhandled rejection(s): ${errorMessages}`
    );
  }

  // Existing: Restore environment variable stubs
  vi.unstubAllEnvs();

  // Existing: Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
});

// ============================================================================
// PATTERN 2: Adding .catch() to Async Operations in beforeEach
// ============================================================================

// BEFORE (tests/integration/core/task-orchestrator-e2e.test.ts:259-267):
beforeEach(async () => {
  const backlog = createComplexBacklog();
  const env = setupTestEnvironment(backlog);
  tempDir = env.tempDir;
  sessionManager = env.sessionManager;
  sessionPath = env.sessionPath;

  await sessionManager.loadSession(sessionPath);
});

// AFTER (with proper error handling):
beforeEach(async () => {
  const backlog = createComplexBacklog();
  const env = setupTestEnvironment(backlog);
  tempDir = env.tempDir;
  sessionManager = env.sessionManager;
  sessionPath = env.sessionPath;

  await sessionManager.loadSession(sessionPath).catch(err => {
    // Log the error for debugging
    console.error('Session load failed in beforeEach:', err);
    // Re-throw to fail the test
    throw err;
  });
});

// ============================================================================
// PATTERN 3: Async Cleanup for Process Signal Handlers
// ============================================================================

// BEFORE (tests/integration/prp-pipeline-shutdown.test.ts:307-311):
process.emit('SIGTERM');
return false; // No more items

// AFTER (with proper async cleanup):
process.emit('SIGTERM');

// Allow async signal handlers to complete
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));

return false; // No more items

// ALSO UPDATE afterEach (line 116):
// BEFORE:
afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();
  // ... listener restoration
});

// AFTER:
afterEach(async () => {
  // Allow pending async operations to complete
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();
  // ... listener restoration
});

// ============================================================================
// PATTERN 4: Mock Timer Cleanup
// ============================================================================

// ADD at top of test file (tests/e2e/pipeline.test.ts):
let mockTimeouts: NodeJS.Timeout[] = [];

beforeEach(() => {
  mockTimeouts = [];
  // ... existing beforeEach code
});

afterEach(() => {
  // NEW: Clean up mock timeouts
  mockTimeouts.forEach(clearTimeout);
  mockTimeouts = [];

  // ... existing afterEach code
});

// MODIFY mock implementation (around line 151):
return {
  stdout: {
    on: vi.fn((event: string, callback: (data: Buffer) => void) => {
      if (event === 'data') {
        // NEW: Store timeout ID for cleanup
        const id = setTimeout(() => callback(Buffer.from(stdout)), 5);
        mockTimeouts.push(id);
      }
    }),
  },
  stderr: {
    on: vi.fn((event: string, callback: (data: Buffer) => void) => {
      if (event === 'data') {
        // NEW: Store timeout ID for cleanup
        const id = setTimeout(() => callback(Buffer.from(stderr)), 5);
        mockTimeouts.push(id);
      }
    }),
  },
  on: vi.fn((event: string, callback: (code: number) => void) => {
    if (event === 'close') {
      // NEW: Store timeout ID for cleanup
      const id = setTimeout(() => callback(exitCode), 10);
      mockTimeouts.push(id);
    }
  }),
};

// ============================================================================
// PATTERN 5: Promise.allSettled for Better Error Diagnostics
// ============================================================================

// BEFORE (tests/integration/core/session-manager.test.ts:1496):
await expect(Promise.all(flushPromises)).resolves.not.toThrow();

// AFTER (if individual failures need handling):
const results = await Promise.allSettled(flushPromises);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  console.error(
    `${failures.length} promises rejected during flush:`,
    failures.map(f => f.status === 'rejected' ? f.reason : 'unknown')
  );
}
// Then assert based on whether failures are expected
```

### Integration Points

```yaml
PARALLEL_EXECUTION:
  - task: P4.M1.T1.S1 (Update dotenv config with quiet option)
    status: Implementing in parallel
    contract: Modifies tests/setup.ts line 23 (dotenv.config call)
    independence: Changes are to different parts of tests/setup.ts
    validation: This PRP adds hooks after dotenv.config(), no conflict

MODIFICATIONS_TO:
  - file: tests/setup.ts
    action: Add global unhandledRejection tracking
    location: After existing imports, before/with existing hooks
    preserve: dotenv.config() call (P4.M1.T1.S1's domain)
    preserve: vi.clearAllMocks(), vi.unstubAllEnvs(), global.gc()

  - file: tests/integration/core/task-orchestrator-e2e.test.ts
    action: Add .catch() to sessionManager.loadSession() in beforeEach
    line: 266
    change: Add error handler to async operation

  - file: tests/integration/prp-pipeline-shutdown.test.ts
    action: Add async delays for signal handler cleanup
    lines: After line 311, after line 383, in afterEach at line 116
    change: Add setImmediate delays to allow async handlers to complete

  - file: tests/e2e/pipeline.test.ts
    action: Add mock timer cleanup mechanism
    change: Store timeout IDs, clear in afterEach
    pattern: Add mockTimeouts array, cleanup in beforeEach/afterEach

INVESTIGATION_TARGETS:
  - file: tests/integration/utils/error-handling.test.ts
    lines: 344-367
    test: "should preserve stack trace through error wrapping"
    action: Run in isolation, analyze failure, fix if needed

PRESERVE:
  - All test logic and assertions
  - All mock implementations (only add cleanup)
  - All existing test hooks (only add error handling)
  - Error class implementations (src/core/errors.ts)
  - Test configuration (vitest.config.ts)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after modifying each file - fix before proceeding
npm run test:run -- tests/integration/core/task-orchestrator-e2e.test.ts 2>&1 | head -50

# Check for TypeScript errors
npx tsc --noEmit tests/integration/core/task-orchestrator-e2e.test.ts

# Expected: Zero syntax errors. If errors exist, READ output and fix before proceeding.
# Most likely errors: Missing await, incorrect promise chaining, syntax in .catch()
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the global rejection tracking with a simple test
npm run test:run -- tests/unit/utils/promise-handling-validator.test.ts -v

# Expected: All tests pass, including unhandledRejection detection

# Test the specific files modified
npm run test:run -- tests/integration/core/task-orchestrator-e2e.test.ts -v
npm run test:run -- tests/integration/prp-pipeline-shutdown.test.ts -v
npm run test:run -- tests/e2e/pipeline.test.ts -v

# Expected: All tests pass with no PromiseRejectionHandledWarning messages

# Run the stack trace preservation test in isolation
npm run test:run -- tests/integration/utils/error-handling.test.ts -t "should preserve stack trace through error wrapping"

# Expected: Test passes (PipelineError.cause is TaskError instance)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full integration test suite
npm run test:run -- tests/integration/

# Expected output should show:
# - No PromiseRejectionHandledWarning messages
# - All integration tests passing
# - Clean test output

# Check for any remaining warnings
npm run test:run -- tests/integration/ 2>&1 | grep -i "PromiseRejectionHandledWarning"

# Expected output (AFTER fixes):
# (no output - grep returns no matches)

# Run e2e tests to verify mock timer cleanup works
npm run test:run -- tests/e2e/

# Expected: All tests pass, no dangling promise warnings
```

### Level 4: Domain-Specific Validation

```bash
# Compare before/after output to visually confirm the fix
echo "=== BEFORE FIX ===" > /tmp/test-output-before.txt
npm run test:run -- tests/integration/ 2>&1 | tee /tmp/test-output-before.txt

# [Apply all fixes from this PRP]

echo "=== AFTER FIX ===" > /tmp/test-output-after.txt
npm run test:run -- tests/integration/ 2>&1 | tee /tmp/test-output-after.txt

# Count promise rejection warnings before/after
echo "Before fix:"
grep -c "PromiseRejectionHandledWarning" /tmp/test-output-before.txt || echo "0"

echo "After fix:"
grep -c "PromiseRejectionHandledWarning" /tmp/test-output-after.txt || echo "0"

# Expected:
# Before fix: >0 (count of promise rejection warnings)
# After fix: 0 (no promise rejection warnings)

# Verify the stack trace preservation test specifically
npm run test:run -- tests/integration/utils/error-handling.test.ts -t "should preserve stack trace through error wrapping" -v

# Expected: Test passes with output showing:
// ✓ tests/integration/utils/error-handling.test.ts (344-367)
//   should preserve stack trace through error wrapping

# Full test suite validation
npm run test:run

# Expected:
# - All tests pass
# - No PromiseRejectionHandledWarning messages anywhere in output
# - Test count shows same or higher passing tests (no regressions)

# Performance check - ensure no performance impact
time npm run test:run -- tests/integration/

# Expected: Test execution time similar to before (rejection tracking has minimal overhead)
```

## Final Validation Checklist

### Technical Validation

- [ ] Global rejection tracking added to tests/setup.ts
- [ ] No syntax errors in modified files
- [ ] No TypeScript errors
- [ ] Test output no longer shows PromiseRejectionHandledWarning messages
- [ ] Stack trace preservation test passes
- [ ] All integration tests pass
- [ ] All e2e tests pass
- [ ] All unit tests pass (no regressions)

### Feature Validation

- [ ] Unhandled promise rejections are caught immediately by global tracking
- [ ] Tests fail with clear error messages when unhandled rejections occur
- [ ] Async operations in test hooks have proper error boundaries
- [ ] Process signal handlers complete before test cleanup
- [ ] Mock timers are cleaned up properly
- [ ] No new warnings or errors introduced
- [ ] Test execution time unchanged (minimal overhead from tracking)

### Code Quality Validation

- [ ] Follows existing codebase patterns in test files
- [ ] Error messages are informative and actionable
- [ ] Changes are minimal and focused
- [ ] No side effects on test logic or assertions
- [ ] Cleanup code is properly placed in afterEach hooks
- [ ] Mock implementations preserve existing behavior

### Documentation & Handoff

- [ ] Analysis document complete in research/analysis.md
- [ ] Before/after output comparison documented
- [ ] All sources of unhandled rejections identified
- [ ] Git commit message references this PRP
- [ ] tasks.json status updated to Complete
- [ ] Ready for next work item (P4.M3 - Verify Overall Test Pass Rate)

## Anti-Patterns to Avoid

- ❌ **Don't suppress the warnings** - Fix the root cause, don't hide the warning
- ❌ **Don't remove process.on('unhandledRejection') from production code** - Only add to tests
- ❌ **Don't use empty .catch() handlers** - At minimum log and re-throw
- ❌ **Don't modify error class constructors** - They're correct, issue is in test code
- ❌ **Don't interfere with P4.M1.T1.S1's changes** - dotenv.config() is their domain
- ❌ **Don't add setTimeout to "fix" timing issues** - Use proper async/await patterns
- ❌ **Don't skip test hooks** - All tests need proper setup/teardown
- ❌ **Don't use process.nextTick for cleanup** - Use setImmediate for better timing
- ❌ **Don't clear all mocks if async operations are pending** - Clear individual mocks instead
- ❌ **Don't assume the test is wrong** - The test is likely revealing a real issue
- ❌ **Don't add rejection tracking to production code** - Only in test environment
- ❌ **Don't forget to clean up event listeners** - Always remove in afterEach
- ❌ **Don't store timeout IDs in global scope** - Use test-scoped variables
- ❌ **Don't suppress errors in .catch()** - Re-throw after logging for debugging

---

## Confidence Score: 9/10

**One-Pass Implementation Success Likelihood**: VERY HIGH

**Rationale**:
1. Clear investigation approach with specific files and line numbers
2. Well-documented patterns for promise rejection handling
3. Existing test (promise-handling-validator.test.ts) provides proven pattern
4. Research phase thoroughly documented the issues
5. Global rejection tracking is a proven pattern (used in existing tests)
6. Specific fixes identified for each problematic pattern
7. Validation commands provide immediate feedback
8. Parallel execution context clearly understood
9. No architectural decisions needed - focused bug fix
10. Industry best practices support the approach

**Potential Risks**:
- **Risk 1**: Stack trace preservation test may have deeper issues (Low - likely fixed by proper error boundaries)
- **Risk 2**: Some warnings may come from production code, not tests (Low - investigation will identify sources)
- **Risk 3**: Adding global tracking may break tests that expect unhandled rejections (Very Low - rare pattern, can be addressed if found)

**Validation**: The completed PRP provides everything needed to investigate and fix promise rejection warnings. Specific files and line numbers are identified, proven patterns are provided for each fix type, validation commands verify success immediately, comprehensive research documents all considerations, and the approach follows industry best practices. The implementation is straightforward with clear success criteria.
