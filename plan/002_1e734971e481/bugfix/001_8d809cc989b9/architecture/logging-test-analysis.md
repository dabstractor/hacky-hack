# Logging Test vs Implementation Analysis

## Executive Summary

**Issue**: 27 test assertions (spanning approximately 15-21 test cases) in `tests/unit/core/task-orchestrator.test.ts` are failing because they expect `console.log` calls while the implementation uses Pino structured logging.

**Root Cause**: Tests use `vi.spyOn(console, 'log')` to spy on console output, but the TaskOrchestrator implementation uses `this.#logger.info()` from the Pino-based logger utility. The mock setup correctly provides `mockLogger` with `info/error/warn/debug` spies, but test assertions don't use them.

**Recommendation**: **Update test assertions to use `mockLogger` spies** (Option A). The implementation is correct and follows structured logging best practices.

**Impact**: Low-risk fix. Tests need to be updated to match the correct implementation architecture.

---

## Analysis Details

### 1. Complete List of Failing Test Assertions

The following 27 test assertions expect `consoleSpy` (spy on `console.log`) to be called with formatted strings:

| Line | Test Context | Expected Console Output | Actual Implementation |
|------|--------------|------------------------|----------------------|
| 325 | executePhase | `'[TaskOrchestrator] Executing Phase: P1 - Phase 1'` | `logger.info({ phaseId, title }, 'Executing Phase')` |
| 429 | executeMilestone | `'[TaskOrchestrator] Executing Milestone: P1.M1 - Milestone 1'` | `logger.info({ milestoneId, title }, 'Executing Milestone')` |
| 525 | executeTask | `'[TaskOrchestrator] Executing Task: P1.M1.T1 - Task 1'` | `logger.info({ taskId, title }, 'Executing Task')` |
| 639 | executeSubtask | `'[TaskOrchestrator] Executing Subtask: P1.M1.T1.S1 - Subtask 1'` | `logger.info({ subtaskId, title }, 'Executing Subtask')` |
| 642 | executeSubtask | `'[TaskOrchestrator] Starting PRPRuntime execution for P1.M1.T1.S1'` | `logger.info({ subtaskId }, 'Starting PRPRuntime execution')` |
| 645 | executeSubtask | `'[TaskOrchestrator] PRPRuntime execution succeeded for P1.M1.T1.S1'` | `logger.info({ subtaskId, success }, 'PRPRuntime execution complete')` |
| 753 | executeSubtask (commit) | `'[TaskOrchestrator] Commit created: abc123'` | `logger.info({ commitHash }, 'Commit created')` |
| 791 | executeSubtask (no files) | `'[TaskOrchestrator] No files to commit'` | `logger.info('No files to commit')` |
| 970 | processNextItem (empty) | `'[TaskOrchestrator] Execution queue empty - processing complete'` | `logger.info('Execution queue empty - processing complete')` |
| 1140 | processNextItem | `'[TaskOrchestrator] Processing: P1.M1.T1.S1 (Subtask)'` | `logger.info({ itemId, type }, 'Processing')` |
| 1359 | setScope | `expect.stringContaining('Scope change')` | `logger.info({ oldScope, newScope }, 'Scope change')` |
| 2132 | setStatus | `expect.stringContaining('[TaskOrchestrator] Status: P1 Planned -> Implementing')` | `logger.info({ itemId, oldStatus, newStatus, timestamp, reason }, 'Status transition')` |
| 2135 | setStatus | `expect.stringContaining('[TaskOrchestrator] Timestamp:')` | Same as above |
| 2238 | setStatus | `expect.stringContaining('(Starting work)')` | Same as above |
| 2241 | setStatus | `expect.stringContaining('[TaskOrchestrator] Timestamp:')` | Same as above |
| 2480 | setStatus | `expect.stringContaining('[TaskOrchestrator] Status: P1 Planned -> Implementing')` | Same as above |
| 2485 | setStatus | `expect.stringContaining('[TaskOrchestrator] Timestamp:')` | Same as above |
| 2488 | setStatus | `expect.stringContaining('(Starting work)')` | Same as above |
| 2551 | setStatus | `expect.stringContaining('(All tests passed)')` | `logger.info(..., reason)` |
| 2733 | executeSubtask (research) | `'[TaskOrchestrator] Researching: P1.M1.T1.S1 - preparing PRP'` | `logger.debug({ subtaskId }, 'Researching - preparing PRP')` |
| 2836 | executeSubtask (error) | `expect.stringContaining('[TaskOrchestrator] Subtask failed:')` | `logger.error({ subtaskId, error }, 'Subtask execution failed')` |
| 2886 | executeSubtask (null return) | `'[TaskOrchestrator] No files to commit'` | `logger.info('No files to commit')` |
| 2889 | executeSubtask (null return) | `'[TaskOrchestrator] Status updated to Complete'` | `logger.info(...)` |
| 2978 | executeSubtask (error) | `expect.stringContaining('[TaskOrchestrator] Subtask failed:')` | `logger.error({ subtaskId, error }, 'Subtask execution failed')` |
| 3363 | setScope | `expect.stringContaining('Scope change')` | `logger.info({ oldScope, newScope }, 'Scope change')` |

