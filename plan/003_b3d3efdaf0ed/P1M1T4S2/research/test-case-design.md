# Test Case Design for Graceful Shutdown and Signal Handling

## Overview

This document outlines the comprehensive test cases for verifying PRPPipeline's graceful shutdown and signal handling functionality. These tests ensure that:

1. SIGINT/SIGTERM signals are caught and processed correctly
2. Current task completes before shutdown
3. Pending tasks are preserved in tasks.json
4. Pipeline can be resumed via --continue flag
5. No state corruption occurs during shutdown

## Test Categories

### 1. Signal Handler Registration and Cleanup

#### Test 1.1: SIGINT Handler Registration

**Purpose**: Verify SIGINT handler is registered during pipeline construction
**Setup**: Create PRPPipeline instance
**Execute**: Check process listeners for SIGINT
**Verify**: SIGINT handler is registered
**Expected**: `process.listeners('SIGINT')` contains pipeline's handler

#### Test 1.2: SIGTERM Handler Registration

**Purpose**: Verify SIGTERM handler is registered during pipeline construction
**Setup**: Create PRPPipeline instance
**Execute**: Check process listeners for SIGTERM
**Verify**: SIGTERM handler is registered
**Expected**: `process.listeners('SIGTERM')` contains pipeline's handler

#### Test 1.3: Signal Handler Cleanup on Normal Completion

**Purpose**: Verify signal handlers are removed after normal pipeline completion
**Setup**: Create and run pipeline to completion (no shutdown)
**Execute**: Check process listeners after pipeline.run()
**Verify**: Signal handlers are removed
**Expected**: Listener count returns to original count

#### Test 1.4: Signal Handler Cleanup on Error

**Purpose**: Verify signal handlers are removed even if pipeline errors
**Setup**: Create pipeline with mocked error during execution
**Execute**: Run pipeline and catch error
**Verify**: Signal handlers are removed in cleanup()
**Expected**: Listeners removed despite error

### 2. Signal Emission and Processing

#### Test 2.1: SIGINT Sets Shutdown Flag

**Purpose**: Verify SIGINT sets shutdownRequested and shutdownReason
**Setup**: Create pipeline with mocked orchestrator
**Execute**: Emit SIGINT during execution
**Verify**:

- `shutdownRequested` is true
- `shutdownReason` is 'SIGINT'
  **Expected**: Both flags set correctly

#### Test 2.2: SIGTERM Sets Shutdown Flag

**Purpose**: Verify SIGTERM sets shutdownRequested and shutdownReason
**Setup**: Create pipeline with mocked orchestrator
**Execute**: Emit SIGTERM during execution
**Verify**:

- `shutdownRequested` is true
- `shutdownReason` is 'SIGTERM'
  **Expected**: Both flags set correctly

#### Test 2.3: Duplicate SIGINT Handling

**Purpose**: Verify duplicate SIGINT signals are handled gracefully
**Setup**: Create pipeline with mocked orchestrator
**Execute**: Emit SIGINT twice in quick succession
**Verify**:

- First SIGINT sets shutdown flag
- Second SIGINT logs warning but doesn't cause issues
  **Expected**: Warning logged: "Duplicate SIGINT received - shutdown already in progress"

#### Test 2.4: Shutdown Request Logging

**Purpose**: Verify appropriate logging on shutdown request
**Setup**: Create pipeline with logger spy
**Execute**: Emit SIGINT
**Verify**: Logger.info called with shutdown message
**Expected**: Log message: "SIGINT received, initiating graceful shutdown"

### 3. Current Task Completion Before Shutdown

#### Test 3.1: Task Completes After SIGINT

**Purpose**: Verify current task finishes before shutdown
**Setup**:

- Create pipeline with 3 tasks
- Mock orchestrator to track completion
  **Execute**:
- Start task 1
- Emit SIGINT during task 1
  **Verify**:
