# Step Orchestration - Research & Best Practices

## Overview

Research findings on async operation chaining patterns for TypeScript, focusing on proper error handling, retry logic, and sequential/parallel execution coordination.

---

## Key Resources & Documentation

### Orchestration Libraries
- **Temporal.io** - https://docs.temporal.io/learn/activities
  - Durable activity execution
  - Automatic retry with exponential backoff
  - Activity timeouts and heartbeats

- **BullMQ** - https://docs.bullmq.io/guide/jobs/job-flow
  - Job dependencies and flows
  - Child jobs and parent jobs
  - Job priorities and concurrency

- **Oxidation** - https://github.com/garyb/reactive-oxide
  - Lightweight async orchestration
  - Cancellation tokens
  - Resource cleanup

- **Promise Chains** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  - Native JavaScript promise chaining
  - Error propagation
  - Sequential execution

### Async Patterns
- **Async/Await** - https://javascript.info/async-await
  - Syntactic sugar for promises
  - Try/catch error handling
  - Sequential execution flow

- **Promise.all** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  - Parallel execution
  - All-or-nothing semantics
  - Rejection handling

- **Promise.allSettled** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  - Parallel execution with individual results
  - Continues on individual failures
  - Better error granularity

---

## Best Practices for Step Orchestration

### 1. Type-Safe Step Definitions

Define clear input/output types for each step:

```typescript
// Pattern: Type-safe step function
type Step<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

// Workflow definition
interface WorkflowSteps {
  validate: Step<unknown, ValidationResult>;
  transform: Step<ValidationResult, TransformedData>;
  save: Step<TransformedData, SaveResult>;
}

// Implementation
const steps: WorkflowSteps = {
  validate: async (input) => {
    // Validation logic
    return { valid: true, data: input };
  },
  transform: async (result) => {
    // Transformation logic
    return { transformed: result.data };
  },
  save: async (data) => {
    // Save logic
    return { success: true };
  },
};
```

**Benefits:**
- Compile-time type checking
- Clear data flow
- IDE autocomplete
- Refactoring safety

### 2. Sequential Execution with Error Handling

Chain steps with proper error propagation:

```typescript
// Pattern: Sequential pipeline
class SequentialPipeline<TInput, TOutput> {
  constructor(private steps: Array<Step<unknown, unknown>>) {}

  async execute(input: TInput): Promise<TOutput> {
    let current = input;

    for (const step of this.steps) {
      try {
        current = await step(current);
      } catch (error) {
        // Wrap error with context
        throw new StepError(
          step.name,
          current,
          error
        );
      }
    }

    return current as TOutput;
  }
}

// Custom error with context
class StepError extends Error {
  constructor(
    public readonly stepName: string,
    public readonly input: unknown,
    originalError: unknown
  ) {
    super(
      `Step "${stepName}" failed: ${
        originalError instanceof Error
          ? originalError.message
          : String(originalError)
      }`
    );
    this.name = 'StepError';
  }
}
```

**Advantages:**
- Explicit error context
- Easy debugging
- Step-level error handling
- Clear failure points

### 3. Parallel Execution with Coordination

Execute independent steps in parallel:

```typescript
// Pattern: Parallel execution with allSettled
class ParallelExecutor {
  async executeAll<TInput, TOutput>(
    steps: Array<Step<TInput, TOutput>>,
    input: TInput
  ): Promise<Array<{ success: boolean; result?: TOutput; error?: Error }>> {
    // Execute all steps in parallel
    const results = await Promise.allSettled(
      steps.map(step => step(input))
    );

    // Transform to structured results
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, result: result.value };
      } else {
        return { success: false, error: result.reason };
      }
    });
  }
}

// Usage
const executor = new ParallelExecutor();
const results = await executor.executeAll(
  [validateStep, checkStep, auditStep],
  inputData
);

// Check results
const allSucceeded = results.every(r => r.success);
const failures = results.filter(r => !r.success);
```

**Benefits:**
- Concurrent execution
- Individual error handling
- Partial success support
- Better performance

### 4. Retry Logic with Exponential Backoff

Implement robust retry logic:

```typescript
// Pattern: Retry decorator
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryIf?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryIf = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!retryIf(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      // Calculate exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      console.warn(
        `Attempt ${attempt + 1}/${maxAttempts} failed. ` +
        `Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
