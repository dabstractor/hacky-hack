# Testing Patterns for Orchestrator Components - Research Findings

## Overview
Testing orchestrator components requires specialized patterns due to their asynchronous, stateful, and often distributed nature. This document covers comprehensive testing strategies and patterns for task orchestration systems.

## Testing Pyramid for Orchestrators

```
         /\
        /  \        E2E Tests (Few)
       /----\
      /      \      Integration Tests (Some)
     /--------\
    /          \    Unit Tests (Many)
   /______________\
```

## 1. Unit Testing Patterns

### Pattern 1: Isolated Component Testing

Test individual components in isolation with mocked dependencies.

```typescript
describe('TaskExecutor', () => {
  let executor: TaskExecutor;
  let mockDependencyChecker: jest.Mocked<DependencyChecker>;
  let mockStateManager: jest.Mocked<StateManager>;

  beforeEach(() => {
    mockDependencyChecker = createMockDependencyChecker();
    mockStateManager = createMockStateManager();

    executor = new TaskExecutor(
      mockDependencyChecker,
      mockStateManager
    );
  });

  describe('executeTask', () => {
    it('should execute task when dependencies are satisfied', async () => {
      // Arrange
      const task = createTestTask({ id: 'T1' });
      mockDependencyChecker.areDependenciesSatisfied.mockResolvedValue(true);

      // Act
      const result = await executor.executeTask(task);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDependencyChecker.areDependenciesSatisfied)
        .toHaveBeenCalledWith('T1');
    });

    it('should not execute task when dependencies are not satisfied', async () => {
      // Arrange
      const task = createTestTask({ id: 'T1' });
      mockDependencyChecker.areDependenciesSatisfied.mockResolvedValue(false);

      // Act
      const result = await executor.executeTask(task);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('dependencies not satisfied');
    });
  });
});
```

### Pattern 2: State Machine Testing

Comprehensive testing of state transitions.

```typescript
describe('TaskStateMachine', () => {
  describe('state transitions', () => {
    const validTransitions: Array<[TaskStatus, TaskStatus]> = [
      [TaskStatus.PLANNED, TaskStatus.QUEUED],
      [TaskStatus.PLANNED, TaskStatus.CANCELLED],
      [TaskStatus.QUEUED, TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETE],
      [TaskStatus.IN_PROGRESS, TaskStatus.FAILED],
      [TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS]
    ];

    test.each(validTransitions)(
      'should allow transition from %s to %s',
      async (from, to) => {
        const machine = new TaskStateMachine(from);
        const context = createMockContext();

        const result = await machine.transition(to, context);

        expect(result.success).toBe(true);
        expect(machine.getCurrentStatus()).toBe(to);
      }
    );
  });

  describe('invalid transitions', () => {
    const invalidTransitions: Array<[TaskStatus, TaskStatus]> = [
      [TaskStatus.COMPLETE, TaskStatus.IN_PROGRESS],
      [TaskStatus.FAILED, TaskStatus.COMPLETE],
      [TaskStatus.PLANNED, TaskStatus.COMPLETE]
    ];

    test.each(invalidTransitions)(
      'should not allow transition from %s to %s',
      async (from, to) => {
        const machine = new TaskStateMachine(from);
        const context = createMockContext();

        const result = await machine.transition(to, context);

        expect(result.success).toBe(false);
        expect(machine.getCurrentStatus()).toBe(from);
      }
    );
  });

  describe('guard conditions', () => {
    it('should enforce guard conditions', async () => {
      const machine = new TaskStateMachine(TaskStatus.PLANNED);
      const context = createMockContext();

      // Mock guard to fail
      mockGuardSatisfied.mockResolvedValue(false);

      const result = await machine.transition(
        TaskStatus.IN_PROGRESS,
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Guard condition failed');
    });
  });
});
```

### Pattern 3: Dependency Resolution Testing

Test topological sorting and cycle detection.

