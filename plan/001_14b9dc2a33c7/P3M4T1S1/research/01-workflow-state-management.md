# Workflow State Management - Research & Best Practices

## Overview

Research findings on workflow state management patterns for TypeScript orchestration systems, focusing on progress tracking, phase management, and completion status monitoring.

---

## Key Resources & Documentation

### Primary Libraries

- **Temporal.io** - https://docs.temporal.io/learn/workflows
  - Durable workflow execution with automatic state persistence
  - Workflow replay and deterministic execution requirements
  - Activity execution with retry policies

- **BullMQ** - https://docs.bullmq.io/
  - Redis-based job queue for Node.js
  - Job state management: waiting, active, completed, failed, delayed
  - Job dependencies and workflow orchestration

- **Bull** - https://github.com/OptimalBits/bull
  - predecessor to BullMQ, still widely used
  - Rich job state tracking and event system

- **Agenda** - https://github.com/agenda/agenda
  - MongoDB-based job scheduling
  - Job definitions with repeat patterns and concurrency control

- **Node-cron** - https://github.com/kelektiv/node-cron
  - Cron-based task scheduling for Node.js
  - Simple time-based execution, minimal state management

### State Management Patterns

- **XState** - https://stately.ai/docs/xstate
  - State machines and statecharts for TypeScript
  - Hierarchical states, parallel states, and history
  - Actor model for distributed state

- **RxJS** - https://rxjs.dev/
  - Reactive programming with observables
  - Operator-based state transformations
  - Event streams and state management

---

## Best Practices for State Management

### 1. Explicit State Enums

Use string literal unions or enums for type-safe state representation:

```typescript
// GOOD: String literal union (recommended for TypeScript)
type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// GOOD: Enum for backward compatibility
enum WorkflowState {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
```

**Why this works:**

- Type-safe state transitions
- Exhaustive switch statements
- Clear semantic meaning
- Easy to serialize

### 2. State Transition Validation

Enforce valid state transitions to prevent invalid state changes:

```typescript
// Pattern: State transition matrix
const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending: ['running', 'cancelled'],
  running: ['paused', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: [], // Terminal state
  failed: ['pending'], // Can retry
  cancelled: [], // Terminal state
};

class Workflow {
  private status: WorkflowStatus = 'pending';

  transitionTo(newStatus: WorkflowStatus): void {
    const allowed = VALID_TRANSITIONS[this.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: ${this.status} → ${newStatus}`);
    }
    this.status = newStatus;
  }
}
```

**Benefits:**

- Prevents invalid state jumps (e.g., pending → completed)
- Self-documenting state machine
- Easy to audit state transitions
- Catches bugs at runtime

### 3. Immutable State Updates

Use immutable patterns for state changes to enable replay and debugging:

```typescript
interface WorkflowState {
  readonly id: string;
  readonly status: WorkflowStatus;
  readonly currentPhase: number;
  readonly phases: ReadonlyArray<Phase>;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly error?: Error;
}

// Pattern: State update with spread operator
function updateState(
  current: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  return {
    ...current,
    ...updates,
  };
}

// Usage
const nextState = updateState(currentState, {
  status: 'running',
  startedAt: new Date(),
});
```

**Advantages:**

- Easy time-travel debugging
- Safe state snapshots
- No mutation side effects
- Enables undo/redo functionality

### 4. Persistent State Storage

Persist state changes immediately to survive crashes:

```typescript
// Pattern: Persistent state manager
class PersistentWorkflowManager {
  private state: WorkflowState;

  constructor(
    private storage: StateStorage,
    initialState: WorkflowState
  ) {
    this.state = initialState;
  }

  async transition(newStatus: WorkflowStatus): Promise<void> {
    // Update in-memory state
    const oldStatus = this.state.status;
    this.state = updateState(this.state, { status: newStatus });

    // Persist to disk immediately
    await this.storage.save(this.state);

    // Log transition
    console.log(`[${this.state.id}] ${oldStatus} → ${newStatus}`);
  }

  async reload(): Promise<void> {
    this.state = await this.storage.load(this.state.id);
  }
}
```

**Key Principles:**

- Write-ahead logging
- Atomic state updates
- Crash recovery
- Audit trail

### 5. Hierarchical State Tracking

Track state at multiple hierarchy levels:

```typescript
// Pattern: Hierarchical state (from your TaskOrchestrator)
interface Backlog {
  phases: Phase[];
}

interface Phase {
  id: string;
  title: string;
  status: 'Planned' | 'Implementing' | 'Complete' | 'Failed';
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  status: 'Planned' | 'Implementing' | 'Complete' | 'Failed';
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: 'Planned' | 'Implementing' | 'Complete' | 'Failed';
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  status: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed';
  dependencies: string[];
}

