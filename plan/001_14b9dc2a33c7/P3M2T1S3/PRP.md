# Product Requirement Prompt (PRP): P3.M2.T1.S3 - Implement Status Tracking and Updates

---

## Goal

**Feature Goal**: Implement comprehensive status tracking and updates in TaskOrchestrator that logs all status transitions, handles errors by setting Failed status, and tracks the task lifecycle through Planned → Researching → Implementing → Complete/Failed states.

**Deliverable**: Enhanced TaskOrchestrator class with:

1. A public `setStatus()` method wrapping SessionManager.updateItemStatus()
2. Status transition logging at appropriate execution points
3. Error handling that sets Failed status on exceptions
4. Comprehensive logging of all status transitions for observability

**Success Definition**:

- `setStatus()` method wraps SessionManager.updateItemStatus() with automatic backlog refresh
- Execution methods call `setStatus()` at appropriate times:
  - `executeSubtask()` sets 'Researching' at start, 'Implementing' during work, 'Complete'/'Failed' at end
  - Parent execution methods log status transitions
- All exceptions trigger 'Failed' status with error logging
- Status transitions are logged with: itemId, oldStatus, newStatus, timestamp, reason
- Full test coverage including error scenarios and status transition verification

## User Persona

**Target User**: PRP Pipeline developers implementing the Task Execution Engine (P3.M2.T1), specifically the status tracking subsystem that provides observability into task execution lifecycle.

**Use Case**: The TaskOrchestrator needs to track and report task status throughout the execution lifecycle so that:

1. The SessionManager can persist accurate state to tasks.json
2. The Pipeline Controller can monitor progress and handle failures
3. Developers can debug issues through comprehensive status transition logs
4. The system can recover from failures by knowing which items failed

**User Journey**:

```
Pipeline Controller calls processNextItem()
    ↓
TaskOrchestrator identifies next pending subtask
    ↓
setStatus() called → 'Researching' (log: "Starting research for PRP generation")
    ↓
Research phase completes → setStatus() called → 'Implementing' (log: "Starting implementation")
    ↓
Coder agent execution
    ├─ Success → setStatus() called → 'Complete' (log: "Implementation completed successfully")
    └─ Exception → setStatus() called → 'Failed' (log: "Execution failed: <error details>")
```

**Pain Points Addressed**:

- **No visibility into status changes**: Currently, status updates happen silently without logging
- **No error state tracking**: Exceptions don't set Failed status, leaving items in inconsistent state
- **Debugging difficulty**: Without status transition logs, it's hard to track what happened during execution
- **No Research status usage**: The 'Researching' status exists but is never used

## Why

- **Observability Foundation**: Status logging provides the audit trail needed for debugging and monitoring the pipeline
- **Error Recovery**: Setting Failed status on exceptions enables the system to identify and potentially retry failed work
- **PRD Compliance**: Section 5.3 specifies support for "Researching" status which is currently unused
- **Future Integration**: P3.M3.T1 (PRP Generation) and P5.M1.T1 (Observability and Logging) depend on proper status tracking
- **State Machine Integrity**: Ensures all status transitions follow the defined state machine (Planned → Researching → Implementing → Complete/Failed)

## What

Implement status tracking in TaskOrchestrator that:

1. Provides a public `setStatus()` wrapper for SessionManager.updateItemStatus()
2. Logs all status transitions with structured information
3. Handles errors by setting Failed status
4. Uses the 'Researching' status during the research phase

### Functionality Requirements

1. **`setStatus(itemId: string, status: Status, reason?: string): Promise<void>`** - Public method that:
   - Wraps SessionManager.updateItemStatus()
   - Logs status transition with itemId, oldStatus, newStatus, reason
   - Refreshes backlog after update
   - Returns Promise that resolves when complete

2. **Enhanced `executeSubtask()`** - Modified to:
   - Set status to 'Researching' at start (for PRP generation phase)
   - Set status to 'Implementing' when starting work
   - Wrap execution in try/catch
   - Set status to 'Complete' on success
   - Set status to 'Failed' on exception with error details

