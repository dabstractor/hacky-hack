# Graceful Shutdown - Research & Best Practices

## Overview

Research findings on interrupting workflows mid-execution and implementing proper cleanup patterns for TypeScript/Node.js applications.

---

## Key Resources & Documentation

### Signal Handling
- **Node.js Process Signals** - https://nodejs.org/api/process.html#process_signal_events
  - SIGTERM, SIGINT, SIGUSR2 signals
  - Process event listeners
  - Graceful shutdown patterns

- **PM2 Graceful Shutdown** - https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
  - PM2 process management
  - Graceful reload
  - Cluster mode shutdown

### Cancellation Patterns
- **AbortController** - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
  - Standard cancellation API
  - Signal propagation
  - Fetch API integration

- **RXJS Disposal** - https://rxjs.dev/guide/subscription
  - Subscription cleanup
  - Unsubscribe patterns
  - takeUntil operator

- **CancellationToken** - https://github.com/microsoft/vscode-extension-samples/blob/main/cancellationToken/src/extension.ts
  - VS Code cancellation pattern
  - isCancellationRequested checks
  - onCancellation callback

### Cleanup Libraries
- **Node-Cleanup** - https://github.com/jtlapp/node-cleanup
  - Exit handler installation
  - Cleanup function queues
  - Signal handling

- **Shutdown** - https://github.com/floatdrop/shutdown
  - Graceful shutdown handler
  - Cleanup on signals
  - Timeout support

---

## Best Practices for Graceful Shutdown

### 1. Process Signal Handling

Handle termination signals properly:

```typescript
// Pattern: Signal handler setup
class GracefulShutdown {
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown = false;

  constructor() {
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    // Handle SIGTERM (termination signal)
    process.on('SIGTERM', () => {
      console.log('[Shutdown] Received SIGTERM');
      this.shutdown('SIGTERM');
    });

    // Handle SIGINT (interrupt signal, Ctrl+C)
    process.on('SIGINT', () => {
      console.log('[Shutdown] Received SIGINT');
      this.shutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[Shutdown] Uncaught exception:', error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Shutdown] Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  register(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('[Shutdown] Already shutting down');
      return;
    }

    this.isShuttingDown = true;
    console.log(`[Shutdown] Starting graceful shutdown from ${signal}...`);

    try {
      // Execute all shutdown handlers
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('[Shutdown] Handler error:', error);
        }
      }

      console.log('[Shutdown] All handlers completed');
    } catch (error) {
      console.error('[Shutdown] Error during shutdown:', error);
    } finally {
      // Exit process
      process.exit(0);
    }
  }
}

// Usage
const shutdown = new GracefulShutdown();

shutdown.register(async () => {
  console.log('[Shutdown] Closing database connections...');
  await database.close();
});

shutdown.register(async () => {
  console.log('[Shutdown] Flushing logs...');
  await logger.flush();
});
```

**Benefits:**
- Multiple signal types handled
- Cleanup handlers executed
- Error resilience
- Ordered shutdown

### 2. AbortController Integration

Use AbortController for cancellable operations:

```typescript
// Pattern: AbortController for cancellation
class CancellableWorkflow {
  private controller = new AbortController();
  private isRunning = false;

  async execute(input: unknown): Promise<unknown> {
    if (this.isRunning) {
      throw new Error('Workflow already running');
    }

    this.isRunning = true;
    const { signal } = this.controller;

    try {
      // Pass signal to all async operations
      const result = await this.step1(input, signal);
      const result2 = await this.step2(result, signal);
      const result3 = await this.step3(result2, signal);

      return result3;
    } catch (error) {
      if (signal.aborted) {
        console.log('[Workflow] Cancelled by user');
        throw new WorkflowCancelledError();
      }
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  cancel(): void {
    if (this.isRunning) {
      console.log('[Workflow] Cancelling...');
      this.controller.abort();
    }
  }

  private async step1(input: unknown, signal: AbortSignal): Promise<unknown> {
    // Check for cancellation
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Race operation against cancellation
    return Promise.race([
      this.performStep1(input),
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ]);
  }

  private async step2(input: unknown, signal: AbortSignal): Promise<unknown> {
    // Same pattern for all steps
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    return Promise.race([
      this.performStep2(input),
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ]);
  }

  private async step3(input: unknown, signal: AbortSignal): Promise<unknown> {
    // Same pattern for all steps
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    return Promise.race([
      this.performStep3(input),
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ]);
  }
}

class WorkflowCancelledError extends Error {
  constructor() {
    super('Workflow was cancelled');
    this.name = 'WorkflowCancelledError';
  }
}
```

**Advantages:**
- Standard cancellation API
- Propagates through async operations
- Works with fetch API
- Cleanup on abort

### 3. Cleanup Resource Management

Track and cleanup resources:

```typescript
// Pattern: Resource tracking
interface Resource {
  name: string;
  cleanup(): Promise<void>;
}

class ResourceManager {
  private resources = new Map<string, Resource>();
  private cleanupOrder: string[] = [];

  register(resource: Resource): void {
    this.resources.set(resource.name, resource);
    this.cleanupOrder.push(resource.name);
  }

  async cleanup(): Promise<void> {
    // Cleanup in reverse order (LIFO)
    const errors: Array<{ resource: string; error: unknown }> = [];

    for (const name of [...this.cleanupOrder].reverse()) {
      const resource = this.resources.get(name);
      if (!resource) continue;

      try {
        console.log(`[Cleanup] Cleaning up ${name}...`);
        await resource.cleanup();
        console.log(`[Cleanup] ${name} cleaned up`);
      } catch (error) {
        console.error(`[Cleanup] Error cleaning up ${name}:`, error);
        errors.push({ resource: name, error });
      }
    }

    // Clear resources
    this.resources.clear();
    this.cleanupOrder = [];

    // Report errors
    if (errors.length > 0) {
      throw new ResourceCleanupError(errors);
    }
  }
}

class ResourceCleanupError extends Error {
  constructor(
    public readonly errors: Array<{ resource: string; error: unknown }>
  ) {
    super(`Resource cleanup failed for ${errors.length} resources`);
    this.name = 'ResourceCleanupError';
  }
}

// Usage
const resources = new ResourceManager();

resources.register({
  name: 'database',
  cleanup: async () => {
    await database.close();
  },
});

resources.register({
  name: 'file-watcher',
  cleanup: async () => {
    await fileWatcher.close();
  },
});

resources.register({
  name: 'http-server',
  cleanup: async () => {
    await httpServer.close();
  },
});

// On shutdown
await resources.cleanup();
```

**Benefits:**
- Automatic resource tracking
- Ordered cleanup (LIFO)
- Error collection
- Comprehensive logging

### 4. In-Flight Operation Tracking

Track and wait for in-flight operations:

```typescript
// Pattern: Operation tracking
class OperationTracker {
  private operations = new Set<Promise<unknown>>();
  private isShuttingDown = false;

  async track<T>(operation: Promise<T>): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('System is shutting down');
    }

    this.operations.add(operation);

    try {
      return await operation;
    } finally {
      this.operations.delete(operation);
    }
  }

  async waitForCompletion(timeout = 30000): Promise<void> {
    if (this.operations.size === 0) {
      console.log('[Tracker] No in-flight operations');
      return;
    }

    console.log(`[Tracker] Waiting for ${this.operations.size} operations...`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout waiting for operations')), timeout);
    });

    try {
      await Promise.race([
        Promise.all(this.operations),
        timeoutPromise,
      ]);
      console.log('[Tracker] All operations completed');
    } catch (error) {
      console.error('[Tracker] Error waiting for operations:', error);
      throw error;
    }
  }

  shutdown(): void {
    this.isShuttingDown = true;
  }

  get count(): number {
    return this.operations.size;
  }
}

// Usage
const tracker = new OperationTracker();

async function processItem(item: unknown) {
  return tracker.track(
    doWork(item)
  );
}

// On shutdown
async function handleShutdown() {
  tracker.shutdown();
  await tracker.waitForCompletion(30000);
}
```

**Advantages:**
- Track all operations
- Wait for completion
- Timeout protection
- Prevent new operations

### 5. Graceful Shutdown with Timeout

Add timeout protection to shutdown:

```typescript
// Pattern: Timeout-protected shutdown
class GracefulShutdown {
  private shutdownTimeout = 30000; // 30 seconds

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log(`[Shutdown] Starting graceful shutdown from ${signal}...`);

    const shutdownPromise = this.performShutdown();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), this.shutdownTimeout);
    });

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      console.log('[Shutdown] Completed successfully');
    } catch (error) {
      console.error('[Shutdown] Error or timeout:', error);
      console.error('[Shutdown] Forcing exit...');
    } finally {
      process.exit(0);
    }
  }

  private async performShutdown(): Promise<void> {
    const steps = [
      { name: 'Stop accepting new work', fn: () => this.stopAcceptingWork() },
      { name: 'Wait for in-flight operations', fn: () => this.waitForOperations() },
      { name: 'Close connections', fn: () => this.closeConnections() },
      { name: 'Flush logs', fn: () => this.flushLogs() },
      { name: 'Cleanup resources', fn: () => this.cleanupResources() },
    ];

    for (const step of steps) {
      console.log(`[Shutdown] ${step.name}...`);
      try {
        await step.fn();
        console.log(`[Shutdown] ${step.name} - DONE`);
      } catch (error) {
        console.error(`[Shutdown] ${step.name} - FAILED:`, error);
        // Continue with next step
      }
    }
  }

  private async stopAcceptingWork(): Promise<void> {
    // Implementation
  }

  private async waitForOperations(): Promise<void> {
    // Implementation
  }

  private async closeConnections(): Promise<void> {
    // Implementation
  }

  private async flushLogs(): Promise<void> {
    // Implementation
  }

  private async cleanupResources(): Promise<void> {
    // Implementation
  }
}
```