- Task 1 completes
- Tasks 2 and 3 are NOT started
- Loop exits after task 1
  **Expected**: `processNextItem` called exactly once (for task 1)

#### Test 3.2: Task Completes After SIGTERM

**Purpose**: Verify current task finishes on SIGTERM
**Setup**: Same as Test 3.1
**Execute**: Emit SIGTERM during task 1
**Verify**: Same expectations as Test 3.1
**Expected**: Task 1 completes, loop exits

#### Test 3.3: In-Flight Task Not Interrupted

**Purpose**: Verify task already in progress completes
**Setup**:

- Mock long-running task (100ms)
- Emit signal 50ms into task
  **Execute**: Start task, emit signal mid-execution
  **Verify**: Task completes (no premature interruption)
  **Expected**: Task finishes, then loop checks shutdown flag

#### Test 3.4: Loop Exit After Shutdown Flag

**Purpose**: Verify main loop exits after shutdownRequested check
**Setup**: Create pipeline with mocked orchestrator
**Execute**:

- Set shutdownRequested = true
- Run one iteration
  **Verify**: Loop exits after current task completes
  **Expected**: `currentPhase` becomes 'shutdown_interrupted'

### 4. State Preservation During Shutdown

#### Test 4.1: SaveBacklog Called on Shutdown

**Purpose**: Verify SessionManager.saveBacklog() is called during cleanup
**Setup**:

- Create pipeline with mocked SessionManager
- Spy on saveBacklog method
  **Execute**: Run pipeline with SIGINT
  **Verify**: saveBacklog called exactly once
  **Expected**: Spy called with current backlog

#### Test 4.2: Task Statuses Preserved

**Purpose**: Verify task statuses are correctly saved
**Setup**:

- Create backlog with mixed statuses (Complete, Implementing, Planned)
- Trigger shutdown during "Implementing" task
  **Execute**: Run pipeline with shutdown
  **Verify**: Saved tasks.json has correct statuses:
- Task 1: Complete
- Task 2: Implementing (current task when shutdown)
- Task 3: Planned
  **Expected**: Statuses match execution state at shutdown

#### Test 4.3: CurrentItemId Preserved

**Purpose**: Verify currentItemId is saved for resume
**Setup**:

- Create backlog
- Start task P1.M1.T1.S2
- Trigger shutdown
  **Execute**: Run with shutdown
  **Verify**: tasks.json contains currentItemId = 'P1.M1.T1.S2'
  **Expected**: Resume can continue from this task

#### Test 4.4: FlushUpdates Called Before Save

**Purpose**: Verify pending batch updates are flushed
**Setup**:

- Create pipeline with mocked SessionManager
- Spy on flushUpdates method
  **Execute**: Run pipeline with shutdown
  **Verify**: flushUpdates called before saveBacklog
  **Expected**: Both methods called in correct order

#### Test 4.5: State Preserved on Error During Shutdown

**Purpose**: Verify state is saved even if error occurs during shutdown
**Setup**:

- Mock orchestrator to throw error
- Mock SessionManager saveBacklog
  **Execute**: Run pipeline (will error)
  **Verify**: saveBacklog still called in cleanup
  **Expected**: State saved despite error

### 5. Resume Functionality (--continue Flag)

#### Test 5.1: Resume from Interrupted Session

**Purpose**: Verify --continue flag resumes from saved state
**Setup**:

- Run pipeline with 3 tasks, interrupt after task 1
- Verify tasks.json has state
  **Execute**: Run pipeline again with --continue flag
  **Verify**:
- Tasks 1 skipped (already Complete)
- Task 2 starts
- No backlog regeneration
  **Expected**: Resume continues from task 2

#### Test 5.2: Resume Preserves Completed Tasks

**Purpose**: Verify completed tasks aren't re-executed
**Setup**:

- Create tasks.json with task 1 = Complete, task 2 = Planned
  **Execute**: Resume with --continue
  **Verify**: Task 1 not executed, task 2 executed
  **Expected**: Only planned tasks execute

