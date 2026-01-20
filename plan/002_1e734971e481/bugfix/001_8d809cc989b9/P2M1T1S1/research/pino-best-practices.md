# Pino Logger Best Practices Research

## Official Pino Documentation URLs

### Key Documentation Sections:
- **Main Documentation**: https://getpino.io/#/
- **API Documentation**: https://getpino.io/#/docs/api
- **Log Levels**: https://getpino.io/#/docs/api?id=log-level
- **Child Loggers**: https://getpino.io/#/docs/api?id=child
- **Transports**: https://getpino.io/#/docs/transports
- **ECMAScript Modules**: https://getpino.io/#/docs/ecmascript-modules
- **Performance Benchmarks**: https://getpino.io/#/docs/benchmarks

### GitHub Repository:
- **Official Repo**: https://github.com/pinojs/pino
- **Examples**: https://github.com/pinojs/pino/tree/master/examples
- **TypeScript Definitions**: https://github.com/pinojs/pino/blob/master/types/pino.d.ts

## Best Practices for Structured Logging

### Structured Data Patterns

```typescript
// GOOD - Structured context with clear separation
logger.info({
  taskId: 'P1.M1.T1',
  status: 'in_progress',
  duration: 145,
  userId: 'abc-123'
}, 'Task status changed');

// BAD - String interpolation loses structure
logger.info(`Task ${taskId} changed to ${status}`);

// GOOD - Error objects with context
logger.error({
  err: error,
  context: 'task_execution',
  taskId: 'P1.M1.T1'
}, 'Task failed');

// BAD - Error as string
logger.error(`Task failed: ${error.message}`);
```

### Consistent Field Naming

Use consistent field names across your application:
```typescript
interface StandardLogFields {
  // Request/Operation tracking
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;

  // User context
  userId?: string;
  accountId?: string;

  // Operation details
  operation?: string;
  action?: string;
  component?: string;

  // Performance
  duration?: number;
  startTime?: number;
  endTime?: number;

  // Metadata
  version?: string;
  environment?: string;
}
```

## Child Logger Usage Patterns

### Component Hierarchy Pattern
```typescript
// Parent logger for module
const moduleLogger = getLogger('PRPPipeline');

// Child logger for specific component
const taskLogger = moduleLogger.child({
  component: 'TaskExecutor',
  projectId: 'P1'
});

// Grandchild for specific task
const specificTaskLogger = taskLogger.child({
  taskId: 'P1.M1.T1',
  milestoneId: 'M1'
});

// Each level adds context without modifying parents
specificTaskLogger.info('Processing task');
```

### Immutable Context Pattern
```typescript
// Child loggers are IMMUTABLE - once created, context cannot be changed
const logger = getLogger('MyComponent');
const child1 = logger.child({ taskId: 'P1.M1.T1' });
const child2 = child1.child({ subtaskId: 'S1' });

// child1 still only has taskId, not subtaskId
// child2 has both taskId and subtaskId
```

## Performance Considerations

### Log Level Evaluation
```typescript
// Pino evaluates log levels BEFORE serialization
// Disabled log levels have ~zero performance cost

const logger = getLogger('MyComponent', { level: 'info' });

// This has minimal overhead - level check happens first
logger.debug({ heavyData: expensiveComputation() }, 'Debug message');
// Pino checks: if (levelVal <= 20) { serialize(); log; }
// Since level is 'info' (30), this returns immediately

// GOOD - Rely on Pino's level checking
logger.debug(expensiveObject(), 'Debug');

// BAD - Manual level checking (unnecessary)
if (logger.level === 'debug') {
  logger.debug(expensiveObject(), 'Debug');
}
```

### Serialization Performance
```typescript
// GOOD - Pino serializes efficiently
logger.info({
  user: { id: 123, name: 'John' },
  meta: { timestamp: Date.now() }
}, 'User action');

// WATCH OUT - Circular references
const circular = { a: 1 };
circular.self = circular;
logger.info({ data: circular }, 'This might be slow');
// Pino handles circular refs but with performance cost

// GOOD - Selective logging
logger.info({
  // Only log what you need
  userId: user.id,
  action: 'login',
  timestamp: Date.now()
}, 'User logged in');
```

## Gotchas for Debug-Level Logging

### Gotcha 1: Log Level Hierarchy
```typescript
// Pino log levels (numeric values):
// trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60

// Setting level to 'info' means debug and trace are DISABLED
const logger = getLogger('MyComponent', { level: 'info' });

logger.debug('This will NOT be logged'); // Silent
logger.info('This WILL be logged');     // Output

// Solution - Use verbose flag for debug
const debugLogger = getLogger('MyComponent', { verbose: true });
debugLogger.debug('This WILL be logged');
```

### Gotcha 2: Mutable Objects
```typescript
// GOTCHA - Object mutations affect logged data
const data = { status: 'pending' };
logger.debug({ data }, 'Before');
data.status = 'complete';
// If log is flushed later, it shows status: 'complete'

// SOLUTION - Log immutable data
logger.debug({ data: { ...data } }, 'Immutable snapshot');
```

### Gotcha 3: Error Objects
```typescript
// GOTCHA - Error objects need special handling
logger.error({ error: new Error('Failed') }, 'Operation failed');
// Output: { error: {} } - Error properties are not enumerable

// SOLUTION - Use pino's stdSerializers.err
import pino from 'pino';

const logger = pino({
  serializers: {
    err: pino.stdSerializers.err
  }
});

logger.error({ err: new Error('Failed') }, 'Operation failed');
// Output: { err: { type: 'Error', message: 'Failed', stack: '...' } }
```

### Gotcha 4: Redaction Path Matching
```typescript
// Your current redaction paths
const REDACT_PATHS = [
  'apiKey',
  'headers.authorization'
];

// GOTCHA - Exact path matching only
logger.info({
  apiKey: 'secret',           // Redacted
  credentials: { apiKey: 'secret' }  // NOT redacted!
}, 'API call');

// SOLUTION - Add nested paths
const REDACT_PATHS = [
  'apiKey',
  'credentials.apiKey',
  '*.apiKey',  // Wildcard (slower but comprehensive)
  'data.*.secret'
];
```

## Correlation ID Pattern

```typescript
// Initialize correlation ID at entry point
function withCorrelationId<T>(
  fn: (correlationId: string) => T
): T {
  const correlationId = uuidv4();
  return fn(correlationId);
}

// Use throughout request lifecycle
withCorrelationId((correlationId) => {
  const logger = getLogger('MyComponent').child({ correlationId });

  // Pass to async operations
  fetch('https://api.example.com', {
    headers: { 'x-correlation-id': correlationId }
  });

  logger.info('This log is correlated');
});
```

## Summary of Key URLs

### Official Documentation:
- Main: https://getpino.io/#/
- API Reference: https://getpino.io/#/docs/api
- Child Loggers: https://getpino.io/#/docs/api?id=child
- Log Levels: https://getpino.io/#/docs/api?id=log-level
- Transports: https://getpino.io/#/docs/transports

### GitHub Resources:
- Repository: https://github.com/pinojs/pino
- Examples: https://github.com/pinojs/pino/tree/master/examples
- TypeScript Types: https://github.com/pinojs/pino/blob/master/types/pino.d.ts

### Related Packages:
- pino-http: https://github.com/pinojs/pino-http
- pino-pretty: https://github.com/pinojs/pino-pretty
- pino-multi-stream: https://github.com/pinojs/pino-multi-stream