**Benefits:**
- Timeout protection
- Sequential cleanup steps
- Error resilience
- Force exit on timeout

---

## Common Pitfalls to Avoid

### 1. Not Handling All Signals

```typescript
// BAD: Only handling SIGINT
process.on('SIGINT', () => {
  process.exit(0);
});

// GOOD: Handle all termination signals
['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
  process.on(signal, () => {
    gracefulShutdown(signal as string);
  });
});
```

### 2. Infinite Wait on Shutdown

```typescript
// BAD: Waits forever
await waitForOperations(); // Might never complete

// GOOD: Timeout protection
await waitForWithTimeout(waitForOperations(), 30000);
```

### 3. Not Stopping New Work

```typescript
// BAD: New work continues during shutdown
async function shutdown() {
  await database.close();
}

// GOOD: Stop accepting new work
async function shutdown() {
  acceptNewWork = false;
  await waitForCurrentWork();
  await database.close();
}
```

### 4. Swallowing Cleanup Errors

```typescript
// BAD: Errors silently ignored
async function cleanup() {
  try {
    await db.close();
  } catch (error) {
    // Error ignored
  }
  try {
    await server.close();
  } catch (error) {
    // Error ignored
  }
}

// GOOD: Collect and report errors
async function cleanup() {
  const errors = [];

  try {
    await db.close();
  } catch (error) {
    errors.push({ resource: 'db', error });
  }

  try {
    await server.close();
  } catch (error) {
    errors.push({ resource: 'server', error });
  }

  if (errors.length > 0) {
    console.error('Cleanup errors:', errors);
  }
}
```

### 5. Not Cleaning Up Resources

```typescript
// BAD: Resources not cleaned up
process.on('SIGTERM', () => {
  process.exit(0); // Exits immediately
});

// GOOD: Cleanup before exit
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
```

---

## Integration with TaskOrchestrator

Based on your `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`:

```typescript
import { EventEmitter } from 'events';

export class InterruptibleTaskOrchestrator extends TaskOrchestrator {
  private controller = new AbortController();
  private eventEmitter = new EventEmitter();

  constructor(sessionManager: SessionManager, scope?: Scope) {
    super(sessionManager, scope);
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
  }

  private async handleShutdown(signal: string): Promise<void> {
    console.log(`[TaskOrchestrator] Received ${signal}, initiating graceful shutdown...`);

    // Stop accepting new work
    this.controller.abort();

    // Emit shutdown event
    this.eventEmitter.emit('shutdown', { signal });

    // Wait for current item to complete (with timeout)
    try {
      await Promise.race([
        this.waitForCurrentItem(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout waiting for current item')), 5000);
        }),
      ]);
    } catch (error) {
      console.error('[TaskOrchestrator] Error waiting for current item:', error);
    }

    // Get state snapshot before exit
    const snapshot = this.getSnapshot();
    console.log('[TaskOrchestrator] State snapshot:', JSON.stringify(snapshot, null, 2));

    // Exit
    process.exit(0);
  }

  private async waitForCurrentItem(): Promise<void> {
    // Wait for current processNextItem() to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Check if no item is currently being processed
        // This would require tracking current state
        clearInterval(checkInterval);
        resolve();
      }, 100);
    });
  }

  getSnapshot(): unknown {
    return {
      executionQueue: this.executionQueue,
      scope: this.#scope,
      timestamp: new Date().toISOString(),
    };
  }

  onShutdown(callback: (data: { signal: string }) => void): void {
    this.eventEmitter.on('shutdown', callback);
  }

  // Override processNextItem to check for cancellation
  async processNextItem(): Promise<boolean> {
    if (this.controller.signal.aborted) {
      console.log('[TaskOrchestrator] Shutdown in progress, not processing new items');
      return false;
    }

    return super.processNextItem();
  }
}
```

---

## Recommended Next Steps

1. **Add Signal Handling**
   - Handle SIGTERM, SIGINT
   - Add graceful shutdown logic
   - Implement timeout protection

2. **Add Cancellation Support**
   - Integrate AbortController
   - Pass signals to async operations
   - Implement cleanup on abort

3. **Add Resource Tracking**
   - Track open connections
   - Track file handles
   - Implement cleanup handlers

4. **Add State Persistence**
   - Save state on shutdown
   - Enable resume on restart
   - Track progress

5. **Add Shutdown Hooks**
   - Register cleanup handlers
   - Execute in order
   - Collect and report errors

---

## Additional Resources

- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
- [Graceful Shutdown in Node.js](https://cloud.google.com/blog/products/serverless/helping-your-nodejs-services-respond-gracefully-to-shutdown-signals)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [PM2 Graceful Shutdown](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)
- [Kubernetes Termination Signals](https://cloud.google.com/blog/products/serverless/helping-your-nodejs-services-respond-gracefully-to-shutdown-signals)
- [Docker Stop Signal](https://docs.docker.com/engine/reference/commandline/stop/)
