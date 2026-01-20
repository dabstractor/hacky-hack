# Atomic State Persistence Patterns - Research Findings

## Overview
Atomic state persistence is critical for orchestrator reliability and consistency. This document covers patterns, techniques, and best practices for ensuring atomic state updates in distributed task orchestration systems.

## Core Concepts

### 1. ACID Properties in Orchestrators

```typescript
interface AtomicStateOperation {
  // Atomicity: All or nothing
  // Consistency: Valid state transitions
  // Isolation: No interference
  // Durability: Survives failures
  execute(): Promise<void>;
  rollback(): Promise<void>;
  commit(): Promise<void>;
}
```

### 2. Transactional Patterns

#### Pattern 1: Database Transactions

**Description**: Use database transactions for atomic state updates.

```typescript
class TransactionalStateManager {
  constructor(private db: Database) {}

  async updateTaskState(
    taskId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Verify current state
      const current = await trx('tasks')
        .where('id', taskId)
        .first();

      if (!current) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (current.status !== oldStatus) {
        throw new ConcurrentModificationError(
          `Task ${taskId} status changed from ${oldStatus} to ${current.status}`
        );
      }

      // Update task state
      await trx('tasks')
        .where('id', taskId)
        .update({
          status: newStatus,
          updated_at: new Date(),
          version: current.version + 1
        });

      // Record state transition
      await trx('state_transitions').insert({
        task_id: taskId,
        from_status: oldStatus,
        to_status: newStatus,
        timestamp: new Date(),
        metadata: JSON.stringify(metadata)
      });

      // Update dependent tasks if needed
      await this.updateDependents(trx, taskId, newStatus);

      // All changes will commit atomically
    });
  }

  private async updateDependents(
    trx: Transaction,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<void> {
    // Get tasks that depend on this task
    const dependents = await trx('task_dependencies')
      .where('dependency_id', taskId)
      .pluck('task_id');

    // Update their status based on this task's completion
    for (const dependentId of dependents) {
      const newDependentStatus = this.calculateDependentStatus(dependentId, newStatus);

      if (newDependentStatus) {
        await trx('tasks')
          .where('id', dependentId)
          .update({
            status: newDependentStatus,
            updated_at: new Date()
          });
      }
    }
  }

  private calculateDependentStatus(
    dependentId: string,
    dependencyStatus: TaskStatus
  ): TaskStatus | null {
    // Determine new status based on dependency status
    if (dependencyStatus === TaskStatus.FAILED) {
      return TaskStatus.BLOCKED;
    }
    // Add more logic as needed
    return null;
  }
}
```

**Advantages:**
- True atomicity
- Rollback on failure
- Data consistency guaranteed

**Disadvantages:**
- Database lock contention
- Limited scalability
- Complex distributed transactions

**Use Cases:**
- Single-database scenarios
- When ACID is required
- Moderate scale systems

#### Pattern 2: Optimistic Concurrency Control

**Description**: Use versioning to detect and handle concurrent modifications.

```typescript
interface VersionedState {
  id: string;
  status: TaskStatus;
  version: number;
}

class OptimisticStateManager {
  async updateWithRetry(
    stateId: string,
    updateFn: (state: VersionedState) => Partial<VersionedState>,
    maxRetries: number = 3
  ): Promise<void> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.attemptUpdate(stateId, updateFn);
        return; // Success
      } catch (error) {
        if (error instanceof ConcurrentModificationError) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Max retries (${maxRetries}) exceeded for ${stateId}`);
          }
          // Retry with exponential backoff
          await this.sleep(Math.pow(2, attempt) * 100);
        } else {
          throw error; // Re-throw non-concurrency errors
        }
      }
    }
  }

  private async attemptUpdate(
    stateId: string,
    updateFn: (state: VersionedState) => Partial<VersionedState>
  ): Promise<void> {
    // Read current state
    const current = await this.readState(stateId);

    // Calculate new state
    const updates = updateFn(current);

    // Try to update with version check
    const result = await this.db.query(
      `UPDATE states
       SET status = $1, version = version + 1, updated_at = $2
       WHERE id = $3 AND version = $4`,
      [updates.status, new Date(), stateId, current.version]
    );

    if (result.rowCount === 0) {
      throw new ConcurrentModificationError(
        `State ${stateId} was modified by another process`
      );
    }
  }

  private async readState(stateId: string): Promise<VersionedState> {
    const result = await this.db.query(
      'SELECT * FROM states WHERE id = $1',
      [stateId]
    );

    if (result.rows.length === 0) {
      throw new Error(`State ${stateId} not found`);
    }

    return result.rows[0];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ConcurrentModificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrentModificationError';
  }
}
```

**Advantages:**
- No locking overhead
- High concurrency
- Works well for low-contention scenarios

**Disadvantages:**
- Retry overhead on contention
- Not suitable for high-contention scenarios
- Complex error handling

**Use Cases:**
- Low-contention scenarios
- When read performance is critical
- Distributed systems

#### Pattern 3: Pessimistic Concurrency Control

**Description**: Use explicit locks to prevent concurrent modifications.

```typescript
class PessimisticStateManager {
  private locks = new Map<string, Lock>();

