# Pipeline Result Patterns - Research & Best Practices

## Overview

Research findings on return types and result patterns for multi-step workflows in TypeScript, focusing on comprehensive summaries, statistics collection, and error reporting.

---

## Key Resources & Documentation

### Result Type Libraries
- **Neverthrow** - https://github.com/supermacro/neverthrow
  - Result<T, E> type for error handling
  - Functional error handling patterns
  - Chaining and composition

- **Effect-TS** - https://github.com/Effect-TS/effect
  - Comprehensive error handling
  - Resource management
  - Concurrent operations

- **Pratica** - https://github.com/MartinKazil/pratica
  - Maybe, Either, and Async types
  - Functional programming utilities
  - Type-safe error handling

- **Ts-Result** - https://github.com/gdelmas/TS-Result
  - Simple Result type
  - Ok and Err variants
  - Type-safe chaining

- ** fp-ts** - https://github.com/gcanti/fp-ts
  - Functional programming in TypeScript
  - Either, Task, Option types
  - Category theory fundamentals

### Validation Libraries
- **Zod** - https://github.com/colinhacks/zod
  - Schema validation
  - Type inference
  - Error formatting

- **io-ts** - https://github.com/gcanti/io-ts
  - Runtime type validation
  - Codec patterns
  - Combinator-based

- **Runtypes** - https://github.com/pelotom/runtypes
  - Runtime validation
  - Type reflection
  - Union types

---

## Best Practices for Pipeline Results

### 1. Discriminated Union Result Types

Use discriminated unions for type-safe results:

```typescript
// Pattern: Discriminated union result
type PipelineResult<TData, TError = Error> =
  | { success: true; data: TData; error?: never }
  | { success: false; data?: never; error: TError };

// Usage
async function executePipeline(): Promise<PipelineResult<string>> {
  try {
    const result = await doWork();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Type narrowing
const result = await executePipeline();

if (result.success) {
  // TypeScript knows result.data is string here
  console.log(result.data.toUpperCase());
} else {
  // TypeScript knows result.error is Error here
  console.error(result.error.message);
}
```

**Benefits:**
- Type-safe error handling
- Explicit success/failure
- No runtime type checks needed
- Self-documenting API

### 2. Structured Error Types

Provide detailed error context:

```typescript
// Pattern: Structured error type
interface PipelineError {
  code: string;
  message: string;
  step: string;
  stepNumber: number;
  timestamp: Date;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

// Usage
class PipelineExecutor {
  async execute(): Promise<PipelineResult<string, PipelineError>> {
    try {
      return { success: true, data: 'result' };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STEP_FAILED',
          message: 'Step execution failed',
          step: 'validate',
          stepNumber: 1,
          timestamp: new Date(),
          originalError: error,
          context: { input: 'value' },
        },
      };
    }
  }
}
```

**Advantages:**
- Rich error context
- Easy debugging
- Error categorization
- Audit trail

### 3. Validation Result Collection

Collect all validation results:

```typescript
// Pattern: Validation result collection
interface ValidationResult {
  level: number;
  description: string;
  success: boolean;
  command?: string;
  output?: string;
  error?: string;
  timestamp: Date;
}

interface PipelineSummary {
  success: boolean;
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  skippedValidations: number;
  results: ValidationResult[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

// Usage (similar to your PRPExecutor)
class Validator {
  async validate(gates: ValidationGate[]): Promise<PipelineSummary> {
    const startTime = new Date();
    const results: ValidationResult[] = [];

    for (const gate of gates) {
      const result = await this.executeGate(gate);
      results.push(result);

      if (!result.success) {
        break; // Stop on first failure
      }
    }

    const endTime = new Date();

    return {
      success: results.every(r => r.success),
      totalValidations: results.length,
      passedValidations: results.filter(r => r.success).length,
      failedValidations: results.filter(r => !r.success && !r.skipped).length,
      skippedValidations: results.filter(r => r.skipped).length,
      results,
      duration: endTime.getTime() - startTime.getTime(),
      startTime,
      endTime,
    };
  }
}
```