3. **Status Transition Logging** - All status changes log:
   - Timestamp (ISO 8601)
   - Item ID and type
   - Old status → New status
   - Reason for transition
   - Error details (if applicable)

4. **Error Handling** - All execution methods:
   - Catch exceptions
   - Set status to 'Failed'
   - Log error with context
   - Re-throw for upstream handling

### Success Criteria

- [ ] `setStatus()` method exists and wraps SessionManager.updateItemStatus()
- [ ] `setStatus()` logs all status transitions with structured information
- [ ] `executeSubtask()` sets 'Researching' status at start
- [ ] `executeSubtask()` sets 'Implementing' status during work
- [ ] `executeSubtask()` sets 'Complete' or 'Failed' status at end
- [ ] All exceptions trigger 'Failed' status with error logging
- [ ] Status logs include: timestamp, itemId, oldStatus, newStatus, reason
- [ ] All tests pass including error scenarios
- [ ] Test coverage > 95% for new code

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: A developer unfamiliar with this codebase can implement status tracking using:

- Exact locations of existing status update patterns in SessionManager
- Current Status type definition and valid values
- Existing logging patterns in TaskOrchestrator (`[TaskOrchestrator] message`)
- Test patterns for async methods with mocked SessionManager
- External research on state machine patterns and error handling
- Complete code examples showing the patterns to follow

### Documentation & References

