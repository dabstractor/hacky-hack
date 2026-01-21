# TypeScript Enum and Union Type Validation Patterns

Research compiled for: P1M2T3S1 - Task Status Validation Module

## Table of Contents

1. [Runtime Enum Validation](#1-runtime-enum-validation)
2. [Zod for Enum Validation](#2-zod-for-enum-validation)
3. [Testing Enum Completeness and Exhaustiveness](#3-testing-enum-completeness-and-exhaustiveness)
4. [Pattern Matching with Discriminated Unions](#4-pattern-matching-with-discriminated-unions)
5. [Type-Safe State Transition Validation](#5-type-safe-state-transition-validation)
6. [Additional Resources](#6-additional-resources)

---

## 1. Runtime Enum Validation

### Understanding the TypeScript Enum Challenge

TypeScript enums exist at compile-time but require runtime validation for external data (API responses, user input, database records).

### Basic Runtime Validation Patterns

#### Pattern 1: Object.values() Check

```typescript
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

function isValidTaskStatus(value: string): value is TaskStatus {
  return Object.values(TaskStatus).includes(value as TaskStatus);
}

// Usage
function processTaskStatus(input: unknown): TaskStatus | null {
  if (typeof input === 'string' && isValidTaskStatus(input)) {
    return input;
  }
  return null;
}
```

#### Pattern 2: Set-Based Lookup (More Performant)

```typescript
// Create a Set once at module level for O(1) lookup
const TASK_STATUS_VALUES = new Set<string>(Object.values(TaskStatus));

function isValidTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUS_VALUES.has(value);
}
```

#### Pattern 3: Reverse Mapping for Numeric Enums

```typescript
enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

function isValidPriority(value: number): value is Priority {
  return Object.values(Priority).includes(value);
}

// Alternative: check if value exists as key
function isValidPriorityAlt(value: number): value is Priority {
  return Priority[value] !== undefined;
}
```

### Type Guards and Predicates

```typescript
// Custom type guard
function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && value in TaskStatus;
}

// Assertive version (throws on invalid)
function assertTaskStatus(value: unknown): asserts value is TaskStatus {
  if (!isTaskStatus(value)) {
    throw new Error(`Invalid TaskStatus: ${value}`);
  }
}

// Usage in validation
function validateAndParseStatus(input: unknown): TaskStatus {
  assertTaskStatus(input);
  return input; // Type is now narrowed
}
```

### Generic Enum Validator

```typescript
function createEnumValidator<T extends string | number>(
  enumObject: Record<string, T>
): (value: unknown) => value is T {
  const validValues = new Set(Object.values(enumObject));

  return (value: unknown): value is T => {
    return (
      typeof value === typeof enumObject[Object.keys(enumObject)[0]] &&
      validValues.has(value as T)
    );
  };
}

// Usage
const isValidTaskStatus = createEnumValidator(TaskStatus);
const isValidPriority = createEnumValidator(Priority);
```

---

## 2. Zod for Enum Validation

### Why Zod?

Zod provides:

- Runtime validation with TypeScript inference
- Excellent error messages
- Composable schemas
- Transformation capabilities
- Wide ecosystem adoption

### Basic Zod Enum Validation

#### Pattern 1: Using nativeEnum()

```typescript
import { z } from 'zod';

// Validates against TypeScript enum
const TaskStatusSchema = z.nativeEnum(TaskStatus);

type TaskStatusType = z.infer<typeof TaskStatusSchema>; // TaskStatus

// Parse and validate
function parseTaskStatus(input: unknown): TaskStatus {
  return TaskStatusSchema.parse(input);
}

// Safe parse (returns result object)
function safeParseTaskStatus(input: unknown) {
  return TaskStatusSchema.safeParse(input);
}

// Usage
const result1 = parseTaskStatus('pending'); // TaskStatus.PENDING
const result2 = safeParseTaskStatus('invalid'); // { success: false, error: ZodError }
```

#### Pattern 2: Using z.enum() for String Literals

```typescript
// Define values directly
const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'blocked',
  'completed',
  'failed',
]);

type TaskStatus = z.infer<typeof TaskStatusSchema>;
// type TaskStatus = "pending" | "in_progress" | "blocked" | "completed" | "failed"

// With custom error messages
const TaskStatusSchemaWithMessage = z.enum(
  ['pending', 'in_progress', 'blocked', 'completed', 'failed'],
  {
    errorMap: () => ({ message: 'Invalid task status value' }),
  }
);
```

#### Pattern 3: Discriminated Union Validation

```typescript
// Define state with discriminator
const TaskStateSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('pending'),
    createdAt: z.coerce.date(),
  }),
  z.object({
    status: z.literal('in_progress'),
    startedAt: z.coerce.date(),
    assignee: z.string(),
  }),
  z.object({
    status: z.literal('blocked'),
    blockedAt: z.coerce.date(),
    blockedReason: z.string(),
  }),
  z.object({
    status: z.literal('completed'),
    completedAt: z.coerce.date(),
    result: z.string(),
  }),
  z.object({
    status: z.literal('failed'),
    failedAt: z.coerce.date(),
    error: z.string(),
  }),
]);

type TaskState = z.infer<typeof TaskStateSchema>;
```

#### Pattern 4: Transforming and Refining

```typescript
// Transform string to enum with custom validation
const TaskStatusSchema = z.string().transform((val, ctx) => {
  const normalized = val.toLowerCase().replace(/-/g, '_');
  const validValues = Object.values(TaskStatus);

  if (!validValues.includes(normalized as TaskStatus)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid status: ${val}. Valid values: ${validValues.join(', ')}`,
    });
    return z.NEVER;
  }

  return normalized as TaskStatus;
});

// Refine additional constraints
const StatusWithMetadataSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  // Only allow transition if status is not already completed
  updatedAt: z.coerce
    .date()
    .refine(date => date <= new Date(), {
      message: 'Updated date cannot be in the future',
    }),
});
```

#### Pattern 5: Schema Composition

```typescript
// Base schema
const BaseTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
});

