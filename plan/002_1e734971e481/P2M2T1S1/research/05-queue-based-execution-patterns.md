# Queue-Based Execution Patterns - Research Findings

## Overview
Queue-based execution is a fundamental pattern for task orchestration, enabling asynchronous processing, load balancing, and fault tolerance. This document covers patterns, implementations, and best practices for queue-based task execution systems.

## Core Concepts

### 1. Basic Queue Architecture

```typescript
interface TaskQueue {
  enqueue(task: Task): Promise<void>;
  dequeue(): Promise<Task | null>;
  peek(): Promise<Task | null>;
  size(): Promise<number>;
  isEmpty(): Promise<boolean>;
}

interface QueueWorker {
  id: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getProcessedCount(): number;
}
```

### 2. Queue Implementation Patterns

#### Pattern 1: In-Memory Queue

**Description**: Fast, simple queue for single-process scenarios.

```typescript
class InMemoryTaskQueue implements TaskQueue {
  private queue: Task[] = [];
  private lock = new AsyncLock();

  async enqueue(task: Task): Promise<void> {
    await this.lock.acquire();
    try {
      this.queue.push(task);
    } finally {
      this.lock.release();
    }
  }

  async dequeue(): Promise<Task | null> {
    await this.lock.acquire();
    try {
      return this.queue.shift() || null;
    } finally {
      this.lock.release();
    }
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async isEmpty(): Promise<boolean> {
    return this.queue.length === 0;
  }

  async peek(): Promise<Task | null> {
    return this.queue[0] || null;
  }
}
```

**Advantages:**
- Fast performance (in-memory operations)
- Simple implementation
- No external dependencies

**Disadvantages:**
- Not durable (data lost on crash)
- Single-process only
- Limited scalability

**Use Cases:**
- Development and testing
- Single-process applications
- Non-critical tasks
- When performance is more important than durability

#### Pattern 2: Persistent Queue (Database-Backed)

**Description**: Queue backed by database for durability.

```typescript
class DatabaseTaskQueue implements TaskQueue {
  constructor(private db: Database) {}

  async enqueue(task: Task): Promise<void> {
    await this.db.query(
      `INSERT INTO task_queue (task_id, data, priority, created_at)
       VALUES ($1, $2, $3, $4)`,
      [task.id, JSON.stringify(task), task.priority, new Date()]
    );
  }

  async dequeue(): Promise<Task | null> {
    const result = await this.db.query(
      `DELETE FROM task_queue
       WHERE id = (
         SELECT id FROM task_queue
         ORDER BY priority DESC, created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows[0].data);
  }

  async size(): Promise<number> {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM task_queue'
    );
    return parseInt(result.rows[0].count);
  }

  async isEmpty(): Promise<boolean> {
    return (await this.size()) === 0;
  }

  async peek(): Promise<Task | null> {
    const result = await this.db.query(
      `SELECT data FROM task_queue
       ORDER BY priority DESC, created_at ASC
       LIMIT 1`
    );

    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows[0].data);
  }
}
```

**Advantages:**
- Durable (survives crashes)
- Supports multiple processes
- Can query queue state

**Disadvantages:**
- Slower than in-memory
- Database dependency
- More complex implementation

**Use Cases:**
- Production systems
- Critical tasks
- Multi-process deployments
- When durability is required

#### Pattern 3: Message Broker Queue

**Description**: Queue backed by message broker (RabbitMQ, Kafka, etc.).

```typescript
class MessageBrokerQueue implements TaskQueue {
  private channel: Channel;

  constructor(private connection: Connection, queueName: string) {
    this.channel = connection.createChannel();
    this.channel.assertQueue(queueName, { durable: true });
  }