// Parent status aggregation
function getPhaseStatus(phase: Phase): Phase['status'] {
  const allComplete = phase.milestones.every(m => m.status === 'Complete');
  const anyFailed = phase.milestones.some(m => m.status === 'Failed');
  const anyImplementing = phase.milestones.some(
    m => m.status === 'Implementing'
  );

  if (anyFailed) return 'Failed';
  if (allComplete) return 'Complete';
  if (anyImplementing) return 'Implementing';
  return 'Planned';
}
```

**Benefits:**

- Natural hierarchy mapping
- Parent status derived from children
- Parallel processing of siblings
- Clear progress visualization

---

## Common Pitfalls to Avoid

### 1. Mutable State in Async Workflows

```typescript
// BAD: Shared mutable state across async operations
class BadWorkflow {
  private status = 'pending';

  async execute() {
    this.status = 'running';
    await this.step1();
    await this.step2();
    // Race condition: status might be changed elsewhere
    if (this.status === 'running') {
      this.status = 'complete';
    }
  }
}

// GOOD: Local state or immutable
class GoodWorkflow {
  private state: WorkflowState = { status: 'pending' };

  async execute() {
    this.state = updateState(this.state, { status: 'running' });
    await this.step1();
    await this.step2();
    // Safe: state is immutable, no race condition
    this.state = updateState(this.state, { status: 'complete' });
  }
}
```

### 2. Missing Terminal States

```typescript
// BAD: No clear completion
enum State {
  STARTED,
  PROCESSING,
  // Missing: COMPLETED, FAILED
}

// GOOD: Explicit terminal states
type WorkflowState =
  | { type: 'started' }
  | { type: 'processing' }
  | { type: 'completed'; result: unknown }
  | { type: 'failed'; error: Error };
```

### 3. State Without Timestamps

```typescript
// BAD: No timing information
interface WorkflowState {
  status: string;
}

// GOOD: Track all state changes
interface WorkflowState {
  status: WorkflowStatus;
  statusHistory: Array<{
    status: WorkflowStatus;
    timestamp: Date;
    reason?: string;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;
}
```

### 4. Silent State Transitions

```typescript
// BAD: State changes without logging
class SilentWorkflow {
  setStatus(status: string) {
    this.status = status;
  }
}

// GOOD: All transitions logged
class VerboseWorkflow {
  setStatus(status: string, reason?: string) {
    const oldStatus = this.status;
    this.status = status;
    console.log(
      `[${this.id}] ${oldStatus} → ${status}${reason ? ` (${reason})` : ''}`
    );
  }
}
```

### 5. No Recovery Mechanism

```typescript
// BAD: Single source of truth, no backup
class InMemoryWorkflow {
  private state: WorkflowState;
  // If process crashes, state is lost
}

// GOOD: Persistent storage with reload
class PersistentWorkflow {
  private state: WorkflowState;

  constructor(private storage: StateStorage) {
    this.state = storage.load() || initialState;
  }

  async save() {
    await this.storage.save(this.state);
  }

  async reload() {
    this.state = await this.storage.load();
  }
}
```

---

## Implementation Examples from Your Codebase

### TaskOrchestrator State Management

Located at: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`

**Key Patterns:**

1. **Status transitions with logging** (lines 163-192)
   - Captures oldStatus for logging
   - Includes timestamp and reason
   - Persists via SessionManager
   - Reloads backlog after update

2. **Immutable state access** (lines 129-145)
   - Read-only getters for backlog
   - Shallow copy for execution queue
   - Prevents external mutation

3. **Scope-based execution** (lines 359-393)
   - Dynamic reconfiguration
   - Queue rebuilding on scope change
   - Current item completion before scope change

### PRPExecutor State Management

Located at: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`

**Key Patterns:**

1. **Validation gate results** (lines 35-74)
   - Structured result objects
   - Success tracking per gate
   - Comprehensive error context

2. **Fix-and-retry state** (lines 262-290)
   - Loop with attempt counter
   - Exponential backoff
   - Detailed logging

3. **Error types** (lines 82-134)
   - Custom error classes
   - Context preservation
   - Clear error semantics

---

## Recommended Next Steps

1. **Add State Transition Validation**
   - Implement VALID_TRANSITIONS matrix
   - Add transition validation in setStatus()
   - Unit test all valid/invalid transitions

2. **Add State History Tracking**
   - Store array of past states
   - Include timestamps and reasons
   - Enable replay debugging

3. **Add State Snapshotting**
   - Capture full state at key points
   - Enable rollback to snapshots
   - Support time-travel debugging

4. **Add Progress Metrics**
   - Track items completed vs total
   - Calculate percentage complete
   - Estimate time remaining

5. **Add State Visualization**
   - Generate state diagram
   - Show current phase in hierarchy
   - Highlight blocked items

---

## Additional Resources

- [Finite State Machines in TypeScript](https://kentcdodds.com/blog/finite-state-machines-with-react-fsm)
- [State Machines vs Statecharts](https://statecharts.github.io/)
- [Temporal Workflow Best Practices](https://docs.temporal.io/best-practices/workflows)
- [BullMQ Job State Management](https://docs.bullmq.io/guide/jobs/job-state)
- [XState State Machines](https://stately.ai/docs/xstate)
