# Logging and Observability Research for Task Orchestration Systems

**Research Date:** 2026-01-13
**Purpose:** Guide for implementing structured logging and observability in task orchestration systems

---

## Table of Contents

1. [Overview](#1-overview)
2. [Status Transition Logging Patterns](#2-status-transition-logging-patterns)
3. [Bracketed Log Format Patterns](#3-bracketed-log-format-patterns)
4. [Error Message Formatting](#4-error-message-formatting)
5. [Structured Logging Best Practices](#5-structured-logging-best-practices)
6. [Observability in Orchestration Systems](#6-observability-in-orchestration-systems)
7. [Node.js Logging Libraries](#7-nodejs-logging-libraries)
8. [Implementation Examples](#8-implementation-examples)
9. [Best Practices Checklist](#9-best-practices-checklist)
10. [Additional Resources](#10-additional-resources)

---

## 1. Overview

### 1.1 Three Pillars of Observability

Observability in distributed systems consists of three core pillars:

1. **Logs**: Discrete events with timestamps and contextual information
2. **Metrics**: Quantitative measurements (CPU, memory, request rates, latency)
3. **Traces**: Request lifecycle across distributed systems

### 1.2 Why Structured Logging Matters

- **Machine-readable**: JSON format enables easy parsing and analysis
- **Queryable**: Structured fields allow powerful filtering and aggregation
- **Context-rich**: Include correlation IDs, request IDs, user IDs
- **Debugging-friendly**: Stack traces, error codes, and actionable messages

---

## 2. Status Transition Logging Patterns

### 2.1 Current Implementation Pattern

**File:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

The current implementation uses bracketed log format with structured information:

```typescript
// Status transition log
console.log(`[TaskOrchestrator] Executing Phase: ${phase.id} - ${phase.title}`);

// Dependency blocking log
console.log(
  `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
);

// Completion log
console.log('[TaskOrchestrator] Backlog processing complete');
```

### 2.2 Recommended Status Transition Log Structure

Each status transition should include:

#### Log Entry Schema

```typescript
interface StatusTransitionLog {
  // Component identification
  component: string;        // e.g., "TaskOrchestrator"

  // Item identification
  itemId: string;          // e.g., "P1.M1.T1.S3"
  itemType: string;        // e.g., "Subtask", "Task", "Milestone", "Phase"
  itemTitle?: string;      // Human-readable title

  // Status transition
  previousStatus?: Status; // Previous state (if known)
  newStatus: Status;       // New state
  timestamp: string;       // ISO 8601 timestamp

  // Execution context
  sessionId?: string;      // Session identifier
  workflowId?: string;     // Workflow identifier

  // Additional context
  dependencies?: string[]; // Dependency IDs
  blockers?: string[];     // Blocking dependency IDs

  // Metadata
  duration?: number;       // Execution time in milliseconds
  error?: string;          // Error message if failed
  errorCode?: string;      // Error code for categorization
}
```

### 2.3 Status Values and Transitions

**File:** `/home/dustin/projects/hacky-hack/src/core/models.ts`

```typescript
type Status =
  | 'Planned'        // Initial state
  | 'Implementing'   // In progress
  | 'Complete'       // Successfully finished
  | 'Blocked'        // Waiting for dependencies
  | 'Failed';        // Execution failed

// Valid transitions
const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  'Planned': ['Implementing', 'Blocked', 'Failed'],
  'Implementing': ['Complete', 'Failed', 'Blocked'],
  'Blocked': ['Implementing', 'Failed'],
  'Complete': [],           // Terminal state
  'Failed': ['Implementing'], // Retry
};
```

### 2.4 Status Transition Log Examples

#### Example 1: Successful Execution

```typescript
// Log format
console.log(`[TaskOrchestrator] Status transition: ${itemId} ${itemType}`)
console.log(`  Previous: ${previousStatus} → New: ${newStatus}`);
console.log(`  Title: ${itemTitle}`);
console.log(`  Dependencies: ${dependencies.join(', ')}`);
console.log(`  Duration: ${duration}ms`);
```

**Output:**
```
[TaskOrchestrator] Status transition: P1.M1.T1.S3 Subtask
  Previous: Planned → New: Implementing
  Title: Implement logging system
  Dependencies: P1.M1.T1.S1, P1.M1.T1.S2
  Duration: 0ms
```

#### Example 2: Blocked on Dependencies

```typescript
console.log(`[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies`);

for (const blocker of blockers) {
  console.log(
    `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
  );
}
```

**Output:**
```
[TaskOrchestrator] Subtask P1.M1.T1.S3 blocked on dependencies
[TaskOrchestrator] Blocked on: P1.M1.T1.S1 - Setup project structure (status: Planned)
[TaskOrchestrator] Blocked on: P1.M1.T1.S2 - Configure TypeScript (status: Implementing)
```

#### Example 3: Failed Execution

```typescript
console.error(`[TaskOrchestrator] Execution failed: ${itemId}`);
console.error(`  Status: Implementing → Failed`);
console.error(`  Error: ${error.message}`);
console.error(`  Error Code: ${errorCode}`);
console.error(`  Stack Trace: ${error.stack}`);
```

**Output:**
```
[TaskOrchestrator] Execution failed: P1.M1.T1.S3
  Status: Implementing → Failed
  Error: Cannot read property 'foo' of undefined
  Error Code: TYPE_ERROR
  Stack Trace: TypeError: Cannot read property 'foo' of undefined
    at executeSubtask (/src/core/task-orchestrator.ts:365:12)
    at processNextItem (/src/core/task-orchestrator.ts:447:5)
```

### 2.5 What Information to Include in Status Transition Logs

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Component** | Yes | Logging component name | `TaskOrchestrator` |
| **Item ID** | Yes | Unique item identifier | `P1.M1.T1.S3` |
| **Item Type** | Yes | Type of hierarchy item | `Subtask`, `Task`, `Milestone`, `Phase` |
| **Previous Status** | Conditional | State before transition | `Planned` |
| **New Status** | Yes | State after transition | `Implementing` |
| **Timestamp** | Yes | ISO 8601 timestamp | `2026-01-13T10:30:45.123Z` |
| **Session ID** | Recommended | Session identifier | `session-abc123` |
| **Duration** | For completion | Execution time in ms | `1234` |
| **Dependencies** | If applicable | Dependency IDs | `['P1.M1.T1.S1']` |
| **Blockers** | If blocked | Blocking dependency IDs | `['P1.M1.T1.S1']` |
| **Error Message** | On failure | Human-readable error | `Failed to connect to database` |
| **Error Code** | On failure | Categorizable error code | `DB_CONNECTION_ERROR` |
| **Stack Trace** | On failure | Full stack trace | `Error: ... at ...` |

---

## 3. Bracketed Log Format Patterns

### 3.1 Current Bracketed Format Pattern

The codebase uses consistent bracketed format: `[Component] message`

**Examples from TaskOrchestrator:**

```typescript
console.log('[TaskOrchestrator] Executing Phase: P1.M1 - Project Setup');
console.log('[TaskOrchestrator] Waiting for dependencies: P1.M1.T1.S1');
console.log('[TaskOrchestrator] Backlog processing complete');
```

### 3.2 Bracketed Format Specification

#### Pattern Structure

```
[ComponentName] Action: Target - Context (metadata)
```

#### Components

1. **Bracketed Component Identifier**
   - Format: `[ComponentName]`
   - Purpose: Quick visual filtering and categorization
   - Examples: `[TaskOrchestrator]`, `[SessionManager]`, `[PRPBlueprintAgent]`

2. **Action Verb**
   - Format: `Action:`
   - Purpose: Describe what's happening
   - Examples: `Executing`, `Waiting`, `Blocked`, `Failed`, `Complete`

3. **Target**
   - Format: `Target`
   - Purpose: What is being acted upon
   - Examples: `P1.M1.T1.S3`, `Session abc123`, `Backlog`

4. **Context** (optional)
   - Format: `- Context`
   - Purpose: Additional relevant information
   - Examples: `- Project Setup`, `- Waiting for dependencies`

5. **Metadata** (optional)
   - Format: `(metadata)`
   - Purpose: Structured data
   - Examples: `(status: Planned)`, `(duration: 1234ms)`

### 3.3 Bracketed Log Format Examples

#### Information Logs

```typescript
// Component lifecycle
console.log('[TaskOrchestrator] Starting backlog processing');
console.log('[TaskOrchestrator] Backlog processing complete');

// Item execution
console.log('[TaskOrchestrator] Executing Phase: P1.M1 - Project Setup');
console.log('[TaskOrchestrator] Executing Milestone: P1.M1.T1 - Environment Setup');
console.log('[TaskOrchestrator] Executing Task: P1.M1.T1.S1 - Initialize Git');
console.log('[TaskOrchestrator] Executing Subtask: P1.M1.T1.S1.1 - Create .gitignore');

// Dependency management
console.log('[TaskOrchestrator] Dependencies complete for P1.M1.T1.S2');
console.log('[TaskOrchestrator] Waiting for dependencies: P1.M1.T1.S1, P1.M1.T1.S2');
```

#### Warning Logs

```typescript
console.warn('[TaskOrchestrator] Subtask P1.M1.T1.S3 has no dependencies (may execute out of order)');
console.warn('[TaskOrchestrator] Dependency P1.M1.T1.S1 not found in backlog');
console.warn('[TaskOrchestrator] Circular dependency detected: P1.M1.T1.S1 → P1.M1.T1.S2 → P1.M1.T1.S1');
```

#### Error Logs

```typescript
console.error('[TaskOrchestrator] Failed to execute subtask: P1.M1.T1.S3');
console.error('[TaskOrchestrator] Timeout waiting for dependencies of P1.M1.T1.S2 after 30000ms');
console.error('[TaskOrchestrator] Cannot refresh backlog: no active session');
```

### 3.4 Multi-line Indented Format Pattern

For complex logs, use multi-line format with indentation:

```typescript
console.log(`[TaskOrchestrator] Status transition: ${itemId}`);
console.log(`  Type: ${itemType}`);
console.log(`  Title: ${itemTitle}`);
console.log(`  Status: ${previousStatus} → ${newStatus}`);
console.log(`  Dependencies: ${dependencies.join(', ')}`);
console.log(`  Duration: ${duration}ms`);
```

**Output:**
```
[TaskOrchestrator] Status transition: P1.M1.T1.S3
  Type: Subtask
  Title: Implement logging system
  Status: Planned → Implementing
  Dependencies: P1.M1.T1.S1, P1.M1.T1.S2
  Duration: 0ms
```

---

## 4. Error Message Formatting

### 4.1 Error Message Structure

Best practice error messages should include:

1. **What happened**: Clear description of the error
2. **Why it happened**: Root cause (if known)
3. **Context**: Relevant state information
4. **How to fix**: Actionable next steps (if applicable)

### 4.2 Error Message Templates

#### Template 1: Synchronous Error

```typescript
throw new Error(
  `Cannot ${action}: ${reason}\n` +
  `  Context: ${context}\n` +
  `  Solution: ${solution}`
);
```

**Example:**
```typescript
throw new Error(
  `Cannot create TaskOrchestrator: no active session\n` +
  `  Context: SessionManager.currentSession is null\n` +
  `  Solution: Call sessionManager.createSession() first`
);
```

#### Template 2: Timeout Error

```typescript
throw new Error(
  `Timeout ${operation} after ${timeout}ms\n` +
  `  Target: ${target}\n` +
  `  Current state: ${currentState}\n` +
  `  Waiting for: ${waitingFor}`
);
```

**Example:**
```typescript
throw new Error(
  `Timeout waiting for dependencies after 30000ms\n` +
  `  Target: P1.M1.T1.S3\n` +
  `  Current state: Blocked\n` +
  `  Waiting for: P1.M1.T1.S1, P1.M1.T1.S2`
);
```

#### Template 3: Validation Error

```typescript
throw new Error(
  `Validation failed: ${field}\n` +
  `  Expected: ${expected}\n` +
  `  Received: ${received}\n` +
  `  Location: ${location}`
);
```

**Example:**
```typescript
throw new Error(
  `Validation failed: status transition\n` +
  `  Expected: One of [Implementing, Complete, Failed]\n` +
  `  Received: InvalidStatus\n` +
  `  Location: TaskOrchestrator.#updateStatus()`
);
```

#### Template 4: Dependency Error

```typescript
console.error(`[TaskOrchestrator] Dependency error: ${subtaskId}`);
console.error(`  Missing dependencies: ${missing.join(', ')}`);
console.error(`  Circular dependencies: ${circular.join(', ')}`);
console.error(`  Blocking dependencies: ${blocking.map(b => `${b.id} (${b.status})`).join(', ')}`);
```

### 4.3 Error Code Categorization

Define error codes for consistent error handling:

```typescript
enum ErrorCode {
  // Session errors
  NO_ACTIVE_SESSION = 'NO_ACTIVE_SESSION',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Dependency errors
  DEPENDENCY_NOT_FOUND = 'DEPENDENCY_NOT_FOUND',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  DEPENDENCY_TIMEOUT = 'DEPENDENCY_TIMEOUT',

  // Validation errors
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  INVALID_ITEM_ID = 'INVALID_ITEM_ID',

  // Execution errors
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',

  // System errors
  BACKLOG_CORRUPTED = 'BACKLOG_CORRUPTED',
  PERSISTENCE_FAILED = 'PERSISTENCE_FAILED',
}

interface StructuredError {
  code: ErrorCode;
  message: string;
  itemId?: string;
  itemType?: string;
  context?: Record<string, unknown>;
  stack?: string;
}
```

### 4.4 Error Logging Examples

#### Example 1: Dependency Blocking

```typescript
// Current implementation (from task-orchestrator.ts)
for (const blocker of blockers) {
  console.log(
    `[TaskOrchestrator] Blocked on: ${blocker.id} - ${blocker.title} (status: ${blocker.status})`
  );
}

console.log(
  `[TaskOrchestrator] Subtask ${subtask.id} blocked on dependencies, skipping`
);
```

#### Example 2: Timeout Error

```typescript
// Current implementation (from task-orchestrator.ts)
throw new Error(
  `Timeout waiting for dependencies of ${subtask.id} after ${timeout}ms`
);
```

**Enhanced version:**
```typescript
console.error(`[TaskOrchestrator] Dependency timeout: ${subtask.id}`);
console.error(`  Timeout: ${timeout}ms`);
console.error(`  Blocking dependencies:`);
for (const blocker of blockers) {
  console.error(`    - ${blocker.id}: ${blocker.status}`);
}
console.error(`  Polling interval: ${interval}ms`);
console.error(`  Elapsed time: ${Date.now() - startTime}ms`);

throw new Error(
  `Timeout waiting for dependencies of ${subtask.id} after ${timeout}ms`
);
```

#### Example 3: Execution Failure

```typescript
try {
  await executeSubtask(subtask);
} catch (error) {
  console.error(`[TaskOrchestrator] Execution failed: ${subtask.id}`);
  console.error(`  Type: ${subtask.type}`);
  console.error(`  Title: ${subtask.title}`);
  console.error(`  Error: ${error.message}`);
  console.error(`  Error Code: ${error.code || 'UNKNOWN'}`);
  console.error(`  Stack: ${error.stack}`);

  // Update status to failed
  await this.#updateStatus(subtask.id, 'Failed');
}
```

---

## 5. Structured Logging Best Practices

### 5.1 Structured Logging Format

#### JSON Log Format

```typescript
interface StructuredLog {
  // Standard fields
  timestamp: string;      // ISO 8601
  level: string;          // 'debug' | 'info' | 'warn' | 'error'
  message: string;        // Human-readable message
  component: string;      // Component name

  // Context fields
  sessionId?: string;     // Session identifier
  itemId?: string;        // Item identifier
  itemType?: string;      // Item type
  workflowId?: string;    // Workflow identifier

  // Event-specific fields
  event?: string;         // Event type
  previousStatus?: string;
  newStatus?: string;
  duration?: number;

  // Error fields
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  // Metadata
  metadata?: Record<string, unknown>;
}
```

#### Example JSON Log Entry

```json
{
  "timestamp": "2026-01-13T10:30:45.123Z",
  "level": "info",
  "message": "Status transition: Planned → Implementing",
  "component": "TaskOrchestrator",
  "sessionId": "session-abc123",
  "itemId": "P1.M1.T1.S3",
  "itemType": "Subtask",
  "previousStatus": "Planned",
  "newStatus": "Implementing",
  "duration": 0,
  "metadata": {
    "title": "Implement logging system",
    "dependencies": ["P1.M1.T1.S1", "P1.M1.T1.S2"]
  }
}
```

### 5.2 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| **debug** | Detailed diagnostic information | `Function execution started` |
| **info** | Normal operational events | `Status transition: Planned → Implementing` |
| **warn** | Warning conditions that don't stop execution | `Subtask has no dependencies` |
| **error** | Error events that might affect execution | `Failed to execute subtask` |

### 5.3 Correlation IDs

Include correlation IDs to track related events:

```typescript
interface LogContext {
  correlationId: string;   // Unique request/event ID
  sessionId: string;       // Session identifier
  workflowId: string;      // Workflow identifier
  itemId?: string;         // Specific item identifier
}

// Generate correlation ID
function generateCorrelationId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Usage
const correlationId = generateCorrelationId();
console.log(`[TaskOrchestrator] Processing item (correlation: ${correlationId})`);
```

### 5.4 Context Enrichment

Always enrich logs with relevant context:

```typescript
interface LogContext {
  // System context
  hostname: string;
  pid: number;
  environment: string;    // 'development' | 'production'

  // Application context
  component: string;
  version: string;

  // Request context
  sessionId?: string;
  workflowId?: string;
  correlationId?: string;

  // Item context
  itemId?: string;
  itemType?: string;
}

function enrichLog(context: Partial<LogContext>): void {
  const defaultContext: LogContext = {
    hostname: require('os').hostname(),
    pid: process.pid,
    environment: process.env.NODE_ENV || 'development',
    component: 'TaskOrchestrator',
    version: '1.0.0',
  };

  return { ...defaultContext, ...context };
}
```

---

## 6. Observability in Orchestration Systems

### 6.1 Key Metrics to Track

#### Execution Metrics

```typescript
interface ExecutionMetrics {
  // Throughput
  tasksCompleted: number;
  tasksFailed: number;
  tasksPerMinute: number;

  // Latency
  averageTaskDuration: number;
  p95TaskDuration: number;
  p99TaskDuration: number;

  // Queue depth
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;

  // Success rate
  successRate: number;     // percentage
  failureRate: number;     // percentage
}
```

#### Dependency Metrics

```typescript
interface DependencyMetrics {
  totalDependencies: number;
  satisfiedDependencies: number;
  blockingDependencies: number;
  circularDependencies: number;
  averageWaitTime: number;
  maxWaitTime: number;
}
```

### 6.2 Distributed Tracing

Implement distributed tracing for workflow execution:

```typescript
interface TraceContext {
  traceId: string;         // Root trace ID
  spanId: string;          // Current span ID
  parentSpanId?: string;   // Parent span ID
}

function createTraceContext(): TraceContext {
  return {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
  };
}

function logWithTrace(context: TraceContext, message: string): void {
  console.log(`[trace=${context.traceId},span=${context.spanId}] ${message}`);
}
```

### 6.3 Event Logging for State Transitions

Log all state transitions as events:

```typescript
interface StateTransitionEvent {
  eventType: 'STATE_TRANSITION';
  timestamp: string;
  itemId: string;
  itemType: string;
  previousState: string;
  newState: string;
  trigger: string;         // What caused the transition
  context?: Record<string, unknown>;
}

function logStateTransition(event: StateTransitionEvent): void {
  console.log(JSON.stringify({
    ...event,
    component: 'TaskOrchestrator',
  }));
}
```

### 6.4 Progress Tracking

Track overall pipeline progress:

```typescript
interface ProgressMetrics {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  blockedItems: number;
  inProgressItems: number;
  percentageComplete: number;
  estimatedTimeRemaining?: number;
}

function logProgress(metrics: ProgressMetrics): void {
  console.log(`[TaskOrchestrator] Pipeline progress: ${metrics.percentageComplete}%`);
  console.log(`  Completed: ${metrics.completedItems}/${metrics.totalItems}`);
  console.log(`  In Progress: ${metrics.inProgressItems}`);
  console.log(`  Blocked: ${metrics.blockedItems}`);
  console.log(`  Failed: ${metrics.failedItems}`);

  if (metrics.estimatedTimeRemaining) {
    console.log(`  ETA: ${formatDuration(metrics.estimatedTimeRemaining)}`);
  }
}
```

---

## 7. Node.js Logging Libraries

### 7.1 Popular Logging Libraries

| Library | Features | Performance | Use Case |
|---------|----------|-------------|----------|
| **Winston** | Versatile, multiple transports | Medium | General purpose, production apps |
| **Pino** | High-performance, low-overhead | Very Fast | High-throughput applications |
| **Bunyan** | JSON structured logging | Fast | Node.js services |
| **console.log** | Built-in, no dependencies | N/A | Development, debugging |

### 7.2 Winston Example

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    component: 'TaskOrchestrator',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('Status transition', {
  itemId: 'P1.M1.T1.S3',
  itemType: 'Subtask',
  previousStatus: 'Planned',
  newStatus: 'Implementing',
});

logger.error('Execution failed', {
  itemId: 'P1.M1.T1.S3',
  error: error.message,
  stack: error.stack,
});
```

### 7.3 Pino Example

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    component: 'TaskOrchestrator',
    environment: process.env.NODE_ENV,
  },
});

// Usage
logger.info({
  itemId: 'P1.M1.T1.S3',
  itemType: 'Subtask',
  previousStatus: 'Planned',
  newStatus: 'Implementing',
}, 'Status transition');

logger.error({
  itemId: 'P1.M1.T1.S3',
  err: error,
}, 'Execution failed');
```

### 7.4 Console Logging with Structure

For development, use structured console logging:

```typescript
class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      component: this.component,
      message,
      ...metadata,
    }));
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      component: this.component,
      message,
      error: error?.message,
      stack: error?.stack,
      ...metadata,
    }));
  }
}

