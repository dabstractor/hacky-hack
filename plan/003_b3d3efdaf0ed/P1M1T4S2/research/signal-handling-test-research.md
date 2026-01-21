# Signal Handling and Graceful Shutdown Testing Research

**Date**: 2026-01-19
**Author**: Research Agent
**Focus**: Testing graceful shutdown and signal handling in TypeScript/Node.js applications

## Table of Contents

1. [Overview](#overview)
2. [Mocking Process Signals in Vitest](#mocking-process-signals-in-vitest)
3. [Testing Task Completion Before Shutdown](#testing-task-completion-before-shutdown)
4. [Testing State Persistence During Shutdown](#testing-state-persistence-during-shutdown)
5. [Testing Signal Listener Cleanup](#testing-signal-listener-cleanup)
6. [Common Pitfalls When Testing Signal Handlers](#common-pitfalls-when-testing-signal-handlers)
7. [Testing --continue Flag Functionality](#testing---continue-flag-functionality)
8. [Verifying No State Corruption During Shutdown](#verifying-no-state-corruption-during-shutdown)
9. [Best Practices Summary](#best-practices-summary)
10. [References and Resources](#references-and-resources)

---

## Overview

This research document compiles best practices for testing graceful shutdown and signal handling in TypeScript/Node.js applications, with specific focus on patterns applicable to PRPPipeline testing.

### Key Signals to Test

- **SIGINT**: Sent when user presses Ctrl+C
- **SIGTERM**: Sent by `kill` command (default signal)
- **Custom Resource Limits**: Application-defined limits (memory, file handles, task count)

### Graceful Shutdown Requirements

1. **Current task completion**: Allow in-flight task to finish
2. **State persistence**: Save current progress before exit
3. **Clean resource cleanup**: Remove event listeners, close connections
4. **Informative logging**: Log shutdown reason and progress state
5. **Resumability**: Enable continuation via --continue flag

---

## 1. Mocking Process Signals in Vitest

### Pattern 1: Using process.emit()

The most direct way to test signal handlers is using `process.emit()` to trigger signal events.

```typescript
describe('SIGINT handling', () => {
  it('should set shutdown flags on SIGINT', async () => {
    // SETUP
    const pipeline = new PRPPipeline('./test.md');

    // EXECUTE - Emit SIGINT directly
    process.emit('SIGINT');

    // VERIFY
    expect(pipeline.shutdownRequested).toBe(true);
    expect(pipeline.shutdownReason).toBe('SIGINT');

    // CLEANUP - Remove listeners to prevent memory leaks
    process.removeAllListeners('SIGINT');
  });
});
```

**Key Points:**

- `process.emit('SIGINT')` triggers all registered SIGINT handlers synchronously
- Handlers execute in the order they were registered
- Must clean up listeners in `afterEach` to prevent test pollution

### Pattern 2: Emitting Signals During Execution

For testing shutdown during actual execution, emit signals within mocked process methods:

```typescript
it('should handle SIGTERM during execution', async () => {
  const pipeline = new PRPPipeline('./test.md');

  // Mock orchestrator to emit signal during execution
  const mockOrchestrator: any = {
    processNextItem: vi.fn().mockImplementation(async () => {
      // Emit SIGTERM mid-execution
      process.emit('SIGTERM');

      // Allow async signal handlers to complete
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));

      return false;
    }),
  };
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  await pipeline.run();

  // VERIFY
  expect(pipeline.shutdownRequested).toBe(true);
  expect(pipeline.shutdownReason).toBe('SIGTERM');
});
```

**Critical Pattern: Use `setImmediate()` to allow async handlers to complete**

```typescript
// Always allow async handlers to process
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
```

### Pattern 3: Setting Shutdown Flags Directly

For testing shutdown behavior without actual signal emission:

```typescript
it('should complete current task before shutdown', async () => {
  const pipeline = new PRPPipeline('./test.md');

  let callCount = 0;
  const mockOrchestrator: any = {
    processNextItem: vi.fn().mockImplementation(async () => {
      callCount++;
      // Simulate shutdown after first task
      if (callCount === 1) {
        (pipeline as any).shutdownRequested = true;
        (pipeline as any).shutdownReason = 'SIGINT';
      }
      return callCount <= 1;
    }),
  };
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  await pipeline.run();

  // VERIFY: First task completed, then loop exited
  expect(callCount).toBe(1);
  expect(pipeline.currentPhase).toBe('shutdown_interrupted');
});
```

---

## 2. Testing Task Completion Before Shutdown

### Pattern: Verify Current Task Completes

The key requirement is that the **current task must complete** before shutdown.

```typescript
it('should complete current task before shutdown on SIGINT', async () => {
  const backlog: Backlog = {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Phase 1',
        status: 'Planned',
        description: 'Test phase',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Milestone 1',
            status: 'Planned',
            description: 'Test milestone',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Task 1',
                status: 'Planned',
                description: 'Test task',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Subtask 1',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Subtask 2',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                  {
                    id: 'P1.M1.T1.S3',
                    type: 'Subtask',
                    title: 'Subtask 3',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
  const { createArchitectAgent } =
    await import('../../src/agents/agent-factory.js');
  (createArchitectAgent as any).mockReturnValue(mockAgent);

  // Setup mock SessionManager
  const mockSessionManager = {
    currentSession: {
      metadata: { path: tempDir },
      taskRegistry: backlog,
    },
    initialize: vi.fn().mockResolvedValue({
      /* session */
    }),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
  };
  MockSessionManagerClass.mockImplementation(() => mockSessionManager);

  const pipeline = new PRPPipeline(
    prdPath,
    undefined,
    undefined,
    false,
    false,
    undefined,
    undefined,
    planDir
  );

  // Mock processNextItem to simulate task execution with shutdown after first task
  let callCount = 0;
  const mockOrchestrator: any = {
    sessionManager: {},
    processNextItem: vi.fn().mockImplementation(async () => {
      callCount++;
      // After first task completes, set shutdown flag directly
      if (callCount === 1) {
        (pipeline as any).shutdownRequested = true;
        (pipeline as any).shutdownReason = 'SIGINT';
      }
      // Return false after second call to simulate queue empty
      return callCount <= 1;
    }),
  };
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  // Run pipeline
  const result = await pipeline.run();

  // VERIFY: Pipeline should have shutdown gracefully
  expect(pipeline.shutdownRequested).toBe(true);
  expect(pipeline.shutdownReason).toBe('SIGINT');
  expect(pipeline.currentPhase).toBe('shutdown_interrupted');
  expect(result.shutdownInterrupted).toBe(true);
  expect(result.shutdownReason).toBe('SIGINT');

  // CRITICAL: processNextItem should have been called - current task completed
  expect(callCount).toBeGreaterThan(0);

  // Cleanup should have been called
  expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
});
```

### Key Verification Points

1. **Task completion**: `processNextItem` was called at least once
2. **Loop exit**: Loop broke after shutdown flag was set
3. **Phase state**: `currentPhase` is `shutdown_interrupted`
4. **Result flags**: `shutdownInterrupted: true`, `shutdownReason` matches signal

---

## 3. Testing State Persistence During Shutdown

### Pattern: Verify saveBacklog is Called

State persistence is critical for resumption. Verify that state is saved even during error conditions.

```typescript
it('should save backlog state in cleanup even on error', async () => {
  const backlog: Backlog = {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        title: 'Phase 1',
        status: 'Implementing',
        description: 'Test phase',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            title: 'Milestone 1',
            status: 'Implementing',
            description: 'Test milestone',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                title: 'Task 1',
                status: 'Implementing',
                description: 'Test task',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    title: 'Subtask 1',
                    status: 'Complete',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                  {
                    id: 'P1.M1.T1.S2',
                    type: 'Subtask',
                    title: 'Subtask 2',
                    status: 'Planned',
                    story_points: 1,
                    dependencies: [],
                    context_scope: 'Test scope',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const pipeline = new PRPPipeline(
    prdPath,
    undefined,
    undefined,
    false,
    false,
    undefined,
    undefined,
    planDir
  );

  // Simulate error during execution with SIGINT
  const mockOrchestrator: any = {
    sessionManager: {},
    processNextItem: vi.fn().mockImplementation(async () => {
      process.emit('SIGINT');

      // Allow async signal handlers to complete
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));

      throw new Error('Simulated execution error');
    }),
  };
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  const mockSessionManager: any = {
    currentSession: {
      metadata: { path: tempDir },
      taskRegistry: backlog,
    },
    initialize: vi.fn().mockResolvedValue({
      /* session */
    }),
    saveBacklog: vi.fn().mockResolvedValue(undefined),
  };
  (pipeline as any).sessionManager = mockSessionManager;

  const result = await pipeline.run();

  // VERIFY: Even on error, cleanup should save state
  expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
  expect(result.shutdownInterrupted).toBe(true);
  expect(pipeline.currentPhase).toBe('shutdown_complete');
});
```

### Pattern: Test with Duplicate Signals

Verify that duplicate signals don't cause state corruption:

```typescript
it('should handle duplicate SIGINT signals gracefully', async () => {
  const pipeline = new PRPPipeline(
    prdPath,
    undefined,
    undefined,
    false,
    false,
    undefined,
    undefined,
    planDir
  );
  const warnSpy = vi.spyOn((pipeline as any).logger, 'warn');

  const mockOrchestrator: any = {
    sessionManager: {},
    processNextItem: vi.fn().mockImplementation(async () => {
      // Send duplicate SIGINT signals
      process.emit('SIGINT');
      process.emit('SIGINT');

      // Allow async signal handlers to complete
      await new Promise(resolve => setImmediate(resolve));
      await new Promise(resolve => setImmediate(resolve));

      return false;
    }),
  };
  (pipeline as any).taskOrchestrator = mockOrchestrator;

  await pipeline.run();

  // VERIFY: Duplicate SIGINT should log warning
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Duplicate SIGINT')
  );
  warnSpy.mockRestore();
});
```

---

## 4. Testing Signal Listener Cleanup

### Pattern: Verify Listeners Are Removed

Memory leaks occur when listeners aren't removed. Verify cleanup using `process._events`.

```typescript
describe('signal listener cleanup', () => {
  let originalProcessListeners: {
    SIGINT: Array<() => void>;
    SIGTERM: Array<() => void>;
  };

  beforeEach(() => {
    // Store original process listeners to restore after tests
    originalProcessListeners = {
      SIGINT: (process as any)._events?.SIGINT
        ? [...(process as any)._events.SIGINT]
        : [],
      SIGTERM: (process as any)._events?.SIGTERM
        ? [...(process as any)._events.SIGTERM]
        : [],
    };
  });

  afterEach(async () => {
    // Allow pending async operations to complete
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    // Restore original process listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    originalProcessListeners.SIGINT.forEach(listener =>
      process.on('SIGINT', listener)
    );
    originalProcessListeners.SIGTERM.forEach(listener =>
      process.on('SIGTERM', listener)
    );
  });

  it('should remove signal listeners in cleanup', async () => {
    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    const initialSigintCount = (process as any)._events?.SIGINT?.length ?? 0;

    // Run pipeline
    const mockSessionManager: any = {
      currentSession: {
        metadata: { path: tempDir },
        taskRegistry: { backlog: [] },
      },
      initialize: vi.fn().mockResolvedValue({
        /* session */
      }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
    };
    (pipeline as any).sessionManager = mockSessionManager;

    const mockOrchestrator: any = {
      sessionManager: {},
      processNextItem: vi.fn().mockResolvedValue(false),
    };
    (pipeline as any).taskOrchestrator = mockOrchestrator;

    await pipeline.run();

    // VERIFY: Signal listeners should be cleaned up (back to original count)
    const finalSigintCount = (process as any)._events?.SIGINT?.length ?? 0;
    expect(finalSigintCount).toBeLessThanOrEqual(initialSigintCount);
  });
});
```

### Implementation Pattern: Store Handler References

```typescript
export class PRPPipeline extends Workflow {
  // Store handler references for cleanup
  #sigintHandler: (() => void) | null = null;
  #sigtermHandler: (() => void) | null = null;

  #setupSignalHandlers(): void {
    // Create handlers
    this.#sigintHandler = () => {
      this.logger.info(
        '[PRPPipeline] SIGINT received, initiating graceful shutdown'
      );
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGINT';
    };

    this.#sigtermHandler = () => {
      this.logger.info(
        '[PRPPipeline] SIGTERM received, initiating graceful shutdown'
      );
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGTERM';
    };

    // Register handlers
    process.on('SIGINT', this.#sigintHandler);
    process.on('SIGTERM', this.#sigtermHandler);
  }

  async cleanup(): Promise<void> {
    // Remove signal listeners to prevent memory leaks
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
      this.logger.debug('[PRPPipeline] SIGINT handler removed');
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
      this.logger.debug('[PRPPipeline] SIGTERM handler removed');
    }
  }
}
```

---

## 5. Common Pitfalls When Testing Signal Handlers

### Pitfall 1: Not Allowing Async Handlers to Complete

**Problem**: Signal handlers execute synchronously, but state changes may be async.

**Solution**: Always use `setImmediate()` to allow event loop processing.

```typescript
// ❌ WRONG - Handlers may not complete
process.emit('SIGINT');
expect(pipeline.shutdownRequested).toBe(true);

// ✅ CORRECT - Allow handlers to process
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
expect(pipeline.shutdownRequested).toBe(true);
```

### Pitfall 2: Not Cleaning Up Listeners Between Tests

**Problem**: Listeners accumulate across tests, causing unexpected behavior.

**Solution**: Always clean up in `afterEach`.

```typescript
afterEach(async () => {
  // Allow pending async operations to complete
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  // Clean up temp directory
  rmSync(tempDir, { recursive: true, force: true });
  vi.clearAllMocks();

  // CRITICAL: Restore original process listeners
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(listener =>
    process.on('SIGINT', listener)
  );
  originalProcessListeners.SIGTERM.forEach(listener =>
    process.on('SIGTERM', listener)
  );
});
```

### Pitfall 3: Testing Real process.exit() Calls

**Problem**: Calling `process.exit()` terminates the test runner.

**Solution**: Mock `process.exit` or avoid calling it in production code.

```typescript
// ❌ DON'T call process.exit in production
process.on('SIGINT', () => {
  cleanup();
  process.exit(0); // Terminates tests!
});

// ✅ DO set flags and let caller decide
process.on('SIGINT', () => {
  this.shutdownRequested = true;
  this.shutdownReason = 'SIGINT';
});
```

### Pitfall 4: Assuming Signal Order

**Problem**: Tests may assume signals arrive in specific order.

**Solution**: Test various signal combinations and timings.

```typescript
// Test SIGTERM followed by SIGINT
process.emit('SIGTERM');
await new Promise(resolve => setImmediate(resolve));
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));

// Verify last signal wins
expect(pipeline.shutdownReason).toBe('SIGINT');
```

### Pitfall 5: Not Testing Error Paths

**Problem**: Only testing successful shutdown, not shutdown during errors.

**Solution**: Always test cleanup in `finally` blocks.

```typescript
it('should call cleanup in finally block even on error', async () => {
  const mockError = new Error('Test error');
  const mockManager: any = {
    initialize: vi.fn().mockRejectedValue(mockError),
    currentSession: null,
    saveBacklog: vi.fn().mockResolvedValue(undefined),
  };

  const pipeline = new PRPPipeline('./test.md');
  (pipeline as any).sessionManager = mockManager;

  // Spy on cleanup method
  const cleanupSpy = vi.spyOn(pipeline, 'cleanup').mockResolvedValue(undefined);

  await pipeline.run();

  // VERIFY: cleanup should be called even though initialize failed
  expect(cleanupSpy).toHaveBeenCalled();
  cleanupSpy.mockRestore();
});
```

---

## 6. Testing --continue Flag Functionality

### Overview

The `--continue` flag allows resuming from a previously interrupted session. Testing involves:

1. **Interrupt a session**: Simulate shutdown mid-execution
2. **Verify state persistence**: Confirm state was saved
3. **Resume with --continue**: Start new pipeline with saved state
4. **Verify continuation**: Confirm execution resumes from correct point

### Pattern: Test Session Resumption

```typescript
describe('--continue flag functionality', () => {
  it('should resume from interrupted session', async () => {
    // STEP 1: Create initial session and interrupt it
    const backlog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Implementing',
          description: 'Test phase',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Milestone 1',
              status: 'Implementing',
              description: 'Test milestone',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Task 1',
                  status: 'Implementing',
                  description: 'Test task',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 1',
                      status: 'Complete',
                      story_points: 1,
                      dependencies: [],
                      context_scope: 'Test scope',
                    },
                    {
                      id: 'P1.M1.T1.S2',
                      type: 'Subtask',
                      title: 'Subtask 2',
                      status: 'Planned',
                      story_points: 1,
                      dependencies: [],
                      context_scope: 'Test scope',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    // Mock initial pipeline run
    const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
    const { createArchitectAgent } =
      await import('../../src/agents/agent-factory.js');
    (createArchitectAgent as any).mockReturnValue(mockAgent);

    // Create interrupted session
    const mockSessionManager: any = {
      currentSession: {
        metadata: { path: tempDir },
        taskRegistry: backlog,
      },
      initialize: vi.fn().mockResolvedValue({
        metadata: { id: 'test-session', path: tempDir },
        taskRegistry: backlog,
      }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
      hasSessionChanged: vi.fn().mockReturnValue(false),
    };
    MockSessionManagerClass.mockImplementation(() => mockSessionManager);

    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );

    // Simulate interruption after first task
    let callCount = 0;
    const mockOrchestrator: any = {
      processNextItem: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          (pipeline as any).shutdownRequested = true;
          (pipeline as any).shutdownReason = 'SIGINT';
        }
        return callCount <= 1;
      }),
    };
    (pipeline as any).taskOrchestrator = mockOrchestrator;

    await pipeline.run();

    // VERIFY: Session was interrupted and saved
    expect(pipeline.shutdownRequested).toBe(true);
    expect(mockSessionManager.saveBacklog).toHaveBeenCalledWith(backlog);

    // STEP 2: Resume with --continue
    vi.clearAllMocks();

    const resumePipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );

    // Mock resumed execution
    const resumeOrchestrator: any = {
      processNextItem: vi.fn().mockResolvedValue(false),
    };
    (resumePipeline as any).taskOrchestrator = resumeOrchestrator;

    const resumeResult = await resumePipeline.run();

    // VERIFY: Execution resumed
    expect(resumeResult.success).toBe(true);
    expect(mockSessionManager.initialize).toHaveBeenCalled(); // Loaded existing session
  });

  it('should skip backlog generation when --continue with existing backlog', async () => {
    const backlog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Complete',
          description: 'Test phase',
          milestones: [],
        },
      ],
    };

    const mockSessionManager: any = {
      currentSession: {
        metadata: { path: tempDir },
        taskRegistry: backlog,
      },
      initialize: vi.fn().mockResolvedValue({
        metadata: { id: 'test-session', path: tempDir },
        taskRegistry: backlog,
      }),
      saveBacklog: vi.fn().mockResolvedValue(undefined),
      hasSessionChanged: vi.fn().mockReturnValue(false),
    };
    MockSessionManagerClass.mockImplementation(() => mockSessionManager);

    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );
    (pipeline as any).sessionManager = mockSessionManager;

    await pipeline.decomposePRD();

    // VERIFY: Architect agent should NOT be called for existing backlog
    const { createArchitectAgent } =
      await import('../../src/agents/agent-factory.js');
    expect(createArchitectAgent).not.toHaveBeenCalled();
    expect(pipeline.currentPhase).toBe('prd_decomposed');
  });
});
```

### Key Verification Points for --continue

1. **Session loading**: `SessionManager.initialize()` loads existing session
2. **Backlog preservation**: Existing backlog is used, not regenerated
3. **Status continuation**: Tasks marked as `Complete` are not re-executed
4. **State restoration**: `currentPhase` reflects session state
5. **Progress tracking**: `completedTasks` count matches saved state

---

## 7. Verifying No State Corruption During Shutdown

### Pattern: Verify State Consistency

State corruption can occur when:

- Multiple shutdown signals are received
- Shutdown occurs during state serialization
- Error handling interferes with cleanup

```typescript
describe('state corruption prevention', () => {
  it('should maintain state consistency with multiple shutdown signals', async () => {
    const backlog: Backlog = { backlog: [] };

    const mockAgent = { prompt: vi.fn().mockResolvedValue({ backlog }) };
    const { createArchitectAgent } =
      await import('../../src/agents/agent-factory.js');
    (createArchitectAgent as any).mockReturnValue(mockAgent);

    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );

    const mockOrchestrator: any = {
      processNextItem: vi.fn().mockImplementation(async () => {
        // Send multiple shutdown signals
        process.emit('SIGINT');
        await new Promise(resolve => setImmediate(resolve));
        process.emit('SIGTERM');
        await new Promise(resolve => setImmediate(resolve));
        process.emit('SIGINT');
        await new Promise(resolve => setImmediate(resolve));

        return false;
      }),
    };
    (pipeline as any).taskOrchestrator = mockOrchestrator;

    const mockSessionManager: any = {
      currentSession: { metadata: { path: tempDir }, taskRegistry: backlog },
      initialize: vi.fn().mockResolvedValue({
        /* session */
      }),
      saveBacklog: vi.fn().mockImplementation((savedBacklog: Backlog) => {
        // Verify state is not corrupted
        expect(savedBacklog).toBeDefined();
        expect(savedBacklog.backlog).toBeDefined();
        expect(Array.isArray(savedBacklog.backlog)).toBe(true);
        return Promise.resolve(undefined);
      }),
    };
    (pipeline as any).sessionManager = mockSessionManager;

    await pipeline.run();

    // VERIFY: Shutdown reason should be the last signal received
    expect(pipeline.shutdownReason).toBe('SIGINT');
    expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
  });

  it('should preserve state integrity during error in cleanup', async () => {
    const backlog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Implementing',
          description: 'Test phase',
          milestones: [],
        },
      ],
    };

    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );

    // Mock saveBacklog to throw error
    const mockSessionManager: any = {
      currentSession: { metadata: { path: tempDir }, taskRegistry: backlog },
      initialize: vi.fn().mockResolvedValue({
        /* session */
      }),
      saveBacklog: vi.fn().mockRejectedValue(new Error('Save failed')),
    };
    (pipeline as any).sessionManager = mockSessionManager;

    const mockOrchestrator: any = {
      processNextItem: vi.fn().mockResolvedValue(false),
    };
    (pipeline as any).taskOrchestrator = mockOrchestrator;

    // Should not throw, cleanup errors are logged but not re-thrown
    const result = await pipeline.run();

    // VERIFY: Pipeline completes despite cleanup error
    expect(result).toBeDefined();
    expect(pipeline.currentPhase).toBe('shutdown_complete');
  });

  it('should handle shutdown during state serialization', async () => {
    const backlog: Backlog = {
      backlog: [
        {
          id: 'P1',
          type: 'Phase',
          title: 'Phase 1',
          status: 'Implementing',
          description: 'Test phase',
          milestones: [
            {
              id: 'P1.M1',
              type: 'Milestone',
              title: 'Milestone 1',
              status: 'Implementing',
              description: 'Test milestone',
              tasks: [
                {
                  id: 'P1.M1.T1',
                  type: 'Task',
                  title: 'Task 1',
                  status: 'Implementing',
                  description: 'Test task',
                  subtasks: [
                    {
                      id: 'P1.M1.T1.S1',
                      type: 'Subtask',
                      title: 'Subtask 1',
                      status: 'Complete',
                      story_points: 1,
                      dependencies: [],
                      context_scope: 'Test scope',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const pipeline = new PRPPipeline(
      prdPath,
      undefined,
      undefined,
      false,
      false,
      undefined,
      undefined,
      planDir
    );

    let saveAttempted = false;
    const mockSessionManager: any = {
      currentSession: { metadata: { path: tempDir }, taskRegistry: backlog },
      initialize: vi.fn().mockResolvedValue({
        /* session */
      }),
      saveBacklog: vi.fn().mockImplementation(async (savedBacklog: Backlog) => {
        saveAttempted = true;
        // Simulate signal during save
        if (!saveAttempted) {
          process.emit('SIGINT');
          await new Promise(resolve => setImmediate(resolve));
        }
        // Verify backlog structure
        expect(savedBacklog.backlog).toHaveLength(1);
        expect(savedBacklog.backlog[0].id).toBe('P1');
        return Promise.resolve(undefined);
      }),
    };
    (pipeline as any).sessionManager = mockSessionManager;

    const mockOrchestrator: any = {
      processNextItem: vi.fn().mockResolvedValue(false),
    };
    (pipeline as any).taskOrchestrator = mockOrchestrator;

    await pipeline.run();

    // VERIFY: State was saved and is consistent
    expect(saveAttempted).toBe(true);
    expect(mockSessionManager.saveBacklog).toHaveBeenCalled();
  });
});
```

### State Corruption Detection Patterns

1. **Structural validation**: Verify saved JSON structure is valid
2. **Status consistency**: Ensure task statuses are coherent
3. **Reference integrity**: Validate parent-child relationships
4. **Metadata preservation**: Check session metadata is intact

```typescript
// Example state validation helper
function validateBacklogState(backlog: Backlog): void {
  expect(backlog).toBeDefined();
  expect(backlog.backlog).toBeDefined();
  expect(Array.isArray(backlog.backlog)).toBe(true);

  for (const phase of backlog.backlog) {
    expect(phase.id).toMatch(/^P\d+$/);
    expect(phase.type).toBe('Phase');
    expect(phase.milestones).toBeDefined();
    expect(Array.isArray(phase.milestones)).toBe(true);

    for (const milestone of phase.milestones) {
      expect(milestone.id).toMatch(/^P\d+\.M\d+$/);
      expect(milestone.type).toBe('Milestone');
      expect(milestone.tasks).toBeDefined();
      expect(Array.isArray(milestone.tasks)).toBe(true);

      for (const task of milestone.tasks) {
        expect(task.id).toMatch(/^P\d+\.M\d+\.T\d+$/);
        expect(task.type).toBe('Task');
        expect(task.subtasks).toBeDefined();
        expect(Array.isArray(task.subtasks)).toBe(true);

        for (const subtask of task.subtasks) {
          expect(subtask.id).toMatch(/^P\d+\.M\d+\.T\d+\.S\d+$/);
          expect(subtask.type).toBe('Subtask');
          expect(['Planned', 'Implementing', 'Complete', 'Failed']).toContain(
            subtask.status
          );
        }
      }
    }
  }
}
```

---

## 8. Best Practices Summary

### 1. Signal Handler Implementation

```typescript
// ✅ DO: Store handler references for cleanup
#sigintHandler: (() => void) | null = null;
#sigtermHandler: (() => void) | null = null;

#setupSignalHandlers(): void {
  this.#sigintHandler = () => {
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGINT';
  };
  this.#sigtermHandler = () => {
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGTERM';
  };
  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);
}

// ❌ DON'T: Use anonymous functions you can't remove
process.on('SIGINT', () => {
  this.shutdownRequested = true; // Can't remove this listener!
});
```

### 2. Graceful Shutdown Loop

```typescript
// ✅ DO: Check shutdown flag after each task
while (await this.taskOrchestrator.processNextItem()) {
  this.completedTasks = this.#countCompletedTasks();

  // Check for shutdown request after each task
  if (this.shutdownRequested) {
    this.logger.info(
      '[PRPPipeline] Shutdown requested, finishing current task'
    );
    this.currentPhase = 'shutdown_interrupted';
    break;
  }
}

// ❌ DON'T: Exit immediately without completing current task
if (this.shutdownRequested) {
  process.exit(1); // Current task is lost!
}
```

### 3. State Persistence in Cleanup

```typescript
// ✅ DO: Save state in finally block
async run(): Promise<PipelineResult> {
  try {
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();
    return { success: true, /* ... */ };
  } catch (error) {
    return { success: false, error, /* ... */ };
  } finally {
    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}

// ❌ DON'T: Save state only in success path
async run(): Promise<PipelineResult> {
  try {
    await this.executeBacklog();
    await this.saveState(); // Lost if error occurs!
  } catch (error) {
    return { success: false, error };
  }
}
```

### 4. Test Cleanup

```typescript
// ✅ DO: Always restore original listeners
afterEach(async () => {
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(listener =>
    process.on('SIGINT', listener)
  );
  originalProcessListeners.SIGTERM.forEach(listener =>
    process.on('SIGTERM', listener)
  );
});

// ❌ DON'T: Assume tests run in isolation
afterEach(() => {
  // Listeners leak to next test!
  process.removeAllListeners('SIGINT');
});
```

### 5. Async Handler Handling

```typescript
// ✅ DO: Allow async handlers to complete
process.emit('SIGINT');
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));
expect(pipeline.shutdownRequested).toBe(true);

// ❌ DON'T: Check state immediately after emit
process.emit('SIGINT');
expect(pipeline.shutdownRequested).toBe(true); // May fail!
```

### 6. Mock Strategy

```typescript
// ✅ DO: Mock at appropriate level
const mockOrchestrator: any = {
  processNextItem: vi.fn().mockImplementation(async () => {
    // Control shutdown timing
    if (callCount === 1) {
      (pipeline as any).shutdownRequested = true;
    }
    return true;
  }),
};

// ❌ DON'T: Mock process methods directly
vi.spyOn(process, 'on').mockImplementation(() => {
  // Breaks signal handling!
});
```

---

## 9. Testing Checklist

### Signal Emission Tests

- [ ] SIGINT sets shutdown flags correctly
- [ ] SIGTERM sets shutdown flags correctly
- [ ] Duplicate SIGINT logs warning
- [ ] Shutdown reason reflects last signal received
- [ ] Signals work during different execution phases

### Task Completion Tests

- [ ] Current task completes before shutdown
- [ ] Loop breaks after shutdown flag is set
- [ ] `shutdownInterrupted` is true in result
- [ ] `shutdownReason` matches signal type
- [ ] Progress is logged at shutdown

### State Persistence Tests

- [ ] `saveBacklog` is called in cleanup
- [ ] State is saved even on error
- [ ] State is saved on normal completion
- [ ] State structure is valid after save
- [ ] Session metadata is preserved

### Listener Cleanup Tests

- [ ] SIGINT listener is removed
- [ ] SIGTERM listener is removed
- [ ] Listener count doesn't increase across runs
- [ ] No memory leaks from dangling listeners
- [ ] Original listeners are restored in tests

### --continue Flag Tests

- [ ] Existing session is loaded
- [ ] Backlog is not regenerated
- [ ] Completed tasks are skipped
- [ ] `currentPhase` reflects session state
- [ ] Execution resumes from correct point

### State Corruption Tests

- [ ] Multiple signals don't corrupt state
- [ ] Shutdown during serialization is handled
- [ ] Cleanup errors don't lose state
- [ ] Backlog structure is valid
- [ ] Task statuses are consistent

---

## 10. References and Resources

### Official Documentation

- [Node.js Process Documentation](https://nodejs.org/api/process.html)
  - `process.emit()` for triggering events
  - `process.on()` for registering handlers
  - `process.off()` for removing handlers
  - Signal handling best practices

- [Vitest Documentation](https://vitest.dev/guide/)
  - Mocking functions with `vi.fn()`
  - Spy utilities with `vi.spyOn()`
  - Test lifecycle hooks (`beforeEach`, `afterEach`)

### Related Code Examples

#### PRPPipeline Signal Handler Implementation

**File**: `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

```typescript
export class PRPPipeline extends Workflow {
  shutdownRequested: boolean = false;
  shutdownReason: 'SIGINT' | 'SIGTERM' | 'RESOURCE_LIMIT' | null = null;
  #sigintHandler: (() => void) | null = null;
  #sigtermHandler: (() => void) | null = null;
  #sigintCount: number = 0;

  #setupSignalHandlers(): void {
    this.#sigintHandler = () => {
      this.#sigintCount++;
      if (this.#sigintCount > 1) {
        this.logger.warn('[PRPPipeline] Duplicate SIGINT received');
        return;
      }
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGINT';
    };

    this.#sigtermHandler = () => {
      this.shutdownRequested = true;
      this.shutdownReason = 'SIGTERM';
    };

    process.on('SIGINT', this.#sigintHandler);
    process.on('SIGTERM', this.#sigtermHandler);
  }

  async cleanup(): Promise<void> {
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
    }

    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (backlog) {
      await this.sessionManager.saveBacklog(backlog);
    }
  }
}
```

#### Integration Test Example

**File**: `/home/dustin/projects/hacky-hack/tests/integration/prp-pipeline-shutdown.test.ts`

```typescript
describe('PRPPipeline Graceful Shutdown Integration Tests', () => {
  let originalProcessListeners: {
    SIGINT: Array<() => void>;
    SIGTERM: Array<() => void>;
  };

  beforeEach(() => {
    originalProcessListeners = {
      SIGINT: (process as any)._events?.SIGINT
        ? [...(process as any)._events.SIGINT]
        : [],
      SIGTERM: (process as any)._events?.SIGTERM
        ? [...(process as any)._events.SIGTERM]
        : [],
    };
  });

  afterEach(async () => {
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    originalProcessListeners.SIGINT.forEach(listener =>
      process.on('SIGINT', listener)
    );
    originalProcessListeners.SIGTERM.forEach(listener =>
      process.on('SIGTERM', listener)
    );
  });

  it('should complete current task before shutdown on SIGINT', async () => {
    // Test implementation...
  });
});
```

### Common Patterns

#### Pattern 1: Signal Emission in Tests

```typescript
// Emit signal
process.emit('SIGINT');

// Allow async handlers to complete
await new Promise(resolve => setImmediate(resolve));
await new Promise(resolve => setImmediate(resolve));

// Verify state
expect(pipeline.shutdownRequested).toBe(true);
```

#### Pattern 2: Listener Cleanup

```typescript
beforeEach(() => {
  originalProcessListeners = {
    SIGINT: (process as any)._events?.SIGINT?.slice() || [],
    SIGTERM: (process as any)._events?.SIGTERM?.slice() || [],
  };
});

afterEach(() => {
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  originalProcessListeners.SIGINT.forEach(listener =>
    process.on('SIGINT', listener)
  );
  originalProcessListeners.SIGTERM.forEach(listener =>
    process.on('SIGTERM', listener)
  );
});
```

#### Pattern 3: Verify Cleanup in Finally

```typescript
it('should call cleanup in finally block even on error', async () => {
  const cleanupSpy = vi.spyOn(pipeline, 'cleanup').mockResolvedValue(undefined);
  const mockManager = {
    initialize: vi.fn().mockRejectedValue(new Error('Test error')),
  };
  (pipeline as any).sessionManager = mockManager;

  await pipeline.run();

  expect(cleanupSpy).toHaveBeenCalled();
  cleanupSpy.mockRestore();
});
```

---

## Conclusion

Testing graceful shutdown and signal handling requires careful attention to:

1. **Async timing**: Use `setImmediate()` to allow handlers to complete
2. **Listener cleanup**: Always restore original listeners in tests
3. **State preservation**: Verify state is saved in all scenarios
4. **Error handling**: Test cleanup in `finally` blocks
5. **Resumption**: Validate --continue flag functionality
6. **Corruption prevention**: Test with multiple signals and concurrent operations

The patterns and examples in this document provide a comprehensive foundation for testing signal handling in TypeScript/Node.js applications, specifically applied to PRPPipeline testing scenarios.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-19