#### Test 5.3: Resume from CurrentItemId

**Purpose**: Verify resume continues from currentItemId
**Setup**:

- Create tasks.json with currentItemId = 'P1.M1.T1.S3'
  **Execute**: Resume with --continue
  **Verify**: Execution starts from P1.M1.T1.S3
  **Expected**: Correct task resumed

#### Test 5.4: No Resume on Normal Completion

**Purpose**: Verify --continue is ignored if session already complete
**Setup**:

- Create tasks.json with all tasks = Complete
  **Execute**: Run with --continue
  **Verify**: No tasks executed
  **Expected**: Message: "All tasks already complete"

### 6. State Corruption Prevention

#### Test 6.1: Multiple Signals Don't Corrupt State

**Purpose**: Verify rapid multiple signals don't cause state issues
**Setup**: Create pipeline with 5 tasks
**Execute**: Emit SIGINT, SIGTERM, SIGINT rapidly
**Verify**:

- Only first signal processed
- State remains consistent
- No duplicate saves
  **Expected**: Clean shutdown with valid state

#### Test 6.2: Shutdown During Serialization

**Purpose**: Verify state handles shutdown during tasks.json write
**Setup**:

- Mock writeTasksJSON to be slow
- Emit signal during write
  **Execute**: Run pipeline
  **Verify**:
- Write completes atomically
- No partial/corrupted tasks.json
  **Expected**: Valid JSON file after shutdown

#### Test 6.3: Error During Cleanup Doesn't Corrupt

**Purpose**: Verify cleanup errors don't prevent state save
**Setup**:

- Mock cleanup to throw after saveBacklog
  **Execute**: Run pipeline with error
  **Verify**: saveBacklog called before error
  **Expected**: State saved, cleanup error logged

#### Test 6.4: Atomic Write Prevents Corruption

**Purpose**: Verify atomic write pattern prevents partial files
**Setup**:

- Mock fs.write to fail midway
  **Execute**: Trigger saveBacklog
  **Verify**:
- Temp file created
- On failure, temp file cleaned up
- Original tasks.json intact
  **Expected**: Either old or new file, never partial

### 7. PipelineResult Accuracy

#### Test 7.1: ShutdownInterrupted Flag on SIGINT

**Purpose**: Verify PipelineResult.shutdownInterrupted is true on SIGINT
**Setup**: Create pipeline, emit SIGINT
**Execute**: Run pipeline
**Verify**: result.shutdownInterrupted === true
**Expected**: Flag set correctly

#### Test 7.2: ShutdownInterrupted Flag on SIGTERM

**Purpose**: Verify PipelineResult.shutdownInterrupted is true on SIGTERM
**Setup**: Create pipeline, emit SIGTERM
**Execute**: Run pipeline
**Verify**: result.shutdownInterrupted === true
**Expected**: Flag set correctly

#### Test 7.3: ShutdownReason in Result

**Purpose**: Verify shutdownReason is included in result
**Setup**: Create pipeline, emit signal
**Execute**: Run pipeline
**Verify**: result.shutdownReason matches signal type
**Expected**: 'SIGINT' or 'SIGTERM'

#### Test 7.4: Progress Metrics Accurate

**Purpose**: Verify progress metrics reflect shutdown state
**Setup**: Create 5 tasks, shutdown after task 2
**Execute**: Run pipeline with shutdown
**Verify**:

- result.totalTasks = 5
- result.completedTasks = 2
- result.failedTasks = 0
  **Expected**: Metrics accurate at shutdown point

#### Test 7.5: FinalPhase Correct on Shutdown

**Purpose**: Verify finalPhase is 'shutdown_interrupted'
**Setup**: Create pipeline, trigger shutdown
**Execute**: Run pipeline
**Verify**: result.finalPhase === 'shutdown_interrupted'
**Expected**: Phase reflects interrupted state

### 8. Edge Cases and Error Scenarios