// Usage
const logger = new Logger('TaskOrchestrator');

logger.info('Status transition', {
  itemId: 'P1.M1.T1.S3',
  previousStatus: 'Planned',
  newStatus: 'Implementing',
});

logger.error('Execution failed', error, {
  itemId: 'P1.M1.T1.S3',
});
```

---

## 8. Implementation Examples

### 8.1 Enhanced TaskOrchestrator Logging

**File:** `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

```typescript
export class TaskOrchestrator {
  private readonly logger: Logger;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.logger = new Logger('TaskOrchestrator');

    // ... existing constructor code

    this.logger.info('TaskOrchestrator initialized', {
      sessionId: sessionManager.currentSession?.id,
    });
  }

  async executePhase(phase: Phase): Promise<void> {
    const startTime = Date.now();

    this.logger.info('Executing Phase', {
      itemId: phase.id,
      itemType: 'Phase',
      title: phase.title,
    });

    await this.#updateStatus(phase.id, 'Implementing');

    const duration = Date.now() - startTime;

    this.logger.info('Phase execution started', {
      itemId: phase.id,
      itemType: 'Phase',
      newStatus: 'Implementing',
      duration,
    });
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    const startTime = Date.now();

    this.logger.info('Executing Subtask', {
      itemId: subtask.id,
      itemType: 'Subtask',
      title: subtask.title,
      dependencies: subtask.dependencies,
    });

    // Check dependencies
    if (!this.canExecute(subtask)) {
      const blockers = this.getBlockingDependencies(subtask);

      this.logger.warn('Subtask blocked on dependencies', {
        itemId: subtask.id,
        itemType: 'Subtask',
        blockers: blockers.map(b => ({
          id: b.id,
          status: b.status,
        })),
      });

      return;
    }

    try {
      await this.#updateStatus(subtask.id, 'Implementing');

      // Execute subtask logic
      // ...

      await this.#updateStatus(subtask.id, 'Complete');

      const duration = Date.now() - startTime;

      this.logger.info('Subtask completed', {
        itemId: subtask.id,
        itemType: 'Subtask',
        newStatus: 'Complete',
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Subtask execution failed', error as Error, {
        itemId: subtask.id,
        itemType: 'Subtask',
        duration,
      });

      await this.#updateStatus(subtask.id, 'Failed');
      throw error;
    }
  }
}
```