  async enqueue(task: Task): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(task));
    this.channel.sendToQueue(
      'task_queue',
      buffer,
      { persistent: true }
    );
  }

  async dequeue(): Promise<Task | null> {
    return new Promise((resolve) => {
      this.channel.get('task_queue', {}, (err, msg) => {
        if (err || !msg) {
          resolve(null);
          return;
        }

        const task = JSON.parse(msg.content.toString());
        this.channel.ack(msg);
        resolve(task);
      });
    });
  }

  async size(): Promise<number> {
    const info = await this.channel.checkQueue('task_queue');
    return info.messageCount;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.size()) === 0;
  }

  async peek(): Promise<Task | null> {
    return new Promise((resolve) => {
      this.channel.get('task_queue', { noAck: true }, (err, msg) => {
        if (err || !msg) {
          resolve(null);
          return;
        }

        const task = JSON.parse(msg.content.toString());
        resolve(task);
      });
    });
  }
}
```

**Advantages:**
- Highly scalable
- Built-in features (redelivery, dead letter)
- Supports distributed systems
- Production-ready

**Disadvantages:**
- External dependency
- More complex setup
- Network latency

**Use Cases:**
- Distributed systems
- High-scale applications
- Complex routing requirements
- When advanced features are needed

### 3. Worker Patterns

#### Pattern 1: Single Worker

```typescript
class QueueWorker {
  private running = false;
  private processed = 0;

  constructor(
    private queue: TaskQueue,
    private handler: TaskHandler,
    private id: string
  ) {}

  async start(): Promise<void> {
    this.running = true;

    while (this.running) {
      const task = await this.queue.dequeue();

      if (!task) {
        await this.sleep(100);
        continue;
      }

      try {
        await this.handler.handle(task);
        this.processed++;
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        // Handle error (retry, dead letter, etc.)
      }
    }
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getProcessedCount(): number {
    return this.processed;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Pattern 2: Worker Pool

```typescript
class WorkerPool {
  private workers: QueueWorker[] = [];

  constructor(
    private queue: TaskQueue,
    private handler: TaskHandler,
    poolSize: number
  ) {
    for (let i = 0; i < poolSize; i++) {
      this.workers.push(new QueueWorker(queue, handler, `worker-${i}`));
    }
  }

  async start(): Promise<void> {
    await Promise.all(this.workers.map(w => w.start()));
  }

  async stop(): Promise<void> {
    await Promise.all(this.workers.map(w => w.stop()));
  }

  getTotalProcessed(): number {
    return this.workers.reduce((sum, w) => sum + w.getProcessedCount(), 0);
  }

  getWorkerStats(): WorkerStats[] {
    return this.workers.map(w => ({
      id: w.id,
      running: w.isRunning(),
      processed: w.getProcessedCount()
    }));
  }
}
```

#### Pattern 3: Dynamic Worker Pool

```typescript
class DynamicWorkerPool {
  private workers: Map<string, QueueWorker> = new Map();
  private minWorkers: number;
  private maxWorkers: number;
  private scaleUpThreshold: number;
  private scaleDownThreshold: number;

  constructor(
    private queue: TaskQueue,
    private handler: TaskHandler,
    config: DynamicPoolConfig
  ) {
    this.minWorkers = config.minWorkers || 2;
    this.maxWorkers = config.maxWorkers || 10;
    this.scaleUpThreshold = config.scaleUpThreshold || 100;
    this.scaleDownThreshold = config.scaleDownThreshold || 10;
  }

  async start(): Promise<void> {
    // Start minimum workers
    for (let i = 0; i < this.minWorkers; i++) {
      await this.addWorker();
    }

    // Start scaling monitor
    this.startScalingMonitor();
  }

  async stop(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.stop();
    }
    this.workers.clear();
  }

  private startScalingMonitor(): void {
    setInterval(async () => {
      const queueSize = await this.queue.getSize();
      const workerCount = this.workers.size;

      if (queueSize > this.scaleUpThreshold && workerCount < this.maxWorkers) {
        await this.scaleUp();
      } else if (queueSize < this.scaleDownThreshold && workerCount > this.minWorkers) {
        await this.scaleDown();
      }
    }, 5000); // Check every 5 seconds
  }

  private async scaleUp(): Promise<void> {
    const newWorker = await this.addWorker();
    console.log(`Scaled up: added worker ${newWorker.id}`);
  }

  private async scaleDown(): Promise<void> {
    const workerId = this.workers.keys().next().value;
    await this.removeWorker(workerId);
    console.log(`Scaled down: removed worker ${workerId}`);
  }

  private async addWorker(): Promise<QueueWorker> {
    const id = `worker-${this.workers.size}-${Date.now()}`;
    const worker = new QueueWorker(this.queue, this.handler, id);
    await worker.start();
    this.workers.set(id, worker);
    return worker;
  }

  private async removeWorker(id: string): Promise<void> {
    const worker = this.workers.get(id);
    if (worker) {
      await worker.stop();
      this.workers.delete(id);
    }
  }
}
```

### 4. Priority Queue Patterns

#### Pattern 1: Priority-based Queue

```typescript
class PriorityQueue implements TaskQueue {
  private queues: Map<number, Task[]> = new Map();

  async enqueue(task: Task): Promise<void> {
    const priority = task.priority || 0;
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(task);
  }

  async dequeue(): Promise<Task | null> {
    // Get highest priority queue
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }

    return null;
  }

  async size(): Promise<number> {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.size()) === 0;
  }

  async peek(): Promise<Task | null> {
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority)!;
      if (queue.length > 0) {
        return queue[0];
      }
    }

    return null;
  }
}
```

### 5. Retry and Dead Letter Patterns

#### Pattern 1: Retry with Exponential Backoff

```typescript
class RetryAwareWorker extends QueueWorker {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  protected async processTask(task: Task): Promise<void> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        await this.handler.handle(task);
        return; // Success
      } catch (error) {
        attempt++;

        if (attempt >= this.maxRetries) {
          // Max retries reached, send to dead letter
          await this.sendToDeadLetter(task, error);
          return;
        }

        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
  }

  private async sendToDeadLetter(task: Task, error: Error): Promise<void> {
    await this.deadLetterQueue.enqueue({
      task,
      error: error.message,
      failedAt: new Date(),
      retryCount: this.maxRetries
    });
  }
}
```

#### Pattern 2: Dead Letter Queue

```typescript
class DeadLetterQueue {
  constructor(private db: Database) {}

  async enqueue(item: DeadLetterItem): Promise<void> {
    await this.db.query(
      `INSERT INTO dead_letter_queue (task_id, error, failed_at, retry_count, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        item.task.id,
        item.error,
        item.failedAt,
        item.retryCount,
        JSON.stringify(item.task)
      ]
    );
  }

