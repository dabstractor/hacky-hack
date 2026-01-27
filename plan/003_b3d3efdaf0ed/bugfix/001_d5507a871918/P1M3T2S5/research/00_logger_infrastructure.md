# Logging Infrastructure Research

## Summary

The codebase uses **Pino** as the underlying logging library with a custom wrapper interface.

## Logger Implementation

**File**: `src/utils/logger.ts`

### Key Features
- **Log Levels**: TRACE (10), DEBUG (20), INFO (30), WARN (40), ERROR (50), FATAL (60)
- **Pino Integration**: Uses `pino` with `pino-pretty` for development output
- **Structured Logging**: JSON format with correlation ID and context
- **Sensitive Data Redaction**: Automatically redacts API keys, tokens, passwords

## Debug Mode Detection

Debug mode is determined by:

1. **CLI Flag**: `--verbose` (sets verbose: true in logger config)
2. **Environment Variable**: `HACKY_LOG_LEVEL` (defaults to 'info')
3. **CLI Option**: `--log-level debug` (overrides verbose)

**Priority order**:
1. `--log-level` command line argument
2. `HACKY_LOG_LEVEL` environment variable
3. `--verbose` flag (deprecated, but still works)
4. Default: 'info'

## Logger Instances in PRP Pipeline

The PRP Pipeline has two logger instances:

### `this.logger` - Main Logger
```typescript
// From prp-pipeline.ts (lines 32, 364)
import { getLogger } from '../utils/logger.js';

// Standard logger instance
this.logger = getLogger('PRPPipeline');
// Usage: this.logger.info('Message');
```

### `this.correlationLogger` - Correlation Logger
```typescript
// From prp-pipeline.ts (lines 149, 364-366)
this.correlationLogger = getLogger('PRPPipeline').child({
  correlationId: this.#correlationId,
});

// Usage: this.correlationLogger.debug({ data }, 'Message');
```

## Existing Debug Logging Examples in PRP Pipeline

### Entry Point Debug Logging
```typescript
// From prp-pipeline.ts (lines 1691-1699)
this.correlationLogger.debug(
  {
    prdPath: this.#prdPath,
    scope: this.#scope ?? 'all',
    mode: this.mode,
  },
  '[PRPPipeline] Starting PRP Pipeline workflow'
);
```

### Session Initialization Debug
```typescript
// From prp-pipeline.ts (lines 1714-1719)
this.logger.debug(
  `[PRPPipeline] Checking for nested execution at ${sessionPath}`
);
validateNestedExecution(sessionPath);
this.logger.debug(
  '[PRPPipeline] No nested execution detected, proceeding'
);
```

### Error Logging with Context
```typescript
// From prp-pipeline.ts (lines 1722-1730)
this.logger.error(
  {
    sessionPath,
    existingPid: error.context?.existingPid,
    currentPid: error.context?.currentPid,
  },
  '[PRPPipeline] Nested execution detected - cannot proceed'
);
```

## Best Practices

1. **Use `this.logger.debug()` for general debug logging**
2. **Use `this.correlationLogger.debug()` for cross-component tracing**
3. **Include structured data objects in debug calls**
4. **Use consistent context names** (e.g., 'PRPPipeline', 'TaskOrchestrator')
5. **For temporary debugging, use `--log-level debug` CLI flag**

## Implementation Guidance for Guard Context Logging

Based on the existing patterns:

1. **Use `this.logger`** (not correlationLogger) - guard operations are not critical path
2. **Use template literal format** for simple multi-field messages (like lines 1714-1720)
3. **Place after validation passes** and **after PRP_PIPELINE_RUNNING is set**
4. **Include all 4 required fields**: PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING, PRP_PIPELINE_RUNNING
5. **Use descriptive message**: '[PRPPipeline] Guard Context: ...'