  async updateWithLock(
    stateId: string,
    updateFn: (state: VersionedState) => Promise<Partial<VersionedState>>
  ): Promise<void> {
    const lock = await this.acquireLock(stateId);

    try {
      const current = await this.readState(stateId);
      const updates = await updateFn(current);

      await this.writeState(stateId, updates);
    } finally {
      await this.releaseLock(lock);
    }
  }

  private async acquireLock(stateId: string): Promise<Lock> {
    // Try to acquire lock, wait if necessary
    while (this.locks.has(stateId)) {
      await this.sleep(50);
    }

    const lock = { id: stateId, acquiredAt: new Date() };
    this.locks.set(stateId, lock);
    return lock;
  }

  private async releaseLock(lock: Lock): Promise<void> {
    this.locks.delete(lock.id);
  }

  private async readState(stateId: string): Promise<VersionedState> {
    // Implementation
    return {} as VersionedState;
  }

  private async writeState(
    stateId: string,
    updates: Partial<VersionedState>
  ): Promise<void> {
    // Implementation
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface Lock {
  id: string;
  acquiredAt: Date;
}
```

**Advantages:**
- Prevents conflicts
- Simple error handling
- Predictable behavior

**Disadvantages:**
- Lock overhead
- Potential deadlocks
- Reduced concurrency

**Use Cases:**
- High-contention scenarios
- When conflicts are expensive
- Simple update patterns

### 3. Distributed Transaction Patterns

#### Pattern 1: Two-Phase Commit (2PC)

```typescript
class TwoPhaseCommitCoordinator {
  private participants: TransactionParticipant[] = [];

  async executeTransaction(
    operations: TransactionOperation[]
  ): Promise<void> {
    // Phase 1: Prepare
    const prepareResults = await Promise.allSettled(
      this.participants.map(p => p.prepare(operations))
    );

    // Check if all participants prepared successfully
    const allPrepared = prepareResults.every(
      r => r.status === 'fulfilled'
    );

    if (!allPrepared) {
      // Phase 2: Rollback
      await Promise.allSettled(
        this.participants.map(p => p.rollback())
      );
      throw new Error('Transaction failed during prepare phase');
    }

    // Phase 2: Commit
    const commitResults = await Promise.allSettled(
      this.participants.map(p => p.commit())
    );

    const allCommitted = commitResults.every(
      r => r.status === 'fulfilled'
    );

    if (!allCommitted) {
      throw new Error('Transaction failed during commit phase');
    }
  }
}

interface TransactionParticipant {
  prepare(operations: TransactionOperation[]): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

**Advantages:**
- Atomicity across databases
- Strong consistency
- Standard protocol

**Disadvantages:**
- Blocking coordinator
- Single point of failure
- Performance overhead

**Use Cases:**
- Multi-database transactions
- When strong consistency is required
- Legacy system integration

#### Pattern 2: Saga Pattern

```Description**: Break transaction into sequence of local transactions with compensating actions.

```typescript
interface SagaStep {
  action: () => Promise<void>;
  compensate: () => Promise<void>;
}

class SagaOrchestrator {
  async execute(sagaSteps: SagaStep[]): Promise<void> {
    const completedSteps: SagaStep[] = [];

    try {
      // Execute all steps
      for (const step of sagaSteps) {
        await step.action();
        completedSteps.push(step);
      }
    } catch (error) {
      // Compensate completed steps in reverse order
      console.error('Saga failed, compensating...');

      for (const step of completedSteps.reverse()) {
        try {
          await step.compensate();
        } catch (compensationError) {
          console.error('Compensation failed:', compensationError);
          // Continue compensating other steps
        }
      }

      throw error; // Re-throw original error
    }
  }
}

// Example usage
const updateTaskSaga: SagaStep[] = [
  {
    action: async () => {
      await taskDb.updateStatus(taskId, TaskStatus.IN_PROGRESS);
    },
    compensate: async () => {
      await taskDb.updateStatus(taskId, TaskStatus.PLANNED);
    }
  },
  {
    action: async () => {
      await notificationService.sendNotification(taskId, 'started');
    },
    compensate: async () => {
      await notificationService.sendNotification(taskId, 'cancelled');
    }
  },
  {
    action: async () => {
      await metricsService.recordTaskStart(taskId);
    },
    compensate: async () => {
      await metricsService.recordTaskCancellation(taskId);
    }
  }
];

await sagaOrchestrator.execute(updateTaskSaga);
```

**Advantages:**
- No distributed locks
- Better performance
- Fault tolerance

**Disadvantages:**
- Temporary inconsistency
- Complex compensation logic
- Not truly atomic

**Use Cases:**
- Long-running transactions
- Microservices architectures
- When availability is more important than immediate consistency

#### Pattern 3: Event Sourcing with Snapshots

```typescript
interface StateEvent {
  eventType: string;
  aggregateId: string;
  version: number;
  timestamp: Date;
  data: unknown;
}

class EventSourcedStateManager {
  async updateState(
    aggregateId: string,
    expectedVersion: number,
    events: StateEvent[]
  ): Promise<void> {
    // Append events atomically
    await this.db.transaction(async (trx) => {
      // Verify version
      const current = await trx('aggregates')
        .where('id', aggregateId)
        .first();

      if (current.version !== expectedVersion) {
        throw new ConcurrentModificationError(
          `Expected version ${expectedVersion}, got ${current.version}`
        );
      }

      // Append events
      for (const event of events) {
        await trx('events').insert({
          event_type: event.eventType,
          aggregate_id: event.aggregateId,
          version: event.version,
          timestamp: event.timestamp,
          data: JSON.stringify(event.data)
        });
      }

      // Update aggregate version
      await trx('aggregates')
        .where('id', aggregateId)
        .update({
          version: expectedVersion + events.length,
          updated_at: new Date()
        });
    });
  }

  async getState(aggregateId: string): Promise<any> {
    // Check for snapshot
    const snapshot = await this.getLatestSnapshot(aggregateId);

    if (snapshot) {
      // Replay events from snapshot
      const events = await this.getEventsSince(aggregateId, snapshot.version);
      return this.replayState(snapshot.state, events);
    } else {
      // Replay all events
      const events = await this.getAllEvents(aggregateId);
      return this.replayState(null, events);
    }
  }

  private async getLatestSnapshot(aggregateId: string): Promise<{ state: any; version: number } | null> {
    const result = await this.db.query(
      'SELECT * FROM snapshots WHERE aggregate_id = $1 ORDER BY version DESC LIMIT 1',
      [aggregateId]
    );

    return result.rows[0] || null;
  }

  private async getEventsSince(
    aggregateId: string,
    version: number
  ): Promise<StateEvent[]> {
    const result = await this.db.query(
      `SELECT * FROM events
       WHERE aggregate_id = $1 AND version > $2
       ORDER BY version ASC`,
      [aggregateId, version]
    );

    return result.rows.map(row => ({
      eventType: row.event_type,
      aggregateId: row.aggregate_id,
      version: row.version,
      timestamp: row.timestamp,
      data: JSON.parse(row.data)
    }));
  }

  private replayState(initialState: any, events: StateEvent[]): any {
    let state = initialState;

    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(state: any, event: StateEvent): any {
    // Apply event to state
    return state;
  }

  private async getAllEvents(aggregateId: string): Promise<StateEvent[]> {
    // Implementation
    return [];
  }
}
```

**Advantages:**
- Complete audit trail
- Temporal queries
- Event replay
- Strong consistency

**Disadvantages:**
- Event schema evolution
- Replay overhead
- Snapshot management
- Complex implementation

**Use Cases:**
- Audit requirements
- Temporal queries
- Event replay
- Complex state transitions

### 4. Atomic Update Patterns

#### Pattern 1: Compare-and-Set (CAS)

```typescript
class CompareAndSetManager {
  async compareAndSet(
    stateId: string,
    expectedStatus: TaskStatus,
    newStatus: TaskStatus
  ): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE states
       SET status = $1, updated_at = $2
       WHERE id = $3 AND status = $4`,
      [newStatus, new Date(), stateId, expectedStatus]
    );

    return result.rowCount > 0;
  }
}
```

#### Pattern 2: Atomic Operations with Redis

```typescript
class RedisAtomicManager {
  private client: RedisClient;

  async updateTaskStatus(
    taskId: string,
    expectedStatus: TaskStatus,
    newStatus: TaskStatus
  ): Promise<boolean> {
    const key = `task:${taskId}:status`;

    // Lua script for atomic compare-and-set
    const script = `
      local current = redis.call('GET', KEYS[1])
      if current == ARGV[1] then
        redis.call('SET', KEYS[1], ARGV[2])
        return 1
      else
        return 0
      end
    `;

    const result = await this.client.eval(script, 1, key, expectedStatus, newStatus);
    return result === 1;
  }

  async atomicIncrement(taskId: string, field: string): Promise<number> {
    const key = `task:${taskId}:${field}`;

    return await this.client.incr(key);
  }

  async atomicAddToSet(
    setKey: string,
    ...members: string[]
  ): Promise<number> {
    return await this.client.sadd(setKey, ...members);
  }
}
```

### 5. Batch Update Patterns

```typescript
class BatchAtomicUpdater {
  private pendingUpdates: Map<string, StateUpdate> = new Map();
  private batchTimeout: number = 100; // ms
  private batchSize: number = 100;

  async scheduleUpdate(update: StateUpdate): Promise<void> {
    this.pendingUpdates.set(update.stateId, update);

    if (this.pendingUpdates.size >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();

    await this.db.transaction(async (trx) => {
      for (const update of updates) {
        await trx('states')
          .where('id', update.stateId)
          .where('version', update.expectedVersion)
          .update({
            status: update.newStatus,
            version: update.expectedVersion + 1,
            updated_at: new Date()
          });
      }
    });
  }
}

interface StateUpdate {
  stateId: string;
  expectedVersion: number;
  newStatus: TaskStatus;
}
```

## Key Resources

### Documentation
- **PostgreSQL Transactions**: https://www.postgresql.org/docs/current/tutorial-transactions.html
- **MySQL Transactions**: https://dev.mysql.com/doc/refman/8.0/en/commit.html
- **Redis Transactions**: https://redis.io/docs/manual/transactions/

### Academic Papers
- "The Saga Pattern" (Garcia-Molina et al., 1987)
- "Event Sourcing" (Martin Fowler, 2005)
- "Optimistic Concurrency Control" (Kung and Robinson, 1981)

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Database Systems: The Complete Book" by Garcia-Molina et al.
- "Distributed Systems: Principles and Paradigms" by Tanenbaum and van Steen

### Open Source Projects
- **EventStoreDB**: https://eventstore.com/ - Event sourcing database
- **Axon Framework**: https://axoniq.io/ - DDD and event sourcing framework
- **Temporal**: https://temporal.io/ - Distributed state machine

## Best Practices

### Design Principles
1. **Atomicity first**: Always design for atomic operations
2. **Idempotency**: Make operations idempotent for safe retry
3. **Compensation**: Provide compensation for failed operations
4. **Observability**: Log all state changes
5. **Simplicity**: Prefer simple solutions over complex ones

### Implementation Guidelines
1. **Use transactions**: When available, use database transactions
2. **Version everything**: Use optimistic concurrency control
3. **Batch operations**: Batch updates for performance
4. **Handle conflicts**: Have clear conflict resolution strategy
5. **Test thoroughly**: Test concurrent access scenarios
6. **Monitor**: Track conflicts, retries, and failures

### Performance Considerations
1. **Minimize lock time**: Hold locks for minimum time
2. **Batch writes**: Batch multiple updates together
3. **Use indexes**: Proper indexes for concurrent access
4. **Connection pooling**: Reuse database connections
5. **Async operations**: Use async for I/O operations

## Common Pitfalls

1. **Lost updates**: Concurrent updates overwriting each other
2. **Dirty reads**: Reading uncommitted data
3. **Phantom reads**: Rows appearing/disappearing during transaction
4. **Deadlocks**: Circular wait conditions
5. **Long transactions**: Holding locks too long
6. **No compensation**: No way to rollback failed operations
7. **Ignoring errors**: Not handling failures properly
8. **Missing version checks**: Not detecting concurrent modifications