### 8.2 Dependency Resolution Logging

```typescript
async waitForDependencies(
  subtask: Subtask,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;
  const startTime = Date.now();

  this.logger.info('Waiting for dependencies', {
    itemId: subtask.id,
    itemType: 'Subtask',
    dependencies: subtask.dependencies,
    timeout,
    interval,
  });

  while (Date.now() - startTime < timeout) {
    await this.#refreshBacklog();

    if (this.canExecute(subtask)) {
      const duration = Date.now() - startTime;

      this.logger.info('Dependencies satisfied', {
        itemId: subtask.id,
        itemType: 'Subtask',
        duration,
      });

      return;
    }

    // Log waiting status
    const blockers = this.getBlockingDependencies(subtask);

    this.logger.debug('Still waiting for dependencies', {
      itemId: subtask.id,
      blockers: blockers.map(b => ({
        id: b.id,
        status: b.status,
      })),
      elapsed: Date.now() - startTime,
    });

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  const elapsed = Date.now() - startTime;

  this.logger.error('Dependency wait timeout', undefined, {
    itemId: subtask.id,
    itemType: 'Subtask',
    timeout,
    elapsed,
    blockers: this.getBlockingDependencies(subtask).map(b => b.id),
  });

  throw new Error(
    `Timeout waiting for dependencies of ${subtask.id} after ${timeout}ms`
  );
}
```