**Benefits:**
- Comprehensive validation tracking
- Detailed statistics
- Time tracking
- Clear pass/fail summary

### 4. Artifact Tracking

Track all produced artifacts:

```typescript
// Pattern: Artifact tracking
interface Artifact {
  type: 'file' | 'directory' | 'url' | 'memory';
  path: string;
  size?: number;
  hash?: string;
  metadata?: Record<string, unknown>;
  created: Date;
}

interface PipelineResultWithArtifacts<TData, TError = Error> {
  success: boolean;
  data?: TData;
  error?: TError;
  artifacts: Artifact[];
  statistics: {
    totalArtifacts: number;
    totalSize: number;
    filesCreated: number;
    directoriesCreated: number;
  };
}

// Usage
class Pipeline {
  private artifacts: Artifact[] = [];

  async execute(): Promise<PipelineResultWithArtifacts<string>> {
    const startTime = Date.now();

    // Create artifacts
    await this.createArtifact('/path/to/file.txt');

    const data = await doWork();

    return {
      success: true,
      data,
      artifacts: this.artifacts,
      statistics: this.calculateStatistics(),
    };
  }

  private async createArtifact(path: string): Promise<void> {
    const stats = await fs.stat(path);
    this.artifacts.push({
      type: 'file',
      path,
      size: stats.size,
      hash: await this.calculateHash(path),
      created: new Date(),
    });
  }

  private calculateStatistics() {
    return {
      totalArtifacts: this.artifacts.length,
      totalSize: this.artifacts.reduce((sum, a) => sum + (a.size || 0), 0),
      filesCreated: this.artifacts.filter(a => a.type === 'file').length,
      directoriesCreated: this.artifacts.filter(a => a.type === 'directory').length,
    };
  }
}
```

**Advantages:**
- Track all outputs
- Size calculations
- Hash verification
- Metadata storage

### 5. Performance Metrics

Include performance timing:

```typescript
// Pattern: Performance metrics
interface StepMetrics {
  stepName: string;
  stepNumber: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  memory: {
    before: number;
    after: number;
    delta: number;
  };
  success: boolean;
  error?: string;
}

interface PipelinePerformance {
  totalDuration: number;
  averageStepDuration: number;
  slowestStep: StepMetrics;
  fastestStep: StepMetrics;
  memoryUsage: {
    peak: number;
    average: number;
  };
  steps: StepMetrics[];
}

// Usage
class InstrumentedPipeline {
  async execute(steps: Array<() => Promise<void>>): Promise<PipelinePerformance> {
    const stepMetrics: StepMetrics[] = [];
    const startTime = Date.now();
    let peakMemory = 0;

    for (let i = 0; i < steps.length; i++) {
      const stepStartTime = Date.now();
      const memoryBefore = process.memoryUsage().heapUsed;

      try {
        await steps[i]();

        const stepEndTime = Date.now();
        const memoryAfter = process.memoryUsage().heapUsed;

        stepMetrics.push({
          stepName: `Step ${i + 1}`,
          stepNumber: i,
          duration: stepEndTime - stepStartTime,
          startTime: new Date(stepStartTime),
          endTime: new Date(stepEndTime),
          memory: {
            before: memoryBefore,
            after: memoryAfter,
            delta: memoryAfter - memoryBefore,
          },
          success: true,
        });

        peakMemory = Math.max(peakMemory, memoryAfter);
      } catch (error) {
        stepMetrics.push({
          stepName: `Step ${i + 1}`,
          stepNumber: i,
          duration: Date.now() - stepStartTime,
          startTime: new Date(stepStartTime),
          endTime: new Date(),
          memory: {
            before: memoryBefore,
            after: process.memoryUsage().heapUsed,
            delta: 0,
          },
          success: false,
          error: String(error),
        });
        break;
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      totalDuration,
      averageStepDuration: totalDuration / stepMetrics.length,
      slowestStep: stepMetrics.reduce((max, m) => (m.duration > max.duration ? m : max)),
      fastestStep: stepMetrics.reduce((min, m) => (m.duration < min.duration ? m : min)),
      memoryUsage: {
        peak: peakMemory,
        average: stepMetrics.reduce((sum, m) => sum + m.memory.after, 0) / stepMetrics.length,
      },
      steps: stepMetrics,
    };
  }
}
```