```yaml
# MUST READ - Core Implementation Files

- file: src/core/task-orchestrator.ts
  why: Contains TaskOrchestrator class with executeSubtask() method to enhance
  pattern: Uses bracketed console.log pattern: `[TaskOrchestrator] Message`
  gotcha: All status updates go through #updateStatus() method (private)
  lines: 365-401 (executeSubtask method), 243-251 (#updateStatus method)

- file: src/core/session-manager.ts
  why: Contains updateItemStatus() method that setStatus() wraps
  pattern: Async method that persists to tasks.json and updates internal state
  gotcha: Must await the result, then refresh backlog to get latest state
  lines: 422-463 (updateItemStatus method)

- file: src/core/models.ts
  why: Contains Status type definition showing all valid status values
  pattern: Status is a string literal union: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
  gotcha: 'Researching' status exists but is currently unused in codebase
  lines: 55-61 (Status type definition)

- file: src/utils/task-utils.ts
  why: Contains updateItemStatus() utility for immutable status updates
  pattern: Pure function that creates new Backlog with updated status
  gotcha: TaskOrchestrator's #updateStatus() uses SessionManager method, not this utility
  lines: 261-364 (updateItemStatus function)

- file: tests/unit/core/task-orchestrator.test.ts
  why: Shows existing test patterns for TaskOrchestrator
  pattern: Use factory functions for test data, vi.mock() for SessionManager
  gotcha: SessionManager methods are mocked as vi.fn().mockResolvedValue()
  lines: 1-500 (complete test file for patterns)

- file: tests/unit/core/session-manager.test.ts
  why: Shows test patterns for updateItemStatus() method
  pattern: Test status changes with before/after assertions
  gotcha: Verify both in-memory state and persisted file
  lines: 1-500 (complete test file for patterns)

# EXTERNAL RESEARCH - State Machine & Error Handling Patterns

- docfile: plan/001_14b9dc2a33c7/P3M2T1S3/research/status_tracking_research.md
  why: Comprehensive research on state machine patterns and status tracking
  section: State Machine Patterns (Lines 30-150), Status Transition Logging (Lines 151-280)
  critical: Finite State Machine principles, state transition validation

- docfile: plan/001_14b9dc2a33c7/P3M2T1S3/research/async_error_handling_research.md
  why: Research on async/await error handling patterns for TypeScript workflows
  section: Try/Catch with Status Cleanup (Lines 50-120), Error Context Enrichment (Lines 200-280)
  critical: How to ensure Failed status is set on any exception

- docfile: plan/001_14b9dc2a33c7/P3M2T1S3/research/logging_observability_research.md
  why: Research on logging patterns and observability for orchestration systems
  section: Status Transition Logging (Lines 30-180), Error Message Formatting (Lines 250-380)
  critical: Structured logging schema, bracketed log format patterns

# INDUSTRY REFERENCE IMPLEMENTATIONS

- url: https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html
  why: Airflow's state machine with explicit RUNNING state before work
  critical: How they handle task instance states and transitions

- url: https://docs.temporal.io/typescript/workflows
  why: Temporal's durable workflow state and automatic retry policies
  critical: Activity isolation and error handling patterns

- url: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
  why: GitHub Actions conditional execution and hierarchical status
  critical: Status propagation and job/step status handling
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.ts                 # Test configuration
├── PRD.md                           # Product Requirements Document
├── plan/001_14b9dc2a33c7/
│   ├── tasks.json                   # Task hierarchy
│   ├── architecture/                # Architecture documentation
│   └── P3M2T1S3/                   # This subtask directory
│       ├── research/                # Research documents (created by agents)
│       │   ├── status_tracking_research.md
│       │   ├── async_error_handling_research.md
│       │   └── logging_observability_research.md
│       └── PRP.md                   # THIS FILE
├── src/
│   ├── core/
│   │   ├── models.ts                # Status type, hierarchy interfaces
│   │   ├── session-manager.ts       # SessionManager with updateItemStatus()
│   │   ├── task-orchestrator.ts     # MODIFY: Add setStatus(), enhance executeSubtask()
│   │   └── session-utils.ts         # File utilities
│   └── utils/
│       └── task-utils.ts            # Hierarchy utilities
└── tests/
    └── unit/
        └── core/
            ├── session-manager.test.ts
            └── task-orchestrator.test.ts  # MODIFY: Add status tracking tests
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files - modifications to existing files only

# MODIFICATIONS:
src/core/task-orchestrator.ts
  - ADD: public setStatus(itemId, status, reason?) method
  - MODIFY: executeSubtask() to use setStatus() with full lifecycle tracking
  - MODIFY: executePhase() to log status transitions
  - MODIFY: executeMilestone() to log status transitions
  - MODIFY: executeTask() to log status transitions
  - ADD: try/catch error handling in executeSubtask()

tests/unit/core/task-orchestrator.test.ts
  - ADD: Tests for setStatus() method
  - ADD: Tests for status transition logging
  - ADD: Tests for error handling with Failed status
  - ADD: Integration test for full status lifecycle
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Status values are case-sensitive string literals
// CORRECT: await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
// WRONG: await this.setStatus(subtask.id, 'researching'); // Lowercase fails

// CRITICAL: The 'Researching' status exists but is unused - this PRP activates it
// Status type: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

// CRITICAL: All status updates must persist through SessionManager
// Direct status mutation will NOT persist to tasks.json
// Always use sessionManager.updateItemStatus() or the new setStatus() wrapper

// CRITICAL: After status update, must refresh backlog to get latest state
// The #updateStatus() method does this automatically - setStatus() should too

// CRITICAL: Bracketed logging pattern must be used consistently
// Pattern: [TaskOrchestrator] Message
// Examples:
// console.log(`[TaskOrchestrator] Status: ${id} ${oldStatus} → ${newStatus}`);
// console.log(`[TaskOrchestrator] ERROR: ${subtask.id} failed: ${error.message}`);

// CRITICAL: Error handling MUST set Failed status
// Use try/catch in executeSubtask() to catch any exception
// Set status to 'Failed' with error message as reason

// GOTCHA: The backlog property is a getter, not direct access
// Use this.backlog to read, use setStatus() to update (don't mutate directly)

// PATTERN: Private methods use #prefix (JavaScript private class fields)
// Private: #updateStatus(), #refreshBacklog(), #delegateByType()
// Public: setStatus(), executePhase(), executeSubtask(), processNextItem()

// PATTERN: Status updates in parent items are 'Implementing' only
// executePhase(), executeMilestone(), executeTask() don't use 'Researching'
// Only executeSubtask() uses the full lifecycle: Researching → Implementing → Complete/Failed

// TESTING: Use vi.fn().mockResolvedValue() for async method mocks
// SessionManager.updateItemStatus should be mocked to return updated backlog
// Verify status was set by checking the mock was called with correct parameters

// TESTING: Factory functions create test data
// createTestSubtask(id, title, status, dependencies, context_scope)
// Use these to create test fixtures for different status scenarios

// GOTCHA: Status transitions should be validated
// Not all transitions are valid (e.g., Complete → Planned is invalid)
// This PRP doesn't implement validation but logs all transitions
```

