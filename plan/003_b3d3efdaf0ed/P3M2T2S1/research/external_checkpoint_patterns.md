# Checkpoint/Recovery Patterns in TypeScript/Node.js Applications

## Research Summary

This document compiles comprehensive research on checkpoint/recovery patterns, focusing on established libraries, best practices, and industry examples for building resilient long-running applications in TypeScript/Node.js.

---

## Table of Contents

1. [Checkpoint/Resume Pattern Libraries](#1-checkpointresume-pattern-libraries)
2. [Best Practices for State Persistence](#2-best-practices-for-state-persistence)
3. [Error Recovery Patterns](#3-error-recovery-patterns)
4. [Industry Examples](#4-industry-examples)
5. [Common Pitfalls and Solutions](#5-common-pitfalls-and-solutions)
6. [Library Recommendations](#6-library-recommendations)
7. [Implementation Checklist](#7-implementation-checklist)

---

## 1. Checkpoint/Resume Pattern Libraries

### 1.1 Workflow Orchestration Libraries

#### Temporal

**Overview**: Durable execution platform with built-in checkpointing and automatic recovery.

**Key Features**:

- Automatic state persistence after each workflow step
- Built-in retry policies with exponential backoff
- Durable timers that survive process restarts
- Visibility into workflow execution history

**Documentation**: https://docs.temporal.io/typescript

**Code Example**:

```typescript
import { workflow } from '@temporalio/workflow';

export interface ProcessWorkflowArgs {
  inputUrl: string;
  outputPath: string;
}

export async function processWorkflow(
  args: ProcessWorkflowArgs
): Promise<void> {
  // Each activity is a checkpoint
  await activities.download(args.inputUrl, '/tmp/input.txt');

  // If this fails, workflow resumes from here
  await activities.transform('/tmp/input.txt', '/tmp/output.txt');

  // Final step
  await activities.upload('/tmp/output.txt', args.outputPath);
}

// Retry policy per activity
const activities = workflow.proxyActivities({
  startToCloseTimeout: '5m',
  retryOptions: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});
```

**Pros**:

- Automatic checkpoint management
- Strong consistency guarantees
- Excellent observability
- Handles complex distributed scenarios

**Cons**:

- Requires Temporal server infrastructure
- Learning curve for workflow concepts
- Overkill for simple use cases

**Best For**: Complex multi-step workflows requiring distributed execution

---

#### BullMQ

**Overview**: Redis-based queue with job persistence and state tracking.

**Key Features**:

- Job state persistence (waiting, active, completed, failed)
- Automatic retries with configurable backoff
- Job prioritization and scheduling
- Delayed jobs and cron scheduling

**Documentation**: https://docs.bullmq.io/

**Code Example**:

```typescript
import { Queue, Worker, Job } from 'bullmq';

const queue = new Queue('processing', {
  connection: { host: 'localhost', port: 6379 },
});

// Add job with checkpoint data
await queue.add(
  'process-item',
  {
    itemId: '123',
    checkpoint: {
      processedItems: ['item1', 'item2'],
      lastProcessedIndex: 2,
    },
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    // Remove job after completion
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 1000,
    },
  }
);

// Worker with progress tracking
const worker = new Worker('processing', async (job: Job) => {
  const { checkpoint } = job.data;

  // Resume from checkpoint
  for (let i = checkpoint.lastProcessedIndex; i < items.length; i++) {
    await processItem(items[i]);

    // Update progress (acts as checkpoint)
    await job.updateProgress({
      processedIndex: i,
      total: items.length,
    });

    // Update checkpoint data
    job.data.checkpoint.lastProcessedIndex = i;
    await job.updateData(job.data);
  }
});
```

**Pros**:

- Simple Redis-based setup
- Built-in retry mechanisms
- Good for distributed task processing
- Excellent dashboard UI

**Cons**:

- Requires Redis infrastructure
- Not designed for complex workflow orchestration
- Manual checkpoint management within jobs

**Best For**: Distributed task processing with simple checkpointing needs

---

### 1.2 State Machine Libraries

#### XState

**Overview**: State machine library with persistence support and checkpointing capabilities.

**Key Features**:

- State machine visualization
- State history tracking
- Event-sourced architecture
- Persistence adapters available

**Documentation**: https://xstate.js.org/docs/guides/states.html

**Code Example**:

```typescript
import { createMachine, createActor, assign } from 'xstate';

interface CheckpointContext {
  processedItems: string[];
  currentIndex: number;
  totalItems: number;
}

const processingMachine = createMachine({
  id: 'processing',
  initial: 'idle',
  context: {
    processedItems: [],
    currentIndex: 0,
    totalItems: 100,
  } as CheckpointContext,
  states: {
    idle: {
      on: { START: 'processing' },
    },
    processing: {
      initial: 'itemStep',
      states: {
        itemStep: {
          always: [
            {
              guard: ({ context }) =>
                context.currentIndex >= context.totalItems,
              target: '#processing.completed',
            },
            {
              actions: assign({
                processedItems: ({ context }) => [
                  ...context.processedItems,
                  `item-${context.currentIndex}`,
                ],
                currentIndex: ({ context }) => context.currentIndex + 1,
              }),
              target: 'itemStep', // Continue processing
            },
          ],
        },
      },
    },
    completed: {
      type: 'final',
    },
  },
});

// Persist state to localStorage/file
function saveCheckpoint(snapshot: any) {
  const checkpoint = {
    state: JSON.stringify(snapshot),
    timestamp: Date.now(),
  };
  fs.writeFileSync('checkpoint.json', JSON.stringify(checkpoint));
}

// Restore from checkpoint
function loadCheckpoint() {
  const data = fs.readFileSync('checkpoint.json', 'utf-8');
  const checkpoint = JSON.parse(data);
  return JSON.parse(checkpoint.state);
}

// Create actor with checkpoint restoration
const initialSnapshot = loadCheckpoint();
const actor = createActor(processingMachine, {
  snapshot: initialSnapshot,
});

// Subscribe to state changes for auto-checkpointing
actor.subscribe(snapshot => {
  saveCheckpoint(snapshot);
});
```

**Pros**:

- Visual state debugging
- Strong typing with TypeScript
- Testable state machines
- Guard-based transitions

**Cons**:

- Steeper learning curve
- Manual persistence integration
- Can be overkill for simple workflows

**Best For**: Complex stateful workflows with multiple decision points

---

### 1.3 File-Based Checkpoint Libraries

#### proper-lockfile

**Overview**: Cross-platform file locking for preventing concurrent access.

**Documentation**: https://www.npmjs.com/package/proper-lockfile

**Code Example**:

```typescript
import lockfile from 'proper-lockfile';
import { writeFile, readFile } from 'fs/promises';

class CheckpointManager {
  private lockfilePath: string;

  constructor(private checkpointPath: string) {
    this.lockfilePath = `${checkpointPath}.lock`;
  }

  async saveCheckpoint(data: any): Promise<void> {
    // Acquire lock to prevent concurrent writes
    const release = await lockfile.lock(this.checkpointPath, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 500,
      },
    });

    try {
      // Write checkpoint data
      await writeFile(
        this.checkpointPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } finally {
      // Always release lock
      await release();
    }
  }

  async loadCheckpoint(): Promise<any> {
    // Acquire lock for read consistency
    const release = await lockfile.lock(this.checkpointPath);

    try {
      const data = await readFile(this.checkpointPath, 'utf-8');
      return JSON.parse(data);
    } finally {
      await release();
    }
  }
}
```

**Pros**:

- Prevents race conditions
- Cross-platform support
- Simple API

**Cons**:

- Doesn't handle atomic writes
- Manual cleanup of stale locks
- Not distributed-safe

**Best For**: Single-process scenarios needing file-based checkpoints

---

#### fs-extra

**Overview**: Enhanced file system module with atomic write operations.

**Documentation**: https://www.npmjs.com/package/fs-extra

**Code Example**:

```typescript
import fs from 'fs-extra';
import path from 'path';

class AtomicCheckpoint {
  async save(checkpointPath: string, data: any): Promise<void> {
    const tempPath = `${checkpointPath}.${Date.now()}.tmp`;

    try {
      // Write to temp file first
      await fs.writeJson(tempPath, data, { spaces: 2 });

      // Atomic rename (guaranteed on POSIX, works on Windows)
      await fs.rename(tempPath, checkpointPath);
    } catch (error) {
      // Cleanup temp file on failure
      await fs.remove(tempPath).catch(() => {});
      throw error;
    }
  }

  async load(checkpointPath: string): Promise<any> {
    return await fs.readJson(checkpointPath);
  }

  // Cleanup old checkpoints
  async cleanup(checkpointDir: string, retainCount: number = 5): Promise<void> {
    const files = await fs.readdir(checkpointDir);

    const checkpoints = files
      .filter(f => f.startsWith('checkpoint-'))
      .map(f => ({
        name: f,
        path: path.join(checkpointDir, f),
        time: parseInt(f.split('-')[1]),
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    // Remove old checkpoints
    for (const checkpoint of checkpoints.slice(retainCount)) {
      await fs.remove(checkpoint.path);
    }
  }
}
```

**Pros**:

- Atomic write operations
- Cross-platform compatibility
- Rich API for file operations

**Cons**:

- Additional dependency
- Manual cleanup needed

**Best For**: Reliable file-based checkpointing with atomic guarantees

---

## 2. Best Practices for State Persistence

### 2.1 Atomic File Write Patterns

#### Pattern 1: Write-Temp-Then-Rename (Recommended)

**Description**: Write to a temporary file, then atomically rename over the target.

**Benefits**:

- Atomic on POSIX systems (rename is atomic)
- No partial writes visible
- Works across crashes and interruptions

**Implementation**:

```typescript
import { writeFile, rename, unlink } from 'fs/promises';
import { dirname, basename } from 'path';
import { randomBytes } from 'crypto';

async function atomicWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = `${dirname(targetPath)}/.${basename(targetPath)}.${randomBytes(8).toString('hex')}.tmp`;

  try {
    // Write complete data to temp file
    await writeFile(tempPath, data, { mode: 0o644 });

    // Atomic rename over target
    await rename(tempPath, targetPath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
```

**When to Use**: All critical state writes (checkpoint files, configuration, etc.)

---

#### Pattern 2: Write-and-Fsync

**Description**: Write data and explicitly sync to disk before considering complete.

**Benefits**:

- Ensures data is physically written to disk
- Survives power loss immediately after write
- Stronger durability guarantees

**Implementation**:

```typescript
import { writeFile, open } from 'fs/promises';

async function durableWrite(targetPath: string, data: string): Promise<void> {
  const tempPath = `${targetPath}.tmp`;

  try {
    // Write and fsync
    await writeFile(tempPath, data, { mode: 0o644 });

    // Explicitly flush to disk
    const handle = await open(tempPath, 'r');
    await handle.datasync(); // or fsync
    await handle.close();

    // Rename for atomicity
    await rename(tempPath, targetPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }
}
```

**When to Use**: Critical checkpoints where durability is more important than performance

---

### 2.2 JSON Serialization Best Practices

#### Date Handling

**Problem**: JSON.stringify() converts Dates to strings, losing type information.

**Solution 1: ISO String with Type Marker**:

```typescript
function serializeWithDates(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Date) {
      return {
        __type: 'Date',
        value: value.toISOString(),
      };
    }
    return value;
  });
}

function deserializeWithDates(json: string): any {
  return JSON.parse(json, (key, value) => {
    if (value && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
}
```

**Solution 2: Using super-json**:

```typescript
import { SuperJSON } from 'super-json';

const superJson = new SuperJSON();

const data = {
  createdAt: new Date(),
  processedAt: new Date('2024-01-15'),
};

// Serialize with automatic Date handling
const serialized = superJson.serialize(data);

// Deserialize with automatic Date restoration
const deserialized = superJson.deserialize(serialized);

console.log(deserialized.createdAt instanceof Date); // true
```

**Recommended Library**: `super-json`

---

#### Circular Reference Handling

**Problem**: Objects with circular references break JSON.stringify().

**Solution 1: Custom Replacer**:

```typescript
function serializeSafe(obj: any): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}
```

**Solution 2: Using flatted**:

```typescript
import { parse, stringify } from 'flatted';

const obj = { name: 'test' };
obj.self = obj; // Circular reference

// Handles circular references automatically
const json = stringify(obj);
const parsed = parse(json);
```

**Recommended Library**: `flatted` for complex object graphs

---

#### Schema Validation with Zod

**Problem**: Deserialized JSON may not match expected structure.

**Solution**: Validate with Zod schemas:

```typescript
import { z } from 'zod';

const CheckpointSchema = z.object({
  version: z.literal('1.0'),
  timestamp: z.string().datetime(),
  processedItems: z.array(z.string()),
  currentIndex: z.number().int().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
});

type Checkpoint = z.infer<typeof CheckpointSchema>;

function saveCheckpoint(checkpointPath: string, data: Checkpoint) {
  // Validate before writing
  const validated = CheckpointSchema.parse(data);

  await atomicWrite(checkpointPath, JSON.stringify(validated, null, 2));
}

function loadCheckpoint(checkpointPath: string): Checkpoint {
  const data = JSON.parse(await fs.readFile(checkpointPath, 'utf-8'));

  // Validate after reading
  return CheckpointSchema.parse(data);
}
```

**Recommended**: Always validate checkpoints on load to catch corruption early

---

### 2.3 Checkpoint File Naming Conventions

#### Timestamp-Based Naming

**Pattern**: Include timestamp for chronological ordering and cleanup.

```typescript
function getCheckpointPath(baseDir: string): string {
  const timestamp = Date.now();
  const isoDate = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
  return path.join(baseDir, `checkpoint-${isoDate}-${timestamp}.json`);
}

// Examples:
// checkpoint-2024-01-15T10-30-45-123456789-1705317045123.json
// checkpoint-2024-01-15T10-35-12-987654321-1705317312987.json
```

#### Hash-Based Naming

**Pattern**: Include content hash for deduplication and verification.

```typescript
import { createHash } from 'crypto';

function getCheckpointPathWithHash(baseDir: string, data: any): string {
  const content = JSON.stringify(data);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);

  return path.join(baseDir, `checkpoint-${hash}.json`);
}
```

#### Sequential Naming

**Pattern**: Sequence numbers for simple checkpoint chains.

```typescript
class SequentialCheckpoint {
  private sequence: number = 0;

  getNextPath(baseDir: string): string {
    this.sequence++;
    return path.join(
      baseDir,
      `checkpoint-${this.sequence.toString().padStart(6, '0')}.json`
    );
  }
}
```

---

### 2.4 Retention Policies and Cleanup Strategies

#### Strategy 1: Keep Latest N Checkpoints

```typescript
async function retainLatestN(
  checkpointDir: string,
  count: number = 5
): Promise<void> {
  const files = await fs.readdir(checkpointDir);

  const checkpoints = files
    .filter(f => f.startsWith('checkpoint-'))
    .map(f => ({
      name: f,
      path: path.join(checkpointDir, f),
      mtime: fs.statSync(path.join(checkpointDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime); // Newest first

  // Delete old checkpoints
  for (const old of checkpoints.slice(count)) {
    await fs.remove(old.path);
  }
}
```

#### Strategy 2: Time-Based Retention

```typescript
async function retainRecent(
  checkpointDir: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<void> {
  const files = await fs.readdir(checkpointDir);
  const now = Date.now();

  for (const file of files) {
    if (!file.startsWith('checkpoint-')) continue;

    const filePath = path.join(checkpointDir, file);
    const stats = await fs.stat(filePath);
    const age = now - stats.mtime.getTime();

    if (age > maxAgeMs) {
      await fs.remove(filePath);
    }
  }
}
```

#### Strategy 3: Hybrid Approach

```typescript
interface RetentionPolicy {
  keepLatest: number; // Always keep N latest
  maxAge: number; // Max age in milliseconds
  keepDaily: number; // Keep one per day for N days
  keepWeekly: number; // Keep one per week for N weeks
}

async function applyRetentionPolicy(
  checkpointDir: string,
  policy: RetentionPolicy
): Promise<void> {
  const files = await fs.readdir(checkpointDir);
  const checkpoints = await Promise.all(
    files
      .filter(f => f.startsWith('checkpoint-'))
      .map(async f => {
        const filePath = path.join(checkpointDir, f);
        const stats = await fs.stat(filePath);
        return {
          name: f,
          path: filePath,
          mtime: stats.mtime,
          age: Date.now() - stats.mtime.getTime(),
        };
      })
  );

  // Always keep latest N
  const latestN = checkpoints
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, policy.keepLatest);

  // Keep daily snapshots
  const dailySnapshots = new Map<string, (typeof checkpoints)[0]>();
  for (const cp of checkpoints) {
    const dayKey = cp.mtime.toISOString().split('T')[0];
    if (!dailySnapshots.has(dayKey)) {
      dailySnapshots.set(dayKey, cp);
    }
  }
  const keepDaily = Array.from(dailySnapshots.values())
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, policy.keepDaily);

  // Combine retention sets
  const toKeep = new Set([
    ...latestN.map(cp => cp.path),
    ...keepDaily.map(cp => cp.path),
  ]);

  // Delete others
  for (const cp of checkpoints) {
    if (!toKeep.has(cp.path) && cp.age > policy.maxAge) {
      await fs.remove(cp.path);
    }
  }
}
```

---

## 3. Error Recovery Patterns

### 3.1 Detecting Corrupted Checkpoints

#### Pattern 1: Schema Validation

```typescript
import { z } from 'zod';

const CheckpointSchema = z.object({
  version: z.literal('1.0'),
  timestamp: z.number().int().positive(),
  checksum: z.string(),
  data: z.object({
    // Your checkpoint data structure
  }),
});

async function loadCheckpointWithValidation(
  checkpointPath: string
): Promise<Checkpoint> {
  try {
    const raw = await fs.readFile(checkpointPath, 'utf-8');
    const json = JSON.parse(raw);

    // Validate structure
    const checkpoint = CheckpointSchema.parse(json);

    // Validate checksum
    const calculated = calculateChecksum(checkpoint.data);
    if (calculated !== checkpoint.checksum) {
      throw new CheckpointError('Checksum mismatch - data corrupted');
    }

    return checkpoint;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new CheckpointError('Invalid checkpoint schema', error);
    }
    throw error;
  }
}

function calculateChecksum(data: any): string {
  const content = JSON.stringify(data);
  return createHash('sha256').update(content).digest('hex');
}
```

#### Pattern 2: Version Migration

```typescript
interface CheckpointV1 {
  version: '1.0';
  data: any;
}

interface CheckpointV2 {
  version: '2.0';
  data: any;
  metadata: { createdAt: Date };
}

function migrateCheckpoint(checkpoint: CheckpointV1): CheckpointV2 {
  if (checkpoint.version === '1.0') {
    return {
      version: '2.0',
      data: checkpoint.data,
      metadata: {
        createdAt: new Date(),
      },
    };
  }

  return checkpoint as CheckpointV2;
}

async function loadCheckpointWithMigration(
  checkpointPath: string
): Promise<CheckpointV2> {
  const raw = await fs.readFile(checkpointPath, 'utf-8');
  const checkpoint = JSON.parse(raw);

  // Migrate if needed
  const migrated = migrateCheckpoint(checkpoint);

  // Validate migrated version
  return CheckpointV2Schema.parse(migrated);
}
```

---

### 3.2 Validation Strategies for Checkpoint Integrity

#### Strategy 1: Checksum Validation

```typescript
interface CheckpointWithIntegrity {
  version: string;
  timestamp: number;
  checksum: string;
  data: any;
}

function createCheckpoint(data: any): CheckpointWithIntegrity {
  const content = JSON.stringify(data);
  const checksum = createHash('sha256').update(content).digest('hex');

  return {
    version: '1.0',
    timestamp: Date.now(),
    checksum,
    data,
  };
}

function validateCheckpoint(checkpoint: CheckpointWithIntegrity): boolean {
  const content = JSON.stringify(checkpoint.data);
  const calculated = createHash('sha256').update(content).digest('hex');

  return calculated === checkpoint.checksum;
}
```

#### Strategy 2: Size and Format Checks

```typescript
function quickValidate(checkpointPath: string): boolean {
  try {
    // Check file exists and is readable
    const stats = fs.statSync(checkpointPath);
    if (stats.size === 0) return false;
    if (stats.size > 100 * 1024 * 1024) {
      // 100MB max
      return false;
    }

    // Quick JSON parse test
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    if (!content.trim().startsWith('{')) return false;

    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}
```

---

### 3.3 Rollback Mechanisms

#### Pattern 1: Keep Previous Checkpoint

```typescript
class CheckpointManager {
  private currentPath: string;
  private previousPath: string;

  async save(data: any): Promise<void> {
    // Move current to previous
    if (await this.exists(this.currentPath)) {
      await fs.rename(this.currentPath, this.previousPath);
    }

    try {
      // Write new checkpoint
      await this.atomicWrite(this.currentPath, data);
    } catch (error) {
      // Rollback on failure
      if (await this.exists(this.previousPath)) {
        await fs.rename(this.previousPath, this.currentPath);
      }
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (await this.exists(this.previousPath)) {
      await fs.copy(this.previousPath, this.currentPath);
    }
  }
}
```

#### Pattern 2: Checkpoint Chain

```typescript
interface CheckpointChain {
  checkpoints: string[]; // Paths to checkpoint files
  currentIndex: number;
}

class ChainCheckpointManager {
  async createCheckpoint(data: any): Promise<void> {
    const path = this.getNextPath();
    await atomicWrite(path, data);

    this.chain.checkpoints.push(path);
    this.chain.currentIndex = this.chain.checkpoints.length - 1;

    await this.saveChain();
  }

  async rollback(steps: number = 1): Promise<any> {
    const newIndex = this.chain.currentIndex - steps;
    if (newIndex < 0) {
      throw new Error('Cannot rollback - no earlier checkpoint');
    }

    this.chain.currentIndex = newIndex;
    const checkpointPath = this.chain.checkpoints[newIndex];

    return await this.loadCheckpoint(checkpointPath);
  }

  async loadLatest(): Promise<any> {
    const path = this.chain.checkpoints[this.chain.currentIndex];
    return await this.loadCheckpoint(path);
  }
}
```

---

### 3.4 Fallback Strategies

#### Strategy 1: Use Previous Checkpoint

```typescript
async function loadCheckpointWithFallback(checkpointDir: string): Promise<any> {
  const checkpoints = await this.listCheckpoints(checkpointDir);

  // Try latest first
  for (const checkpoint of checkpoints) {
    try {
      return await this.loadAndValidateCheckpoint(checkpoint);
    } catch (error) {
      console.warn(`Checkpoint ${checkpoint} invalid, trying next...`);
      continue;
    }
  }

  // All checkpoints failed
  throw new Error('No valid checkpoints found. Starting fresh.');
}
```

#### Strategy 2: Partial Recovery

```typescript
async function partialRecovery(
  checkpointPath: string
): Promise<PartialRecovery> {
  try {
    const checkpoint = await loadCheckpointWithValidation(checkpointPath);
    return { status: 'full', data: checkpoint };
  } catch (error) {
    // Try to recover partial data
    try {
      const raw = await fs.readFile(checkpointPath, 'utf-8');
      const partial = JSON.parse(raw);

      // Recover what we can
      const recovered = {
        processedItems: partial.data?.processedItems || [],
        metadata: partial.metadata || {},
        // Use safe defaults for missing data
        currentIndex: 0,
      };

      return {
        status: 'partial',
        data: recovered,
        warnings: ['Some checkpoint data was corrupted'],
      };
    } catch {
      return {
        status: 'failed',
        data: null,
        warnings: ['Checkpoint completely corrupted'],
      };
    }
  }
}
```

#### Strategy 3: Start Over with Diagnostics

```typescript
async function loadOrStartFresh(
  checkpointDir: string,
  initialData: any
): Promise<any> {
  try {
    return await loadCheckpointWithFallback(checkpointDir);
  } catch (error) {
    // Log diagnostic information
    const diagnostics = {
      error: error.message,
      checkpointFiles: await fs.readdir(checkpointDir),
      timestamp: new Date().toISOString(),
    };

    await fs.writeJson(
      path.join(checkpointDir, 'recovery-log.json'),
      diagnostics
    );

    // Start with fresh data
    return initialData;
  }
}
```

---

## 4. Industry Examples

### 4.1 CI/CD Systems

#### GitHub Actions

**Checkpoint Strategy**: Workflow artifacts and step results

**Key Patterns**:

- Each step generates artifacts
- Failed steps can be retried
- Workflow runs can be re-run from failed jobs

**Similar Pattern Implementation**:

```typescript
class WorkflowCheckpoint {
  async saveStepResult(stepName: string, result: any) {
    const artifactPath = path.join(
      this.runDir,
      'artifacts',
      `${stepName}.json`
    );
    await atomicWrite(artifactPath, result);
  }

  async getStepResult(stepName: string) {
    const artifactPath = path.join(
      this.runDir,
      'artifacts',
      `${stepName}.json`
    );

    if (await fileExists(artifactPath)) {
      return await fs.readJson(artifactPath);
    }

    return null; // Step not completed yet
  }

  async resumeFromFailed() {
    const steps = this.getWorkflowSteps();

    for (const step of steps) {
      const result = await this.getStepResult(step.name);

      if (result?.status === 'completed') {
        console.log(`Skipping ${step.name} - already completed`);
        continue;
      }

      if (result?.status === 'failed') {
        console.log(`Retrying ${step.name} - previously failed`);
        await this.executeStep(step);
      }

      // Step hasn't run yet
      await this.executeStep(step);
    }
  }
}
```

---

#### Jenkins

**Checkpoint Strategy**: Build workspace and console output

**Key Patterns**:

- Workspace directory contains build state
- Console logs provide execution history
- Builds can be restarted from failed stages

**Similar Pattern Implementation**:

```typescript
class BuildCheckpoint {
  private workspaceDir: string;

  async saveBuildState(buildData: any) {
    // Save build state to workspace
    await atomicWrite(
      path.join(this.workspaceDir, 'build-state.json'),
      buildData
    );

    // Append to console log
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: 'Checkpoint saved',
      stage: buildData.currentStage,
    };

    await fs.appendFile(
      path.join(this.workspaceDir, 'console.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }

  async resumeBuild() {
    const statePath = path.join(this.workspaceDir, 'build-state.json');

    if (await fileExists(statePath)) {
      const state = await fs.readJson(statePath);
      console.log(`Resuming from stage: ${state.currentStage}`);

      // Continue from saved state
      return state;
    }

    // Fresh build
    return { currentStage: 'init' };
  }
}
```

---

### 4.2 Workflow Engines

#### Apache Airflow

**Checkpoint Strategy**: Task instance state in database

**Key Patterns**:

- Each task's state stored in database
- Tasks can be cleared and rerun
- Workflow DAG preserved between runs

**Key Takeaways**:

1. Database-backed state is more reliable than files
2. Individual task states allow granular retry
3. Task dependencies prevent invalid state transitions

**File-Based Adaptation**:

```typescript
class AirflowStyleCheckpoint {
  private taskStates: Map<string, TaskState> = new Map();

  async updateTaskState(taskId: string, state: TaskState) {
    // Update in-memory state
    this.taskStates.set(taskId, state);

    // Persist to file
    await this.persistTaskStates();
  }

  async canRunTask(taskId: string, dependencies: string[]): Promise<boolean> {
    // Check all dependencies are successful
    for (const depId of dependencies) {
      const depState = this.taskStates.get(depId);
      if (depState?.status !== 'success') {
        return false;
      }
    }

    // Check task hasn't already run
    const taskState = this.taskStates.get(taskId);
    return taskState?.status !== 'success';
  }

  async clearTaskState(taskId: string) {
    this.taskStates.delete(taskId);
    await this.persistTaskStates();
  }

  async rerunFailedTasks() {
    for (const [taskId, state] of this.taskStates) {
      if (state.status === 'failed') {
        await this.clearTaskState(taskId);
      }
    }
  }
}
```

---

#### Temporal

**Checkpoint Strategy**: Durable execution history

**Key Patterns**:

- Workflow history contains all events
- Commands generated deterministically
- State replayed from history on restart

**Key Takeaways**:

1. Event sourcing provides complete audit trail
2. Deterministic workflow code enables replay
3. Workflow state is reconstructed from history

**File-Based Adaptation**:

```typescript
interface HistoryEvent {
  eventId: number;
  eventType: string;
  timestamp: number;
  data: any;
}

class EventSourcedCheckpoint {
  private history: HistoryEvent[] = [];

  async recordEvent(eventType: string, data: any) {
    const event: HistoryEvent = {
      eventId: this.history.length,
      eventType,
      timestamp: Date.now(),
      data,
    };

    this.history.push(event);
    await this.persistHistory();
  }

  async replay(): Promise<any> {
    let state = this.getInitialState();

    for (const event of this.history) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  async rebuildFromHistory(historyPath: string) {
    const historyData = await fs.readJson(historyPath);
    this.history = historyData;

    return await this.replay();
  }

  private applyEvent(state: any, event: HistoryEvent): any {
    switch (event.eventType) {
      case 'TASK_STARTED':
        return { ...state, currentTask: event.data.taskId };
      case 'TASK_COMPLETED':
        return {
          ...state,
          completedTasks: [...state.completedTasks, event.data.taskId],
        };
      default:
        return state;
    }
  }
}
```

---

### 4.3 Database Migration Tools

#### Prisma Migrate

**Checkpoint Strategy**: Migration history table

**Key Patterns**:

- `_prisma_migrations` table tracks applied migrations
- Each migration is atomic (all-or-nothing)
- Failed migrations can be rolled back

**Key Takeaways**:

1. Transactional migrations ensure consistency
2. Migration order matters
3. Rollback requires inverse migrations

**File-Based Adaptation**:

```typescript
class MigrationCheckpoint {
  async applyMigration(migration: Migration) {
    const transaction = await this.beginTransaction();

    try {
      // Apply migration changes
      await migration.up(transaction);

      // Record migration
      await this.recordMigration(migration.id, transaction);

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      // Rollback on failure
      await transaction.rollback();
      throw error;
    }
  }

  async getAppliedMigrations(): Promise<string[]> {
    const history = await this.loadMigrationHistory();
    return history.map(m => m.id);
  }

  async rollbackMigration(migrationId: string) {
    const migration = await this.loadMigration(migrationId);

    const transaction = await this.beginTransaction();

    try {
      await migration.down(transaction);
      await this.removeMigrationRecord(migrationId, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

---

#### Flyway

**Checkpoint Strategy**: Versioned migration scripts with checksums

**Key Patterns**:

- Migration files have version numbers
- Checksums validate file integrity
- Failed migrations mark state as failed

**Key Takeaways**:

1. Version numbers enforce order
2. Checksums detect file modifications
3. Failed state requires manual intervention

**File-Based Adaptation**:

```typescript
class VersionedMigration {
  async applyPendingMigrations() {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations(applied);

    for (const migration of pending) {
      const expectedChecksum = this.calculateChecksum(migration);

      if (migration.checksum !== expectedChecksum) {
        throw new Error(`Migration ${migration.version} has been modified`);
      }

      try {
        await this.applyMigration(migration);
        await this.recordMigration(migration);
      } catch (error) {
        await this.markMigrationFailed(migration, error);
        throw error;
      }
    }
  }

  async repairFailedMigration(version: string) {
    const failed = await this.getMigrationRecord(version);

    if (failed?.status !== 'failed') {
      throw new Error('Migration is not in failed state');
    }

    // Mark as pending for retry
    await this.removeMigrationRecord(version);
  }
}
```

---

## 5. Common Pitfalls and Solutions

### Pitfall 1: Non-Atomic Writes

**Problem**: Writing directly to target file can corrupt data on interruption.

**Bad Example**:

```typescript
// DON'T DO THIS
await fs.writeFile('checkpoint.json', JSON.stringify(data));
```

**Solution**: Use atomic write pattern

```typescript
// DO THIS
const tmpPath = 'checkpoint.json.tmp';
await fs.writeFile(tmpPath, JSON.stringify(data));
await fs.rename(tmpPath, 'checkpoint.json');
```

---

### Pitfall 2: Date Serialization Issues

**Problem**: Dates become strings, losing type information.

**Bad Example**:

```typescript
// DON'T DO THIS
const data = { createdAt: new Date() };
await fs.writeFile('checkpoint.json', JSON.stringify(data));

// Later: createdAt is a string, not a Date
```

**Solution**: Use super-json or custom replacer

```typescript
// DO THIS
import { stringify, parse } from 'super-json';

const data = { createdAt: new Date() };
await fs.writeFile('checkpoint.json', stringify(data));

// Later: Date is properly restored
const restored = parse(await fs.readFile('checkpoint.json', 'utf-8'));
```

---

### Pitfall 3: Circular Reference Errors

**Problem**: Objects with circular references break JSON.stringify().

**Bad Example**:

```typescript
// DON'T DO THIS
const obj = { name: 'test' };
obj.self = obj;
JSON.stringify(obj); // Throws: Converting circular structure to JSON
```

**Solution**: Use flatted or circular-safe replacer

```typescript
// DO THIS
import { stringify, parse } from 'flatted';

const obj = { name: 'test' };
obj.self = obj;
const json = stringify(obj); // Works!
```

---

### Pitfall 4: No Validation on Load

**Problem**: Corrupted checkpoints cause runtime errors later.

**Bad Example**:

```typescript
// DON'T DO THIS
const data = JSON.parse(fs.readFileSync('checkpoint.json'));
// data might be missing required fields
```

**Solution**: Validate with Zod schema

```typescript
// DO THIS
const CheckpointSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  processedItems: z.array(z.string()),
});

const raw = JSON.parse(fs.readFileSync('checkpoint.json'));
const data = CheckpointSchema.parse(raw); // Throws if invalid
```

---

### Pitfall 5: Unbounded Checkpoint Growth

**Problem**: Checkpoints accumulate without cleanup.

**Bad Example**:

```typescript
// DON'T DO THIS
// Creates new checkpoint on every save
await fs.writeFile(`checkpoint-${Date.now()}.json`, data);
// Never cleans up old files
```

**Solution**: Implement retention policy

```typescript
// DO THIS
class CheckpointManager {
  async save(data: any) {
    await this.writeCheckpoint(data);
    await this.cleanupOldCheckpoints(5); // Keep only 5 latest
  }

  async cleanupOldCheckpoints(retainCount: number) {
    const files = await this.listCheckpoints();
    const toDelete = files.slice(retainCount);

    for (const file of toDelete) {
      await fs.remove(file);
    }
  }
}
```

---

### Pitfall 6: Race Conditions on Concurrent Access

**Problem**: Multiple processes write to same checkpoint file.

**Bad Example**:

```typescript
// DON'T DO THIS
// Process 1 and 2 both read, modify, and write
const data = JSON.parse(fs.readFileSync('checkpoint.json'));
data.count++;
await fs.writeFile('checkpoint.json', JSON.stringify(data));
// One write will be lost
```

**Solution**: Use file locking

```typescript
// DO THIS
import lockfile from 'proper-lockfile';

const release = await lockfile.lock('checkpoint.json');
try {
  const data = JSON.parse(fs.readFileSync('checkpoint.json'));
  data.count++;
  await fs.writeFile('checkpoint.json', JSON.stringify(data));
} finally {
  await release();
}
```

---

### Pitfall 7: Not Handling SIGINT/SIGTERM

**Problem**: Process interruption without state save.

**Bad Example**:

```typescript
// DON'T DO THIS
// No signal handlers
while (processing) {
  await processItem();
  // If user presses Ctrl+C here, state is lost
}
await saveCheckpoint(); // Never reached
```

**Solution**: Handle shutdown signals

```typescript
// DO THIS
let shutdownRequested = false;

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  shutdownRequested = true;
});

while (!shutdownRequested && processing) {
  await processItem();

  if (shutdownRequested) {
    await saveCheckpoint();
    break;
  }
}
```

---

### Pitfall 8: Inconsistent State After Partial Failure

**Problem**: Only some data written before failure.

**Bad Example**:

```typescript
// DON'T DO THIS
// Writes multiple files
await fs.writeFile('checkpoint-1.json', data1);
await fs.writeFile('checkpoint-2.json', data2);
await fs.writeFile('checkpoint-3.json', data3);
// If fails after 1 and 2, state is inconsistent
```

**Solution**: Use atomic batch writes or transactions

```typescript
// DO THIS
// Write single checkpoint with all data
await atomicWrite(
  'checkpoint.json',
  JSON.stringify({
    data1,
    data2,
    data3,
  })
);
```

---

## 6. Library Recommendations

### For Simple File-Based Checkpointing

**Recommended**: `fs-extra`

**Why**:

- Built-in atomic operations
- Cross-platform compatibility
- No additional dependencies for basic use

**Code Example**:

```typescript
import fs from 'fs-extra';

class SimpleCheckpoint {
  async save(path: string, data: any) {
    await fs.writeJson(path, data, { spaces: 2 });
  }

  async load(path: string) {
    return await fs.readJson(path);
  }
}
```

**npm**: https://www.npmjs.com/package/fs-extra

---

### For Complex Object Serialization

**Recommended**: `super-json`

**Why**:

- Handles Date, RegExp, Error, BigInt
- Handles circular references
- Preserves type information
- TypeScript support

**Code Example**:

```typescript
import { SuperJSON } from 'super-json';

const superJson = new SuperJSON();

const data = {
  date: new Date(),
  regex: /test/g,
  error: new Error('test'),
  bigint: 123n,
};

const serialized = superJson.serialize(data);
const deserialized = superJson.deserialize(serialized);
```

**npm**: https://www.npmjs.com/package/super-json

---

### For Circular References

**Recommended**: `flatted`

**Why**:

- Minimal size
- Fast performance
- Simple API
- Works with any circular structure

**Code Example**:

```typescript
import { parse, stringify } from 'flatted';

const obj = { name: 'test' };
obj.self = obj;

const json = stringify(obj);
const parsed = parse(json);
```

**npm**: https://www.npmjs.com/package/flatted

---

### For Schema Validation

**Recommended**: `zod`

**Why**:

- TypeScript-first
- Runtime type validation
- Excellent error messages
- Composable schemas

**Code Example**:

```typescript
import { z } from 'zod';

const CheckpointSchema = z.object({
  version: z.string(),
  timestamp: z.number(),
  data: z.object({
    items: z.array(z.string()),
  }),
});

type Checkpoint = z.infer<typeof CheckpointSchema>;

function validateCheckpoint(data: unknown): Checkpoint {
  return CheckpointSchema.parse(data);
}
```

**npm**: https://www.npmjs.com/package/zod

---

### For File Locking

**Recommended**: `proper-lockfile`

**Why**:

- Cross-platform (Windows/Linux/macOS)
- Automatic stale lock detection
- Retry mechanisms
- Promise-based API

**Code Example**:

```typescript
import lockfile from 'proper-lockfile';

const release = await lockfile.lock('checkpoint.json', {
  retries: {
    retries: 5,
    minTimeout: 100,
    maxTimeout: 500,
  },
});

try {
  // Critical section
  await updateCheckpoint();
} finally {
  await release();
}
```

**npm**: https://www.npmjs.com/package/proper-lockfile

---

### For Workflow Orchestration

**Recommended**: `Temporal` (for complex workflows)

**Why**:

- Built-in durable execution
- Automatic retries
- State management
- Excellent observability

**Documentation**: https://docs.temporal.io/typescript

**Recommended**: `BullMQ` (for task queues)

**Why**:

- Redis-based (simple setup)
- Job persistence
- Retry policies
- Great dashboard

**Documentation**: https://docs.bullmq.io/

---

### For State Machines

**Recommended**: `XState`

**Why**:

- Visual debugging
- TypeScript support
- State history
- Event-driven

**Documentation**: https://xstate.js.org/

---

## 7. Implementation Checklist

### Phase 1: Design

- [ ] Define checkpoint data structure
- [ ] Choose serialization format (JSON recommended)
- [ ] Plan checkpoint frequency (per task, N items, time-based)
- [ ] Determine retention policy (count, time, hybrid)
- [ ] Design validation schema (Zod recommended)

### Phase 2: Core Implementation

- [ ] Implement atomic write pattern
- [ ] Implement checkpoint save function
- [ ] Implement checkpoint load function
- [ ] Add schema validation on load
- [ ] Add checksum/integrity checking
- [ ] Implement versioning/migration strategy

### Phase 3: Error Handling

- [ ] Handle corrupted checkpoints (validation)
- [ ] Implement rollback mechanism
- [ ] Add fallback to previous checkpoint
- [ ] Add recovery mode (start fresh if all fail)
- [ ] Log diagnostic information on failures

### Phase 4: Cleanup and Maintenance

- [ ] Implement retention policy
- [ ] Add automatic cleanup of old checkpoints
- [ ] Add manual cleanup command/utility
- [ ] Monitor checkpoint file sizes
- [ ] Add checkpoint compression if needed

### Phase 5: Signal Handling

- [ ] Add SIGINT handler (Ctrl+C)
- [ ] Add SIGTERM handler (kill command)
- [ ] Flush pending state on shutdown
- [ ] Save final checkpoint on exit
- [ ] Ensure cleanup handlers run in finally blocks

### Phase 6: Testing

- [ ] Test atomic write behavior
- [ ] Test corrupted checkpoint recovery
- [ ] Test rollback mechanism
- [ ] Test signal handling (send SIGINT during execution)
- [ ] Test concurrent access (if applicable)
- [ ] Test cleanup and retention policies
- [ ] Test with large datasets
- [ ] Test version migration

### Phase 7: Observability

- [ ] Log checkpoint save/load operations
- [ ] Track checkpoint file sizes
- [ ] Monitor save/load performance
- [ ] Add metrics for recovery success rate
- [ ] Log validation failures with details

### Phase 8: Documentation

- [ ] Document checkpoint file format
- [ ] Document recovery procedures
- [ ] Document manual cleanup process
- [ ] Document common error scenarios
- [ ] Add examples of checkpoint structure

---

## Key Takeaways

1. **Always use atomic writes**: Write to temp file, then rename
2. **Validate on load**: Use Zod or similar to catch corruption early
3. **Handle Dates properly**: Use super-json or custom replacer
4. **Implement retention**: Don't let checkpoints grow unbounded
5. **Handle shutdown signals**: Save state on SIGINT/SIGTERM
6. **Add checksums**: Detect data corruption
7. **Support rollback**: Keep previous checkpoint for recovery
8. **Plan for migration**: Version your checkpoint format
9. **Test recovery**: Simulate failures and corruption
10. **Log everything**: Diagnostic info is crucial for debugging

---

## Additional Resources

### Documentation

- **Node.js File System**: https://nodejs.org/api/fs.html
- **Temporal TypeScript SDK**: https://docs.temporal.io/typescript
- **XState Docs**: https://xstate.js.org/docs/
- **BullMQ Docs**: https://docs.bullmq.io/

### Libraries

- **fs-extra**: https://www.npmjs.com/package/fs-extra
- **super-json**: https://www.npmjs.com/package/super-json
- **flatted**: https://www.npmjs.com/package/flatted
- **zod**: https://www.npmjs.com/package/zod
- **proper-lockfile**: https://www.npmjs.com/package/proper-lockfile

### Patterns and Best Practices

- Atomic File Operations: https://man7.org/linux/man-pages/man2/rename.2.html
- Event Sourcing: https://martinfowler.com/eaaDev/EventSourcing.html
- State Machine Patterns: https://refactoring.guru/design-patterns/state

---

## Conclusion

Effective checkpoint/recovery patterns are essential for building resilient long-running applications. The key is to:

1. **Use atomic writes** to prevent corruption
2. **Validate everything** to catch errors early
3. **Plan for failure** with rollback and recovery mechanisms
4. **Handle edge cases** like Dates, circular references, and concurrent access
5. **Implement cleanup** to prevent resource exhaustion
6. **Test thoroughly** especially error scenarios

The patterns and libraries discussed in this document provide a solid foundation for implementing robust checkpoint/recovery mechanisms in TypeScript/Node.js applications. Choose the approach that best fits your complexity level and infrastructure constraints.