### 2. Implementation Logging Reference

The TaskOrchestrator (`src/core/task-orchestrator.ts`) uses structured logging via Pino:

```typescript
// Logger initialization (line ~112)
this.#logger = getLogger('TaskOrchestrator');

// Structured logging pattern throughout:
this.#logger.info({ phaseId: phase.id, title: phase.title }, 'Executing Phase');
this.#logger.info({ subtaskId: subtask.id }, 'Starting PRPRuntime execution');
this.#logger.error({ error: errorMessage }, 'Smart commit failed');
```

**Key characteristics**:
- Data is passed as an object parameter: `{ key: value }`
- Message is a separate string parameter: `'Executing Phase'`
- Context 'TaskOrchestrator' is added automatically via logger factory
- Different log levels: `info()`, `warn()`, `error()`, `debug()`

### 3. Mock Setup Analysis

The test file has **correct mock setup** (lines 22-34):

```typescript
// CORRECT: Mock logger is already hoisted and configured
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

**The Issue**: Test assertions don't use `mockLogger`. Instead, they use:
```typescript
// WRONG: Spying on console.log
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Executing Phase: P1 - Phase 1');
```

### 4. Root Cause Identification

**The Mismatch**:
1. **Tests expect**: Console output with formatted strings like `'[TaskOrchestrator] Executing Phase: P1 - Phase 1'`
2. **Implementation does**: Pino structured logging like `logger.info({ phaseId: 'P1', title: 'Phase 1' }, 'Executing Phase')`
3. **Mock setup**: Provides `mockLogger.info` spy, but tests use `console.log` spy

**Why This Happened**:
- Tests were likely written before Pino logger was implemented
- Or tests were written assuming console.log would be used
- The mock setup was updated to use `mockLogger` but assertions weren't updated

---

## Recommended Fix Strategy

### Option A: Update Test Assertions to Use mockLogger (RECOMMENDED)

**Pros**:
- Preserves structured logging architecture
- Follows best practices for testing
- Tests validate actual implementation behavior
- Mock is already correctly set up
- Low risk - only test changes needed

**Cons**:
- Requires updating 27 assertions
- Some assertions may need adjustment for multiple log calls

**Implementation**:
```typescript
// BEFORE (failing):
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
await orchestrator.executePhase(phase);
expect(consoleSpy).toHaveBeenCalledWith('[TaskOrchestrator] Executing Phase: P1 - Phase 1');

