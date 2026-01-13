# Structured Logging Quick Reference

**Research Date:** 2026-01-13
**Purpose:** Quick reference guide for implementing structured logging patterns

---

## Quick Reference Patterns

### 1. Component-Based Logger Initialization

```typescript
import { getLogger } from './utils/logger.js';

class TaskOrchestrator {
  private readonly logger: Logger;

  constructor() {
    this.logger = getLogger('TaskOrchestrator');
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info('Executing subtask', {
      subtaskId: subtask.id,
      title: subtask.title,
    });
  }
}
```

### 2. Correlation ID Generation and Propagation

```typescript
class SessionManager {
  createSession(metadata: SessionMetadata): Session {
    const correlationId = `wf-${metadata.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.info('Session created', {
      sessionId: metadata.id,
      correlationId,
    });

    return {
      metadata: { ...metadata, correlationId },
      taskRegistry: [],
      createdAt: new Date(),
    };
  }
}

class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const correlationId = this.session.currentSession?.metadata.correlationId;

    this.logger.info('Executing subtask', {
      correlationId, // Always include
      subtaskId: subtask.id,
    });
  }
}
```

### 3. AsyncLocalStorage for Automatic Context Propagation

```typescript
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{
  correlationId: string;
  sessionId: string;
}>();

class PRPPipeline {
  async execute(prdPath: string): Promise<void> {
    const session = this.createSession(prdPath);

    await asyncLocalStorage.run(
      {
        correlationId: session.metadata.correlationId,
        sessionId: session.metadata.id,
      },
      async () => {
        await this.executeWorkflow(session);
      }
    );
  }

  private async executeWorkflow(session: Session): Promise<void> {
    const context = asyncLocalStorage.getStore();

    this.logger.info('Executing workflow', {
      correlationId: context?.correlationId,
    });
  }
}
```

### 4. Status Transition Logging

```typescript
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();
    const session = this.session.currentSession!;

    // Log: Status transition to Implementing
    this.logger.info('Status transition', {
      correlationId: session.metadata.correlationId,
      subtaskId: subtask.id,
      previousStatus: subtask.status,
      newStatus: 'Implementing',
    });

    await this.#updateStatus(subtask.id, 'Implementing');

    try {
      await this.#executeSubtaskWork(subtask);

      // Log: Status transition to Complete
      this.logger.info('Status transition', {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        previousStatus: 'Implementing',
        newStatus: 'Complete',
        duration: Date.now() - startTime,
      });

      await this.#updateStatus(subtask.id, 'Complete');
    } catch (error) {
      // Log: Status transition to Failed
      this.logger.error('Status transition', error as Error, {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        previousStatus: 'Implementing',
        newStatus: 'Failed',
        duration: Date.now() - startTime,
      });

      await this.#updateStatus(subtask.id, 'Failed');
      throw error;
    }
  }
}
```

### 5. Error Logging with Context

```typescript
class TaskOrchestrator {
  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();
    const session = this.session.currentSession!;

    try {
      await this.#executeSubtaskWork(subtask);
    } catch (error) {
      const duration = Date.now() - startTime;

      // Structured error logging
      this.logger.error('Subtask execution failed', error as Error, {
        correlationId: session.metadata.correlationId,
        subtaskId: subtask.id,
        subtaskTitle: subtask.title,
        duration,
        status: 'Failed',
        // Error details automatically included:
        // - error.message
        // - error.stack (when verbose)
        // - error.code (if available)
      });

      await this.#updateStatus(subtask.id, 'Failed');
      throw error;
    }
  }
}
```

### 6. Custom Error Class with Context

```typescript
export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly context: {
      correlationId: string;
      itemId: string;
      itemType: string;
      sessionId: string;
      timestamp: Date;
      originalError?: unknown;
    }
  ) {
    super(message);
    this.name = 'WorkflowError';
    Error.captureStackTrace(this, WorkflowError);
  }

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

