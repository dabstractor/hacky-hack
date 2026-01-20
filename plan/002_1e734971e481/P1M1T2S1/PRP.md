# Product Requirement Prompt (PRP): Test Workflow Lifecycle

**PRP ID**: P1.M1.T2.S1
**Generated**: 2026-01-15
**Story Points**: 2

---

## Goal

**Feature Goal**: Create a comprehensive test suite that validates Groundswell Workflow lifecycle functionality including class-based Workflow extensions, @Step decorator with event emission, @Task decorator for parent-child relationships, @ObservedState decorator with snapshotState() method, and proper mocking to prevent actual LLM calls.

**Deliverable**: `tests/integration/groundswell/workflow.test.ts` - A comprehensive test file covering all Workflow lifecycle patterns with proper mocking, event verification, state snapshot testing, and parent-child relationship validation.

**Success Definition**:
- Test 1: Simple Workflow extending base class, override run() method, call run() and verify execution
- Test 2: @Step decorator with trackTiming option, verify stepStart/stepEnd events with duration
- Test 3: Parent-child workflows with @Task decorator, verify child attachment and events
- Test 4: @ObservedState field with snapshotState(), verify state captured
- All tests use vi.mock() to prevent actual LLM calls
- All tests follow existing patterns from tests/unit/groundswell/ and tests/unit/workflows/
- Test achieves 100% coverage of tested lifecycle methods
- Any issues with event propagation or state snapshots are documented

---

## User Persona

**Target User**: Developer/System running the PRP Development Pipeline

**Use Case**: Fourth validation step in Phase 1 (P1.M1.T2) to verify that after npm link is validated (S1), imports work (S2), and version is compatible (S3), the Groundswell Workflow lifecycle methods work correctly for building hierarchical workflows.

**User Journey**:
1. Pipeline completes P1.M1.T1 (npm link, imports, version compatibility) with success
2. Pipeline starts P1.M1.T2.S1 (Workflow lifecycle tests)
3. Test suite runs 4 test categories covering Workflow lifecycle
4. Each test validates specific lifecycle functionality
5. Events are captured and verified
6. State snapshots are captured and validated
7. Parent-child relationships are verified
8. If all tests pass: Proceed to P1.M1.T2.S2 (Agent and Prompt tests)
9. If tests fail: Document specific issues for debugging

**Pain Points Addressed**:
- Uncertainty whether Groundswell Workflow lifecycle works correctly
- Lack of test coverage for decorator patterns (@Step, @Task, @ObservedState)
- Risk of accidental LLM API calls during testing
- Missing validation of event propagation through workflow hierarchy
- Unclear state snapshot behavior and @ObservedState field capture

---

## Why

- **Foundation for P1.M1.T2.S2 and P1.M1.T2.S3**: Workflow lifecycle must work correctly before testing Agent/Prompt creation (S2) and MCP tool registration (S3)
- **Critical Pattern Validation**: @Step, @Task, and @ObservedState decorators are core patterns used throughout the codebase (src/workflows/bug-hunt-workflow.ts, src/workflows/fix-cycle-workflow.ts, src/workflows/prp-pipeline.ts)
- **Event System Validation**: Workflow events (stepStart, stepEnd, taskStart, taskEnd, error) are critical for observability and debugging
- **State Management Verification**: @ObservedState and snapshotState() are essential for persistence and recovery
- **Problems Solved**:
  - Validates that Workflow base class can be extended and run() method executes
  - Confirms @Step decorator emits events with correct structure and timing
  - Verifies @Task decorator creates parent-child relationships correctly
  - Tests @ObservedState decorator captures state in snapshots
  - Ensures no accidental LLM API calls via proper mocking

---

## What

Create a comprehensive test suite covering 4 main test categories:

### Test 1: Class-Based Workflow Extension
- Create a simple Workflow class that extends the Groundswell Workflow base class
- Override the run() method with custom logic
- Call run() and verify:
  - Method executes without errors
  - Status transitions occur (idle → running → completed)
  - Return value is correct
  - Logger is available and functional

### Test 2: @Step Decorator with trackTiming
- Create a Workflow with a @Step decorated method
- Use trackTiming: true option
- Verify:
  - stepStart event is emitted with correct step name
  - stepEnd event is emitted with duration >= 0
  - Events contain workflow node context
  - Method executes and returns correct value
  - Observer is notified of events

### Test 3: @Task Decorator for Parent-Child Relationships
- Create a parent Workflow with @Task decorated method
- Method returns a child Workflow instance
- Verify:
  - Child is automatically attached to parent (child.parent === parent)
  - Parent.children array contains the child
  - taskStart and taskEnd events are emitted
  - Events propagate to parent observer
  - isDescendantOf() returns correct results

### Test 4: @ObservedState Decorator and snapshotState()
- Create a Workflow with @ObservedState decorated fields
- Test variations:
  - Plain @ObservedState() - field is visible in snapshot
  - @ObservedState({ redact: true }) - field shows as '***'
  - @ObservedState({ hidden: true }) - field is excluded from snapshot
- Verify:
  - snapshotState() captures all non-hidden @ObservedState fields
  - Redacted fields show as '***'
  - Hidden fields are not in snapshot
  - State is emitted in stateUpdated events
  - getObservedState() utility returns correct state

### Success Criteria