const result = await withRetry(
  () => fetchAPI(),
  {
    maxAttempts: 5,
    baseDelay: 2000,
    retryIf: (error) => error instanceof NetworkError,
  }
);
```

**Key Features:**
- Configurable attempts
- Exponential backoff
- Conditional retry
- Detailed logging

### 5. Cancellation Support

Support mid-execution cancellation:

```typescript
// Pattern: AbortController integration
class CancellableWorkflow {
  async execute(
    input: unknown,
    signal?: AbortSignal
  ): Promise<unknown> {
    // Check for cancellation
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Step 1
    const step1Result = await this.withCancellation(
      () => this.step1(input),
      signal
    );

    // Step 2
    const step2Result = await this.withCancellation(
      () => this.step2(step1Result),
      signal
    );

    return step2Result;
  }

  private async withCancellation<T>(
    fn: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
    ]);
  }
}

// Usage
const controller = new AbortController();
const workflow = new CancellableWorkflow();

// Start execution
const resultPromise = workflow.execute(input, controller.signal);

// Cancel if needed
setTimeout(() => controller.abort(), 5000);
```

**Benefits:**
- Clean cancellation
- Resource cleanup
- Timeout support
- User cancellation

### 6. Progress Tracking

Report progress during execution:

```typescript
// Pattern: Progress callbacks
interface ProgressInfo {
  step: number;
  total: number;
  stepName: string;
  percentComplete: number;
}

type ProgressCallback = (progress: ProgressInfo) => void;

class ProgressiveWorkflow {
  async execute(
    steps: Array<Step<unknown, unknown>>,
    input: unknown,
    onProgress?: ProgressCallback
  ): Promise<unknown> {
    let current = input;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Report progress
      onProgress?.({
        step: i + 1,
        total: steps.length,
        stepName: step.name,
        percentComplete: (i / steps.length) * 100,
      });

      // Execute step
      current = await step(current);
    }

    // Report completion
    onProgress?.({
      step: steps.length,
      total: steps.length,
      stepName: 'Complete',
      percentComplete: 100,
    });

    return current;
  }
}

// Usage
const workflow = new ProgressiveWorkflow();
await workflow.execute(
  [step1, step2, step3],
  input,
  (progress) => {
    console.log(
      `Progress: ${progress.step}/${progress.total} ` +
      `(${progress.percentComplete.toFixed(1)}%) - ${progress.stepName}`
    );
  }
);
```

**Advantages:**
- User feedback
- UI updates
- Monitoring integration
- Debugging visibility

---

## Common Pitfalls to Avoid

### 1. Swallowed Errors in Promises

```typescript
// BAD: Errors swallowed
Promise.all([
  step1(),
  step2(),
  step3(),
]).then(() => {
  console.log('All done');
}); // Errors ignored

// GOOD: Catch errors
try {
  await Promise.all([step1(), step2(), step3()]);
  console.log('All done');
} catch (error) {
  console.error('Failed:', error);
}
```

### 2. Missing Error Context

```typescript
// BAD: Generic error handling
try {
  await step1();
  await step2();
  await step3();
} catch (error) {
  console.error('Failed'); // Which step?
}

// GOOD: Step-specific errors
try {
  await step1();
} catch (error) {
  throw new StepError('step1', input, error);
}

try {
  await step2();
} catch (error) {
  throw new StepError('step2', input, error);
}
```

### 3. Unbounded Parallelism

```typescript
// BAD: Too many parallel operations
const results = await Promise.all(
  items.map(item => processItem(item)) // 1000 parallel requests
);

// GOOD: Limit concurrency
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent
const results = await Promise.all(
  items.map(item => limit(() => processItem(item)))
);
```

### 4. No Timeout Handling

```typescript
// BAD: Hangs forever
await step1();

// GOOD: Timeout protection
await withTimeout(step1(), 5000);

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });

  return Promise.race([promise, timeout]);
}
```

### 5. Race Conditions in Sequential Steps

```typescript
// BAD: Shared mutable state
let shared = { value: 0 };

async function badWorkflow() {
  await step1(shared); // Modifies shared
  await step2(shared); // Reads and modifies
  await step3(shared); // Reads and modifies
}