---

## Implementation Blueprint

### Data Models and Structure

This PRP uses existing data models - no new models needed.

**Existing Models Used:**

- `Status` type from `src/core/models.ts`: `'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'`
- `HierarchyItem` type: `Phase | Milestone | Task | Subtask`
- SessionManager's `updateItemStatus(itemId: string, status: Status): Promise<Backlog>`

**Status State Machine (for reference):**

```
Planned → Researching → Implementing → Complete
                              ↓
                            Failed
                              ↓
                           Obsolete
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: MODIFY src/core/task-orchestrator.ts - Add setStatus() method
  - IMPLEMENT: public async setStatus(itemId: string, status: Status, reason?: string): Promise<void>
  - SIGNATURE: Matches contract definition from work item
  - LOGIC:
    1. Get current item to capture oldStatus (for logging)
    2. Log status transition: [TaskOrchestrator] Status: {itemId} {oldStatus} → {status} {reason}
    3. Call SessionManager.updateItemStatus() to persist
    4. Call #refreshBacklog() to reload latest state
  - LOG FORMAT: Include timestamp, itemId, oldStatus, newStatus, reason
  - ERROR HANDLING: Propagate SessionFileError from SessionManager
  - NAMING: camelCase method name, matches contract
  - PLACEMENT: After get backlog getter, before executePhase()

Task 2: MODIFY src/core/task-orchestrator.ts - Enhance executeSubtask() entry
  - MODIFY: executeSubtask() method to set 'Researching' status at start
  - ADD: await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
  - PLACEMENT: At very start of method, after initial console.log
  - LOG: Also log: [TaskOrchestrator] Researching: {subtask.id} - preparing PRP

Task 3: MODIFY src/core/task-orchestrator.ts - Add try/catch to executeSubtask()
  - MODIFY: Wrap existing execution logic in try/catch block
  - LOGIC:
    1. After 'Researching', set status to 'Implementing'
    2. Wrap placeholder execution in try block
    3. On success, set status to 'Complete'
    4. On catch, set status to 'Failed' with error message
    5. Re-throw error for upstream handling
  - PRESERVE: All existing placeholder execution logic
  - PLACEMENT: Main body of executeSubtask() method

Task 4: MODIFY src/core/task-orchestrator.ts - Update parent execution methods logging
  - MODIFY: executePhase(), executeMilestone(), executeTask() to log status
  - ADD: Log statement before #updateStatus calls
  - LOG FORMAT: [TaskOrchestrator] {Type}: {id} - Setting status to Implementing
  - PRESERVE: All existing status update logic
  - PLACEMENT: In each execute* method, before calling #updateStatus

Task 5: CREATE tests/unit/core/task-orchestrator.test.ts - Add setStatus() tests
  - IMPLEMENT: Unit tests for setStatus() method
  - TEST CASES:
    - logs status transition with correct format
    - calls SessionManager.updateItemStatus() with correct parameters
    - calls #refreshBacklog() after status update
    - includes reason in log when provided
    - handles missing reason parameter
  - PATTERN: Use existing test structure with describe/it blocks
  - FOLLOW: Setup/Execute/Verify pattern

Task 6: CREATE tests/unit/core/task-orchestrator.test.ts - Add executeSubtask() tests
  - IMPLEMENT: Unit tests for enhanced executeSubtask() method
  - TEST CASES:
    - sets 'Researching' status at start
    - sets 'Implementing' status after research
    - sets 'Complete' status on success
    - sets 'Failed' status on exception
    - includes error message in failed status reason
    - re-throws error after setting Failed status
  - PATTERN: Mock SessionManager.updateItemStatus to verify calls
  - FOLLOW: Setup/Execute/Verify pattern with async/await

Task 7: CREATE tests/unit/core/task-orchestrator.test.ts - Add error handling tests
  - IMPLEMENT: Unit tests for error handling
  - TEST CASES:
    - catches exceptions and sets Failed status
    - logs error with context
    - re-throws original error
    - handles different error types (Error, string, unknown)
  - PATTERN: Use vi.fn().mockRejectedValue for error scenarios
  - FOLLOW: Error testing patterns from existing test suite

Task 8: CREATE tests/unit/core/task-orchestrator.test.ts - Add integration test
  - IMPLEMENT: Integration test for full status lifecycle
  - TEST SCENARIO:
    1. Create test subtask with 'Planned' status
    2. Call executeSubtask()
    3. Verify status progression: Planned → Researching → Implementing → Complete
    4. Verify all status transitions were logged
    5. Repeat with error scenario → verify Failed status
  - PATTERN: Use factory functions for test data
  - VALIDATE: Complete lifecycle tracking works end-to-end
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: setStatus() Method Implementation
// ============================================================================

/**
 * Sets item status with logging and state persistence
 *
 * @param itemId - Item ID to update (e.g., "P1.M1.T1.S1")
 * @param status - New status value
 * @param reason - Optional reason for status change (for debugging)
 * @throws {Error} If SessionManager.updateItemStatus() fails
 *
 * @remarks
 * Public wrapper for SessionManager.updateItemStatus() that:
 * 1. Logs the status transition with structured information
 * 2. Persists the status change via SessionManager
 * 3. Refreshes backlog to get latest state
 *
 * Logs include: timestamp, itemId, oldStatus, newStatus, reason
 */
public async setStatus(
  itemId: string,
  status: Status,
  reason?: string
): Promise<void> {
  // PATTERN: Get current item to capture oldStatus for logging
  const currentItem = findItem(this.#backlog, itemId);
  const oldStatus = currentItem?.status ?? 'Unknown';
  const timestamp = new Date().toISOString();

  // PATTERN: Log status transition with structured information
  // Format includes: timestamp, itemId, oldStatus, newStatus, reason
  const reasonStr = reason ? ` (${reason})` : '';
  console.log(
    `[TaskOrchestrator] Status: ${itemId} ${oldStatus} → ${status}${reasonStr}`
  );
  console.log(`[TaskOrchestrator] Timestamp: ${timestamp}`);

  // PATTERN: Persist status change through SessionManager
  await this.sessionManager.updateItemStatus(itemId, status);

  // PATTERN: Reload backlog to get latest state
  await this.#refreshBacklog();
}

// ============================================================================
// PATTERN 2: Enhanced executeSubtask() with Full Lifecycle Tracking
// ============================================================================

async executeSubtask(subtask: Subtask): Promise<void> {
  console.log(
    `[TaskOrchestrator] Executing Subtask: ${subtask.id} - ${subtask.title}`
  );

  // PATTERN: Set 'Researching' status at start (NEW - activates unused status)
  await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
  console.log(`[TaskOrchestrator] Researching: ${subtask.id} - preparing PRP`);

  // PATTERN: Check dependencies (existing logic - preserve)
  if (!this.canExecute(subtask)) {
    const blockers = this.getBlockingDependencies(subtask);
    for (const blocker of blockers) {
      console.log(
        `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
      );
    }
    console.log(
      `[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies, skipping`
    );
    return;
  }

  // PATTERN: Set 'Implementing' status before work
  await this.setStatus(subtask.id, 'Implementing', 'Starting implementation');

  // PATTERN: Wrap execution in try/catch for error handling (NEW)
  try {
    // PLACEHOLDER: PRP generation + Coder agent execution (existing - preserve)
    console.log(
      `[TaskOrchestrator] PLACEHOLDER: Would generate PRP and run Coder agent`
    );
    console.log(`[TaskOrchestrator] Context scope: ${subtask.context_scope}`);

    // PATTERN: Set 'Complete' status on success
    await this.setStatus(subtask.id, 'Complete', 'Implementation completed successfully');
  } catch (error) {
    // PATTERN: Set 'Failed' status on exception with error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    await this.setStatus(
      subtask.id,
      'Failed',
      `Execution failed: ${errorMessage}`
    );

    // PATTERN: Log error with context for debugging
    console.error(
      `[TaskOrchestrator] ERROR: ${subtask.id} failed: ${errorMessage}`
    );

    // PATTERN: Re-throw error for upstream handling
    throw error;
  }
}

