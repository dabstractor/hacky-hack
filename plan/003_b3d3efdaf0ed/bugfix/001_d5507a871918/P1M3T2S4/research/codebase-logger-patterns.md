# PRP Pipeline Logger Patterns Research

## Overview

Research on logging patterns used in the PRP Pipeline for consistent debug logging implementation.

## Logger Usage in PRP Pipeline

**Location:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

### Logger Instances

The PRP Pipeline has two logger instances:

1. **`this.logger`** - Base logger from Workflow parent class
2. **`this.correlationLogger`** - Child logger with correlation ID for tracing

```typescript
// Constructor
this.correlationLogger = getLogger('PRPPipeline').child({
  correlationId: this.#correlationId,
});
```

### Logging Patterns

#### 1. Debug Logging

**Pattern:** Consistent `[PRPPipeline]` prefix with context objects

```typescript
// From run() method
this.logger.debug('[PRPPipeline] Session initialized', {
  sessionPath: this.sessionManager?.currentSession?.metadata.path,
  hasExistingBacklog:
    (this.sessionManager?.currentSession?.taskRegistry?.backlog?.length ?? 0) >
    0,
});
```

**Key characteristics:**

- Always use `[PRPPipeline]` prefix
- Include context object with relevant data
- Use optional chaining for nested properties
- Provide boolean/numeric values for quick inspection

#### 2. Info Logging

**Pattern:** Simple messages with critical state information

```typescript
this.logger.info('[PRPPipeline] Starting PRP Pipeline workflow');
this.logger.info(`[PRPPipeline] PRD: ${this.#prdPath}`);
this.logger.info(
  `[PRPPipeline] Scope: ${JSON.stringify(this.#scope ?? 'all')}`
);
```

**Key characteristics:**

- Include `[PRPPipeline]` prefix
- Use template literals for dynamic values
- JSON.stringify complex objects

#### 3. Error Logging

**Pattern:** Detailed error context with stack traces

```typescript
this.logger.debug('[PRPPipeline] Workflow failed with error', {
  errorMessage,
  errorType: error instanceof Error ? error.constructor.name : 'Unknown',
  errorCode: (error as { code?: string })?.code,
  currentPhase: this.currentPhase,
  ...(error instanceof Error && { stack: error.stack }),
});
```

**Key characteristics:**

- Include error type, code, phase
- Conditionally include stack trace for Error instances
- Spread operator for conditional stack property

#### 4. Warning Logging

**Pattern:** Non-fatal issues that need attention

```typescript
this.logger.warn(
  '[PRPPipeline] Duplicate SIGINT received - shutdown already in progress'
);
```

**Key characteristics:**

- Use `[PRPPipeline]` prefix
- Clear descriptive messages

## Cleanup Method Logging

**Location:** `src/workflows/prp-pipeline.ts:1323` (cleanup method)

The cleanup method has extensive logging for debugging shutdown behavior:

```typescript
async cleanup(): Promise<void> {
  this.logger.info('[PRPPipeline] Starting cleanup and state preservation');

  try {
    // CRITICAL: Stop progress display (must happen before other cleanup)
    this.#progressDisplay?.stop();
    this.logger.debug('[PRPPipeline] Progress display stopped');

    // CRITICAL: Stop resource monitoring
    if (this.#resourceMonitor) {
      this.#resourceMonitor.stop();
      this.logger.debug('[PRPPipeline] Resource monitoring stopped');
    }

    // Log progress state before shutdown
    const progress = this.#progressTracker?.getProgress();
    if (progress) {
      this.logger.info('[PRPPipeline] 💾 Saving progress state', {
        completedTasks: progress.completed,
        pendingTasks: progress.remaining,
        totalTasks: progress.total,
        completionRate: `${progress.percentage.toFixed(1)}%`,
        elapsed: `${progress.elapsed}ms`,
        eta: progress.eta === Infinity ? null : progress.eta,
      });
    }

    // ... more cleanup ...

    // Remove signal listeners to prevent memory leaks
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
      this.logger.debug('[PRPPipeline] SIGINT handler removed');
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
      this.logger.debug('[PRPPipeline] SIGTERM handler removed');
    }

    this.currentPhase = 'shutdown_complete';
    this.logger.info('[PRPPipeline] Cleanup complete');
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't prevent shutdown
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
  }
}
```

**Key patterns for cleanup logging:**

1. Log entry: "Starting cleanup and state preservation"
2. Log each step: Use debug level for individual operations
3. Log success: "Cleanup complete"
4. Log errors: Use error level but don't re-throw

## Signal Handler Setup Logging

**Location:** `src/workflows/prp-pipeline.ts:403` (#setupSignalHandlers)

```typescript
#setupSignalHandlers(): void {
  // Register handlers
  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);

  this.logger.debug('[PRPPipeline] Signal handlers registered');
}
```

**Pattern:** Use debug level for setup operations

## Implementation Guidance for PRP_PIPELINE_RUNNING Logging

Based on the existing patterns, here's how to implement logging for the guard variable:

### 1. Setting the Guard

**Pattern:** Use debug level with context object

```typescript
// After validateNestedExecution passes
process.env.PRP_PIPELINE_RUNNING = process.pid.toString();

this.logger.debug('[PRPPipeline] Set PRP_PIPELINE_RUNNING', {
  pid: process.pid,
  variable: 'PRP_PIPELINE_RUNNING',
  value: process.pid.toString(),
});

// OR simpler:
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${process.pid}`);
```

### 2. Clearing the Guard

**Pattern:** Use debug level with ownership verification

```typescript
// In finally block
if (process.env.PRP_PIPELINE_RUNNING === process.pid.toString()) {
  delete process.env.PRP_PIPELINE_RUNNING;

  this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING', {
    pid: process.pid,
    reason: 'Pipeline cleanup',
  });

  // OR simpler:
  this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');
}
```

### 3. Guard Already Set (Same PID)

**Pattern:** Use debug level for idempotent case

```typescript
if (process.env.PRP_PIPELINE_RUNNING === process.pid.toString()) {
  this.logger.debug(
    '[PRPPipeline] PRP_PIPELINE_RUNNING already set to current PID',
    {
      pid: process.pid,
    }
  );
  return;
}
```

## Summary

**Consistent Patterns:**

1. **Prefix:** Always use `[PRPPipeline]` in log messages
2. **Level:** Use `debug` for guard operations (not critical path)
3. **Format:** Template literals for simple messages, objects for complex context
4. **Timing:** Log immediately after setting/clearing
5. **Context:** Include PID and variable name for debugging

**Example complete implementation:**

```typescript
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  const currentPid = process.pid.toString();

  try {
    // Create SessionManager
    this.sessionManager = new SessionManagerClass(
      this.#prdPath,
      this.#planDir,
      this.#flushRetries
    );

    // Execute workflow steps
    await this.initializeSession();
    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();

    // ... rest of implementation ...

  } catch (error) {
    // ... error handling ...
  } finally {
    // Clear guard if we own it
    if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
      delete process.env.PRP_PIPELINE_RUNNING;
      this.logger.debug(`[PRPPipeline] Cleared PRP_PIPELINE_RUNNING`);
    }

    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}
```

**Note:** The actual setting of `PRP_PIPELINE_RUNNING` should happen after `validateNestedExecution()` is called (which will be added in subtask P1.M3.T2.S3). The clearing happens in the finally block.