- [ ] Test 1: Class-based Workflow extension works correctly
- [ ] Test 2: @Step decorator emits events with timing information
- [ ] Test 3: @Task decorator creates parent-child relationships
- [ ] Test 4: @ObservedState decorator captures state correctly
- [ ] All tests use vi.mock() for @anthropic-ai/sdk to prevent API calls
- [ ] Event verification uses observers and/or spies
- [ ] State snapshot testing covers all @ObservedState options
- [ ] Tests follow existing patterns from tests/unit/groundswell/
- [ ] 100% coverage of tested lifecycle methods
- [ ] All tests pass consistently

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Results:**
- [x] Groundswell Workflow API documented (run(), attachChild(), detachChild(), setStatus(), snapshotState())
- [x] @Step decorator options documented (trackTiming, snapshotState, logStart, logFinish)
- [x] @Task decorator options documented (concurrent, errorMergeStrategy)
- [x] @ObservedState decorator metadata documented (hidden, redact)
- [x] Event types documented (stepStart, stepEnd, taskStart, taskEnd, error, stateUpdated)
- [x] Mock patterns for @anthropic-ai/sdk identified
- [x] Test patterns from existing codebase analyzed
- [x] Groundswell source test files referenced
- [x] Observer pattern for event verification documented
- [x] State snapshot testing approaches identified

---

### Documentation & References

```yaml
# MUST READ - Contract definition from PRD
- docfile: plan/002_1e734971e481/current_prd.md
  why: Contains the work item contract definition for this subtask
  section: P1.M1.T2.S1 contract definition
  critical: Specifies exact test requirements and expected outputs

# MUST READ - Previous PRP (P1.M1.T1.S3) outputs
- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T1S3/PRP.md
  why: Defines the GroundswellCompatibilityReport interface that confirms version compatibility
  pattern: If version compatibility check fails, Workflow features may be missing
  critical: v0.0.3 contains critical fixes (Promise.allSettled, isDescendantOf public API)

# MUST READ - Groundswell Analysis (internal research)
- docfile: plan/002_1e734971e481/architecture/groundswell_analysis.md
  why: Comprehensive documentation of Groundswell API including Workflow lifecycle
  section: Section 2.1 (Workflow class), Section 2.2 (Decorators), Section 3 (Hierarchical Task Management)
  critical: |
    - Workflow key methods: run(), attachChild(), detachChild(), setStatus(), snapshotState(), isDescendantOf()
    - @Step options: trackTiming (default: true), snapshotState (default: false), logStart, logFinish
    - @Task options: concurrent (default: false), errorMergeStrategy
    - @ObservedState metadata: hidden, redact
    - Event types: stepStart, stepEnd, taskStart, taskEnd, childAttached, childDetached, error, stateUpdated

# INTERNAL RESEARCH - Test patterns (created by parallel research agents)
- docfile: plan/002_1e734971e481/P1M1T2S1/research/groundswell-test-patterns.md
  why: Comprehensive test patterns for Groundswell Workflow lifecycle testing
  section: Complete document with code examples
  critical: |
    - Pattern 1: Testing class-based Workflow extensions with constructor validation
    - Pattern 2: Testing @Step decorator with event emission verification
    - Pattern 3: Testing @Task decorator with parent-child relationship validation
    - Pattern 4: Testing @ObservedState decorator with snapshotState() verification
    - Mock patterns for vi.mock() with @anthropic-ai/sdk

- docfile: plan/002_1e734971e481/P1M1T2S1/research/groundswell-examples-research.md
  why: Research findings from Groundswell source code test files
  section: Sections 1-5 for specific test file references
  critical: |
    - Unit test reference: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts
    - Decorator test reference: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts
    - Observer pattern for event verification
    - Type-safe event discrimination patterns
    - Mock node and context creators

# EXISTING CODEBASE PATTERNS - Import test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/groundswell/imports.test.ts
  why: Example of comprehensive Groundswell testing with S1 validation check
  pattern: beforeAll checks npm link validation, conditional test execution with itIf
  gotcha: Uses vi.mock('@anthropic-ai/sdk') to prevent API calls

# EXISTING CODEBASE PATTERNS - Workflow test patterns
- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/bug-hunt-workflow.test.ts
  why: Example of testing Workflow class with @Step decorator
  pattern: Constructor validation tests, status transition tests, spy usage for method calls
  gotcha: Uses vi.clearAllMocks() in beforeEach for cleanup

- file: /home/dustin/projects/hacky-hack/tests/unit/workflows/fix-cycle-workflow.test.ts
  why: Example of testing Workflow with multiple @Step methods
  pattern: Status verification, logger spy usage, error handling tests

# EXISTING CODEBASE PATTERNS - Mock patterns
- file: /home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts
  why: Example of comprehensive mocking for Groundswell and dependencies
  pattern: Module-level vi.mock() with hoisting, vi.mocked() for type-safe access
  gotcha: |
    vi.mock('groundswell', async () => {
      const actual = await vi.importActual('groundswell');
      return { ...actual, createAgent: vi.fn(), createPrompt: vi.fn() };
    });

# EXISTING CODEBASE PATTERNS - Real Workflow implementations
- file: /home/dustin/projects/hacky-hack/src/workflows/bug-hunt-workflow.ts
  why: Real-world example of Workflow extension with @Step decorator
  pattern: class extends Workflow, constructor validation, @Step({ trackTiming: true })
  gotcha: Uses this.correlationLogger for tracing, setStatus() for lifecycle

- file: /home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts
  why: Another real-world example with multiple @Step methods
  pattern: Similar structure, multiple phases with @Step decorators

# EXTERNAL DOCUMENTATION - Groundswell source test files
- file: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts
  why: Groundswell's own unit tests for Workflow class
  pattern: Observer pattern for event capture, status transition tests
  critical: Shows how to test run() method, setStatus(), observer notification

- file: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts
  why: Groundswell's own tests for @Step and @ObservedState decorators
  pattern: Event emission verification, timing tracking, state snapshot testing
  critical: |
    - Test step execution and return values
    - Verify event emission (stepStart, stepEnd, error)
    - Confirm timing information when trackTiming is true
    - Test observer notification for step events

- file: /home/dustin/projects/groundswell/src/__tests__/unit/workflow-isDescendantOf.test.ts
  why: Tests for isDescendantOf() method used in parent-child validation
  pattern: Multi-level hierarchy tests, circular reference detection

- file: /home/dustin/projects/groundswell/examples/examples/02-decorator-options.ts
  why: Example showing all @Step decorator options
  pattern: @Step({ trackTiming, snapshotState, logStart, logFinish })

# EXTERNAL DOCUMENTATION - URLs
- url: https://vitest.dev/guide/mocking.html
  why: Vitest mocking documentation for vi.mock() patterns

- url: https://vitest.dev/api/index.html#vi-mocked
  why: vi.mocked() documentation for type-safe mock access
```