  async reprocess(itemId: string): Promise<boolean> {
    const item = await this.get(itemId);
    if (!item) return false;

    // Remove from dead letter and re-enqueue
    await this.delete(itemId);
    await this.taskQueue.enqueue(item.task);

    return true;
  }

  private async get(itemId: string): Promise<DeadLetterItem | null> {
    const result = await this.db.query(
      'SELECT * FROM dead_letter_queue WHERE id = $1',
      [itemId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      task: JSON.parse(row.data),
      error: row.error,
      failedAt: row.failed_at,
      retryCount: row.retry_count
    };
  }

  private async delete(itemId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM dead_letter_queue WHERE id = $1',
      [itemId]
    );
  }
}
```

### 6. Backpressure and Flow Control

#### Pattern 1: Semaphore-based Flow Control

```typescript
class SemaphoreWorkerPool {
  private semaphore: Semaphore;

  constructor(
    private queue: TaskQueue,
    private handler: TaskHandler,
    concurrency: number
  ) {
    this.semaphore = new Semaphore(concurrency);
  }

  async start(): Promise<void> {
    while (true) {
      await this.semaphore.acquire();

      const task = await this.queue.dequeue();
      if (!task) {
        this.semaphore.release();
        await this.sleep(100);
        continue;
      }

      // Process without blocking
      this.processTask(task).finally(() => {
        this.semaphore.release();
      });
    }
  }

  private async processTask(task: Task): Promise<void> {
    try {
      await this.handler.handle(task);
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error);
    }
  }
}
```

### 7. Monitoring and Observability

#### Queue Metrics

```typescript
interface QueueMetrics {
  queueSize: number;
  processingRate: number; // tasks/second
  averageProcessingTime: number; // milliseconds
  errorRate: number; // percentage
  workerUtilization: number; // percentage
}

