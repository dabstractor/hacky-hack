# Graceful Shutdown Patterns Research

## Analysis of Existing Implementation (src/workflows/prp-pipeline.ts)

### Current Graceful Shutdown Pattern

#### 1. Shutdown Request Flag (Line 168)

```typescript
/** Whether graceful shutdown has been requested */
shutdownRequested: boolean = false;
```

#### 2. Signal Handler Setup (Lines 282-316)

```typescript
#setupSignalHandlers(): void {
  this.#sigintHandler = () => {
    this.#sigintCount++;
    if (this.#sigintCount > 1) {
      this.logger.warn('[PRPPipeline] Duplicate SIGINT received');
      return;
    }
    this.logger.info('[PRPPipeline] SIGINT received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGINT';
  };

  this.#sigtermHandler = () => {
    this.logger.info('[PRPPipeline] SIGTERM received, initiating graceful shutdown');
    this.shutdownRequested = true;
    this.shutdownReason = 'SIGTERM';
  };

  process.on('SIGINT', this.#sigintHandler);
  process.on('SIGTERM', this.#sigtermHandler);
}
```

#### 3. Async Loop Graceful Exit (Lines 810-824)

```typescript
// Check for shutdown request after each task
if (this.shutdownRequested) {
  this.logger.info('[PRPPipeline] Shutdown requested, finishing current task');

  const progress = this.#progressTracker?.getProgress();
  this.logger.info(
    `[PRPPipeline] Shutting down: ${progress?.completed}/${progress?.total} tasks complete`
  );

  this.currentPhase = 'shutdown_interrupted';
  break; // Exit the loop gracefully
}
```

#### 4. Progress Saving on Shutdown (Lines 1225-1298)

```typescript
@Step({ trackTiming: true })
async cleanup(): Promise<void> {
  try {
    // Save current state
    const backlog = this.sessionManager.currentSession?.taskRegistry;
    if (backlog) {
      await this.sessionManager.flushUpdates();
      await this.sessionManager.saveBacklog(backlog);
      this.logger.info('[PRPPipeline] ✅ State saved successfully');
    }

    // Remove signal listeners
    if (this.#sigintHandler) {
      process.off('SIGINT', this.#sigintHandler);
    }
    if (this.#sigtermHandler) {
      process.off('SIGTERM', this.#sigtermHandler);
    }
  } catch (error) {
    this.logger.error(`[PRPPipeline] Cleanup failed: ${error}`);
  }
}
```

## Extending for Resource Limits

### Proposed Enhancement Pattern

```typescript
// In PRPPipeline class
private resourceMonitor?: ResourceMonitor;

// Enhanced shutdown handling
async handleResourceLimit(): Promise<void> {
  this.logger.warn('[PRPPipeline] Resource limits reached, initiating graceful shutdown');
  this.shutdownRequested = true;
  this.shutdownReason = 'RESOURCE_LIMIT';

  // Loop will exit naturally via shutdownRequested check
  // cleanup() will handle state preservation
}
```

### Key Patterns Identified

1. **Boolean Flag Pattern**: Use `shutdownRequested` boolean, not exceptions
2. **Break from Loop**: Check flag after each task, break gracefully
3. **Cleanup in Finally**: cleanup() always runs via finally block
4. **State Preservation**: flushUpdates() then saveBacklog()
5. **Signal Listener Removal**: Prevent memory leaks by removing handlers

### Implementation for Resource Limits

```typescript
// In executeBacklog() loop, after each task:
if (this.#resourceMonitor?.shouldStop()) {
  const status = this.#resourceMonitor.getStatus();
  this.logger.warn(
    { limitType: status.limitType, tasksCompleted: this.completedTasks },
    '[PRPPipeline] Resource limit reached, initiating graceful shutdown'
  );

  if (status.suggestion) {
    this.logger.info(`[PRPPipeline] Suggestion: ${status.suggestion}`);
  }

  this.#resourceLimitReached = true;
  this.shutdownRequested = true;
  this.shutdownReason = 'RESOURCE_LIMIT';
  this.currentPhase = 'resource_limit_reached';
  break;
}
```
