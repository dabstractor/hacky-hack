# Error Handling and Debug Logging Patterns Research

## Error Handling Patterns

### File Locations

- `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
- `/home/dustin/projects/hacky-hack/src/workflows/fix-cycle-workflow.ts`
- `/home/dustin/projects/hacky-hack/src/utils/errors.ts`

### Pattern 1: Try-Catch with Error Classification

```typescript
try {
  // Operation that might fail
  await this.sessionManager.initialize();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check if error is fatal using isFatalError()
  if (isFatalError(error, this.#continueOnError)) {
    this.logger.error(
      `[PRPPipeline] Fatal session initialization error: ${errorMessage}`
    );
    throw error; // Re-throw to abort pipeline
  }

  // Non-fatal: track failure and continue
  this.#trackFailure('initializeSession', error, { phase: this.currentPhase });
  this.logger.warn(
    `[PRPPipeline] Non-fatal session initialization error, continuing: ${errorMessage}`
  );
}
```

### Pattern 2: Error Tracking

```typescript
#trackFailure(taskId: string, error: unknown, context?: {...}): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  let errorCode: string | undefined;

  if (isPipelineError(error)) {
    errorCode = error.code;
  }

  const failure: TaskFailure = {
    taskId,
    taskTitle: context?.taskTitle ?? taskId,
    error: errorObj,
    errorCode,
    timestamp: new Date(),
    phase: context?.phase,
    milestone: context?.milestone,
  };

  this.#failedTasks.set(taskId, failure);

  this.logger.error('[PRPPipeline] Task failure tracked', {
    taskId,
    taskTitle: failure.taskTitle,
    errorCode,
    errorMessage: errorObj.message,
    ...(errorObj.stack && { stack: errorObj.stack }),
    timestamp: failure.timestamp.toISOString(),
    ...context,
  });
}
```

### Pattern 3: Error Hierarchy

```typescript
// Base error class
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();
    this.cause = cause;

    // CRITICAL: Must set prototype for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

### Pattern 4: Type Guards

```typescript
export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}
```

## Debug Logging Patterns

### Logging Library

**Uses Pino** for high-performance structured logging

### Logger Setup

```typescript
import type { Logger } from '../utils/logger.js';
import { getLogger } from '../utils/logger.js';

// Get context-aware logger
const logger = getLogger('PRPPipeline');
const correlationLogger = getLogger('PRPPipeline').child({ correlationId });
```

### Debug Logging Examples

```typescript
// Basic debug logging
this.logger.debug('[PRPPipeline] Session initialized', {
  sessionPath: this.sessionManager?.currentSession?.metadata.path,
  hasExistingBacklog:
    (this.sessionManager?.currentSession?.taskRegistry?.backlog?.length ?? 0) >
    0,
});

// With correlation ID
this.correlationLogger.debug(
  {
    prdPath: this.#prdPath,
    scope: this.#scope ?? 'all',
    mode: this.mode,
  },
  '[PRPPipeline] Starting PRP Pipeline workflow'
);

// Debug logging for environment variables
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);
```

### Log Levels

- `trace` - Extremely detailed logging
- `debug` - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages
- `error` - Error messages
- `fatal` - Critical errors

### Sensitive Data Redaction

Automatic redaction of:

- API keys
- Tokens
- Passwords
- Email addresses

Handled at the logger level, no need to worry in business logic.

## Session Path Access Patterns

### Session Structure

```typescript
export interface SessionMetadata {
  readonly id: string;
  readonly hash: string;
  readonly path: string; // plan/{sequence}_{hash}/
}
```

### Common Access Pattern

```typescript
// Optional chaining with nullish coalescing
const sessionPath = this.sessionManager.currentSession?.metadata.path;

// With existence check
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  validateNestedExecution(sessionPath);
}

// Default empty string for logging
const sessionPath = this.sessionManager.currentSession?.metadata.path ?? '';
```

## Import Statements

```typescript
import { isPipelineError, isFatalError } from '../utils/errors.js';
import {
  validateNestedExecution,
  isNestedExecutionError,
} from '../utils/validation/execution-guard.js';
import type { Logger } from '../utils/logger.js';
import { getLogger } from '../utils/logger.js';
```

## Key Gotchas

1. **Always use type guards for error handling**

   ```typescript
   if (isNestedExecutionError(error)) {
     // Type narrowing: error is now NestedExecutionError
   }
   ```

2. **Optional chaining for session path**

   ```typescript
   this.sessionManager.currentSession?.metadata.path;
   ```

3. **Context object in logger.debug() can be first or second parameter**

   ```typescript
   this.logger.debug({ context }, 'Message'); // Object first
   this.logger.debug('Message', { context }); // Or second
   ```

4. **Error context uses intersection types**
   ```typescript
   context?: PipelineErrorContext & {
     existingPid?: string;
     currentPid?: string;
     sessionPath?: string;
   }
   ```

## References

- Errors: `src/utils/errors.ts`
- Logger: `src/utils/logger.ts`
- Validation: `src/utils/validation/execution-guard.ts`
- PRP Pipeline: `src/workflows/prp-pipeline.ts`
- Fix Cycle Workflow: `src/workflows/fix-cycle-workflow.ts`
