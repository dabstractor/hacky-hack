# Task Prioritization and Blocking Patterns - Research Findings

## Overview

Effective task prioritization and blocking mechanisms are crucial for orchestrator efficiency and correctness. This document covers patterns, algorithms, and implementations for managing task priorities and handling blocking scenarios.

## Core Concepts

### 1. Task Priority Model

```typescript
interface Priority {
  value: number; // Higher = more important
  level: PriorityLevel;
  weight: number; // For weighted fair queuing
  createdAt: Date;
  updatedAt: Date;
}

enum PriorityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  BACKGROUND = 'background',
}

interface PrioritizedTask {
  id: string;
  priority: Priority;
  blockingDependencies: string[]; // Tasks that must complete first
  softDependencies: string[]; // Prefer to complete first but not required
  estimatedDuration?: number; // For shortest-job-first scheduling
  deadline?: Date; // For earliest-deadline-first scheduling
  tags: string[]; // For tag-based prioritization
}
```

### 2. Prioritization Algorithms

#### Algorithm 1: Static Priority Scheduling

**Description**: Tasks execute in order of fixed priority values.

```typescript
class StaticPriorityScheduler {
  private priorityQueue: PriorityQueue<PrioritizedTask>;

  constructor() {
    this.priorityQueue = new PriorityQueue(
      (a, b) => b.priority.value - a.priority.value
    );
  }

  schedule(task: PrioritizedTask): void {
    this.priorityQueue.enqueue(task);
  }

  getNext(): PrioritizedTask | null {
    return this.priorityQueue.dequeue();
  }

  peek(): PrioritizedTask | null {
    return this.priorityQueue.peek();
  }
}
```

**Advantages:**

- Simple implementation
- Predictable behavior
- Fast execution

**Disadvantages:**

- Can lead to starvation of low-priority tasks
- Doesn't adapt to changing conditions
- May not meet deadlines

**Use Cases:**

- When priorities are well-defined and stable
- When starvation is acceptable
- Simple scheduling scenarios

#### Algorithm 2: Dynamic Priority Scheduling (Aging)

**Description**: Task priorities increase over time to prevent starvation.

```typescript
class AgingScheduler {
  private tasks: Map<string, PrioritizedTask> = new Map();
  private basePriorities: Map<string, number> = new Map();
  private agingFactor = 0.1; // Priority increase per second
  private maxAgeBoost = 50; // Maximum priority boost from aging

  schedule(task: PrioritizedTask): void {
    this.tasks.set(task.id, task);
    this.basePriorities.set(task.id, task.priority.value);
  }

  getNext(): PrioritizedTask | null {
    let highestPriorityTask: PrioritizedTask | null = null;
    let highestPriority = -Infinity;

    for (const task of this.tasks.values()) {
      const agedPriority = this.calculateAgedPriority(task);

      if (agedPriority > highestPriority) {
        highestPriority = agedPriority;
        highestPriorityTask = task;
      }
    }

    if (highestPriorityTask) {
      this.tasks.delete(highestPriorityTask.id);
      this.basePriorities.delete(highestPriorityTask.id);
    }

    return highestPriorityTask;
  }

  private calculateAgedPriority(task: PrioritizedTask): number {
    const basePriority = this.basePriorities.get(task.id)!;
    const ageInSeconds =
      (Date.now() - task.priority.createdAt.getTime()) / 1000;
    const ageBoost = Math.min(
      ageInSeconds * this.agingFactor,
      this.maxAgeBoost
    );

    return basePriority + ageBoost;
  }
}
```

**Advantages:**

- Prevents starvation
- Fair to all tasks
- Adapts to wait time

**Disadvantages:**

- More complex implementation
- Requires tracking age
- May delay critical tasks

**Use Cases:**

- When starvation is unacceptable
- When fairness is important
- Mixed workload scenarios

#### Algorithm 3: Shortest Job First (SJF)

**Description**: Prioritize tasks with shorter estimated duration.

```typescript
class ShortestJobFirstScheduler {
  private tasks: PrioritizedTask[] = [];

  schedule(task: PrioritizedTask): void {
    this.tasks.push(task);
    this.tasks.sort(
      (a, b) =>
        (a.estimatedDuration || Infinity) - (b.estimatedDuration || Infinity)
    );
  }

  getNext(): PrioritizedTask | null {
    return this.tasks.shift() || null;
  }
}
```

**Advantages:**

- Minimizes average waiting time
- Good for throughput

**Disadvantages:**

- Requires accurate duration estimates
- Long jobs may starve
- Not suitable for real-time systems

**Use Cases:**

- When duration estimates are reliable
- Batch processing systems
- Throughput-oriented scenarios

#### Algorithm 4: Earliest Deadline First (EDF)

