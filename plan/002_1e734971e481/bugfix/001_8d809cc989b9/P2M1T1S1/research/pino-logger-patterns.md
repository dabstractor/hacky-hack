# Pino Logger Usage Patterns Research

## Logger Initialization

**File**: `src/utils/logger.ts`

```typescript
// Basic initialization with context
const logger = getLogger('ComponentName');

// With configuration options
const logger = getLogger('ComponentName', {
  verbose: true,        // Enable debug-level logging
  machineReadable: false, // Use pretty-printed output (default)
});
```

**Key Features**:
- Uses Pino with redaction for sensitive data
- Supports both pretty-printed (development) and JSON (production) output
- Debug logs only appear when `verbose: true` is set
- Context is automatically included in all log entries

## Child Logger Creation with Context

**File**: `src/workflows/prp-pipeline.ts` (lines 286-288)

```typescript
// Basic child logger
const childLogger = logger.child({ correlationId: this.correlationId });

// Example with correlation tracking
this.correlationLogger = getLogger('PRPPipeline').child({
  correlationId: this.#correlationId,
});
```

## Existing Debug Logging Patterns

### SessionManager (src/core/session-manager.ts)
```typescript
// Debug logging with structured context
this.#logger.debug(
  { backlogPath: this.#currentSession.metadata.path },
  'Backlog persisted'
);

// Simple debug messages
this.#logger.debug('No pending updates to flush');
this.#logger.debug('Batching state reset');
```

### TaskOrchestrator (src/core/task-orchestrator.ts)
```typescript
// Debug logging with context
this.#logger.debug(
  { subtaskId: subtask.id, blockerIds },
  'Waiting for dependencies'
);

// Initialization logging
this.#logger.debug({ maxSize: 3 }, 'ResearchQueue initialized');
this.#logger.debug('PRPRuntime initialized for subtask execution');
```

### PRPPipeline (src/workflows/prp-pipeline.ts)
```typescript
// Pipeline-level debug logging
this.logger.debug('[PRPPipeline] Signal handlers registered');
this.logger.debug('[PRPPipeline] Resource monitoring stopped');
this.logger.debug('[PRPPipeline] Pending updates flushed on shutdown');
```

## Structured Logging Conventions

### Standard Pattern: `{ context object }, 'message'`
```typescript
// From src/utils/progress.ts
this.#logger.debug({ itemId }, 'Task started');
this.#logger.debug({ itemId, duration }, 'Task completed');

// From src/agents/prp-executor.ts
this.#logger.info({ prpTaskId: prp.taskId }, 'Starting PRP execution');

// From src/utils/resource-monitor.ts
logger.debug({ interval }, 'Resource monitoring started')
logger.debug('Resource monitoring stopped')
```

## Key Conventions

### Do:
1. **Use context objects** - Always pass relevant data as the first parameter
2. **Be descriptive in context keys** - Use `subtaskId`, `correlationId`, `taskPath`, etc.
3. **Use consistent prefixes** - `'[ComponentName] message'` for component-level logs
4. **Include relevant data** - When logging operations, include key identifiers
5. **Use debug for verbose information** - Debug logs should provide detailed tracing info

### Don't:
1. **Log sensitive data** - The logger automatically redacts common patterns (API keys, tokens, passwords)
2. **Use string interpolation for data** - Use structured objects instead
3. **Overuse debug logging** - Keep debug logs meaningful and concise
4. **Forget to include context** - Always add relevant identifiers to help with debugging

## Best Practices

### Initialize loggers at module level
```typescript
import { getLogger } from '../utils/logger.js';

const logger = getLogger('ComponentName');
```

### Use child loggers for request/operation tracing
```typescript
const requestLogger = logger.child({ requestId, userId });
requestLogger.debug('Processing request');
```

### Log state changes with context
```typescript
logger.debug({
  taskId,
  fromStatus: 'pending',
  toStatus: 'in_progress'
}, 'Task status changed');
```

### Use debug for timing and performance info
```typescript
const startTime = Date.now();
// ... operation ...
logger.debug({ operation: 'prp-execution', duration: Date.now() - startTime }, 'Operation completed');
```