---

## 9. Best Practices Checklist

### 9.1 Status Transition Logging

- [ ] Always log before and after status transitions
- [ ] Include item ID, type, and title in logs
- [ ] Log both previous and new status
- [ ] Include timestamp (ISO 8601 format)
- [ ] Add execution duration for completion logs
- [ ] Log dependency IDs when checking/waiting
- [ ] Include blocking dependencies when blocked
- [ ] Use consistent bracketed format: `[Component] message`
- [ ] Use multi-line indented format for complex information

### 9.2 Error Logging

- [ ] Use `console.error()` for error messages
- [ ] Include error message and stack trace
- [ ] Add error code for categorization
- [ ] Include relevant context (item ID, type, state)
- [ ] Provide actionable error messages
- [ ] Log what, why, context, and how to fix
- [ ] Never expose sensitive information in errors
- [ ] Use structured error objects when possible

### 9.3 General Logging

- [ ] Use appropriate log levels (debug, info, warn, error)
- [ ] Include component name in bracketed format
- [ ] Add correlation IDs for request tracking
- [ ] Use structured logging (JSON format preferred)
- [ ] Enrich logs with context (session, workflow, item IDs)
- [ ] Avoid logging sensitive data (passwords, tokens, PII)
- [ ] Use async logging in production to avoid blocking
- [ ] Configure log levels per environment