// ============================================================================
// PATTERN 3: Enhanced Parent Execution Methods with Logging
// ============================================================================

async executePhase(phase: Phase): Promise<void> {
  // PATTERN: Log before status update (NEW - adds visibility)
  console.log(
    `[TaskOrchestrator] Phase: ${phase.id} - Setting status to Implementing`
  );

  // EXISTING: Status update (preserve logic)
  await this.#updateStatus(phase.id, 'Implementing');

  // EXISTING: Logging (preserve)
  console.log(
    `[TaskOrchestrator] Executing Phase: ${phase.id} - ${phase.title}`
  );
}

// Apply same pattern to executeMilestone() and executeTask()

// ============================================================================
// PATTERN 4: Status Transition Log Format
// ============================================================================

// Format: [TaskOrchestrator] Status: {itemId} {oldStatus} → {newStatus} ({reason})
// Examples:
// [TaskOrchestrator] Status: P1.M1.T1.S1 Planned → Researching (Starting PRP generation)
// [TaskOrchestrator] Status: P1.M1.T1.S1 Researching → Implementing (Starting implementation)
// [TaskOrchestrator] Status: P1.M1.T1.S1 Implementing → Complete (Implementation completed successfully)
// [TaskOrchestrator] Status: P1.M1.T1.S1 Implementing → Failed (Execution failed: Network timeout)
// [TaskOrchestrator] Timestamp: 2024-01-13T10:30:45.123Z