// Status-specific schemas
const PendingTaskSchema = BaseTaskSchema.extend({
  status: z.literal(TaskStatus.PENDING),
  scheduledDate: z.coerce.date().optional(),
});

const InProgressTaskSchema = BaseTaskSchema.extend({
  status: z.literal(TaskStatus.IN_PROGRESS),
  startedAt: z.coerce.date(),
  progress: z.number().min(0).max(100),
});

// Union schema
const TaskSchema = z.discriminatedUnion('status', [
  PendingTaskSchema,
  InProgressTaskSchema,
  // ... other status schemas
]);
```

### Testing Zod Schemas

```typescript
import { test, expect } from 'vitest';
import { z } from 'zod';

test('TaskStatusSchema accepts valid enum values', () => {
  expect(() => TaskStatusSchema.parse('pending')).not.toThrow();
  expect(() => TaskStatusSchema.parse('completed')).not.toThrow();
});

test('TaskStatusSchema rejects invalid values', () => {
  const result = TaskStatusSchema.safeParse('invalid_status');
  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.error.issues).toHaveLength(1);
    expect(result.error.issues[0].code).toBe('invalid_enum_value');
  }
});

test('TaskStateSchema requires correct fields per status', () => {
  // Valid: pending with createdAt
  expect(() =>
    TaskStateSchema.parse({
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  ).not.toThrow();

  // Invalid: missing createdAt
  expect(() =>
    TaskStateSchema.parse({
      status: 'pending',
    })
  ).toThrow();

  // Invalid: wrong field for status
  expect(() =>
    TaskStateSchema.parse({
      status: 'pending',
      assignee: 'john', // assignee is for in_progress
    })
  ).toThrow();
});
```

---

## 3. Testing Enum Completeness and Exhaustiveness

### TypeScript Exhaustiveness Checking

#### Pattern 1: Switch Statement with Never

```typescript
function getTaskStatusDescription(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.PENDING:
      return 'Task is waiting to start';
    case TaskStatus.IN_PROGRESS:
      return 'Task is currently being worked on';
    case TaskStatus.BLOCKED:
      return 'Task is blocked and cannot proceed';
    case TaskStatus.COMPLETED:
      return 'Task has been completed successfully';
    case TaskStatus.FAILED:
      return 'Task has failed';
    default:
      // If a new enum value is added, TypeScript will error:
      // "Type 'string' is not assignable to type 'never'"
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
}
```

#### Pattern 2: Helper Function for Exhaustiveness

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function handleTaskStatus(status: TaskStatus): void {
  switch (status) {
    case TaskStatus.PENDING:
      console.log('Initializing task');
      break;
    case TaskStatus.IN_PROGRESS:
      console.log('Task in progress');
      break;
    case TaskStatus.BLOCKED:
      console.log('Task blocked');
      break;
    case TaskStatus.COMPLETED:
      console.log('Task complete');
      break;
    case TaskStatus.FAILED:
      console.log('Task failed');
      break;
    default:
      return assertNever(status);
  }
}
```

#### Pattern 3: Object Mapping with Exhaustiveness

```typescript
const STATUS_CONFIGS = {
  [TaskStatus.PENDING]: { color: 'gray', icon: 'clock' },
  [TaskStatus.IN_PROGRESS]: { color: 'blue', icon: 'spinner' },
  [TaskStatus.BLOCKED]: { color: 'red', icon: 'ban' },
  [TaskStatus.COMPLETED]: { color: 'green', icon: 'check' },
  [TaskStatus.FAILED]: { color: 'darkred', icon: 'x' },
} as const satisfies Record<TaskStatus, { color: string; icon: string }>;

// Using satisfies ensures all enum values are covered
```

### Testing Enum Coverage

#### Test All Enum Values

```typescript
import { test, describe } from 'vitest';

describe('TaskStatus exhaustiveness', () => {
  // Get all enum values
  const allStatuses = Object.values(TaskStatus) as TaskStatus[];

  test.each(allStatuses)('getTaskStatusDescription handles %s', status => {
    expect(() => getTaskStatusDescription(status)).not.toThrow();
    const description = getTaskStatusDescription(status);
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });
});
```

#### Property-Based Testing with fast-check

```typescript
import fc from 'fast-check';
import { test, expect } from 'vitest';

test('all TaskStatus values have valid descriptions', () => {
  fc.assert(
    fc.constantFrom(...Object.values(TaskStatus)).map(status => {
      const description = getTaskStatusDescription(status);
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
      return true;
    })
  );
});
```

#### Testing State Machine Coverage

```typescript
test('all valid state transitions are defined', () => {
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
    [TaskStatus.IN_PROGRESS]: [
      TaskStatus.BLOCKED,
      TaskStatus.COMPLETED,
      TaskStatus.FAILED,
    ],
    [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.FAILED],
    [TaskStatus.COMPLETED]: [], // Terminal state
    [TaskStatus.FAILED]: [], // Terminal state
  };

  // Ensure all statuses are covered
  for (const status of Object.values(TaskStatus)) {
    expect(validTransitions).toHaveProperty(status);
    expect(Array.isArray(validTransitions[status])).toBe(true);
  }
});
```

### Compile-Time Enum Completeness

#### Using ts-pattern for Exhaustive Matching

```typescript
import { match } from 'ts-pattern';

function handleStatus(status: TaskStatus): string {
  return match(status)
    .with(TaskStatus.PENDING, () => 'Waiting')
    .with(TaskStatus.IN_PROGRESS, () => 'Working')
    .with(TaskStatus.BLOCKED, () => 'Blocked')
    .with(TaskStatus.COMPLETED, () => 'Done')
    .with(TaskStatus.FAILED, () => 'Failed')
    .exhaustive(); // Compile error if any case is missing
}
```

#### Type-Level Enum Keys

```typescript
type TaskStatusKeys = keyof typeof TaskStatus;
// "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "FAILED"

type TaskStatusValues = (typeof TaskStatus)[keyof typeof TaskStatus];
// "pending" | "in_progress" | "blocked" | "completed" | "failed"

// Helper to ensure coverage
type AllStatusesCovered<T extends Record<TaskStatus, unknown>> = T;
```

---

## 4. Pattern Matching with Discriminated Unions

### Understanding Discriminated Unions

A discriminated union uses a common property (the discriminator) to distinguish between different object shapes.

### Basic Discriminated Union Pattern

```typescript
// Define the union
type TaskEvent =
  | { type: 'created'; taskId: string; createdAt: Date }
  | { type: 'assigned'; taskId: string; assignee: string }
  | { type: 'started'; taskId: string; startedAt: Date }
  | { type: 'blocked'; taskId: string; reason: string; blockedAt: Date }
  | { type: 'completed'; taskId: string; completedAt: Date; result?: string }
  | { type: 'failed'; taskId: string; error: string; failedAt: Date };

// Pattern matching with switch
function handleTaskEvent(event: TaskEvent): string {
  switch (event.type) {
    case 'created':
      return `Task ${event.taskId} created at ${event.createdAt}`;
    case 'assigned':
      return `Task ${event.taskId} assigned to ${event.assignee}`;
    case 'started':
      return `Task ${event.taskId} started at ${event.startedAt}`;
    case 'blocked':
      return `Task ${event.taskId} blocked: ${event.reason}`;
    case 'completed':
      return (
        `Task ${event.taskId} completed` +
        (event.result ? ` with result: ${event.result}` : '')
      );
    case 'failed':
      return `Task ${event.taskId} failed: ${event.error}`;
    default:
      const _exhaustive: never = event;
      throw new Error(`Unknown event type: ${_exhaustive}`);
  }
}
```

### State with Discriminated Unions

```typescript
type TaskState =
  | { status: 'pending'; queuedAt: Date; scheduledFor?: Date }
  | {
      status: 'in_progress';
      startedAt: Date;
      assignee: string;
      progress: number;
    }
  | { status: 'blocked'; blockedAt: Date; reason: string; canUnblock: boolean }
  | { status: 'completed'; completedAt: Date; result?: string }
  | { status: 'failed'; failedAt: Date; error: string; retryable: boolean };

// Type-safe state transitions
function transitionTask(state: TaskState, event: TaskEvent): TaskState | Error {
  // Discriminated union narrowing based on current state
  if (state.status === 'pending') {
    switch (event.type) {
      case 'started':
        return {
          status: 'in_progress',
          startedAt: event.startedAt,
          assignee: '', // Would come from event
          progress: 0,
        };
      case 'blocked':
        return {
          status: 'blocked',
          blockedAt: event.blockedAt,
          reason: event.reason,
          canUnblock: true,
        };
      default:
        return new Error(`Invalid transition from pending to ${event.type}`);
    }
  }

  if (state.status === 'in_progress') {
    switch (event.type) {
      case 'completed':
        return {
          status: 'completed',
          completedAt: event.completedAt,
          result: event.result,
        };
      case 'failed':
        return {
          status: 'failed',
          failedAt: event.failedAt,
          error: event.error,
          retryable: true,
        };
      case 'blocked':
        return {
          status: 'blocked',
          blockedAt: event.blockedAt,
          reason: event.reason,
          canUnblock: true,
        };
      default:
        return new Error(
          `Invalid transition from in_progress to ${event.type}`
        );
    }
  }

  // ... other state handling

  return new Error('Cannot transition from terminal state');
}
```

### Using ts-pattern Library

```typescript
import { match, P } from 'ts-pattern';

function handleTaskState(state: TaskState): string {
  return match(state)
    .with(
      { status: 'pending' },
      s =>
        `Pending since ${s.queuedAt}` +
        (s.scheduledFor ? `, scheduled for ${s.scheduledFor}` : '')
    )
    .with(
      { status: 'in_progress' },
      s => `In progress for ${s.assignee}: ${s.progress}%`
    )
    .with(
      { status: 'blocked' },
      s => `Blocked: ${s.reason}${s.canUnblock ? ' (can unblock)' : ''}`
    )
    .with({ status: 'completed' }, s => `Completed at ${s.completedAt}`)
    .with(
      { status: 'failed' },
      s => `Failed: ${s.error}${s.retryable ? ' (retryable)' : ''}`
    )
    .exhaustive();
}

// Advanced pattern matching
function canRetry(state: TaskState): boolean {
  return match(state)
    .with({ status: 'failed', retryable: true }, () => true)
    .with({ status: P.union('blocked', 'pending') }, () => true)
    .otherwise(() => false);
}
```

### Testing Discriminated Unions

```typescript
import { test, expect } from 'vitest';
import { z } from 'zod';

// Zod schema for discriminated union
const TaskStateSchema: z.ZodType<TaskState> = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('pending'),
    queuedAt: z.coerce.date(),
    scheduledFor: z.coerce.date().optional(),
  }),
  z.object({
    status: z.literal('in_progress'),
    startedAt: z.coerce.date(),
    assignee: z.string(),
    progress: z.number().min(0).max(100),
  }),
  z.object({
    status: z.literal('blocked'),
    blockedAt: z.coerce.date(),
    reason: z.string(),
    canUnblock: z.boolean(),
  }),
  z.object({
    status: z.literal('completed'),
    completedAt: z.coerce.date(),
    result: z.string().optional(),
  }),
  z.object({
    status: z.literal('failed'),
    failedAt: z.coerce.date(),
    error: z.string(),
    retryable: z.boolean(),
  }),
]);

test('TaskStateSchema validates all states', () => {
  // Valid pending state
  expect(() =>
    TaskStateSchema.parse({
      status: 'pending',
      queuedAt: new Date().toISOString(),
    })
  ).not.toThrow();

  // Invalid: wrong field for status
  expect(() =>
    TaskStateSchema.parse({
      status: 'pending',
      progress: 50, // progress belongs to in_progress
    })
  ).toThrow();
});

test('state transitions are validated', () => {
  const pendingState: TaskState = {
    status: 'pending',
    queuedAt: new Date(),
  };

  const result = transitionTask(pendingState, {
    type: 'started',
    taskId: '123',
    startedAt: new Date(),
  });

  expect(result).not.toBeInstanceOf(Error);
  if (!(result instanceof Error)) {
    expect(result.status).toBe('in_progress');
  }
});
```

---

## 5. Type-Safe State Transition Validation

### State Machine Pattern

```typescript
// Define valid transitions
type StateTransitions = {
  [K in TaskStatus]: TaskStatus[];
};

const VALID_TRANSITIONS: StateTransitions = {
  [TaskStatus.PENDING]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.BLOCKED,
    TaskStatus.FAILED,
  ],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.BLOCKED,
    TaskStatus.COMPLETED,
    TaskStatus.FAILED,
  ],
  [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.FAILED],
  [TaskStatus.COMPLETED]: [], // Terminal state
  [TaskStatus.FAILED]: [
    TaskStatus.PENDING, // Can retry
  ],
};

// Type-safe transition validator
function isValidTransition(from: TaskStatus, to: TaskStatus): to is TaskStatus {
  return VALID_TRANSITIONS[from].includes(to);
}

// Transition function with validation
function transitionStatus(
  current: TaskStatus,
  next: TaskStatus
): TaskStatus | Error {
  if (!isValidTransition(current, next)) {
    return new Error(
      `Invalid transition from ${current} to ${next}. ` +
        `Valid transitions: ${VALID_TRANSITIONS[current].join(', ')}`
    );
  }
  return next;
}
```

### State Machine with Context

```typescript
interface TaskContext {
  assignee?: string;
  blockedReason?: string;
  result?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface StateMachineConfig {
  initial: TaskStatus;
  states: {
    [K in TaskStatus]: {
      on?: {
        [event: string]: TaskStatus;
      };
      enter?: (context: TaskContext) => TaskContext;
      exit?: (context: TaskContext) => TaskContext;
    };
  };
}

const taskStateMachine: StateMachineConfig = {
  initial: TaskStatus.PENDING,
  states: {
    [TaskStatus.PENDING]: {
      on: {
        START: TaskStatus.IN_PROGRESS,
        BLOCK: TaskStatus.BLOCKED,
        FAIL: TaskStatus.FAILED,
      },
      enter: ctx => ({ ...ctx }),
    },
    [TaskStatus.IN_PROGRESS]: {
      on: {
        COMPLETE: TaskStatus.COMPLETED,
        BLOCK: TaskStatus.BLOCKED,
        FAIL: TaskStatus.FAILED,
      },
      enter: ctx => ({
        ...ctx,
        startedAt: ctx.startedAt ?? new Date(),
      }),
    },
    [TaskStatus.BLOCKED]: {
      on: {
        UNBLOCK: TaskStatus.IN_PROGRESS,
        FAIL: TaskStatus.FAILED,
      },
      enter: ctx => ({
        ...ctx,
        blockedReason: ctx.blockedReason ?? 'Unknown',
      }),
    },
    [TaskStatus.COMPLETED]: {
      enter: ctx => ({
        ...ctx,
        completedAt: ctx.completedAt ?? new Date(),
      }),
    },
    [TaskStatus.FAILED]: {
      on: {
        RETRY: TaskStatus.PENDING,
      },
      enter: ctx => ({
        ...ctx,
        error: ctx.error ?? 'Unknown error',
      }),
    },
  },
};

function sendEvent(
  currentStatus: TaskStatus,
  event: string,
  context: TaskContext
): { status: TaskStatus; context: TaskContext } | Error {
  const stateConfig = taskStateMachine.states[currentStatus];

  if (!stateConfig.on || !(event in stateConfig.on)) {
    return new Error(
      `Event "${event}" not valid for status "${currentStatus}"`
    );
  }

  const nextStatus = stateConfig.on[event];

  // Exit current state
  const afterExit = stateConfig.exit?.(context) ?? context;

  // Enter next state
  const afterEnter =
    taskStateMachine.states[nextStatus].enter?.(afterExit) ?? afterExit;

  return {
    status: nextStatus,
    context: afterEnter,
  };
}
```

### XState Pattern for Complex State Machines

```typescript
import { setup, assign, fromPromise } from 'xstate';

// Type-safe state machine with XState v5
const taskMachine = setup({
  types: {
    context: {} as {
      taskId: string;
      assignee?: string;
      error?: string;
      retryCount: number;
    },
    events: {} as
      | { type: 'start'; assignee: string }
      | { type: 'block'; reason: string }
      | { type: 'unblock' }
      | { type: 'complete'; result?: string }
      | { type: 'fail'; error: string }
      | { type: 'retry' },
  },
  actors: {
    notifyAssignee: fromPromise(
      async ({ input }: { input: { assignee: string } }) => {
        // Send notification
      }
    ),
  },
}).createMachine({
  id: 'task',
  initial: 'pending',
  context: {
    taskId: '',
    retryCount: 0,
  },
  states: {
    pending: {
      on: {
        start: {
          target: 'inProgress',
          actions: assign({
            assignee: ({ event }) => event.assignee,
          }),
        },
        block: {
          target: 'blocked',
          actions: assign({
            error: ({ event }) => event.reason,
          }),
        },
      },
    },
    inProgress: {
      entry: ({ context }) => {
        console.log(`Task started for ${context.assignee}`);
      },
      on: {
        complete: 'completed',
        block: 'blocked',
        fail: 'failed',
      },
    },
    blocked: {
      on: {
        unblock: 'inProgress',
        fail: 'failed',
      },
    },
    completed: {
      type: 'final', // Terminal state
    },
    failed: {
      on: {
        retry: {
          target: 'pending',
          guard: ({ context }) => context.retryCount < 3,
          actions: assign({
            retryCount: ({ context }) => context.retryCount + 1,
          }),
        },
      },
    },
  },
});
```

### Testing State Transitions

```typescript
import { test, expect, describe } from 'vitest';

describe('Task status transitions', () => {
  const allStatuses = Object.values(TaskStatus) as TaskStatus[];

  test.each(allStatuses)('status %s has defined transitions', status => {
    expect(VALID_TRANSITIONS).toHaveProperty(status);
    expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
  });

  test('valid transitions succeed', () => {
    expect(isValidTransition(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)).toBe(
      true
    );
    expect(
      isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED)
    ).toBe(true);
  });

  test('invalid transitions fail', () => {
    expect(isValidTransition(TaskStatus.COMPLETED, TaskStatus.PENDING)).toBe(
      false
    );
    expect(isValidTransition(TaskStatus.FAILED, TaskStatus.IN_PROGRESS)).toBe(
      false
    );
  });

  test('transition function validates moves', () => {
    const validResult = transitionStatus(
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS
    );
    expect(validResult).not.toBeInstanceOf(Error);
    if (!(validResult instanceof Error)) {
      expect(validResult).toBe(TaskStatus.IN_PROGRESS);
    }

    const invalidResult = transitionStatus(
      TaskStatus.COMPLETED,
      TaskStatus.PENDING
    );
    expect(invalidResult).toBeInstanceOf(Error);
  });
});

describe('State machine with events', () => {
  test('START event transitions from pending to inProgress', () => {
    const result = sendEvent(TaskStatus.PENDING, 'START', {});

    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    }
  });

  test('invalid event returns error', () => {
    const result = sendEvent(TaskStatus.COMPLETED, 'START', {});

    expect(result).toBeInstanceOf(Error);
  });
});
```

### Runtime State Validation with Zod

```typescript
import { z } from 'zod';

// Validate state transitions at runtime
const TransitionEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('start'),
    assignee: z.string().min(1),
  }),
  z.object({
    type: z.literal('block'),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal('unblock'),
  }),
  z.object({
    type: z.literal('complete'),
    result: z.string().optional(),
  }),
  z.object({
    type: z.literal('fail'),
    error: z.string().min(1),
  }),
  z.object({
    type: z.literal('retry'),
  }),
]);

function validateAndTransition(
  currentStatus: TaskStatus,
  event: unknown,
  context: TaskContext
): { status: TaskStatus; context: TaskContext } | Error {
  // Validate event shape
  const eventResult = TransitionEventSchema.safeParse(event);
  if (!eventResult.success) {
    return new Error(`Invalid event: ${eventResult.error.message}`);
  }

  return sendEvent(currentStatus, eventResult.data.type, context);
}
```

---

## 6. Additional Resources

### Official TypeScript Documentation

- [TypeScript Handbook - Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Release Notes - 5.0 (Enum improvements)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)

### Zod Documentation

- [Zod Documentation](https://zod.dev/)
- [Zod - Union and Discriminated Unions](https://zod.dev/?id=unions)
- [Zod - Native Enums](https://zod.dev/?id=native-enums)
- [Zod - Error Handling](https://zod.dev/?id=error-handling)
- [Zod - Refinement](https://zod.dev/?id=refine)

### State Machine Libraries

- [XState Documentation](https://stately.ai/docs)
- [XState - Type Safety](https://stately.ai/docs/guides/typescript)
- [ts-pattern Library](https://github.com/gvergnaud/ts-pattern)
- [State Machine Cat](https://state-machine-cat.js.org/) - Visual state machine modeling

### Blog Posts and Articles

- [Pattern Matching in TypeScript](https://www.effect.website/docs/guides/pattern-matching)
- [Exhaustiveness Checking in TypeScript](https://effect.website/guides/pattern-matching/exhaustiveness-checking)
- [Type-Safe State Machines](https://kettanaito.com/blog/zero-runtime-type-safety-for-your-state-machine)
- [Discriminated Unions in TypeScript](https://mariusschulz.com/blog/discriminated-unions-in-typescript)
- [Making TypeScript Feel Like Haskell](https://thoughtspile.github.io/2022/01/05/typescript-pattern-matching)

### Testing Resources

- [Vitest - Testing](https://vitest.dev/)
- [fast-check - Property-Based Testing](https://fast-check.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Testing Guide](https://zod.dev/?id=testing)

### Code Examples

- [typescript-state-machine](https://github.com/brunobdias/typescript-state-machine)
- [xstate catalog](https://github.com/statelyai/xstate-catalog)
- [ts-pattern examples](https://github.com/gvergnaud/ts-pattern/tree/main/examples)

---

## Summary of Key Patterns

### For Runtime Validation

1. Use `Object.values()` with `includes()` for simple enum checking
2. Use Set-based lookups for O(1) performance on frequently validated enums
3. Create custom type guards with `value is EnumType` predicates
4. Use Zod's `nativeEnum()` for comprehensive validation with good error messages

### For Exhaustiveness

1. Use `switch` statements with `never` default case to catch missing enum values
2. Create an `assertNever()` helper function for runtime assertion
3. Use `satisfies` keyword to ensure object mappings cover all enum values
4. Consider `ts-pattern` library for more ergonomic pattern matching

### For State Machines

1. Define valid transitions in a type-safe mapping
2. Use discriminated unions to represent states with state-specific data
3. Validate transitions both at compile-time (types) and runtime (guards)
4. Consider XState for complex state machines with side effects

### For Testing

1. Use `test.each()` to test all enum values
2. Use property-based testing (fast-check) for comprehensive coverage
3. Test both valid and invalid transitions
4. Use Zod schemas to validate runtime data in tests