### 9.4 Observability

- [ ] Track key metrics (throughput, latency, success rate)
- [ ] Implement distributed tracing for workflows
- [ ] Log all state transitions as events
- [ ] Track progress and estimated completion time
- [ ] Monitor dependency resolution patterns
- [ ] Alert on error thresholds and anomalies
- [ ] Use log aggregation and analysis tools
- [ ] Implement structured logging for querying

---

## 10. Additional Resources

### 10.1 Documentation URLs

| Resource | URL | Purpose |
|----------|-----|---------|
| **Winston Documentation** | https://github.com/winstonjs/winston | Popular Node.js logging library |
| **Pino Documentation** | https://getpino.io/ | High-performance Node.js logger |
| **Bunyan Documentation** | https://github.com/trentm/node-bunyan | JSON structured logging |
| **Node.js Console API** | https://nodejs.org/api/console.html | Built-in logging methods |
| **OpenTelemetry** | https://opentelemetry.io/ | Observability framework |
| **Twelve-Factor App Logging** | https://12factor.net/logs | Logging best practices |

### 10.2 Related Research Documents

| Document | Path |
|----------|------|
| **ESLint Research** | `/plan/001_14b9dc2a33c7/P1M1T3S1/research/eslint-research.md` |
| **MCP Patterns Research** | `/plan/001_14b9dc2a33c7/P2M1T2S3/research/mcp-patterns-research.md` |
| **TypeScript Best Practices** | `/plan/001_14b9dc2a33c7/docs/typescript_project_structure_best_practices.md` |

### 10.3 Code Examples

| Example | Path |
|---------|------|
| **TaskOrchestrator** | `/src/core/task-orchestrator.ts` |
| **SessionManager** | `/src/core/session-manager.ts` |
| **Task Models** | `/src/core/models.ts` |
| **Task Utils** | `/src/utils/task-utils.ts` |

---

**End of Research Document**

**Last Updated:** 2026-01-13
**Researcher:** Claude Code Agent
**For:** P3M2T1S3 - Logging and Observability Implementation