---

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                  # Node.js >=20, TypeScript 5.2.0, vitest test runner
├── tsconfig.json                 # experimentalDecorators: true
├── vitest.config.ts              # Decorator support, groundswell path alias
├── src/
│   └── workflows/
│       ├── bug-hunt-workflow.ts  # Real Workflow with @Step example
│       ├── fix-cycle-workflow.ts # Real Workflow with multiple @Step
│       └── prp-pipeline.ts       # Real Workflow with @Step and @ObservedState
└── tests/
    ├── setup.ts                  # Global test setup
    ├── unit/
    │   ├── groundswell/
    │   │   └── imports.test.ts   # Import validation with S1 check
    │   └── workflows/
    │       ├── bug-hunt-workflow.test.ts  # Workflow test pattern example
    │       └── fix-cycle-workflow.test.ts # Multiple @Step test pattern
    └── integration/              # NEW TEST FILE LOCATION
        └── groundswell/
            └── workflow.test.ts  # TO BE CREATED
```

---

### Desired Codebase Tree (files to be added)

```bash
hacky-hack/
└── tests/
    └── integration/
        └── groundswell/
            └── workflow.test.ts  # NEW: Comprehensive Workflow lifecycle tests
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Mock Anthropic SDK to prevent actual API calls
// Groundswell may initialize the Anthropic SDK on import
// This is required by the z.ai API endpoint enforcement
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: { create: vi.fn() }
  })),
}));

// CRITICAL: Decorators require experimentalDecorators: true
// Already configured in vitest.config.ts and tsconfig.json
// Without this, decorators will not work

// CRITICAL: @Step decorator wraps async methods
// The decorator returns a new function that wraps the original
// Method signature must be: async methodName(): Promise<ReturnType>

// CRITICAL: Event emission timing
// Events are emitted synchronously during method execution
// stepStart is emitted BEFORE method body executes
// stepEnd is emitted AFTER method body completes

// CRITICAL: Observer pattern for event verification
// Only root workflows can have observers
// Events propagate from children to parent observers
// Use observer.onEvent to capture events for verification

// CRITICAL: State snapshot behavior
// snapshotState() only captures fields marked with @ObservedState()
// Regular fields are NOT included in snapshots
// @ObservedState({ hidden: true }) fields are excluded
// @ObservedState({ redact: true }) fields show as '***'

// CRITICAL: @Task decorator behavior
// Only attaches objects that have an 'id' property (duck-typing)
// Non-workflow objects are silently skipped (lenient validation)
// Automatic attachment happens when method returns
// Original return value is always preserved

// CRITICAL: Parent-child relationship validation
// attachChild() throws if child already has different parent
// attachChild() throws if child is ancestor of parent (circular reference)
// isDescendantOf() was added in v0.0.3, check for availability

// CRITICAL: Status lifecycle
// Workflow status starts as 'idle'
// Call setStatus('running') before executing work
// Call setStatus('completed') or setStatus('failed') when done
// Status changes emit treeUpdated events

// CRITICAL: Test file location
// MUST be at tests/integration/groundswell/workflow.test.ts
// This is an integration test, not unit test
// Tests real Workflow behavior with Groundswell library

// CRITICAL: ESM import requirements
// Must use: import { Workflow } from 'groundswell';
// Must use: .js extensions for relative imports (ESM requirement)
// Pattern: import { Workflow } from 'groundswell'; (works for external package)

// CRITICAL: vi.mock() hoisting
// vi.mock() calls must be at top level before imports
// They are hoisted to the top of the file by Vitest
// Cannot be conditional or inside describe blocks

// CRITICAL: Mock cleanup
// Use vi.clearAllMocks() in beforeEach to prevent test pollution
// This ensures mocks don't leak between tests

// CRITICAL: Observer error handling
// Observer errors don't crash workflows - they're logged to workflow.node.logs
// Don't expect throws from observer callbacks

// CRITICAL: Type-safe event discrimination
// Use TypeScript discriminated unions for event type checking
// Pattern: if (event.type === 'stepEnd') { /* access event.duration */ }

// CRITICAL: Event ordering
// For @Step: stepStart → method body → stepEnd
// For @Task: taskStart → child.run() → taskEnd
// Observer sees events in the order they occur

// GOTCHA: getObservedState() utility
// Import from Groundswell: import { getObservedState } from 'groundswell';
// Returns object with only @ObservedState fields
// Redacted fields show as '***', hidden fields are excluded

// GOTCHA: S1 dependency check pattern
// May want to check npm link validation before running tests
// Follow pattern from tests/unit/groundswell/imports.test.ts
// Use conditional test execution: const itIf = shouldRun ? it : it.skip;

// GOTCHA: Version compatibility consideration
// Previous PRP (P1.M1.T1.S3) checks for v0.0.3 features
// isDescendantOf() is only available in v0.0.3+
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Workflow lifecycle test result structure
 */
interface WorkflowLifecycleTestResult {
  testName: string;
  passed: boolean;
  category: 'class-extension' | 'step-decorator' | 'task-decorator' | 'observed-state';
  issues?: string[];
}

/**
 * Event capture for verification
 */