```typescript
describe('DependencyResolver', () => {
  describe('topological sorting', () => {
    it('should sort tasks in dependency order', () => {
      const tasks = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['A', 'B'] },
        { id: 'D', dependencies: ['C'] }
      ];

      const resolver = new DependencyResolver();
      const sorted = resolver.topologicalSort(tasks);

      expect(sorted).toEqual(['A', 'B', 'C', 'D']);
      expect(isValidTopologicalOrder(sorted, tasks)).toBe(true);
    });

    it('should detect cycles', () => {
      const tasks = [
        { id: 'A', dependencies: ['B'] },
        { id: 'B', dependencies: ['C'] },
        { id: 'C', dependencies: ['A'] } // Cycle!
      ];

      const resolver = new DependencyResolver();

      expect(() => resolver.topologicalSort(tasks)).toThrow(
        /cycle detected/i
      );
    });
  });

  describe('complex dependency graphs', () => {
    it('should handle diamond dependencies', () => {
      //   A
      //  / \
      // B   C
      //  \ /
      //   D
      const tasks = [
        { id: 'A', dependencies: [] },
        { id: 'B', dependencies: ['A'] },
        { id: 'C', dependencies: ['A'] },
        { id: 'D', dependencies: ['B', 'C'] }
      ];

      const resolver = new DependencyResolver();
      const sorted = resolver.topologicalSort(tasks);

      expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
      expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('C'));
      expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('D'));
      expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('D'));
    });
  });
});
```

## 2. Integration Testing Patterns

### Pattern 1: End-to-End Workflow Testing

Test complete workflows with real dependencies.

```typescript
describe('Orchestrator E2E Tests', () => {
  let orchestrator: TaskOrchestrator;
  let testDatabase: TestDatabase;
  let messageBus: TestMessageBus;

  beforeAll(async () => {
    // Setup real dependencies
    testDatabase = await createTestDatabase();
    messageBus = new TestMessageBus();

    orchestrator = new TaskOrchestrator({
      database: testDatabase,
      messageBus: messageBus,
      executor: new RealTaskExecutor()
    });

    await orchestrator.initialize();
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await messageBus.cleanup();
    await orchestrator.shutdown();
  });

  it('should execute complete workflow', async () => {
    // Arrange
    const workflow = createTestWorkflow({
      phases: [
        {
          milestones: [
            {
              tasks: [
                { id: 'T1', dependencies: [] },
                { id: 'T2', dependencies: ['T1'] },
                { id: 'T3', dependencies: ['T1'] }
              ]
            }
          ]
        }
      ]
    });

    // Act
    const result = await orchestrator.execute(workflow);

    // Assert
    expect(result.status).toBe(WorkflowStatus.COMPPLETED);
    expect(await getTaskStatus('T1')).toBe(TaskStatus.COMPLETE);
    expect(await getTaskStatus('T2')).toBe(TaskStatus.COMPLETE);
    expect(await getTaskStatus('T3')).toBe(TaskStatus.COMPLETE);
  });

  it('should handle task failures gracefully', async () => {
    // Arrange
    const workflow = createTestWorkflow({
      tasks: [
        { id: 'T1', dependencies: [] },
        { id: 'T2', dependencies: ['T1'], shouldFail: true },
        { id: 'T3', dependencies: ['T2'] }
      ]
    });

    // Act
    const result = await orchestrator.execute(workflow);

    // Assert
    expect(result.status).toBe(WorkflowStatus.FAILED);
    expect(await getTaskStatus('T1')).toBe(TaskStatus.COMPLETE);
    expect(await getTaskStatus('T2')).toBe(TaskStatus.FAILED);
    expect(await getTaskStatus('T3')).toBe(TaskStatus.BLOCKED);
  });
});
```

### Pattern 2: Database Integration Testing

Test with real database using test fixtures.