// Usage
try {
  await this.#executeSubtaskWork(subtask);
} catch (error) {
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

  this.logger.error(
    'Workflow error',
    workflowError,
    workflowError.toLogObject()
  );
  throw workflowError;
}
```

### 7. Parallel Execution with Aggregated Logging

```typescript
class TaskOrchestrator {
  async executeSubtasksParallel(subtasks: Subtask[]): Promise<void> {
    const session = this.session.currentSession!;

    this.logger.info('Starting parallel execution', {
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

    this.logger.info('Parallel execution completed', {
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

      this.logger.warn('Some subtasks failed', {
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

### 8. Sequential Execution with Progress Logging

```typescript
class TaskOrchestrator {
  async executeSubtasksSequential(subtasks: Subtask[]): Promise<void> {
    const session = this.session.currentSession!;
    const total = subtasks.length;

    this.logger.info('Starting sequential execution', {
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
        this.logger.info('Execution progress', {
          correlationId: session.metadata.correlationId,
          completed: index + 1,
          total,
          succeeded,
          failed,
          percentage: Math.round(((index + 1) / total) * 100),
        });
      } catch (error) {
        failed++;
        throw error;
      }
    }

    this.logger.info('Sequential execution completed', {
      correlationId: session.metadata.correlationId,
      totalSubtasks: total,
      succeeded,
      failed,
    });
  }
}
```

### 9. Retry Logic with Logging

```typescript
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

    const session = this.session.currentSession!;
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

### 10. Sensitive Data Redaction

```typescript
// Configure Pino with redaction
import pino from 'pino';

const logger = pino({
  redact: [
    'password',
    'token',
    'api_key',
    'secret',
    'authorization',
    '*.password',
    '*.token',
    'request.headers.authorization',
  ],
});

// Usage - sensitive data automatically redacted
class AuthManager {
  async login(username: string, password: string): Promise<void> {
    this.logger.info('User login attempt', {
      username,
      password, // Automatically redacted to [Redacted]
    });
    // Output: {"level":"info","username":"alice","password":"[Redacted]","msg":"User login attempt"}
  }

  async fetchAPI(url: string, apiKey: string): Promise<void> {
    this.logger.info('Fetching API', {
      url,
      apiKey, // Automatically redacted to [Redacted]
    });
    // Output: {"level":"info","url":"https://api.example.com","apiKey":"[Redacted]","msg":"Fetching API"}
  }
}
```

---

## Common Log Message Templates

### Session Events

```typescript
// Session created
logger.info('Session created', {
  sessionId,
  correlationId,
  prdPath,
  scope,
  mode,
});

// Session completed
logger.info('Session completed', {
  sessionId,
  correlationId,
  duration,
  totalTasks,
  completedTasks,
  failedTasks,
});

// Session failed
logger.error('Session failed', error, {
  sessionId,
  correlationId,
  duration,
  errorMessage,
});
```

### Task Events

```typescript
// Task started
logger.info('Task started', {
  correlationId,
  subtaskId,
  subtaskTitle,
  dependencies,
  contextScope,
});

// Task completed
logger.info('Task completed', {
  correlationId,
  subtaskId,
  duration,
  status: 'Complete',
});

// Task failed
logger.error('Task failed', error, {
  correlationId,
  subtaskId,
  duration,
  status: 'Failed',
});
```

### Status Transitions

```typescript
// Status transition
logger.info('Status transition', {
  correlationId,
  itemId,
  itemType,
  previousStatus,
  newStatus,
  timestamp: new Date().toISOString(),
});
```

### Validation Events

```typescript
// Validation passed
logger.info('Validation passed', {
  correlationId,
  itemId,
  itemType,
});

// Validation failed
logger.warn('Validation failed', {
  correlationId,
  itemId,
  itemType,
  errors: ['Error 1', 'Error 2'],
  warnings: ['Warning 1'],
});
```

---

## External Resources

### Official Documentation

- **Pino Documentation**: https://getpino.io/#/
- **Pino API Reference**: https://getpino.io/#/docs/api
- **Pino Redaction Guide**: https://getpino.io/#/docs/api?id=redaction
- **Pino Pretty**: https://github.com/pinojs/pino-pretty

### Best Practices

- **OWASP Logging Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- **Twelve-Factor App Logging**: https://12factor.net/logs
- **Structured Logging Best Practices**: https://www.honeycomb.io/blog/why-structured-logging-is-key-to-observability/
- **Distributed Tracing**: https://www.elastic.co/guide/en/apm/get-started/current/distributed-tracing.html

### Node.js and TypeScript

- **AsyncLocalStorage**: https://nodejs.org/api/async_context.html#class-asynclocalstorage
- **TypeScript Error Handling**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- **OpenTelemetry JavaScript**: https://opentelemetry.io/docs/instrumentation/js/

---

## Anti-Patterns to Avoid

❌ **Don't** create multiple logger instances
✅ **Do** use singleton pattern with factory function

❌ **Don't** use `console.log()` directly
✅ **Do** use `logger.info()`, `logger.error()`, etc.

❌ **Don't** log sensitive data without redaction
✅ **Do** configure Pino redaction for sensitive fields

❌ **Don't** lose context in async call chains
✅ **Do** propagate correlation ID or use AsyncLocalStorage

❌ **Don't** skip logging status transitions
✅ **Do** log all state changes with previous/new status

❌ **Don't** log everything at info level
✅ **Do** use debug level for detailed tracing

---

**End of Quick Reference**

**Last Updated:** 2026-01-13
**Researcher:** Claude Code Agent
