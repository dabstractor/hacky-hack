# Logging vs Test Expectations Analysis

## Executive Summary

**Issue**: 21 Task Orchestrator unit tests fail because test mocks expect `console.log()` calls but the implementation uses Pino structured logger.

**Root Cause**: Test-implementation misalignment. Tests were written expecting console.log with specific formatted strings (e.g., `'[TaskOrchestrator] Executing Phase: P1 - Phase 1'`), but the actual implementation uses Pino logger with structured data objects.

**Recommendation**: Update test mocks to expect Pino logger calls instead of console.log. The implementation is correct - tests need alignment.

## Analysis Details

### Test Expectations Pattern

Tests expect console.log calls with this format:

```typescript
// Example from tests/unit/core/task-orchestrator.test.ts:319-328
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

await orchestrator.executePhase(phase);

expect(consoleSpy).toHaveBeenCalledWith(
  '[TaskOrchestrator] Executing Phase: P1 - Phase 1'
);
```

**Expected patterns:**
- `'[TaskOrchestrator] Executing Phase: {id} - {title}'`
- `'[TaskOrchestrator] Executing Milestone: {id} - {title}'`
- `'[TaskOrchestrator] Executing Task: {id} - {title}'`
- `'[TaskOrchestrator] Executing Subtask: {id} - {title}'`
- `'[TaskOrchestrator] Starting PRPRuntime execution for {id}'`
- `'[TaskOrchestrator] PRPRuntime execution succeeded for {id}'`
- `'[TaskOrchestrator] Commit created: {hash}'`
- `'[TaskOrchestrator] No files to commit'`
- `'[TaskOrchestrator] Smart commit failed: {error}'`
- `'[TaskOrchestrator] Session path not available for smart commit'`
- `'[TaskOrchestrator] Execution queue empty - processing complete'`

### Implementation Logging Pattern

The actual implementation uses Pino logger:

```typescript
// From src/core/task-orchestrator.ts:112
this.#logger = getLogger('TaskOrchestrator');

// Example from lines 484-491
async executePhase(phase: Phase): Promise<void> {
  this.#logger.info({ phaseId: phase.id }, 'Setting status to Implementing');
  await this.#updateStatus(phase.id, 'Implementing');
  this.#logger.info(
    { phaseId: phase.id, title: phase.title },
    'Executing Phase'
  );
}
```

**Actual patterns:**
- Structured logging with objects: `{ phaseId, title }` + message
- Uses Pino logger with levels: info, warn, error, debug
- Context is included via getLogger('TaskOrchestrator')
- Messages are separate from data

### Mock Setup Analysis

Current mock setup (lines 22-34):

```typescript
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

**Problem**: The mockLogger IS defined with info/error/warn/debug methods, but tests are spying on console.log instead of using mockLogger.

## Complete List of 21 Failing Tests

1. `executePhase > should log execution message` (line 298)
2. `executeMilestone > should log execution message` (line 404)
3. `executeTask > should log execution message` (line 500)
4. `executeSubtask > should log placeholder execution message` (line 608)
5. `executeSubtask > smartCommit integration > should log commit hash when smartCommit succeeds` (line 721)
6. `executeSubtask > smartCommit integration > should log when smartCommit returns null (no files to commit)` (line 759)
7. `executeSubtask > smartCommit integration > should log error but not fail subtask when smartCommit throws` (line 797)
8. `executeSubtask > smartCommit integration > should log warning when session path is not available` (line 840)
9. `processNextItem > should return false when backlog is complete (no items pending)` (line 969)
10. `processNextItem > should log item being processed` (needs verification)
11. `integration scenarios > should support complete processing cycle: process items until complete` (needs verification)
12. `dependency resolution > executeSubtask() with dependencies > should skip execution when dependencies are not satisfied` (needs verification)
13. `dependency resolution > executeSubtask() with dependencies > should log all blocking dependencies` (needs verification)
14. `setStatus() > should log status transition with correct format` (needs verification)
15. `setStatus() > should include reason in log when provided` (needs verification)
16. `setStatus() > should handle missing reason parameter` (needs verification)
17. `executeSubtask() status lifecycle > should log Researching status with message` (needs verification)
18. `error handling with Failed status > should include error message in failed status reason` (needs verification)
19. `error handling with Failed status > should log error with context` (needs verification)
20. `error handling with Failed status > should handle different error types (Error, string, unknown)` (needs verification)
21. Additional logging tests (needs verification)

## Recommended Fix Strategy

### Option 1: Update Tests to Use MockLogger (RECOMMENDED)

Change test assertions from console.log to mockLogger:

```typescript
// BEFORE (current failing tests)
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
await orchestrator.executePhase(phase);
expect(consoleSpy).toHaveBeenCalledWith(
  '[TaskOrchestrator] Executing Phase: P1 - Phase 1'
);