// GOOD: Immutable state passing
async function goodWorkflow() {
  const result1 = await step1({ value: 0 });
  const result2 = await step2(result1);
  const result3 = await step3(result2);
}
```

---

## Implementation Examples from Your Codebase

### PRPExecutor Orchestration

Located at: `/home/dustin/projects/hacky-hack/src/agents/prp-executor.ts`

**Key Patterns:**

1. **Fix-and-Retry Loop** (lines 262-290)
   ```typescript
   while (fixAttempts <= maxFixAttempts) {
     validationResults = await this.#runValidationGates(prp);
     const allPassed = validationResults.every(r => r.success || r.skipped);

     if (allPassed) {
       break; // Success!
     }

     if (fixAttempts < maxFixAttempts) {
       fixAttempts++;
       const delay = Math.min(2000 * Math.pow(2, fixAttempts - 1), 30000);
       console.warn(`Validation failed. Fix attempt ${fixAttempts}/${maxFixAttempts}...`);
       await this.#sleep(delay);
       await this.#fixAndRetry(prp, validationResults, fixAttempts);
     } else {
       break; // Exhausted fix attempts
     }
   }
   ```
   - Retry loop with exponential backoff
   - Clear success condition
   - Detailed logging
   - Maximum attempt limit

2. **Sequential Validation Gates** (lines 326-384)
   ```typescript
   for (const gate of sortedGates) {
     if (gate.manual || gate.command === null) {
       results.push({ /* skipped */ });
       continue;
     }

     const result = await this.#bashMCP.execute_bash({
       command: gate.command,
       cwd: this.sessionPath,
       timeout: 120000,
     });

     results.push(gateResult);

     if (!gateResult.success) {
       console.error(`Validation Level ${gate.level} failed`);
       break; // Stop on first failure
     }
   }
   ```
   - Sequential execution
   - Skip manual gates
   - Timeout per command
   - Stop on first failure

3. **Structured Error Types** (lines 82-134)
   ```typescript
   export class PRPExecutionError extends Error {
     constructor(
       public readonly taskId: string,
       public readonly prpPath: string,
       originalError: unknown
     ) {
       super(`Failed to execute PRP for ${taskId}...`);
       this.name = 'PRPExecutionError';
     }
   }

   export class ValidationError extends Error {
     constructor(
       public readonly level: number,
       public readonly command: string,
       public readonly stdout: string,
       public readonly stderr: string
     ) {
       super(`Validation failed at Level ${level}...`);
       this.name = 'ValidationError';
     }
   }
   ```
   - Custom error classes
   - Context preservation
   - Clear error semantics
   - Type-safe error handling

### PRPGenerator Orchestration

Located at: `/home/dustin/projects/hacky-hack/src/agents/prp-generator.ts`

**Key Patterns:**

1. **Retry Loop with Exponential Backoff** (lines 169-227)
   ```typescript
   for (let attempt = 0; attempt < maxRetries; attempt++) {
     try {
       const prompt = createPRPBlueprintPrompt(task, backlog, process.cwd());
       const result = await this.#researcherAgent.prompt(prompt);
       const validated = PRPDocumentSchema.parse(result);
       await this.#writePRPToFile(validated);
       return validated;
     } catch (error) {
       if (error instanceof PRPFileError) {
         throw error; // Don't retry file write failures
       }

       if (attempt === maxRetries - 1) {
         throw new PRPGenerationError(task.id, attempt + 1, error);
       }

       const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
       console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
       await new Promise(resolve => setTimeout(resolve, delay));
     }
   }
   ```
   - Retry with exponential backoff
   - Different retry logic for different errors
   - Detailed logging
   - Custom error types

---

## Recommended Next Steps

1. **Add Cancellation Support**
   - Integrate AbortController
   - Add timeout to long-running operations
   - Implement cleanup on cancellation

2. **Add Progress Callbacks**
   - Report step completion
   - Calculate percentage complete
   - Support progress bars in CLI

3. **Add Concurrency Limits**
   - Use p-limit or similar
   - Prevent resource exhaustion
   - Add queue management

4. **Add Circuit Breaker**
   - Stop after N consecutive failures
   - Add cooldown period
   - Automatic recovery

5. **Add Observability**
   - Emit events for each step
   - Track execution metrics
   - Support distributed tracing

---

## Additional Resources

- [Promise Best Practices](https://javascript.info/promise-basics)
- [Async/Await Best Practices](https://github.com/yortus/asyncawait-patterns)
- [Error Handling in Async Functions](https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/)
- [Temporal Activity Best Practices](https://docs.temporal.io/best-practices/activities)
- [BullMQ Flow Guide](https://docs.bullmq.io/guide/job-flow)
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Promise Concurrency](https://github.com/sindresorhus/p-queue)