**Description**: Prioritize tasks with earliest deadlines.

```typescript
class EarliestDeadlineFirstScheduler {
  private tasks: PrioritizedTask[] = [];

  schedule(task: PrioritizedTask): void {
    this.tasks.push(task);
    this.tasks.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });
  }

  getNext(): PrioritizedTask | null {
    const now = new Date();
    const task = this.tasks.shift();

    // Check if task missed deadline
    if (task && task.deadline && task.deadline < now) {
      console.warn(`Task ${task.id} missed deadline`);
      // Handle missed deadline
    }

    return task || null;
  }
}
```

**Advantages:**

- Optimizes for meeting deadlines
- Good for real-time systems
- Predictable behavior

**Disadvantages:**

- Requires deadlines
- May starve tasks without deadlines
- Can be unstable with overload

**Use Cases:**

- Real-time systems
- Time-sensitive workflows
- SLA-driven processing

#### Algorithm 5: Multi-Level Feedback Queue

**Description**: Multiple priority queues with tasks moving between them.

```typescript
class MultiLevelFeedbackScheduler {
  private queues: PriorityQueue<PrioritizedTask>[] = [];
  private quantum: number[] = []; // Time quantum for each queue
  private taskQueueMap: Map<string, number> = new Map(); // Task -> queue index

  constructor(levels: number) {
    for (let i = 0; i < levels; i++) {
      this.queues.push(
        new PriorityQueue((a, b) => b.priority.value - a.priority.value)
      );
      this.quantum.push(Math.pow(2, i) * 100); // Exponential quanta
    }
  }

  schedule(task: PrioritizedTask, initialQueue: number = 0): void {
    this.queues[initialQueue].enqueue(task);
    this.taskQueueMap.set(task.id, initialQueue);
  }

  getNext(): PrioritizedTask | null {
    // Find highest priority non-empty queue
    for (let i = 0; i < this.queues.length; i++) {
      if (!this.queues[i].isEmpty()) {
        return this.queues[i].dequeue();
      }
    }
    return null;
  }

  markIncomplete(task: PrioritizedTask, actualDuration: number): void {
    const currentQueue = this.taskQueueMap.get(task.id)!;
    const timeQuantum = this.quantum[currentQueue];

    // Demote to lower queue if task exceeded quantum
    if (actualDuration > timeQuantum && currentQueue < this.queues.length - 1) {
      this.schedule(task, currentQueue + 1);
    } else {
      this.schedule(task, currentQueue);
    }
  }
}
```

**Advantages:**

- Adaptive to task behavior
- Balances response time and throughput
- No starvation with aging

**Disadvantages:**

- Complex implementation
- Requires tuning
- Hard to predict behavior

**Use Cases:**

- Mixed workloads
- When task behavior varies
- General-purpose scheduling

### 3. Blocking Patterns

#### Pattern 1: Dependency-Based Blocking

```typescript
class DependencyBlocker {
  private blockedTasks: Map<string, Set<string>> = new Map(); // taskId -> blocking tasks
  private dependencyGraph: DependencyGraph;

  isBlocked(taskId: string): boolean {
    const blockingTasks = this.blockedTasks.get(taskId);
    return blockingTasks ? blockingTasks.size > 0 : false;
  }

  getBlockingTasks(taskId: string): string[] {
    return Array.from(this.blockedTasks.get(taskId) || []);
  }

  setBlocked(taskId: string, blockingDependencies: string[]): void {
    this.blockedTasks.set(taskId, new Set(blockingDependencies));
  }

  unblockTask(taskId: string, completedTaskId: string): void {
    const blockingTasks = this.blockedTasks.get(taskId);
    if (blockingTasks) {
      blockingTasks.delete(completedTaskId);
      if (blockingTasks.size === 0) {
        this.blockedTasks.delete(taskId);
      }
    }
  }

  getUnblockedTasks(completedTaskId: string): string[] {
    const unblocked: string[] = [];

    for (const [taskId, blockingTasks] of this.blockedTasks.entries()) {
      if (blockingTasks.has(completedTaskId)) {
        this.unblockTask(taskId, completedTaskId);
        unblocked.push(taskId);
      }
    }

    return unblocked;
  }
}
```

#### Pattern 2: Resource-Based Blocking