// ============================================================================
// PATTERN 5: Error Handling with Context
// ============================================================================

// PATTERN: Catch errors, set Failed status, log context, re-throw
try {
  // ... execution logic ...
} catch (error) {
  // Extract error message safely (handles Error objects and primitives)
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Set Failed status with error details
  await this.setStatus(itemId, 'Failed', `Execution failed: ${errorMessage}`);

  // Log error with context for debugging
  console.error(`[TaskOrchestrator] ERROR: ${itemId} failed: ${errorMessage}`);
  if (error instanceof Error && error.stack) {
    console.error(`[TaskOrchestrator] Stack trace: ${error.stack}`);
  }

  // Re-throw for upstream handling
  throw error;
}

// ============================================================================
// PATTERN 6: Testing Status Transitions
// ============================================================================

// Test: Verify setStatus() logs correctly
it('should log status transition with correct format', async () => {
  const orchestrator = createTestOrchestrator(testBacklog);
  const consoleLogSpy = vi.spyOn(console, 'log');

  await orchestrator.setStatus('P1.M1.T1.S1', 'Implementing', 'Starting work');

  expect(consoleLogSpy).toHaveBeenCalledWith(
    expect.stringContaining('[TaskOrchestrator] Status: P1.M1.T1.S1 Planned → Implementing')
  );
  expect(consoleLogSpy).toHaveBeenCalledWith(
    expect.stringContaining('[TaskOrchestrator] Timestamp:')
  );
});

// Test: Verify executeSubtask() sets Researching status
it('should set Researching status at start', async () => {
  const orchestrator = createTestOrchestrator(testBacklog);
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', []);

  await orchestrator.executeSubtask(subtask);

  expect(mockSessionManager.updateItemStatus).toHaveBeenCalledWith(
    'P1.M1.T1.S1',
    'Researching'
  );
});

// Test: Verify error handling sets Failed status
it('should set Failed status on exception', async () => {
  const orchestrator = createTestOrchestrator(testBacklog);
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', []);

  // Mock to throw error
  mockSessionManager.updateItemStatus.mockImplementation(async () => {
    throw new Error('Test error');
  });

  await expect(orchestrator.executeSubtask(subtask)).rejects.toThrow('Test error');

  // Verify Failed status was set
  const failedCalls = mockSessionManager.updateItemStatus.mock.calls.filter(
    call => call[1] === 'Failed'
  );
  expect(failedCalls.length).toBeGreaterThan(0);
});
```

### Integration Points

```yaml
TASK_ORCHESTRATOR:
  - file: src/core/task-orchestrator.ts
  - add_method: "setStatus(itemId, status, reason?)"
  - modify_method: "executeSubtask()" - Add Researching status, try/catch
  - modify_methods: "executePhase(), executeMilestone(), executeTask()" - Add logging