class QueueMonitor {
  private metrics: QueueMetrics;
  private processingTimes: number[] = [];
  private errorCount = 0;
  private successCount = 0;

  constructor(private queue: TaskQueue) {
    this.metrics = {
      queueSize: 0,
      processingRate: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      workerUtilization: 0
    };
  }

  async collectMetrics(): Promise<QueueMetrics> {
    this.metrics.queueSize = await this.queue.size();
    this.metrics.processingRate = this.calculateProcessingRate();
    this.metrics.averageProcessingTime = this.calculateAvgProcessingTime();
    this.metrics.errorRate = this.calculateErrorRate();

    return this.metrics;
  }

  recordProcessing(duration: number, success: boolean): void {
    this.processingTimes.push(duration);
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  private calculateProcessingRate(): number {
    // Implement based on time window
    return 0;
  }

  private calculateAvgProcessingTime(): number {
    if (this.processingTimes.length === 0) return 0;
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    return sum / this.processingTimes.length;
  }

  private calculateErrorRate(): number {
    const total = this.successCount + this.errorCount;
    if (total === 0) return 0;
    return (this.errorCount / total) * 100;
  }
}
```

## Key Resources

### Message Brokers
- **RabbitMQ**: https://www.rabbitmq.com/ - Feature-rich message broker
- **Apache Kafka**: https://kafka.apache.org/ - Distributed streaming platform
- **Redis Queue**: https://redis.io/docs/manual/patterns/distributed-queues/ - Redis-based queues
- **AWS SQS**: https://aws.amazon.com/sqs/ - Cloud message queue service

### Libraries and Frameworks
- **Bull (Node.js)**: https://github.com/OptimalBits/bull - Redis-based queue
- **Celery (Python)**: https://docs.celeryproject.org/ - Distributed task queue
- **Sidekiq (Ruby)**: https://sidekiq.org/ - Background jobs for Ruby
- **RabbitMQ Java Client**: https://www.rabbitmq.com/java-client.html

### Documentation
- **RabbitMQ Best Practices**: https://www.rabbitmq.com/best-practices.html
- **Kafka Documentation**: https://kafka.apache.org/documentation/
- **Redis Queue Patterns**: https://redis.io/docs/manual/patterns/

### Books and Papers
- "Enterprise Integration Patterns" by Gregor Hohpe
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Queueing Theory" academic papers

## Best Practices

### Design Principles
1. **Idempotency**: Tasks should be idempotent (safe to retry)
2. **At-least-once delivery**: Prefer over at-most-once
3. **Graceful shutdown**: Allow workers to finish current tasks
4. **Dead letter handling**: Always have dead letter queue
5. **Monitoring**: Comprehensive metrics and logging
6. **Circuit breakers**: Stop processing when system is unhealthy

### Implementation Guidelines
1. **Connection pooling**: Reuse connections to message broker
2. **Prefetch count**: Limit messages per worker
3. **Acknowledgment**: Always acknowledge processed messages
4. **Error handling**: Comprehensive error handling and logging
5. **Timeout handling**: Set reasonable timeouts for tasks
6. **Resource limits**: Set memory and CPU limits

### Performance Considerations
1. **Batch processing**: Process multiple tasks together
2. **Async I/O**: Use async/await for I/O operations
3. **Connection reuse**: Reuse database and broker connections
4. **Compression**: Compress large task payloads
5. **Partitioning**: Partition large queues for scalability

## Common Pitfalls

1. **No idempotency**: Tasks that can't be safely retried
2. **Poison pills**: Tasks that always fail
3. **Resource exhaustion**: Workers consuming too much memory
4. **Slow consumers**: Workers slower than task production
5. **No monitoring**: Can't see what's happening in queue
6. **Missing acknowledgments**: Tasks marked as processed when they failed
7. **No dead letter**: Failed tasks have nowhere to go
8. **Hardcoded limits**: Not scaling based on load