**Benefits:**
- Performance bottleneck identification
- Memory leak detection
- Optimization guidance
- Historical comparison

### 6. Retry Attempt Tracking

Track retry attempts:

```typescript
// Pattern: Retry tracking
interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  delay: number;
  error: string;
  success: boolean;
}

interface RetrySummary {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  totalDelay: number;
  attempts: RetryAttempt[];
}

// Usage (similar to your PRPExecutor and PRPGenerator)
class RetryableOperation {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<{ data?: T; retrySummary: RetrySummary }> {
    const attempts: RetryAttempt[] = [];

    for (let i = 0; i < maxAttempts; i++) {
      const attemptStartTime = Date.now();

      try {
        const data = await operation();

        attempts.push({
          attemptNumber: i + 1,
          timestamp: new Date(attemptStartTime),
          delay: 0,
          error: '',
          success: true,
        });

        return {
          data,
          retrySummary: {
            totalAttempts: i + 1,
            successfulAttempts: 1,
            failedAttempts: i,
            totalDelay: attempts.reduce((sum, a) => sum + a.delay, 0),
            attempts,
          },
        };
      } catch (error) {
        const delay = Math.min(baseDelay * Math.pow(2, i), 30000);

        attempts.push({
          attemptNumber: i + 1,
          timestamp: new Date(attemptStartTime),
          delay,
          error: String(error),
          success: false,
        });

        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      retrySummary: {
        totalAttempts: maxAttempts,
        successfulAttempts: 0,
        failedAttempts: maxAttempts,
        totalDelay: attempts.reduce((sum, a) => sum + a.delay, 0),
        attempts,
      },
    };
  }
}
```

**Advantages:**
- Retry pattern visibility
- Delay tracking
- Failure analysis
- Pattern optimization

---

## Common Pitfalls to Avoid

### 1. Loss of Type Safety

```typescript
// BAD: Loose typing
interface BadResult {
  success: boolean;
  data?: any;
  error?: any;
}

// GOOD: Strict typing
interface GoodResult<TData, TError> {
  success: boolean;
  data?: TData;
  error?: TError;
}
```

### 2. Missing Context

```typescript
// BAD: Generic error
return {
  success: false,
  error: new Error('Failed'),
};

// GOOD: Detailed context
return {
  success: false,
  error: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    step: 'validateInput',
    stepNumber: 2,
    timestamp: new Date(),
    originalError: error,
    context: { input, schema: 'UserSchema' },
  },
};
```

### 3. No Statistics

```typescript
// BAD: Just data
return {
  success: true,
  data: result,
};

// GOOD: Include stats
return {
  success: true,
  data: result,
  statistics: {
    totalItems: 100,
    processedItems: 100,
    failedItems: 0,
    skippedItems: 0,
    duration: 5000,
    averageItemDuration: 50,
  },
};
```

### 4. Missing Timing Information

```typescript
// BAD: No timing
interface Result {
  success: boolean;
  data: unknown;
}

// GOOD: Include timing
interface Result {
  success: boolean;
  data: unknown;
  timing: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}
```

### 5. Swallowed Errors

```typescript
// BAD: Error without details
catch (error) {
  return { success: false, error: 'Failed' };
}

// GOOD: Preserve error
catch (error) {
  return {
    success: false,
    error: {
      code: 'OPERATION_FAILED',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      originalError: error,
    },
  };
}
```

---

## Implementation Examples from Your Codebase

### PRPExecutor Result Pattern