```typescript
class ResourceBlocker {
  private resourceAllocations: Map<string, string[]> = new Map(); // resource -> taskIds
  private taskResources: Map<string, string[]> = new Map(); // taskId -> resources
  private waitingTasks: Map<string, Set<string>> = new Map(); // resource -> waiting taskIds

  async acquireResources(
    taskId: string,
    resources: string[]
  ): Promise<boolean> {
    const availableResources = resources.filter(
      resource =>
        !this.resourceAllocations.has(resource) ||
        this.resourceAllocations.get(resource)!.length === 0
    );

    if (availableResources.length === resources.length) {
      // All resources available
      for (const resource of resources) {
        this.resourceAllocations.set(resource, [taskId]);
      }
      this.taskResources.set(taskId, resources);
      return true;
    } else {
      // Some resources unavailable, block task
      for (const resource of resources) {
        if (!this.waitingTasks.has(resource)) {
          this.waitingTasks.set(resource, new Set());
        }
        this.waitingTasks.get(resource)!.add(taskId);
      }
      return false;
    }
  }

  releaseResources(taskId: string): void {
    const resources = this.taskResources.get(taskId);
    if (!resources) return;

    for (const resource of resources) {
      const allocations = this.resourceAllocations.get(resource)!;
      const index = allocations.indexOf(taskId);
      if (index > -1) {
        allocations.splice(index, 1);
      }

      // Notify waiting tasks
      this.notifyResourceAvailable(resource);
    }

    this.taskResources.delete(taskId);
  }

  private notifyResourceAvailable(resource: string): void {
    const waitingTasks = this.waitingTasks.get(resource);
    if (!waitingTasks) return;

    for (const taskId of waitingTasks) {
      // Check if task can now acquire all resources
      const taskResources = this.getTaskRequestedResources(taskId);
      if (this.canAcquireAll(taskResources)) {
        waitingTasks.delete(taskId);
        // Notify scheduler that task is unblocked
      }
    }
  }

  private canAcquireAll(resources: string[]): boolean {
    return resources.every(
      resource =>
        !this.resourceAllocations.has(resource) ||
        this.resourceAllocations.get(resource)!.length === 0
    );
  }

  private getTaskRequestedResources(taskId: string): string[] {
    // Implementation depends on how you track requested resources
    return [];
  }
}
```

#### Pattern 3: Conditional Blocking

```typescript
interface BlockingCondition {
  id: string;
  evaluate(): Promise<boolean>;
  description: string;
}

class ConditionalBlocker {
  private conditions: Map<string, Set<BlockingCondition>> = new Map();

  addBlockingCondition(taskId: string, condition: BlockingCondition): void {
    if (!this.conditions.has(taskId)) {
      this.conditions.set(taskId, new Set());
    }
    this.conditions.get(taskId)!.add(condition);
  }

  async isBlocked(taskId: string): Promise<boolean> {
    const conditions = this.conditions.get(taskId);
    if (!conditions) return false;

    for (const condition of conditions) {
      const result = await condition.evaluate();
      if (result) {
        return true; // Still blocked
      }
    }

    return false; // All conditions cleared
  }

  async checkAndUnblock(taskId: string): Promise<boolean> {
    const wasBlocked = await this.isBlocked(taskId);
    if (!wasBlocked) {
      this.conditions.delete(taskId);
      return true; // Task was unblocked
    }
    return false;
  }

  getBlockingReasons(taskId: string): string[] {
    const conditions = this.conditions.get(taskId);
    if (!conditions) return [];

    return Array.from(conditions).map(c => c.description);
  }
}
```

### 4. Priority Inversion Prevention

#### Pattern 1: Priority Inheritance

```typescript
class PriorityInheritanceManager {
  private taskPriorities: Map<string, number> = new Map();
  private resourceHolders: Map<string, string> = new Map(); // resource -> taskId
  private waitingForResource: Map<string, Set<string>> = new Map(); // resource -> waiting taskIds

  requestResource(taskId: string, resource: string, priority: number): void {
    const holder = this.resourceHolders.get(resource);

    if (holder && this.taskPriorities.get(holder)! < priority) {
      // Priority inversion! Boost holder's priority
      this.boostPriority(holder, priority);
    }

    if (!this.waitingForResource.has(resource)) {
      this.waitingForResource.set(resource, new Set());
    }
    this.waitingForResource.get(resource)!.add(taskId);
  }

  acquireResource(taskId: string, resource: string): void {
    this.resourceHolders.set(resource, taskId);
  }

  releaseResource(taskId: string, resource: string): void {
    if (this.resourceHolders.get(resource) === taskId) {
      this.resourceHolders.delete(resource);

      // Restore original priority
      this.restorePriority(taskId);
    }
  }

  private boostPriority(taskId: string, newPriority: number): void {
    const oldPriority = this.taskPriorities.get(taskId) || 0;
    this.taskPriorities.set(taskId, newPriority);

    // Notify scheduler of priority change
    console.log(
      `Boosted task ${taskId} priority from ${oldPriority} to ${newPriority}`
    );
  }

  private restorePriority(taskId: string): void {
    // Restore to base priority
    const basePriority = this.getBasePriority(taskId);
    this.taskPriorities.set(taskId, basePriority);
  }

  private getBasePriority(taskId: string): number {
    // Implementation depends on how you store base priorities
    return 0;
  }
}
```