interface EventCapture {
  stepStart: number;
  stepEnd: number;
  taskStart: number;
  taskEnd: number;
  errors: number;
  stateUpdates: number;
}
```

---

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE tests/integration/groundswell/workflow.test.ts
  - IMPLEMENT: Main test file with all 4 test categories
  - HEADER: Include JSDoc comments describing test scope
  - IMPORTS: Import from 'groundswell', 'vitest', test utilities
  - NAMING: workflow.test.ts (per convention)
  - PLACEMENT: tests/integration/groundswell/ directory
  - DEPENDENCIES: None (first file)

Task 2: IMPLEMENT mock setup
  - MOCK: @anthropic-ai/sdk to prevent API calls
  - PATTERN: Follow tests/unit/groundswell/imports.test.ts
  - HOISTING: Place at top level before imports
  - CLEANUP: Add vi.clearAllMocks() in beforeEach

Task 3: IMPLEMENT Test Suite 1 - Class-Based Workflow Extension
  - TEST: SimpleWorkflow extends Workflow
  - VERIFY: Constructor creates instance with correct name
  - VERIFY: run() method executes without errors
  - VERIFY: Status transitions (idle → running → completed)
  - VERIFY: Return value is correct
  - VERIFY: Logger is available
  - PATTERN: Follow tests/unit/workflows/bug-hunt-workflow.test.ts constructor tests

Task 4: IMPLEMENT Test Suite 2 - @Step Decorator with trackTiming
  - CREATE: StepTestWorkflow with @Step({ trackTiming: true }) method
  - VERIFY: stepStart event is emitted
  - VERIFY: stepEnd event is emitted with duration >= 0
  - VERIFY: Events contain correct step name
  - VERIFY: Observer receives events
  - PATTERN: Use observer.onEvent to capture events
  - REFERENCE: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts

Task 5: IMPLEMENT Test Suite 3 - @Task Decorator for Parent-Child
  - CREATE: ParentWorkflow with @Task decorated method
  - CREATE: ChildWorkflow for task to return
  - VERIFY: Child is attached (child.parent === parent)
  - VERIFY: Parent.children contains child
  - VERIFY: taskStart and taskEnd events are emitted
  - VERIFY: Events propagate to parent observer
  - VERIFY: isDescendantOf() returns true (if v0.0.3+)
  - PATTERN: Follow Groundswell's workflow-attachChild tests
  - REFERENCE: /home/dustin/projects/groundswell/src/__tests__/unit/workflow.test.ts

Task 6: IMPLEMENT Test Suite 4 - @ObservedState and snapshotState()
  - CREATE: StateTestWorkflow with various @ObservedState fields
  - FIELD 1: Plain @ObservedState() - visible in snapshot
  - FIELD 2: @ObservedState({ redact: true }) - shows as '***'
  - FIELD 3: @ObservedState({ hidden: true }) - excluded from snapshot
  - VERIFY: snapshotState() captures non-hidden fields
  - VERIFY: Redacted field shows as '***'
  - VERIFY: Hidden field is not in snapshot
  - VERIFY: getObservedState() utility returns correct state
  - VERIFY: stateUpdated events are emitted
  - REFERENCE: /home/dustin/projects/groundswell/src/__tests__/unit/decorators.test.ts

Task 7: IMPLEMENT S1/S3 dependency check (optional)
  - CHECK: npm link validation from P1.M1.T1.S1
  - CHECK: version compatibility from P1.M1.T1.S3
  - PATTERN: Follow tests/unit/groundswell/imports.test.ts conditional execution
  - USE: const itIf = shouldRun ? it : it.skip;
  - OPTIONAL: Tests can run without this check

Task 8: IMPLEMENT event verification utilities
  - CREATE: Helper to capture events via observer
  - CREATE: Helper to filter events by type
  - CREATE: Helper to verify event structure
  - PATTERN: Follow Groundswell's observer pattern

Task 9: IMPLEMENT error documentation
  - CATCH: Any unexpected failures
  - LOG: Clear error messages for debugging
  - DOCUMENT: Issues found in test output
  - PATTERN: Use console.log for clear test result output

Task 10: VERIFY test file runs successfully
  - RUN: npm test -- tests/integration/groundswell/workflow.test.ts
  - VERIFY: All 4 test suites pass
  - VERIFY: No accidental API calls (mocks work)
  - VERIFY: Events are captured correctly
  - VERIFY: State snapshots work as expected
  - VERIFY: Parent-child relationships are correct
```

---

### Implementation Patterns & Key Details