Located at: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts` (lines 29-73)

```typescript
export interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
}

export interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
}
```

**Strengths:**
- Detailed validation results
- Comprehensive stdout/stderr capture
- Retry attempt tracking
- Clear success boolean

**Potential Improvements:**
```typescript
export interface ValidationGateResult {
  readonly level: 1 | 2 | 3 | 4;
  readonly description: string;
  readonly success: boolean;
  readonly command: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly skipped: boolean;
  // ADD: Timing information
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly duration?: number;
}

export interface ExecutionResult {
  readonly success: boolean;
  readonly validationResults: ValidationGateResult[];
  readonly artifacts: string[];
  readonly error?: string;
  readonly fixAttempts: number;
  // ADD: Summary statistics
  readonly summary?: {
    totalValidations: number;
    passedValidations: number;
    failedValidations: number;
    skippedValidations: number;
  };
  // ADD: Timing
  readonly timing?: {
    startedAt: Date;
    completedAt: Date;
    totalDuration: number;
  };
}
```

### TaskOrchestrator Status Pattern

Located at: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` (lines 163-192)

```typescript
public async setStatus(
  itemId: string,
  status: Status,
  reason?: string
): Promise<void> {
  const currentItem = findItem(this.#backlog, itemId);
  const oldStatus = currentItem?.status ?? 'Unknown';
  const timestamp = new Date();

  console.log(
    `[TaskOrchestrator] Status: ${itemId} ${oldStatus} → ${status}${reason ? ` (${reason})` : ''}`
  );
  console.log(`[TaskOrchestrator] Timestamp: ${timestamp}`);

  await this.sessionManager.updateItemStatus(itemId, status);
  await this.#refreshBacklog();
}
```

**Strengths:**
- Old status capture
- Timestamp tracking
- Reason parameter
- Logging

**Potential Improvements:**
```typescript
interface StatusTransition {
  readonly itemId: string;
  readonly oldStatus: Status;
  readonly newStatus: Status;
  readonly reason?: string;
  readonly timestamp: Date;
  readonly triggeredBy: 'system' | 'user' | 'dependency';
}

public async setStatus(
  itemId: string,
  status: Status,
  reason?: string,
  triggeredBy: StatusTransition['triggeredBy'] = 'system'
): Promise<StatusTransition> {
  const currentItem = findItem(this.#backlog, itemId);
  const oldStatus = currentItem?.status ?? 'Unknown';
  const timestamp = new Date();

  const transition: StatusTransition = {
    itemId,
    oldStatus,
    newStatus: status,
    reason,
    timestamp,
    triggeredBy,
  };

  // Store transition history
  this.#transitionHistory.push(transition);

  await this.sessionManager.updateItemStatus(itemId, status);
  await this.#refreshBacklog();

  return transition;
}
```

---

## Recommended Next Steps

1. **Add Result Type Utilities**
   - Create Result<T, E> type
   - Add helper functions (map, chain, unwrap)
   - Support async operations

2. **Add Summary Generation**
   - Calculate statistics
   - Generate human-readable summary
   - Support JSON serialization

3. **Add Timing Metrics**
   - Track per-step duration
   - Calculate total duration
   - Identify bottlenecks

4. **Add Artifact Collection**
   - Track all files created
   - Calculate sizes
   - Generate hash checksums

5. **Add Result Comparison**
   - Compare two pipeline runs
   - Highlight differences
   - Trend analysis

---

## Additional Resources

- [Neverthrow Documentation](https://github.com/supermacro/neverthrow)
- [Effect-TS Documentation](https://effect.website/)
- [Pratica Documentation](https://github.com/MartinKazil/pratica)
- [Zod Validation](https://zod.dev/)
- [Error Handling Best Practices](https://medium.com/@david.dalbusco/typescript-error-handling-neverthrow-benefit-d30b01772360)
- [Functional Error Handling](https://www.jstobigdata.com/tags/functional-programming/)