// AFTER (passing):
await orchestrator.executePhase(phase);
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);
```

### Option B: Add console.log Wrapper (NOT RECOMMENDED)

**Pros**:
- Tests pass without changes

**Cons**:
- Breaks structured logging architecture
- Adds unnecessary abstraction
- Violates separation of concerns
- Harder to maintain
- Doesn't align with best practices

### Option C: Change Implementation to console.log (NOT RECOMMENDED)

**Pros**:
- Tests pass without changes

**Cons**:
- Destroys structured logging benefits
- Loses log levels and context
- Breaks pino-pretty formatting
- Cannot redact sensitive data
- Major architectural regression

---

## Implementation Strategy for P3.M1.T1.S2

### Phase 1: Update execute* Method Tests

1. **executePhase test** (line ~319):
   - Remove `consoleSpy` setup
   - Update assertion to use `mockLogger.info`
   - Handle multiple log calls (status + executing)

2. **executeMilestone test** (line ~423):
   - Same pattern as executePhase

3. **executeTask test** (line ~519):
   - Same pattern, verify `taskId` and `title` in data object

4. **executeSubtask tests** (lines ~633, ~2727, ~2820, ~2962):
   - Multiple log points to verify
   - Some tests verify multiple log calls
   - Use `toHaveBeenNthCalledWith` for specific order

### Phase 2: Update processNextItem Tests

1. **Empty queue test** (line ~963):
   - Simple `mockLogger.info` assertion

2. **Processing test** (line ~1134):
   - Verify `itemId` and `type` in data object

### Phase 3: Update setStatus Tests

1. **Status transition tests** (lines ~2474, ~2541, ~2574):
   - Structured data includes: `itemId`, `oldStatus`, `newStatus`, `timestamp`, `reason`
   - Use `expect.objectContaining()` for partial matching

2. **No reason test** (line ~2574):
   - Verify no parentheses in formatted output (if needed)

### Phase 4: Update setScope Tests

1. **Scope change tests** (lines ~1310, ~3353):
   - Verify `oldScope` and `newScope` in data object

### Phase 5: Update Error Handling Tests

1. **Error logging tests** (lines ~2820, ~2962):
   - Use `mockLogger.error` spy
   - Verify error object structure

### Phase 6: Update Smart Commit Tests

1. **Commit created test** (line ~753):
   - Use `mockLogger.info` with `commitHash`

2. **No files test** (line ~791):
   - Simple string message assertion

### Testing Patterns to Use

```typescript
// Pattern 1: Exact match for structured data
expect(mockLogger.info).toHaveBeenCalledWith(
  { phaseId: 'P1', title: 'Phase 1' },
  'Executing Phase'
);

// Pattern 2: Partial match for flexibility
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({ phaseId: 'P1' }),
  'Executing Phase'
);

// Pattern 3: Multiple log calls
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

// Pattern 4: Different log levels
expect(mockLogger.warn).toHaveBeenCalledWith({ subtaskId: 'S1' }, 'Blocked message');
expect(mockLogger.error).toHaveBeenCalledWith({ error: 'message' }, 'Error occurred');
expect(mockLogger.debug).toHaveBeenCalledWith({ subtaskId: 'S1' }, 'Debug message');
```

---

## Best Practices from Codebase Research

### Logger Interface (`src/utils/logger.ts`)

The Logger interface supports multiple call signatures:
- `log(msg: string)` - Simple message
- `log(obj: unknown, msg?: string)` - Structured data with optional message

This flexibility allows both:
```typescript
logger.info('Simple message');
logger.info({ key: 'value' }, 'Message with context');
```

### Mock Setup Pattern

The correct mock setup (already in test file):
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

### Testing Structured Logging

When testing Pino logger:
1. Use the mocked `mockLogger` methods directly
2. Match the structured data object
3. Use `expect.objectContaining()` for partial matches
4. Use `toHaveBeenNthCalledWith()` for multiple calls
5. Match the correct log level (info/warn/error/debug)

---

## Success Criteria for Fix

After P3.M1.T1.S2 implements the fix:

- [ ] All 27 test assertions pass
- [ ] No console.log spying remains in TaskOrchestrator tests
- [ ] All assertions use `mockLogger.info/warn/error/debug`
- [ ] Structured data is properly validated
- [ ] Multiple log calls are correctly verified
- [ ] Test coverage remains at 100%
- [ ] No changes to production code (implementation is correct)

---

## References

- Test file: `/home/dustin/projects/hacky-hack/tests/unit/core/task-orchestrator.test.ts`
- Implementation: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
- Logger utility: `/home/dustin/projects/hacky-hack/src/utils/logger.ts`
- Logger tests: `/home/dustin/projects/hacky-hack/tests/unit/logger.test.ts`
- External research: `plan/.../P3M1T1S1/research/external-research.md`