SESSION_MANAGER:
  - file: src/core/session-manager.ts
  - use_method: "updateItemStatus(itemId, status)" - Called by setStatus()
  - pattern: "No modifications needed - method already exists"

MODELS:
  - file: src/core/models.ts
  - use_type: "Status" for all status values
  - pattern: "No modifications needed - type already includes Researching"

TASK_UTILS:
  - file: src/utils/task-utils.ts
  - use_function: "findItem(backlog, id)" - Get current item for oldStatus
  - pattern: "No modifications needed - utility already exists"

TESTS:
  - file: tests/unit/core/task-orchestrator.test.ts
  - add_tests: "setStatus(), executeSubtask() lifecycle, error handling"
  - pattern: "Follow existing test structure with Setup/Execute/Verify"
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit

# Linting with ESLint (auto-fix issues)
npm run lint -- --fix src/core/task-orchestrator.ts

# Format code with Prettier
npm run format -- --write src/core/task-orchestrator.ts
npm run format -- --write tests/unit/core/task-orchestrator.test.ts

# Project-wide validation
npx tsc --noEmit
npm run lint -- --fix
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific test suites for TaskOrchestrator
npm test -- tests/unit/core/task-orchestrator.test.ts --run

# Test with coverage
npm test -- tests/unit/core/task-orchestrator.test.ts --run --coverage

# Run all unit tests
npm test -- tests/unit/ --run

# Coverage validation
npm test -- --coverage --reporter=term-missing

# Expected: All tests pass. Target coverage > 95% for new code.
# If failing, debug root cause and fix implementation.

# Watch mode during development
npm test -- tests/unit/core/task-orchestrator.test.ts --watch
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual integration test - verify status lifecycle
cat > tests/manual/status-tracking-integration.test.ts << 'EOF'
import { SessionManager } from '../../src/core/session-manager.js';
import { TaskOrchestrator } from '../../src/core/task-orchestrator.js';

async function testStatusLifecycle() {
  const sm = new SessionManager('./PRD.md');
  await sm.initialize();

  const orchestrator = new TaskOrchestrator(sm);

  // Create test subtask with Planned status
  const testSubtask = {
    id: 'TEST.S1',
    type: 'Subtask',
    title: 'Test Status Tracking',
    status: 'Planned',
    story_points: 1,
    dependencies: [],
    context_scope: 'test only'
  };

  // Execute and verify status progression
  console.log('Starting status lifecycle test...');
  await orchestrator.executeSubtask(testSubtask);

  // Verify final status in tasks.json
  const finalItem = findItem(sm.currentSession.taskRegistry, 'TEST.S1');
  console.log(`Final status: ${finalItem?.status}`);
  console.log('Status transitions logged - check console output above');
}

testStatusLifecycle().catch(console.error);
EOF

# Run integration test
npm test -- tests/manual/status-tracking-integration.test.ts

# Verify status changes in tasks.json
cat plan/001_14b9dc2a33c7/tasks.json | jq '.backlog[0].status'

# Expected: Status progression logged, final status persisted to tasks.json
```

### Level 4: Domain-Specific Validation

```bash
# Status Tracking Specific Validations:

# Test 1: Verify Researching status is used
# Execute a subtask, check logs for "Researching" status
# Expected: Log shows "P1.M1.T1.S1 Planned → Researching"

# Test 2: Verify Failed status on exception
# Mock executeSubtask to throw error
# Expected: Log shows "P1.M1.T1.S1 Implementing → Failed"

# Test 3: Verify status transition log format
# Check all status logs follow format: [TaskOrchestrator] Status: {id} {old} → {new}
# Expected: All status logs match pattern

# Test 4: Verify error logging includes stack trace
# Trigger an error, check console.error output
# Expected: Stack trace logged after error message