// AFTER (fixed tests)
await orchestrator.executePhase(phase);
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);
```

### Option 2: Add Console Logger Wrapper (NOT RECOMMENDED)

Add a wrapper that logs to both Pino and console. This adds complexity and doesn't align with the structured logging architecture.

### Option 3: Change Implementation to Use console.log (NOT RECOMMENDED)

This would be a regression from structured logging back to ad-hoc console.log statements.

## Implementation Logging Reference

### executePhase (lines 483-492)

```typescript
async executePhase(phase: Phase): Promise<void> {
  this.#logger.info({ phaseId: phase.id }, 'Setting status to Implementing');
  await this.#updateStatus(phase.id, 'Implementing');
  this.#logger.info(
    { phaseId: phase.id, title: phase.title },
    'Executing Phase'
  );
}
```

**Test should expect:**
```typescript
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1' },
  'Setting status to Implementing'
);
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);
```

### executeMilestone (lines 505-517)

```typescript
async executeMilestone(milestone: Milestone): Promise<void> {
  this.#logger.info(
    { milestoneId: milestone.id },
    'Setting status to Implementing'
  );
  await this.#updateStatus(milestone.id, 'Implementing');
  this.#logger.info(
    { milestoneId: milestone.id, title: milestone.title },
    'Executing Milestone'
  );
}
```

**Test should expect:**
```typescript
expect(mockLogger.info).toHaveBeenCalledWith(
  { milestoneId: 'P1.M1' },
  'Setting status to Implementing'
);
expect(mockLogger.info).toHaveBeenCalledWith(
  { milestoneId: 'P1.M1', title: 'Milestone 1' },
  'Executing Milestone'
);
```

### executeTask (lines 531-562)

```typescript
async executeTask(task: Task): Promise<void> {
  this.#logger.info({ taskId: task.id }, 'Setting status to Implementing');
  await this.#updateStatus(task.id, 'Implementing');
  this.#logger.info({ taskId: task.id, title: task.title }, 'Executing Task');

  this.#logger.info(
    { taskId: task.id, subtaskCount: task.subtasks.length },
    'Enqueuing subtasks for parallel PRP generation'
  );

  for (const subtask of task.subtasks) {
    await this.researchQueue.enqueue(subtask, this.#backlog);
    this.#logger.debug(
      { taskId: task.id, subtaskId: subtask.id },
      'Enqueued for parallel research'
    );
  }

  const stats = this.researchQueue.getStats();
  this.#logger.debug(
    {
      queued: stats.queued,
      researching: stats.researching,
      cached: stats.cached,
    },
    'Research queue stats'
  );
}
```

### executeSubtask (lines 584-750)

Key logging points:
```typescript
// Line 585-588
this.#logger.info(
  { subtaskId: subtask.id, title: subtask.title },
  'Executing Subtask'
);

// Line 591-595
await this.setStatus(subtask.id, 'Researching', 'Starting PRP generation');
this.#logger.debug(
  { subtaskId: subtask.id },
  'Researching - preparing PRP'
);

// Line 598-611 (cache check)
const cachedPRP = this.researchQueue.getPRP(subtask.id);
if (cachedPRP) {
  this.#cacheHits++;
  this.#logger.debug(
    { subtaskId: subtask.id },
    'Cache HIT - using cached PRP'
  );
} else {
  this.#cacheMisses++;
  this.#logger.debug(
    { subtaskId: subtask.id },
    'Cache MISS - PRP will be generated by PRPRuntime'
  );
}