#### Pattern 2: Priority Ceiling Protocol

```typescript
class PriorityCeilingProtocol {
  private resourceCeilings: Map<string, number> = new Map(); // resource -> ceiling priority
  private taskPriorities: Map<string, number> = new Map();
  private taskResources: Map<string, Set<string>> = new Map();

  setCeiling(resource: string, ceiling: number): void {
    this.resourceCeilings.set(resource, ceiling);
  }

  async acquireResource(taskId: string, resource: string): Promise<boolean> {
    const ceiling = this.resourceCeilings.get(resource) || 0;
    const taskPriority = this.taskPriorities.get(taskId) || 0;

    if (taskPriority < ceiling) {
      // Task priority too low, deny access
      return false;
    }

    // Grant access
    if (!this.taskResources.has(taskId)) {
      this.taskResources.set(taskId, new Set());
    }
    this.taskResources.get(taskId)!.add(resource);

    return true;
  }

  releaseResource(taskId: string, resource: string): void {
    const resources = this.taskResources.get(taskId);
    if (resources) {
      resources.delete(resource);
    }
  }
}
```

### 5. Composite Scheduling Strategy

```typescript
class CompositeScheduler {
  private schedulers: Map<string, TaskScheduler> = new Map();

  constructor() {
    this.schedulers.set('static', new StaticPriorityScheduler());
    this.schedulers.set('aging', new AgingScheduler());
    this.schedulers.set('deadline', new EarliestDeadlineFirstScheduler());
  }

  schedule(task: PrioritizedTask, strategy: string): void {
    const scheduler = this.schedulers.get(strategy);
    if (scheduler) {
      scheduler.schedule(task);
    }
  }

  getNext(strategy: string): PrioritizedTask | null {
    const scheduler = this.schedulers.get(strategy);
    return scheduler ? scheduler.getNext() : null;
  }

  // Multi-strategy scheduling
  getNextFromAny(): PrioritizedTask | null {
    for (const scheduler of this.schedulers.values()) {
      const task = scheduler.getNext();
      if (task) return task;
    }
    return null;
  }
}
```

## Key Resources

### Academic Papers

- "A Scheduler for Linux" (Con Kolivas, 2004) - Completely Fair Scheduler
- "Analysis of Priority Inheritance Protocols" (Sha et al., 1990)
- "Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment" (Liu and Layland, 1973)

### Books

- "Operating System Concepts" by Silberschatz, Galvin, and Gagne
- "Real-Time Systems" by Jane W. S. Liu
- "Computer Architecture: A Quantitative Approach" by Hennessy and Patterson

### Documentation

- **Linux Completely Fair Scheduler**: https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html
- **Windows Thread Scheduling**: https://docs.microsoft.com/en-us/windows/win32/procthread/scheduling-priorities
- **Real-Time Linux**: https://rt.wiki.kernel.org/

### Open Source Projects

- **Linux Kernel Scheduler**: https://github.com/torvalds/linux/tree/master/kernel/sched
- **Celery Priority Queue**: https://docs.celeryproject.org/en/stable/userguide/optimizing.html#priority-queues
- **Bull Priority Queue**: https://github.com/OptimalBits/bull#priority-queues

## Best Practices

### Design Principles

1. **Clarity**: Prioritization logic should be clear and understandable
2. **Consistency**: Apply rules consistently across all tasks
3. **Fairness**: Prevent starvation of low-priority tasks
4. **Configurability**: Make policies configurable
5. **Observability**: Log scheduling decisions

### Implementation Guidelines

1. **Use multiple strategies**: Combine different algorithms for different task types
2. **Monitor metrics**: Track scheduling effectiveness
3. **Test thoroughly**: Test with various workloads
4. **Document policies**: Clearly document prioritization rules
5. **Provide overrides**: Allow manual priority adjustments
6. **Handle edge cases**: Tasks without priorities, deadlines, etc.

### Performance Considerations

1. **O(1) operations**: Use efficient data structures
2. **Batch processing**: Process multiple tasks together
3. **Caching**: Cache scheduling decisions
4. **Lazy evaluation**: Calculate priorities on-demand

## Common Pitfalls

1. **Starvation**: Low-priority tasks never execute
2. **Priority inversion**: High-priority tasks blocked by low-priority tasks
3. **Overhead**: Scheduling overhead too high
4. **Complexity**: Too complex to understand and maintain
5. **Inaccuracy**: Poor estimates leading to bad decisions
6. **Deadlines missed**: Not accounting for all factors
7. **No feedback**: Not adapting to system conditions
8. **Hardcoded values**: Not making policies configurable
