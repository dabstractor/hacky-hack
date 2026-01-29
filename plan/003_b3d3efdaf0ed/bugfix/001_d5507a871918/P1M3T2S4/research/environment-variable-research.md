# Environment Variable Guard Research

## Overview

Research on implementing environment variable guards for preventing nested PRP Pipeline execution using `PRP_PIPELINE_RUNNING` environment variable with PID tracking.

## Key Findings from Codebase Analysis

### 1. Existing Environment Variable Patterns

**Location:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

The PRP Pipeline has extensive logging and a try-finally cleanup pattern in the `run()` method:

```typescript
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  try {
    // ... workflow steps ...
  } catch (error) {
    // ... error handling ...
  } finally {
    // Always cleanup, even if interrupted or errored
    await this.cleanup();
  }
}
```

**Key Observations:**

- The `run()` method already has a `try-catch-finally` structure
- The `finally` block calls `cleanup()` which handles:
  - Progress display cleanup
  - Resource monitor stopping
  - State preservation
  - Signal handler removal

### 2. Environment Variable Usage Patterns

**From codebase grep analysis:**

**Setting environment variables:**

- Rare in the codebase (only 3 instances found)
- Used for fallback defaults in README.md and CONFIGURATION.md
- Pattern: `process.env.VAR = value` (value is always stored as string)

**Deleting environment variables:**

- Extensive use in tests for cleanup (100+ instances)
- Pattern: `delete process.env.VAR;`

**String-based PID handling:**

- All PIDs are consistently converted to strings
- Pattern: `process.pid.toString()` for storage and comparison
- Environment variables always store string values

### 3. Existing Test Structure

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts`

Tests already exist for the nested execution guard functionality:

```typescript
describe('Nested Execution Guard', () => {
  it('should allow execution when PRP_PIPELINE_RUNNING is not set', () => {
    delete process.env.PRP_PIPELINE_RUNNING;
    expect(process.env.PRP_PIPELINE_RUNNING).toBeUndefined();
  });

  it('should set PRP_PIPELINE_RUNNING to current PID on valid entry', () => {
    expect(process.pid).toBeGreaterThan(0);
  });

  it('should block execution when PRP_PIPELINE_RUNNING is already set', () => {
    vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
    expect(process.env.PRP_PIPELINE_RUNNING).toBe('99999');
  });
});
```

**Important:** Tests use `vi.unstubAllEnvs()` in `afterEach` to restore environment between tests.

### 4. Architecture Documentation

**Location:** `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/002_external_dependencies.md`

Section 4 provides the implementation pattern:

```typescript
const GUARD_VAR_NAME = 'PRP_PIPELINE_RUNNING';

export function validateNestedExecutionGuard(options: {
  logger: Logger;
  sessionPath?: string;
}): void {
  const { logger, sessionPath } = options;
  const existingPid = process.env[GUARD_VAR_NAME];
  const currentPid = process.pid.toString();

  // Case 1: No pipeline running - allow execution
  if (!existingPid) {
    process.env[GUARD_VAR_NAME] = currentPid;
    logger.debug(`Set ${GUARD_VAR_NAME}=${currentPid}`);
    return;
  }

  // Case 2: Same PID - allow (rare edge case)
  if (existingPid === currentPid) {
    logger.debug(`Guard already set to current PID ${currentPid}`);
    return;
  }

  // Case 3: Check for legitimate bug fix recursion
  const skipBugFinding = process.env.SKIP_BUG_FINDING;
  const isBugfixSession =
    sessionPath?.toLowerCase().includes('bugfix') ?? false;

  if (skipBugFinding === 'true' && isBugfixSession) {
    logger.debug(
      `Allowing bug fix recursion: SKIP_BUG_FINDING=true, path contains 'bugfix'`
    );
    return;
  }

  // Case 4: Block nested execution
  throw new NestedExecutionError(
    `Pipeline already running (PID ${existingPid}). ` +
      `Use SKIP_BUG_FINDING=true in bugfix sessions to allow legitimate recursion.`,
    existingPid,
    currentPid
  );
}

export function clearNestedExecutionGuard(): void {
  delete process.env[GUARD_VAR_NAME];
}
```

### 5. Try-Finally Cleanup Patterns

**From codebase analysis:**

**Resource disposal pattern** (`src/utils/token-counter.ts`):

```typescript
try {
  return counter.countTokens(text);
} finally {
  counter.dispose();
}
```

**Semaphore release pattern** (`src/core/concurrent-executor.ts`):

```typescript
} finally {
  // Always release semaphore slot
  semaphore.release();
  this.#logger.debug(
    { subtaskId: subtask.id, available: semaphore.available },
    'Released semaphore slot'
  );
  // Flush state updates atomically
  await this.#orchestrator.sessionManager.flushUpdates();
}
```

**Key pattern:** Always perform cleanup in `finally` block with debug logging.

## Node.js Best Practices

### From Research Agents

**Official Node.js Documentation URLs:**

- Process API: https://nodejs.org/api/process.html
- process.env: https://nodejs.org/docs/latest-v20.x/api/process.html#processenv
- process.pid: https://nodejs.org/docs/latest-v20.x/api/process.html#processpid

**Key Best Practices:**

1. **process.env always stores strings:**

   ```typescript
   process.env.MY_VAR = 123;
   console.log(typeof process.env.MY_VAR); // "string"
   ```

2. **Always convert PID to string:**

   ```typescript
   const currentPid = process.pid.toString();
   process.env.PRP_PIPELINE_RUNNING = currentPid;
   ```

3. **Clean up environment variables:**

   ```typescript
   delete process.env.PRP_PIPELINE_RUNNING;
   ```

4. **Use try-finally for cleanup:**
   ```typescript
   try {
     // Set guard
     process.env.PRP_PIPELINE_RUNNING = process.pid.toString();
     // Do work
   } finally {
     // Clear guard
     if (process.env.PRP_PIPELINE_RUNNING === process.pid.toString()) {
       delete process.env.PRP_PIPELINE_RUNNING;
     }
   }
   ```

## Implementation Requirements

From the work item specification:

1. **Set PRP_PIPELINE_RUNNING after validation passes:**
   - Use `process.pid` for current process ID
   - Convert to string: `process.pid.toString()`
   - Debug log: `Set PRP_PIPELINE_RUNNING={process.pid}`

2. **Wrap PRP Pipeline run() method body in try-finally:**
   - Set guard in try block
   - Clear guard in finally block

3. **Clear only our own PID:**
   - Check: `if (process.env.PRP_PIPELINE_RUNNING === process.pid.toString())`
   - Then: `delete process.env.PRP_PIPELINE_RUNNING`
   - Log: `Cleared PRP_PIPELINE_RUNNING`

## Critical Implementation Details

1. **String comparison:** Always compare PIDs as strings
2. **PID ownership:** Only clear if we own the guard (same PID)
3. **Debug logging:** Add both set and clear operations
4. **Finally block:** Ensures cleanup even on errors
5. **Test cleanup:** Use `vi.unstubAllEnvs()` in test afterEach

## Related Files

- `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts` - Main implementation location
- `/home/dustin/projects/hacky-hack/tests/unit/nested-execution-guard.test.ts` - Test structure (already exists)
- `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/architecture/002_external_dependencies.md` - Implementation specification