```typescript
// =============================================================================
// FILE HEADER PATTERN
// =============================================================================

/**
 * Integration tests for Groundswell Workflow lifecycle
 *
 * @remarks
 * Tests validate Groundswell Workflow lifecycle functionality including:
 * 1. Class-based Workflow extensions (extends Workflow)
 * 2. @Step decorator with trackTiming option and event emission
 * 3. @Task decorator for parent-child workflow relationships
 * 4. @ObservedState decorator and snapshotState() method
 *
 * All tests mock @anthropic-ai/sdk to prevent actual LLM calls.
 *
 * Depends on successful npm link validation from P1.M1.T1.S1 and
 * version compatibility check from P1.M1.T1.S3.
 *
 * @see {@link https://groundswell.dev | Groundswell Documentation}
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// =============================================================================
// IMPORTS PATTERN
// =============================================================================

import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import type {
  Workflow,
  WorkflowEvent,
  WorkflowObserver,
  StepEvent,
  TaskEvent,
} from 'groundswell';

// =============================================================================
// MOCK SETUP PATTERN - Must be at top level for hoisting
// =============================================================================

/**
 * Mock Anthropic SDK to prevent accidental API calls
 *
 * @remarks
 * Groundswell may initialize the Anthropic SDK on import.
 * Mocking ensures tests are isolated and don't make external API calls.
 * This is required by the z.ai API endpoint enforcement.
 */
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

// =============================================================================
// DYNAMIC IMPORTS - Load after mocks are established
// =============================================================================

// Dynamic import ensures mocks are applied before Groundswell loads
async function loadGroundswell() {
  return await import('groundswell');
}

// =============================================================================
// TEST SUITE 1: Class-Based Workflow Extension
// =============================================================================

describe('Workflow lifecycle: Class-based extension', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Workflow by extending base class', async () => {
    // SETUP: Create a simple workflow class
    class SimpleWorkflow extends gs.Workflow {
      async run(): Promise<string> {
        this.setStatus('running');
        this.logger.info('Running simple workflow');
        this.setStatus('completed');
        return 'done';
      }
    }

    // EXECUTE: Create and run the workflow
    const workflow = new SimpleWorkflow('TestWorkflow');
    const result = await workflow.run();

    // VERIFY: Check execution succeeded
    expect(result).toBe('done');
    expect(workflow.status).toBe('completed');
    expect(workflow.id).toBeDefined();
    expect(workflow.parent).toBeNull();
    expect(workflow.children).toEqual([]);
  });

  it('should transition status through lifecycle', async () => {
    // SETUP: Create workflow with status tracking
    class StatusWorkflow extends gs.Workflow {
      async run(): Promise<void> {
        expect(this.status).toBe('idle');
        this.setStatus('running');
        expect(this.status).toBe('running');
        this.setStatus('completed');
        expect(this.status).toBe('completed');
      }
    }

    // EXECUTE: Run the workflow
    const workflow = new StatusWorkflow('StatusWorkflow');
    await workflow.run();

    // VERIFY: Final status
    expect(workflow.status).toBe('completed');
  });

  it('should handle errors in run() method', async () => {
    // SETUP: Create workflow that throws
    class FailingWorkflow extends gs.Workflow {
      async run(): Promise<void> {
        this.setStatus('running');
        throw new Error('Test error');
      }
    }

    // EXECUTE & VERIFY: Error should propagate
    const workflow = new FailingWorkflow('FailingWorkflow');
    await expect(workflow.run()).rejects.toThrow('Test error');
  });
});

// =============================================================================
// TEST SUITE 2: @Step Decorator with trackTiming
// =============================================================================

describe('Workflow lifecycle: @Step decorator', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute @Step decorated method', async () => {
    // SETUP: Create workflow with @Step method
    class StepWorkflow extends gs.Workflow {
      stepExecuted = false;

      @gs.Step({ trackTiming: true })
      async myStep(): Promise<string> {
        this.stepExecuted = true;
        return 'step result';
      }

      async run(): Promise<void> {
        await this.myStep();
      }
    }

    // EXECUTE: Run the workflow
    const workflow = new StepWorkflow('StepWorkflow');
    await workflow.run();

    // VERIFY: Method executed
    expect(workflow.stepExecuted).toBe(true);
  });

  it('should emit stepStart and stepEnd events', async () => {
    // SETUP: Create workflow and capture events
    class StepWorkflow extends gs.Workflow {
      @gs.Step({ trackTiming: true })
      async myStep(): Promise<string> {
        return 'result';
      }

      async run(): Promise<void> {
        await this.myStep();
      }
    }

    const workflow = new StepWorkflow('StepWorkflow');
    const events: gs.WorkflowEvent[] = [];

    const observer: gs.WorkflowObserver = {
      onLog: () => {},
      onEvent: (event) => events.push(event),
      onStateUpdated: () => {},
      onTreeChanged: () => {},
    };

    workflow.addObserver(observer);

    // EXECUTE: Run the workflow
    await workflow.run();

    // VERIFY: Check events
    const stepStart = events.find((e) => e.type === 'stepStart');
    const stepEnd = events.find((e) => e.type === 'stepEnd');

    expect(stepStart).toBeDefined();
    expect(stepEnd).toBeDefined();

    if (stepStart && stepStart.type === 'stepStart') {
      expect(stepStart.step).toBe('myStep');
      expect(stepStart.workflowId).toBe(workflow.id);
    }

    if (stepEnd && stepEnd.type === 'stepEnd') {
      expect(stepEnd.step).toBe('myStep');
      expect(stepEnd.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('should include timing information when trackTiming is true', async () => {
    // SETUP: Create workflow with trackTiming
    class StepWorkflow extends gs.Workflow {
      @gs.Step({ trackTiming: true })
      async myStep(): Promise<void> {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      async run(): Promise<void> {
        await this.myStep();
      }
    }

    const workflow = new StepWorkflow('StepWorkflow');
    const events: gs.WorkflowEvent[] = [];

    workflow.addObserver({
      onLog: () => {},
      onEvent: (e) => events.push(e),
      onStateUpdated: () => {},
      onTreeChanged: () => {},
    });

    // EXECUTE: Run the workflow
    await workflow.run();

    // VERIFY: Check duration is present and reasonable
    const stepEnd = events.find((e) => e.type === 'stepEnd');
    expect(stepEnd).toBeDefined();

    if (stepEnd && stepEnd.type === 'stepEnd') {
      expect(stepEnd.duration).toBeGreaterThanOrEqual(10);
    }
  });
});

// =============================================================================
// TEST SUITE 3: @Task Decorator for Parent-Child Relationships
// =============================================================================

describe('Workflow lifecycle: @Task decorator', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attach child workflow via @Task decorator', async () => {
    // SETUP: Create parent and child workflows
    class ChildWorkflow extends gs.Workflow {
      async run(): Promise<string> {
        return 'child result';
      }
    }

    class ParentWorkflow extends gs.Workflow {
      @gs.Task()
      async spawnChild(): Promise<ChildWorkflow> {
        return new ChildWorkflow('ChildWorkflow', this);
      }

      async run(): Promise<void> {
        await this.spawnChild();
      }
    }

    // EXECUTE: Run the parent workflow
    const parent = new ParentWorkflow('ParentWorkflow');
    await parent.run();

    // VERIFY: Check parent-child relationship
    expect(parent.children.length).toBe(1);
    const child = parent.children[0];
    expect(child.parent).toBe(parent);
    expect(child.id).toBeDefined();
  });

  it('should emit taskStart and taskEnd events', async () => {
    // SETUP: Create parent-child with event capture
    class ChildWorkflow extends gs.Workflow {
      async run(): Promise<string> {
        return 'child result';
      }
    }

    class ParentWorkflow extends gs.Workflow {
      @gs.Task()
      async spawnChild(): Promise<ChildWorkflow> {
        return new ChildWorkflow('ChildWorkflow', this);
      }

      async run(): Promise<void> {
        await this.spawnChild();
      }
    }

    const parent = new ParentWorkflow('ParentWorkflow');
    const events: gs.WorkflowEvent[] = [];

    parent.addObserver({
      onLog: () => {},
      onEvent: (e) => events.push(e),
      onStateUpdated: () => {},
      onTreeChanged: () => {},
    });

    // EXECUTE: Run the parent
    await parent.run();

    // VERIFY: Check task events
    const taskStart = events.find((e) => e.type === 'taskStart');
    const taskEnd = events.find((e) => e.type === 'taskEnd');

    expect(taskStart).toBeDefined();
    expect(taskEnd).toBeDefined();

    if (taskStart && taskStart.type === 'taskStart') {
      expect(taskStart.task).toBe('spawnChild');
      expect(taskStart.workflowId).toBe(parent.id);
    }

    if (taskEnd && taskEnd.type === 'taskEnd') {
      expect(taskEnd.task).toBe('spawnChild');
    }
  });

  it('should verify isDescendantOf() relationship (v0.0.3+)', async () => {
    // SETUP: Create multi-level hierarchy
    class GrandChildWorkflow extends gs.Workflow {
      async run(): Promise<string> {
        return 'grandchild result';
      }
    }

    class ChildWorkflow extends gs.Workflow {
      @gs.Task()
      async spawnChild(): Promise<GrandChildWorkflow> {
        return new GrandChildWorkflow('GrandChildWorkflow', this);
      }

      async run(): Promise<void> {
        await this.spawnChild();
      }
    }

    class ParentWorkflow extends gs.Workflow {
      @gs.Task()
      async spawnChild(): Promise<ChildWorkflow> {
        return new ChildWorkflow('ChildWorkflow', this);
      }

      async run(): Promise<void> {
        await this.spawnChild();
      }
    }

    // EXECUTE: Create hierarchy
    const parent = new ParentWorkflow('ParentWorkflow');
    await parent.run();

    const child = parent.children[0];
    const grandChild = child.children[0];

    // VERIFY: Check descendant relationships
    // Note: isDescendantOf() is only available in v0.0.3+
    if (typeof parent.isDescendantOf === 'function') {
      expect(grandChild.isDescendantOf(parent)).toBe(true);
      expect(grandChild.isDescendantOf(child)).toBe(true);
      expect(parent.isDescendantOf(grandChild)).toBe(false);
    } else {
      console.warn('isDescendantOf() not available - Groundswell version may be < 0.0.3');
    }
  });
});

// =============================================================================
// TEST SUITE 4: @ObservedState and snapshotState()
// =============================================================================

describe('Workflow lifecycle: @ObservedState decorator', () => {
  let gs: Awaited<ReturnType<typeof loadGroundswell>>;

  beforeAll(async () => {
    gs = await loadGroundswell();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture @ObservedState fields in snapshot', async () => {
    // SETUP: Create workflow with observed state
    class StateWorkflow extends gs.Workflow {
      @gs.ObservedState()
      publicField: string = 'public value';

      @gs.ObservedState()
      counter: number = 42;

      async run(): Promise<void> {
        this.snapshotState();
      }
    }

    // EXECUTE: Run workflow
    const workflow = new StateWorkflow('StateWorkflow');
    await workflow.run();

    // VERIFY: Check state snapshot
    const state = gs.getObservedState(workflow);
    expect(state.publicField).toBe('public value');
    expect(state.counter).toBe(42);
  });

  it('should redact fields marked with redact: true', async () => {
    // SETUP: Create workflow with redacted field
    class StateWorkflow extends gs.Workflow {
      @gs.ObservedState()
      publicField: string = 'public';

      @gs.ObservedState({ redact: true })
      apiKey: string = 'secret-key-12345';

      @gs.ObservedState()
      counter: number = 100;

      async run(): Promise<void> {
        this.snapshotState();
      }
    }

    // EXECUTE: Run workflow
    const workflow = new StateWorkflow('StateWorkflow');
    await workflow.run();

    // VERIFY: Check redaction
    const state = gs.getObservedState(workflow);
    expect(state.publicField).toBe('public');
    expect(state.apiKey).toBe('***');
    expect(state.counter).toBe(100);
  });

  it('should exclude fields marked with hidden: true', async () => {
    // SETUP: Create workflow with hidden field
    class StateWorkflow extends gs.Workflow {
      @gs.ObservedState()
      publicField: string = 'public';

      @gs.ObservedState({ hidden: true })
      internalCounter: number = 999;

      @gs.ObservedState()
      visibleField: string = 'visible';

      async run(): Promise<void> {
        this.snapshotState();
      }
    }

    // EXECUTE: Run workflow
    const workflow = new StateWorkflow('StateWorkflow');
    await workflow.run();

    // VERIFY: Check hidden field is excluded
    const state = gs.getObservedState(workflow);
    expect(state.publicField).toBe('public');
    expect(state.visibleField).toBe('visible');
    expect('internalCounter' in state).toBe(false);
  });

  it('should emit stateUpdated event on snapshot', async () => {
    // SETUP: Create workflow and capture state events
    class StateWorkflow extends gs.Workflow {
      @gs.ObservedState()
      value: string = 'initial';

      async run(): Promise<void> {
        this.snapshotState();
      }
    }

    const workflow = new StateWorkflow('StateWorkflow');
    const events: gs.WorkflowEvent[] = [];

    workflow.addObserver({
      onLog: () => {},
      onEvent: (e) => events.push(e),
      onStateUpdated: () => {},
      onTreeChanged: () => {},
    });

    // EXECUTE: Run workflow
    await workflow.run();

    // VERIFY: Check for stateUpdated event
    const stateUpdated = events.filter((e) => e.type === 'stateUpdated');
    expect(stateUpdated.length).toBeGreaterThan(0);
  });

  it('should combine all @ObservedState options correctly', async () => {
    // SETUP: Create workflow with all variations
    class StateWorkflow extends gs.Workflow {
      @gs.ObservedState()
      visibleField: string = 'visible';

      @gs.ObservedState({ redact: true })
      secretField: string = 'secret';

      @gs.ObservedState({ hidden: true })
      internalField: string = 'internal';

      // Regular field (not observed) - should not appear
      regularField: string = 'regular';

      async run(): Promise<void> {
        this.snapshotState();
      }
    }

    // EXECUTE: Run workflow
    const workflow = new StateWorkflow('StateWorkflow');
    await workflow.run();

    // VERIFY: Check all conditions
    const state = gs.getObservedState(workflow);

    // Visible field should be present
    expect(state.visibleField).toBe('visible');

    // Secret field should be redacted
    expect(state.secretField).toBe('***');

    // Hidden field should not exist
    expect('internalField' in state).toBe(false);

    // Regular field should not exist (not @ObservedState)
    expect('regularField' in state).toBe(false);
  });
});

// =============================================================================
// OPTIONAL: S1/S3 Dependency Check
// =============================================================================

describe('Workflow lifecycle: Prerequisites check', () => {
  it('should have valid Groundswell installation', async () => {
    // This test validates that Groundswell is properly installed
    // before running the lifecycle tests
    const gs = await loadGroundswell();

    expect(gs.Workflow).toBeDefined();
    expect(gs.Step).toBeDefined();
    expect(gs.Task).toBeDefined();
    expect(gs.ObservedState).toBeDefined();
    expect(gs.getObservedState).toBeDefined();
  });
});
```