# Test 5: Verify reason parameter is logged
# Call setStatus() with custom reason
# Expected: Reason appears in log: "(Starting PRP generation)"

# Manual validation checklist:
echo "Status Tracking Validation Checklist"
echo "===================================="
echo "[] setStatus() method exists and is public"
echo "[] setStatus() logs status transitions with timestamp"
echo "[] executeSubtask() sets Researching status at start"
echo "[] executeSubtask() sets Implementing status during work"
echo "[] executeSubtask() sets Complete status on success"
echo "[] executeSubtask() sets Failed status on exception"
echo "[] Status logs include itemId, oldStatus, newStatus, reason"
echo "[] Errors are logged with context and stack trace"
echo "[] Failed status includes error message in reason"
echo "[] Parent execution methods log status changes"
echo "[] All tests pass with >95% coverage"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/core/task-orchestrator.test.ts --run`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Coverage > 95% for new code

### Feature Validation

- [ ] `setStatus()` method is public and accepts (itemId, status, reason?) parameters
- [ ] `setStatus()` logs status transitions with structured information
- [ ] `setStatus()` includes timestamp in logs
- [ ] `executeSubtask()` sets 'Researching' status at start
- [ ] `executeSubtask()` sets 'Implementing' status during work
- [ ] `executeSubtask()` sets 'Complete' status on success
- [ ] `executeSubtask()` sets 'Failed' status on exception
- [ ] Error messages are included in Failed status reason
- [ ] Errors are logged with context and stack trace
- [ ] Parent execution methods log status changes
- [ ] All status transitions follow bracketed log format: `[TaskOrchestrator] Status: ...`

### Code Quality Validation

- [ ] Follows existing bracketed logging pattern: `[TaskOrchestrator] message`
- [ ] Uses strict string equality for status values
- [ ] All status updates go through SessionManager.updateItemStatus()
- [ ] Backlog is refreshed after all status updates
- [ ] Private methods use `#` prefix (if any added)
- [ ] Tests follow Setup/Execute/Verify pattern
- [ ] JSDoc comments present for new public methods
- [ ] Error handling preserves original error before re-throwing

### Documentation & Deployment

- [ ] `setStatus()` method has JSDoc with @param, @throws tags
- [ ] Console.log messages are informative but not verbose
- [ ] Status transition logs include all required fields
- [ ] Error logs are actionable for debugging
- [ ] No TODO comments left in production code
- [ ] Research documents are preserved in research/ subdirectory

---

## Anti-Patterns to Avoid

- ❌ Don't skip logging status transitions - observability is critical
- ❌ Don't use lowercase status values - Status type is case-sensitive
- ❌ Don't catch errors without setting Failed status - causes inconsistent state
- ❌ Don't log errors without context - include error message and stack trace
- ❌ Don't re-throw without logging first - loses debugging information
- ❌ Don't set status directly - always use SessionManager.updateItemStatus()
- ❌ Don't forget to refresh backlog after status updates - stale data causes bugs
- ❌ Don't skip the Researching status - this PRP activates it intentionally
- ❌ Don't log without timestamps - needed for debugging and observability
- ❌ Don't ignore the reason parameter - provides valuable debugging context
- ❌ Don't mutate status directly on items - use immutable update pattern
- ❌ Don't use console.error for non-error conditions - use console.log
- ❌ Don't skip JSDoc comments for public methods - API documentation is required
- ❌ Don't create new Status values - use existing type from models.ts
- ❌ Don't log after status update - log before to capture oldStatus

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Reasoning**:

- Complete understanding of existing codebase patterns from previous subtasks
- All external research completed with actionable findings
- Clear contract definition from work item specification
- Comprehensive code examples with exact patterns to follow
- Existing test patterns identified and documented
- Research documents provide industry best practices
- Error handling patterns are well-established

**Risk Factors**:

- Try/catch in executeSubtask() may mask errors if not implemented correctly
- Status transition logging format must be consistent with existing patterns
- Test mocking may be complex for error scenarios

**Mitigation**:

- Detailed code examples show exact error handling pattern
- Log format is specified with examples
- Test patterns from existing test suite are documented
- Research documents include industry reference implementations