// Line 617-631 (blocking dependencies)
for (const blocker of blockers) {
  this.#logger.info(
    {
      subtaskId: subtask.id,
      blockerId: blocker.id,
      blockerTitle: blocker.title,
      blockerStatus: blocker.status,
    },
    'Blocked on dependency'
  );
}

this.#logger.warn(
  { subtaskId: subtask.id },
  'Subtask blocked on dependencies, skipping'
);

// Line 648-661 (PRP runtime)
this.#logger.info(
  { subtaskId: subtask.id },
  'Starting PRPRuntime execution'
);

const result = await this.#prpRuntime.executeSubtask(
  subtask,
  this.#backlog
);

this.#logger.info(
  { subtaskId: subtask.id, success: result.success },
  'PRPRuntime execution complete'
);

// Line 704-713 (smart commit)
if (!sessionPath) {
  this.#logger.warn('Session path not available for smart commit');
} else {
  const commitHash = await smartCommit(sessionPath, commitMessage);
  if (commitHash) {
    this.#logger.info({ commitHash }, 'Commit created');
  } else {
    this.#logger.info('No files to commit');
  }
}

// Line 715-720 (commit error)
catch (error) {
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  this.#logger.error({ error: errorMessage }, 'Smart commit failed');
}
```

### setStatus (lines 206-230)

```typescript
public async setStatus(
  itemId: string,
  status: Status,
  reason?: string
): Promise<void> {
  const currentItem = findItem(this.#backlog, itemId);
  const oldStatus = currentItem?.status ?? 'Unknown';
  const timestamp = new Date().toISOString();

  this.#logger.info(
    { itemId, oldStatus, newStatus: status, timestamp, reason },
    'Status transition'
  );

  await this.sessionManager.updateItemStatus(itemId, status);
  await this.#refreshBacklog();
}
```

### processNextItem (lines 805-834)

```typescript
async processNextItem(): Promise<boolean> {
  if (this.#executionQueue.length === 0) {
    this.#logger.info('Execution queue empty - processing complete');
    this.currentItemId = null;
    return false;
  }

  const nextItem = this.#executionQueue.shift()!;
  this.currentItemId = nextItem.id;

  this.#logger.info(
    { itemId: nextItem.id, type: nextItem.type },
    'Processing'
  );

  await this.#delegateByType(nextItem);
  await this.#refreshBacklog();

  return true;
}
```

## Best Practices from Codebase Research

### Pattern 1: Using mockLogger Directly

From `tests/unit/logger.test.ts` and other test files:

```typescript
// Correct pattern: use mockLogger directly
it('should log info message', () => {
  const logger = getLogger('Test');
  logger.info('Test message');

  expect(mockLogger.info).toHaveBeenCalledWith('Test message');
});
```

### Pattern 2: Structured Data Matching

When testing structured logging, match the object structure:

```typescript
// Test expects structured data
expect(mockLogger.info).toHaveBeenCalledWith(
  { taskId: 'P1.M1.T1', title: 'Test Task' },
  'Executing Task'
);

// Use matchers for partial object matching
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({
    taskId: 'P1.M1.T1',
  }),
  'Executing Task'
);
```

### Pattern 3: Multiple Call Verification

```typescript
// Verify multiple log calls in order
expect(mockLogger.info).toHaveBeenNthCalledWith(
  1,
  { phaseId: 'P1' },
  'Setting status to Implementing'
);
expect(mockLogger.info).toHaveBeenNthCalledWith(
  2,
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);
```

## Conclusion

**The implementation is correct.** The TaskOrchestrator properly uses Pino structured logging as designed. The tests need to be updated to match the implementation's logging pattern.

**Fix scope:**
- Update 21 test assertions to use mockLogger instead of console.log
- Match structured data objects instead of formatted strings
- Verify correct log levels (info, warn, error, debug)

**Estimated effort:** 1-2 hours to update all 21 tests.