```typescript
describe('SessionManager Database Integration', () => {
  let db: TestDatabase;
  let sessionManager: SessionManager;

  beforeAll(async () => {
    db = await createTestDatabase();
    sessionManager = new SessionManager(db.connectionString);
    await sessionManager.initialize();
  });

  afterAll(async () => {
    await sessionManager.cleanup();
    await db.cleanup();
  });

  beforeEach(async () => {
    await db.reset();
  });

  describe('session persistence', () => {
    it('should persist session state', async () => {
      // Arrange
      const session = createTestSession({
        id: 'S1',
        status: SessionStatus.IN_PROGRESS
      });

      // Act
      await sessionManager.saveSession(session);
      const loaded = await sessionManager.loadSession('S1');

      // Assert
      expect(loaded).toEqual(session);
      expect(loaded.status).toBe(SessionStatus.IN_PROGRESS);
    });

    it('should handle concurrent updates', async () => {
      // Arrange
      const session = createTestSession({ id: 'S1' });
      await sessionManager.saveSession(session);

      // Act - concurrent updates
      const [result1, result2] = await Promise.allSettled([
        sessionManager.updateStatus('S1', SessionStatus.COMPLETE),
        sessionManager.updateStatus('S1', SessionStatus.FAILED)
      ]);

      // Assert - one should succeed, one should fail
      const successful = result1.status === 'fulfilled' ? result1 : result2;
      const failed = result1.status === 'rejected' ? result1 : result2;

      expect(successful.status).toBe('fulfilled');
      expect(failed.status).toBe('rejected');
    });
  });
});
```

### Pattern 3: Message Bus Integration Testing

Test event-driven orchestrator components.

```typescript
describe('Event-Driven Orchestrator', () => {
  let messageBus: MessageBus;
  let orchestrator: Orchestrator;
  let receivedEvents: Array<TaskEvent> = [];

  beforeAll(async () => {
    messageBus = new TestMessageBus();
    orchestrator = new EventDrivenOrchestrator(messageBus);

    // Subscribe to all events
    await messageBus.subscribe('*', (event) => {
      receivedEvents.push(event);
    });

    await orchestrator.start();
  });

  afterAll(async () => {
    await orchestrator.stop();
    await messageBus.disconnect();
  });

  beforeEach(() => {
    receivedEvents = [];
  });

  it('should publish task status change events', async () => {
    // Act
    await orchestrator.updateTaskStatus('T1', TaskStatus.IN_PROGRESS);

    // Assert
    const statusEvents = receivedEvents.filter(
      e => e.type === 'TASK_STATUS_CHANGED'
    );
    expect(statusEvents).toHaveLength(1);
    expect(statusEvents[0].data).toMatchObject({
      taskId: 'T1',
      newStatus: TaskStatus.IN_PROGRESS
    });
  });

  it('should handle event ordering', async () => {
    // Act
    await Promise.all([
      orchestrator.updateTaskStatus('T1', TaskStatus.IN_PROGRESS),
      orchestrator.updateTaskStatus('T1', TaskStatus.COMPLETE)
    ]);

    // Assert
    const t1Events = receivedEvents.filter(e => e.data.taskId === 'T1');
    expect(t1Events[0].data.newStatus).toBe(TaskStatus.IN_PROGRESS);
    expect(t1Events[1].data.newStatus).toBe(TaskStatus.COMPLETE);
  });
});
```

## 3. Performance Testing Patterns

### Pattern 1: Load Testing

Test orchestrator under high load.

```typescript
describe('Orchestrator Load Tests', () => {
  let orchestrator: TaskOrchestrator;

  beforeAll(async () => {
    orchestrator = await createOrchestrator({
      maxConcurrency: 100
    });
  });

  it('should handle 1000 concurrent tasks', async () => {
    // Arrange
    const tasks = Array.from({ length: 1000 }, (_, i) =>
      createTestTask({ id: `T${i}` })
    );

    const startTime = Date.now();

    // Act
    const results = await Promise.allSettled(
      tasks.map(task => orchestrator.execute(task))
    );

    const duration = Date.now() - startTime;

    // Assert
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBe(1000);
    expect(duration).toBeLessThan(5000); // Should complete in < 5s
  });

  it('should maintain throughput under load', async () => {
    const tasks = Array.from({ length: 10000 }, (_, i) =>
      createTestTask({ id: `T${i}` })
    );

    const throughput = await measureThroughput(
      orchestrator,
      tasks,
      { duration: 10000 }
    );

    expect(throughput.tasksPerSecond).toBeGreaterThan(100);
  });
});
```