#### Test 8.1: Shutdown Before Any Tasks

**Purpose**: Verify shutdown works when no tasks started
**Setup**: Create pipeline, emit SIGINT before backlog execution
**Execute**: Run pipeline
**Verify**: Clean shutdown, zero tasks completed
**Expected**: All cleanup runs correctly

#### Test 8.2: Shutdown After Last Task

**Purpose**: Verify shutdown when queue empty (natural completion)
**Setup**: Create pipeline with 1 task
**Execute**: Run to completion
**Verify**: Shutdown flows complete normally
**Expected**: finalPhase = 'shutdown_complete'

#### Test 8.3: Shutdown During Error Recovery

**Purpose**: Verify shutdown during task error handling
**Setup**:

- Mock task to throw error
- Emit SIGINT during error handling
  **Execute**: Run pipeline
  **Verify**:
- Error tracked
- Shutdown completes
- State saved
  **Expected**: Both error and shutdown handled

#### Test 8.4: Resource Limit Shutdown

**Purpose**: Verify RESOURCE_LIMIT shutdown reason
**Setup**:

- Mock resource monitor to return shouldStop = true
  **Execute**: Run pipeline
  **Verify**:
- shutdownReason = 'RESOURCE_LIMIT'
- State saved
  **Expected**: Clean resource limit shutdown

## Test Implementation Notes

### Mock Strategy

1. **SessionManager Mock**:
   - Mock initialize() to return test session
   - Spy on saveBacklog() and flushUpdates()
   - Verify calls and order

2. **TaskOrchestrator Mock**:
   - Mock processNextItem() with controlled behavior
   - Track currentItemId
   - Control loop iterations

3. **PRPRuntime Mock**:
   - Avoid actual LLM calls
   - Return mock execution results

4. **Signal Emission**:
   - Use process.emit('SIGINT')
   - Allow async handlers to complete with setImmediate()
   - Restore listeners in afterEach

### Test Structure Pattern

```typescript
describe('test category', () => {
  it('should do specific thing', async () => {
    // SETUP: Create mocks and test data
    const mockSession = createMockSession();
    const mockOrchestrator = createMockOrchestrator();

    // EXECUTE: Run the test scenario
    process.emit('SIGINT');
    await new Promise(resolve => setImmediate(resolve));
    const result = await pipeline.run();

    // VERIFY: Check expectations
    expect(result.shutdownInterrupted).toBe(true);
    expect(mockSession.saveBacklog).toHaveBeenCalled();
  });
});
```

### Cleanup Pattern

```typescript
beforeEach(() => {
  // Store original listeners
  originalListeners = {
    SIGINT: process.listeners('SIGINT'),
    SIGTERM: process.listeners('SIGTERM'),
  };
});

afterEach(() => {
  // Restore original listeners
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalListeners.SIGINT.forEach(fn => process.on('SIGINT', fn));
  originalListeners.SIGTERM.forEach(fn => process.on('SIGTERM', fn));
});
```

## Success Criteria

All tests pass when:

1. ✅ All signal handlers registered and cleaned up
2. ✅ Current task completes before shutdown
3. ✅ State preserved in tasks.json
4. ✅ Resume functionality works correctly
5. ✅ No state corruption in any scenario
6. ✅ PipelineResult accurate
7. ✅ Edge cases handled gracefully
8. ✅ Zero memory leaks (listeners cleaned up)

## Dependencies on Previous Work Items

This PRP builds on:

- **P1.M1.T4.S1** (Main Execution Loop): Provides loop structure to test shutdown within
- **P1.M1.T3.S4** (QA Agent): Provides test pattern reference

## Parallel Context Considerations

This test file is separate from:

- **P1.M1.T4.S1**: Tests main loop execution (not shutdown)
- **P1.M1.T4.S3**: Will test resource monitoring
- **P1.M1.T4.S4**: Will test nested execution guard

This PRP focuses solely on signal handling and graceful shutdown.