---

### Integration Points

```yaml
INPUT FROM S1 (P1.M1.T1.S1):
  - File: src/utils/validate-groundswell-link.ts
  - Interface: NpmLinkValidationResult
  - Critical: If S1 returns success=false, Groundswell may not be installed
  - Usage: Check if Groundswell is installed before testing lifecycle

INPUT FROM S3 (P1.M1.T1.S3):
  - File: GroundswellCompatibilityReport
  - Interface: GroundswellCompatibilityReport
  - Critical fields: overallCompatible, groundswellVersion.meetsRecommended
  - Usage: Verify isDescendantOf() availability (v0.0.3+ feature)

OUTPUT FOR P1.M1.T2.S2 (Agent and Prompt tests):
  - Confirmation: Workflow lifecycle works correctly
  - Enables: Testing Agent and Prompt creation in workflow context

OUTPUT FOR P1.M1.T2.S3 (MCP tool registration):
  - Confirmation: Event propagation works
  - Enables: Testing MCP tools in workflow context

DIRECTORY STRUCTURE:
  - Create: tests/integration/groundswell/workflow.test.ts (new test file)
  - Location: Integration test directory (not unit test)
  - Reason: Tests real Groundswell behavior, not mocks
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating tests/integration/groundswell/workflow.test.ts
# Check TypeScript compilation
npx tsc --noEmit tests/integration/groundswell/workflow.test.ts

# Expected: No type errors

# Format check
npx prettier --check "tests/integration/groundswell/workflow.test.ts"

# Expected: No formatting issues

# Linting
npx eslint tests/integration/groundswell/workflow.test.ts

# Expected: No linting errors

# Fix any issues before proceeding
npm run fix
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the workflow lifecycle test file
npm test -- tests/integration/groundswell/workflow.test.ts

# Expected: All workflow lifecycle tests pass

# Run with coverage
npm run test:coverage -- tests/integration/groundswell/workflow.test.ts

# Expected: High coverage of tested lifecycle methods

# Run specific test categories
npm test -- -t "Class-based extension"
npm test -- -t "@Step decorator"
npm test -- -t "@Task decorator"
npm test -- -t "@ObservedState"

# Expected: All category tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test S1 dependency (npm link validation)
npm test -- -t "npm link validation"

# Expected: S1 validation passes, workflow tests can run

# Test S3 dependency (version compatibility)
npm test -- -t "version compatibility"

# Expected: S3 validation passes, v0.0.3 features available

# Test full workflow lifecycle
npm test -- tests/integration/groundswell/workflow.test.ts

# Expected: All integration tests pass

# Verify no accidental API calls
# Check that @anthropic-ai/sdk mock prevented calls
npm test -- tests/integration/groundswell/workflow.test.ts 2>&1 | grep -i "anthropic\|api"

# Expected: No actual API calls made (mocks working)
```