### Pattern 2: Stress Testing

Test orchestrator behavior under extreme conditions.

```typescript
describe('Orchestrator Stress Tests', () => {
  it('should handle memory pressure', async () => {
    const orchestrator = await createOrchestrator({
      maxMemoryMB: 100
    });

    // Create large number of in-memory tasks
    const tasks = Array.from({ length: 100000 }, (_, i) =>
      createLargeTestTask({ id: `T${i}`, size: '1MB' })
    );

    const results = await Promise.allSettled(
      tasks.map(task => orchestrator.execute(task))
    );

    // Should either succeed or fail gracefully, not crash
    expect(results).toBeDefined();
  });

  it('should recover from database connection loss', async () => {
    const orchestrator = await createOrchestrator();

    // Start workflow
    const workflow = createTestWorkflow();
    const execution = orchestrator.execute(workflow);

    // Simulate database failure
    await orchestrator.simulateDatabaseFailure();

    // Wait for recovery
    await sleep(1000);

    // Restore database
    await orchestrator.restoreDatabase();

    // Should complete successfully
    await expect(execution).resolves.toBeDefined();
  });
});
```

## 4. Contract Testing Patterns

### Pattern 1: Provider-Consumer Contract Testing

Ensure orchestrator components respect their contracts.

```typescript
describe('Orchestrator Contract Tests', () => {
  describe('TaskExecutor contract', () => {
    it('should implement TaskExecutor interface', () => {
      const executor: TaskExecutor = new RealTaskExecutor();

      // Verify interface compliance
      expect(executor.execute).toBeDefined();
      expect(executor.cancel).toBeDefined();
      expect(executor.getStatus).toBeDefined();
    });

    it('should return correct result type', async () => {
      const executor = new RealTaskExecutor();
      const task = createTestTask();

      const result = await executor.execute(task);

      // Verify result structure
      expect(result).toMatchObject({
        taskId: expect.any(String),
        status: expect.any(String),
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
  });

  describe('MessageBus contract', () => {
    it('should publish events with correct schema', async () => {
      const messageBus = new TestMessageBus();
      const orchestrator = new Orchestrator(messageBus);

      await orchestrator.publishEvent({
        type: 'TASK_STARTED',
        data: { taskId: 'T1' }
      });

      const published = await messageBus.getLastPublishedEvent();

      expect(published).toMatchObject({
        id: expect.any(String),
        type: 'TASK_STARTED',
        timestamp: expect.any(Date),
        data: { taskId: 'T1' }
      });
    });
  });
});
```

## 5. Test Utilities and Helpers

### Fixture Builders

```typescript
class TestTaskBuilder {
  private task: Partial<Task> = {
    id: 'test-task',
    status: TaskStatus.PLANNED,
    dependencies: [],
    priority: 0
  };

  withId(id: string): TestTaskBuilder {
    this.task.id = id;
    return this;
  }

  withStatus(status: TaskStatus): TestTaskBuilder {
    this.task.status = status;
    return this;
  }

  withDependencies(deps: string[]): TestTaskBuilder {
    this.task.dependencies = deps;
    return this;
  }

  withPriority(priority: number): TestTaskBuilder {
    this.task.priority = priority;
    return this;
  }

  build(): Task {
    return { ...this.task } as Task;
  }
}

// Usage
const task = new TestTaskBuilder()
  .withId('T1')
  .withStatus(TaskStatus.IN_PROGRESS)
  .withDependencies(['T0'])
  .withPriority(5)
  .build();
```

### Test Factories

```typescript
class TestFactory {
  static createWorkflow(config: {
    phases?: number;
    milestonesPerPhase?: number;
    tasksPerMilestone?: number;
    subtasksPerTask?: number;
  }): Workflow {
    const phases = Array.from({ length: config.phases || 1 }, (_, i) =>
      this.createPhase({
        id: `P${i}`,
        milestones: config.milestonesPerPhase || 1,
        tasksPerMilestone: config.tasksPerMilestone || 1,
        subtasksPerTask: config.subtasksPerTask || 0
      })
    );

    return {
      id: 'test-workflow',
      phases,
      status: WorkflowStatus.PLANNED
    };
  }

  private static createPhase(config: any): Phase {
    // Implementation
    return {} as Phase;
  }
}
```

### Assertion Helpers

```typescript
class OrchestratorAssertions {
  static assertTaskStatus(
    taskId: string,
    expectedStatus: TaskStatus
  ): void {
    const actualStatus = getTaskStatus(taskId);
    expect(actualStatus).toBe(expectedStatus);
  }

  static assertDependencyOrder(
    tasks: Task[],
    sorted: string[]
  ): void {
    for (const task of tasks) {
      const taskIndex = sorted.indexOf(task.id);
      for (const dep of task.dependencies) {
        const depIndex = sorted.indexOf(dep);
        expect(depIndex).toBeLessThan(taskIndex);
      }
    }
  }

  static assertNoCycles(graph: TaskGraph): void {
    const hasCycle = detectCycle(graph);
    expect(hasCycle).toBe(false);
  }
}
```

## 6. Test Data Management

### Test Database Management

```typescript
class TestDatabaseManager {
  private static instance: TestDatabase;

  static async getInstance(): Promise<TestDatabase> {
    if (!this.instance) {
      this.instance = await this.create();
    }
    return this.instance;
  }

  private static async create(): Promise<TestDatabase> {
    const db = await createTestDatabase({
      name: `test_${randomUUID()}`,
      migrationsPath: './migrations'
    });

    await db.migrate();
    return db;
  }

  static async reset(): Promise<void> {
    const db = await this.getInstance();
    await db.truncateAllTables();
  }

  static async cleanup(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      await this.instance.dropDatabase();
      this.instance = null as any;
    }
  }
}
```

## Key Resources

### Testing Frameworks
- **Jest**: https://jestjs.io/ - JavaScript testing framework
- **pytest**: https://docs.pytest.org/ - Python testing framework
- **JUnit**: https://junit.org/ - Java testing framework
- **Testcontainers**: https://www.testcontainers.org/ - Docker-based test containers

### Mocking Libraries
- **mockk (Kotlin)**: https://mockk.io/
- **sinon.js (JavaScript)**: https://sinonjs.org/
- **unittest.mock (Python)**: https://docs.python.org/3/library/unittest.mock.html

### Integration Testing Tools
- **Docker Compose**: Multi-container test environments
- **LocalStack**: Local AWS cloud testing
- **Testcontainers**: Docker-based integration tests

### Best Practice Guides
- Martin Fowler: "UnitTest"
- Google Testing Blog: "Testing on the Toilet"
- Microsoft: "Unit Testing Best Practices"

## Testing Checklist

### Unit Tests
- [ ] Test all public methods
- [ ] Test edge cases and error conditions
- [ ] Test state transitions
- [ ] Test dependency resolution
- [ ] Test guard conditions
- [ ] Achieve >80% code coverage

### Integration Tests
- [ ] Test with real database
- [ ] Test with real message bus
- [ ] Test concurrent operations
- [ ] Test error recovery
- [ ] Test data persistence
- [ ] Test event propagation

### Performance Tests
- [ ] Load testing (normal load)
- [ ] Stress testing (extreme load)
- [ ] Endurance testing (long-running)
- [ ] Spike testing (sudden load increases)
- [ ] Measure throughput and latency

### Contract Tests
- [ ] Verify API contracts
- [ ] Verify event schemas
- [ ] Verify interface compliance
- [ ] Verify data serialization

## Common Pitfalls

1. **Over-mocking**: Mocking too much leads to brittle tests
2. **Testing implementation**: Test behavior, not implementation
3. **Flaky tests**: Tests that sometimes fail
4. **Slow tests**: Tests taking too long to run
5. **Complex setup**: Test setup that's hard to understand
6. **Missing edge cases**: Not testing error conditions
7. **No cleanup**: Not cleaning up after tests
8. **Shared state**: Tests depending on shared state