### Level 4: Domain-Specific Validation

```bash
# Workflow lifecycle validation
# Test 1: Verify class-based extension works
npm test -- -t "Class-based extension"

# Expected: SimpleWorkflow extends Workflow, run() executes

# Test 2: Verify @Step decorator emits events
npm test -- -t "@Step decorator"

# Expected: stepStart and stepEnd events emitted with duration

# Test 3: Verify @Task decorator creates parent-child
npm test -- -t "@Task decorator"

# Expected: Child attached, events emitted, isDescendantOf works

# Test 4: Verify @ObservedState captures state
npm test -- -t "@ObservedState"

# Expected: State snapshot includes non-hidden fields, redaction works

# Event propagation validation
# Test 5: Verify events propagate to observers
npm test -- -t "event propagation"

# Expected: Observer receives all workflow events

# State snapshot validation
# Test 6: Verify snapshotState() works correctly
npm test -- -t "snapshotState"

# Expected: All @ObservedState fields captured correctly

# Hierarchy validation
# Test 7: Verify parent-child relationships
npm test -- -t "parent-child"

# Expected: attachChild, detachChild, isDescendantOf work correctly

# Error handling validation
# Test 8: Verify errors are handled gracefully
npm test -- -t "error handling"

# Expected: Errors don't crash observers, proper error events emitted
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/integration/groundswell/workflow.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint tests/integration/groundswell/workflow.test.ts`
- [ ] No formatting issues: `npx prettier --check "tests/integration/groundswell/workflow.test.ts"`
- [ ] @anthropic-ai/sdk mock prevents actual API calls
- [ ] Observer pattern correctly captures events
- [ ] State snapshots work as expected

### Feature Validation

- [ ] Test 1: Class-based Workflow extension works
- [ ] Test 2: @Step decorator emits events with timing
- [ ] Test 3: @Task decorator creates parent-child relationships
- [ ] Test 4: @ObservedState decorator captures state correctly
- [ ] Redaction of sensitive fields works
- [ ] Hidden fields are excluded from snapshots
- [ ] isDescendantOf() works (if v0.0.3+)
- [ ] Event propagation to observers works
- [ ] State updates emit stateUpdated events

### Code Quality Validation

- [ ] Follows existing test patterns from tests/unit/groundswell/
- [ ] File placement matches desired codebase tree structure
- [ ] File naming follows convention (workflow.test.ts)
- [ ] Includes JSDoc header with @remarks and @see tags
- [ ] Uses vi.mock() for @anthropic-ai/sdk
- [ ] Uses vi.clearAllMocks() in beforeEach
- [ ] Observer pattern for event verification
- [ ] Tests cover happy path and error cases
- [ ] Clear test names with descriptive what/under why

### Documentation & Deployment

- [ ] Code is self-documenting with clear test names
- [ ] Error messages are descriptive and actionable
- [ ] Test output provides clear pass/fail status
- [ ] Any issues found are documented in test output
- [ ] No environment variables required
- [ ] Tests are idempotent (can run multiple times)

---

## Anti-Patterns to Avoid

- ❌ **Don't skip mocking @anthropic-ai/sdk** - Always mock to prevent API calls
- ❌ **Don't put vi.mock() after imports** - Must be at top level for hoisting
- ❌ **Don't forget vi.clearAllMocks()** - Prevents test pollution
- ❌ **Don't test non-@ObservedState fields in snapshots** - They won't be there
- ❌ **Don't assume isDescendantOf() exists** - Only in v0.0.3+
- ❌ **Don't add observers to child workflows** - Only root can have observers
- ❌ **Don't expect observer errors to throw** - They're logged, not thrown
- ❌ **Don't forget .js extensions** - ESM requires .js in relative imports
- ❌ **Don't use sync expectations for async operations** - Use await
- ❌ **Don't create circular parent-child relationships** - Will throw error
- ❌ **Don't test hidden fields in snapshots** - They're excluded by design
- ❌ **Don't expect redacted fields to show values** - They show as '***'
- ❌ **Don't skip event type checking** - Use discriminated unions for safety
- ❌ **Don't ignore duration in stepEnd events** - Should be >= 0
- ❌ **Don't forget to call run()** - Workflows don't auto-execute

---

## Appendix: Decision Rationale

### Why test @Step, @Task, and @ObservedState separately?

These are three core Groundswell decorator patterns that are used throughout the codebase:
- **@Step**: Used in src/workflows/bug-hunt-workflow.ts, src/workflows/fix-cycle-workflow.ts
- **@Task**: Will be used for hierarchical workflow spawning
- **@ObservedState**: Used for state persistence and recovery

Testing them separately ensures each pattern works correctly before combining them.

### Why use observer pattern for event verification?

Groundswell's event system is designed around observers. Using observers to capture events is the idiomatic way to verify event emission. Spies on emitEvent() are an alternative but observers are more realistic.

### Why mock @anthropic-ai/sdk at module level?

Groundswell may initialize the Anthropic SDK when imported. Mocking at module level with hoisting ensures the mock is applied before any import occurs. This prevents any accidental API calls during test execution.

### Why test redaction and hidden fields separately?

These are two distinct features of @ObservedState:
- **redact: true**: Field is present but value is masked
- **hidden: true**: Field is completely excluded from snapshot

Testing them separately ensures both features work correctly and as expected.

### Why check for isDescendantOf() availability?

The isDescendantOf() method was added in Groundswell v0.0.3. If the installed version is v0.0.1 or v0.0.2, this method won't exist. The check ensures tests work on older versions while documenting the v0.0.3 feature.

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success likelihood

**Validation Factors**:
- [x] Complete context from previous PRPs (S1, S2, S3)
- [x] Comprehensive Groundswell API documented
- [x] Existing test patterns analyzed and documented
- [x] External research from Groundswell source completed
- [x] All file paths and patterns specified
- [x] Mock patterns for @anthropic-ai/sdk identified
- [x] Observer pattern for event verification documented
- [x] ESM requirements documented (.js extensions)
- [x] Decorator requirements documented (experimentalDecorators)
- [x] 100% coverage requirement understood

**Risk Mitigation**:
- S1/S3 dependency checks prevent wasted time on missing/incompatible Groundswell
- Mock pattern prevents accidental API calls
- Observer pattern ensures event verification works
- Comprehensive test coverage catches edge cases
- Clear test names and structure for maintainability
- Follows existing codebase patterns for consistency

**Known Risks**:
- Groundswell version discrepancy (npm: 0.0.1, source: 0.0.3) - mitigated by version checks
- isDescendantOf() may not exist in older versions - mitigated by availability check
- Decorator configuration may differ across environments - mitigated by documentation

---

**END OF PRP**
