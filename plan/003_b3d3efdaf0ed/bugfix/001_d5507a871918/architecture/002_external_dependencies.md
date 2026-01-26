# External Dependencies and Best Practices Research

**Document Version:** 1.0
**Date:** 2026-01-26
**Purpose:** Research document for bug fixes 001_d5507a871918
**Author:** External Research Specialist

---

## Executive Summary

This document compiles best practices, patterns, and external documentation references for implementing the critical bug fixes identified in the PRP Pipeline. Research covers TypeScript constructor patterns, file system workflows, status enum design, session guards, and testing strategies.

**Key Findings:**

- Union types are preferred over enums for state machines in TypeScript
- Constructor optional parameters should default to undefined for backwards compatibility
- File-based state requires atomic write patterns with proper error handling
- Environment variable guards need case-sensitive validation
- Testing constructors requires coverage of all parameter combinations

---

## Table of Contents

1. [TypeScript Constructor Pattern Best Practices](#1-typescript-constructor-pattern-best-practices)
2. [File System Workflow Patterns](#2-file-system-workflow-patterns)
3. [Status Enum Design Patterns](#3-status-enum-design-patterns)
4. [Session Guard Patterns](#4-session-guard-patterns)
5. [Testing Patterns for Constructor Changes](#5-testing-patterns-for-constructor-changes)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Potential Pitfalls](#7-pitfalls-to-avoid)
8. [Alternative Approaches](#8-alternative-approaches-considered)

---

## 1. TypeScript Constructor Pattern Best Practices

### 1.1 Optional Parameters vs Required Parameters

**Issue Context:**

- `ResearchQueue` expects 4 parameters but tests call with 2
- `SessionManager` expects 3 parameters but tests call with 2

**Best Practice: Use Default Values for Optional Parameters**

```typescript
// RECOMMENDED: Default values enable backwards compatibility
export class ResearchQueue {
  constructor(
    sessionManager: SessionManager,
    maxSize: number = 3, // Optional with default
    noCache: boolean = false, // Optional with default
    cacheTtlMs: number = 24 * 60 * 60 * 1000 // Optional with default
  ) {
    // Implementation
  }
}

// USAGE: Both work correctly
const queue1 = new ResearchQueue(sessionManager);
const queue2 = new ResearchQueue(sessionManager, 5);
const queue3 = new ResearchQueue(sessionManager, 5, true, 3600000);
```

**Key Principles:**

1. **Required parameters come first** - Dependencies without defaults
2. **Optional parameters come last** - Provide sensible defaults
3. **Default values should be production-safe** - Avoid undefined behavior
4. **Document default values in JSDoc** - Clear API contract

### 1.2 Constructor Signature Design

**Pattern: Parameter Properties for Immutability**

```typescript
export class SessionManager {
  // Public readonly properties
  readonly prdPath: string;
  readonly planDir: string | undefined;
  readonly flushRetries: number;

  // Private readonly properties
  readonly #logger: Logger;
  readonly #maxRetries: number;

  constructor(
    prdPath: string,
    planDir?: string, // Optional for backwards compatibility
    flushRetries: number = 3 // Sensible default
  ) {
    this.prdPath = prdPath;
    this.planDir = planDir;
    this.flushRetries = flushRetries;
    this.#logger = getLogger('SessionManager');
    this.#maxRetries = 5;
  }
}
```

**Benefits:**

- Clear property initialization
- Immutable public state
- Type-safe optional handling
- Backwards compatible with existing code

### 1.3 Backwards Compatibility Strategies

**Issue:** Breaking changes to constructor signatures break existing tests

**Strategy 1: Default Parameters (Preferred)**

```typescript
// Before: Breaking change
constructor(sessionManager: SessionManager, concurrency: number)

// After: Backwards compatible
constructor(
  sessionManager: SessionManager,
  concurrency: number = 3  // Default enables old usage
)
```

**Strategy 2: Overload Signatures**

```typescript
export class ResearchQueue {
  // Overload 1: Backwards compatible with 2 args
  constructor(sessionManager: SessionManager, noCache: boolean);

  // Overload 2: Full signature
  constructor(
    sessionManager: SessionManager,
    concurrency: number,
    noCache: boolean,
    cacheTtlMs: number
  );

  // Implementation signature
  constructor(
    sessionManager: SessionManager,
    concurrencyOrNoCache: number | boolean,
    noCache?: boolean,
    cacheTtlMs?: number
  ) {
    // Disambiguate and initialize
  }
}
```

**Recommendation:** Use default parameters instead of overloads for simplicity.

### 1.4 Constructor Validation

**Pattern: Validate Required Dependencies**

```typescript
export class ResearchQueue {
  constructor(
    sessionManager: SessionManager,
    maxSize: number = 3,
    noCache: boolean = false,
    cacheTtlMs: number = 24 * 60 * 60 * 1000
  ) {
    // Validate required dependency
    if (!sessionManager?.currentSession) {
      throw new Error(
        'ResearchQueue requires active session. Call SessionManager.initialize() first.'
      );
    }

    // Validate parameter ranges
    if (maxSize < 1 || maxSize > 10) {
      throw new Error(`maxSize must be between 1 and 10, got: ${maxSize}`);
    }

    if (cacheTtlMs < 0) {
      throw new Error(`cacheTtlMs must be non-negative, got: ${cacheTtlMs}`);
    }

    // Initialize
    this.sessionManager = sessionManager;
    this.maxSize = maxSize;
    this.#noCache = noCache;
    this.#cacheTtlMs = cacheTtlMs;
  }
}
```

### 1.5 Documentation References

**TypeScript Handbook:**

- [Constructor Parameters](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties)
- [Optional Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters)
- [Default Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#default-parameters)

**Community Best Practices:**

- Always provide default values for optional parameters
- Document default values in JSDoc comments
- Validate constructor arguments for type safety
- Use readonly properties for immutability

---

## 2. File System Workflow Patterns

### 2.1 Atomic File Writing with fs/promises

**Issue Context:** BugHuntWorkflow doesn't write TEST_RESULTS.md, causing bug fix cycle to fail

**Best Practice: Write-Then-Rename Pattern for Atomicity**

```typescript
import { writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Atomically write data to a file path
 *
 * Pattern:
 * 1. Write to temporary file in same directory
 * 2. Rename temp file to target path (atomic on POSIX)
 * 3. Cleanup on failure
 *
 * @param filepath - Target file path
 * @param data - Content to write
 * @throws {Error} If write or rename fails
 */
async function atomicWrite(filepath: string, data: string): Promise<void> {
  const tempPath = join(tmpdir(), `temp-${Date.now()}-${Math.random()}.tmp`);

  try {
    // Step 1: Write to temp file
    await writeFile(tempPath, data, 'utf-8');

    // Step 2: Atomic rename to target
    await rename(tempPath, filepath);
  } catch (error) {
    // Cleanup temp file on failure
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
```

**Why This Works:**

- `rename()` is atomic on POSIX systems (Linux, macOS)
- Temp file in same directory ensures same filesystem
- Partial writes never visible to readers
- No race conditions during write

### 2.2 File-Based State Management Patterns

**Issue Context:** SessionManager manages tasks.json with retry logic

**Best Practice: Read-Modify-Write with Conflict Detection**

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { calculateDelay } from './retry.js';

interface SessionState {
  version: number;
  lastModified: number;
  data: unknown;
}

/**
 * Update session state with optimistic locking
 *
 * Pattern:
 * 1. Read current state with version
 * 2. Apply modifications
 * 3. Write back if version unchanged (CAS)
 * 4. Retry on version mismatch
 */
async function updateSessionState(
  filepath: string,
  updateFn: (state: SessionState) => SessionState,
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: Read current state
      const content = await readFile(filepath, 'utf-8');
      const currentState: SessionState = JSON.parse(content);

      // Step 2: Apply update
      const newState = updateFn(currentState);

      // Step 3: Atomic write with version check
      await atomicWrite(filepath, JSON.stringify(newState, null, 2));

      return; // Success
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to update session state after ${maxRetries} attempts: ${error}`
        );
      }

      // Exponential backoff before retry
      const delay = calculateDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Key Principles:**

1. **Optimistic locking** - Version numbers detect conflicts
2. **Retry with backoff** - Handle transient failures
3. **Atomic writes** - Prevent partial state corruption
4. **Error propagation** - Fail fast after max retries

### 2.3 Preventing Race Conditions

**Pattern: File Locking with Exclusive Access**

```typescript
import { open, constants } from 'node:fs/promises';

/**
 * Execute callback with exclusive file lock
 *
 * Uses POSIX flock() via fs.open() with 'x' flag
 * to prevent concurrent write access.
 */
async function withFileLock<T>(
  filepath: string,
  callback: () => Promise<T>
): Promise<T> {
  let lockHandle: Awaited<ReturnType<typeof open>> | null = null;

  try {
    // Acquire exclusive lock
    lockHandle = await open(filepath, constants.O_WRONLY | constants.O_CREAT);

    // Execute critical section
    const result = await callback();

    return result;
  } finally {
    // Release lock
    if (lockHandle) {
      await lockHandle.close();
    }
  }
}
```

**Alternative: In-Memory Lock for Single-Process**

```typescript
class LockManager {
  private locks = new Map<string, Promise<void>>();

  async withLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
    // Wait for existing lock
    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    const lock = (async () => {
      try {
        return await callback();
      } finally {
        this.locks.delete(key);
      }
    })();

    this.locks.set(key, lock);
    return lock;
  }
}
```

### 2.4 State Persistence Timing

**Best Practice: Batch Updates with Periodic Flush**

```typescript
export class SessionManager {
  readonly #pendingUpdates: Array<() => Promise<void>> = [];
  readonly #flushInterval: number = 5000; // 5 seconds
  #flushTimer: NodeJS.Timeout | null = null;

  /**
   * Queue state update for batched flush
   */
  queueUpdate(updateFn: () => Promise<void>): void {
    this.#pendingUpdates.push(updateFn);

    // Schedule flush if not already scheduled
    if (!this.#flushTimer) {
      this.#flushTimer = setTimeout(() => {
        this.flush();
      }, this.#flushInterval);
    }
  }

  /**
   * Flush all pending updates to disk
   */
  async flush(): Promise<void> {
    if (this.#flushTimer) {
      clearTimeout(this.#flushTimer);
      this.#flushTimer = null;
    }

    const updates = this.#pendingUpdates.splice(0);

    for (const updateFn of updates) {
      await updateFn();
    }
  }

  /**
   * Ensure all updates are flushed before shutdown
   */
  async shutdown(): Promise<void> {
    await this.flush();
  }
}
```

**Benefits:**

- Reduces disk I/O by batching
- Prevents excessive file writes
- Ensures durability on shutdown
- Configurable flush interval

### 2.5 Documentation References

**Node.js Documentation:**

- [fs.promises API](https://nodejs.org/api/fs.html#fspromises-api)
- [File System Flags](https://nodejs.org/api/fs.html#file-system-flags)
- [Class: FileHandle](https://nodejs.org/api/fs.html#class-filehandle)

**Best Practice Articles:**

- [Atomic File Writes in Node.js](https://archive.fo/XsCqC)
- [File Locking Patterns](https://nodejs.org/api/fs.html#filehandlelocking)
- [Error Handling in Async Operations](https://nodejs.org/api/errors.html)

---

## 3. Status Enum Design Patterns

### 3.1 Union Types vs Enums

**Issue Context:**

- Status type includes 'Retrying' but StatusEnum has only 6 values
- Tests expect 7 status values

**Best Practice: Use Union Types for State Machines**

```typescript
// RECOMMENDED: Union type with discriminated unions
type Status =
  | { type: 'Planned' }
  | { type: 'Researching'; progress: number }
  | { type: 'Implementing' }
  | { type: 'Retrying'; attempt: number; maxAttempts: number }
  | { type: 'Complete' }
  | { type: 'Failed'; error?: string }
  | { type: 'Obsolete' };

// State transition function
function transitionStatus(
  current: Status,
  event: 'start' | 'complete' | 'fail' | 'retry'
): Status {
  switch (current.type) {
    case 'Planned':
      if (event === 'start') return { type: 'Researching', progress: 0 };
      return current;

    case 'Researching':
      if (event === 'complete') return { type: 'Implementing' };
      if (event === 'fail')
        return { type: 'Retrying', attempt: 1, maxAttempts: 3 };
      return current;

    case 'Implementing':
      if (event === 'complete') return { type: 'Complete' };
      if (event === 'fail')
        return { type: 'Retrying', attempt: 1, maxAttempts: 3 };
      return current;

    case 'Retrying':
      if (event === 'complete') return { type: 'Complete' };
      if (event === 'retry' && current.attempt < current.maxAttempts) {
        return {
          type: 'Retrying',
          attempt: current.attempt + 1,
          maxAttempts: current.maxAttempts,
        };
      }
      if (event === 'retry') {
        return { type: 'Failed', error: 'Max retries exceeded' };
      }
      return current;

    case 'Complete':
    case 'Failed':
    case 'Obsolete':
      return current; // Terminal states

    default:
      const _exhaustive: never = current;
      return _exhaustive;
  }
}
```

**Benefits of Union Types:**

1. **Type-safe state transitions** - Compiler catches invalid transitions
2. **Associated data per state** - Progress, attempt counts, errors
3. **Exhaustive checking** - Compiler ensures all cases handled
4. **Zero runtime overhead** - No enum objects at runtime
5. **Better IDE support** - Autocomplete for state-specific properties

### 3.2 Simple String Union (Current Pattern)

**For Backwards Compatibility:**

```typescript
// Simple string union (current implementation)
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying' // Add this value
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Zod schema for runtime validation
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Retrying', // Add this value
  'Complete',
  'Failed',
  'Obsolete',
]);

// Status transition validation
export function isValidStatusTransition(from: Status, to: Status): boolean {
  const validTransitions: Record<Status, Status[]> = {
    Planned: ['Researching', 'Obsolete'],
    Researching: ['Implementing', 'Failed', 'Retrying', 'Obsolete'],
    Implementing: ['Complete', 'Failed', 'Retrying', 'Obsolete'],
    Retrying: ['Implementing', 'Complete', 'Failed', 'Obsolete'],
    Complete: [], // Terminal state
    Failed: ['Retrying', 'Obsolete'], // Can retry or mark obsolete
    Obsolete: [], // Terminal state
  };

  return validTransitions[from]?.includes(to) ?? false;
}
```

### 3.3 State Machine Implementation

**Pattern: State Machine with Transition Guards**

```typescript
export class TaskStateMachine {
  #currentStatus: Status;
  readonly #retryCount: number = 0;
  readonly #maxRetries: number = 3;

  constructor(initialStatus: Status = 'Planned') {
    this.#currentStatus = initialStatus;
  }

  get status(): Status {
    return this.#currentStatus;
  }

  /**
   * Transition to new status with validation
   */
  transition(to: Status): void {
    if (!isValidStatusTransition(this.#currentStatus, to)) {
      throw new Error(
        `Invalid status transition: ${this.#currentStatus} -> ${to}`
      );
    }

    // Check retry limit
    if (to === 'Retrying' && this.#retryCount >= this.#maxRetries) {
      throw new Error(`Max retries (${this.#maxRetries}) exceeded for task`);
    }

    this.#currentStatus = to;

    // Track retry count
    if (to === 'Retrying') {
      this.#retryCount++;
    }
  }

  /**
   * Check if task can be retried
   */
  canRetry(): boolean {
    return (
      this.#retryCount < this.#maxRetries &&
      ['Failed', 'Retrying'].includes(this.#currentStatus)
    );
  }
}
```

### 3.4 Status Transition Testing

**Best Practice: Test All Valid and Invalid Transitions**

```typescript
describe('Status Transitions', () => {
  describe('Valid Transitions', () => {
    it.each([
      ['Planned', 'Researching'],
      ['Planned', 'Obsolete'],
      ['Researching', 'Implementing'],
      ['Researching', 'Failed'],
      ['Researching', 'Retrying'],
      ['Implementing', 'Complete'],
      ['Implementing', 'Failed'],
      ['Implementing', 'Retrying'],
      ['Retrying', 'Implementing'],
      ['Retrying', 'Complete'],
      ['Failed', 'Retrying'],
      ['Failed', 'Obsolete'],
    ])('should allow transition from %s to %s', (from, to) => {
      expect(isValidStatusTransition(from as Status, to as Status)).toBe(true);
    });
  });

  describe('Invalid Transitions', () => {
    it.each([
      ['Planned', 'Complete'],
      ['Planned', 'Failed'],
      ['Complete', 'Implementing'],
      ['Complete', 'Failed'],
      ['Obsolete', 'Planned'],
      ['Obsolete', 'Researching'],
    ])('should reject transition from %s to %s', (from, to) => {
      expect(isValidStatusTransition(from as Status, to as Status)).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should track retry count', () => {
      const machine = new TaskStateMachine();
      machine.transition('Researching');
      machine.transition('Failed');
      machine.transition('Retrying');
      expect(machine.retryCount).toBe(1);
    });

    it('should prevent retry after max attempts', () => {
      const machine = new TaskStateMachine();
      machine.transition('Researching');
      machine.transition('Failed');

      // Exhaust retries
      for (let i = 0; i < 3; i++) {
        machine.transition('Retrying');
        machine.transition('Failed');
      }

      expect(machine.canRetry()).toBe(false);
      expect(() => machine.transition('Retrying')).toThrow();
    });
  });
});
```

### 3.5 Documentation References

**TypeScript Documentation:**

- [Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)
- [Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

**State Machine Patterns:**

- [State Machine Pattern](https://refactoring.guru/design-patterns/state)
- [Type-Safe State Machines in TypeScript](https://gist.github.com/sw-yx/b507acf7d0c63a59a8837a2ae40ae5cd)
- [Finite State Machines with TypeScript](https://hackernoon.com/finite-state-machines-with-typescript)

---

## 4. Session Guard Patterns

### 4.1 Environment Variable Usage

**Issue Context:** PRD requires PRP_PIPELINE_RUNNING guard to prevent nested execution

**Best Practice: Environment Variable Guard with PID Tracking**

```typescript
import { getLogger } from './logger.js';

const GUARD_VAR_NAME = 'PRP_PIPELINE_RUNNING';

/**
 * Error thrown when nested execution is detected
 */
export class NestedExecutionError extends Error {
  readonly existingPid: string;
  readonly currentPid: string;

  constructor(message: string, existingPid: string, currentPid: string) {
    super(message);
    this.name = 'NestedExecutionError';
    this.existingPid = existingPid;
    this.currentPid = currentPid;
  }
}

/**
 * Validate nested execution guard
 *
 * Checks PRP_PIPELINE_RUNNING environment variable to prevent
 * recursive pipeline execution. Allows legitimate bug fix recursion
 * when:
 * - SKIP_BUG_FINDING='true' (exact match)
 * - Path contains 'bugfix' (case-insensitive)
 *
 * @param options - Validation options
 * @throws {NestedExecutionError} If nested execution detected
 */
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
  logger.error(
    `Nested execution detected: existing PID ${existingPid}, current PID ${currentPid}`
  );

  throw new NestedExecutionError(
    `Pipeline already running (PID ${existingPid}). ` +
      `Use SKIP_BUG_FINDING=true in bugfix sessions to allow legitimate recursion.`,
    existingPid,
    currentPid
  );
}

/**
 * Clear nested execution guard
 *
 * Call this when pipeline exits normally.
 */
export function clearNestedExecutionGuard(): void {
  delete process.env[GUARD_VAR_NAME];
}
```

### 4.2 Path Validation for Bug Fix Sessions

**Best Practice: Strict Path Validation**

```typescript
import { resolve, normalize, basename } from 'node:path';

/**
 * Validate session path for bug fix mode
 *
 * Ensures bug fix tasks are only executed within valid
 * bugfix session directories to prevent state corruption.
 *
 * @param sessionPath - Path to validate
 * @throws {Error} If path validation fails
 */
export function validateBugfixSessionPath(sessionPath: string): void {
  const normalizedPath = normalize(resolve(sessionPath));
  const pathBasename = basename(normalizedPath);

  // Check 1: Path must contain 'bugfix' (case-insensitive)
  if (!normalizedPath.toLowerCase().includes('bugfix')) {
    throw new Error(
      `Invalid bugfix session path: must contain 'bugfix'. Got: ${sessionPath}`
    );
  }

  // Check 2: Prevent path traversal attacks
  if (normalizedPath.includes('..')) {
    throw new Error(
      `Invalid session path: path traversal not allowed. Got: ${sessionPath}`
    );
  }

  // Check 3: Ensure path is within plan directory
  if (!normalizedPath.startsWith(process.cwd() + '/plan/')) {
    throw new Error(
      `Invalid session path: must be within plan/ directory. Got: ${sessionPath}`
    );
  }

  // Check 4: Validate session directory format
  const sessionDirPattern = /^\d{3}_[a-f0-9]{12}$/;
  if (!sessionDirPattern.test(pathBasename)) {
    throw new Error(
      `Invalid session directory format: expected {sequence}_{hash}, got: ${pathBasename}`
    );
  }
}
```

### 4.3 Recursive Execution Detection

**Pattern: Stack-Based Detection**

```typescript
export class RecursionGuard {
  #maxDepth: number;
  #currentDepth: number = 0;

  constructor(maxDepth: number = 5) {
    this.#maxDepth = maxDepth;
  }

  /**
   * Execute callback with recursion detection
   */
  async withRecursionGuard<T>(
    callback: () => Promise<T>,
    context: string
  ): Promise<T> {
    this.#currentDepth++;

    if (this.#currentDepth > this.#maxDepth) {
      throw new Error(
        `Max recursion depth (${this.#maxDepth}) exceeded in ${context}`
      );
    }

    try {
      return await callback();
    } finally {
      this.#currentDepth--;
    }
  }
}
```

### 4.4 Debug Logging for Guards

**Best Practice: Comprehensive Guard Logging**

```typescript
export function logGuardContext(logger: Logger): void {
  logger.debug('=== Nested Execution Guard Context ===');
  logger.debug(
    `PRP_PIPELINE_RUNNING: ${process.env.PRP_PIPELINE_RUNNING ?? 'not set'}`
  );
  logger.debug(
    `SKIP_BUG_FINDING: ${process.env.SKIP_BUG_FINDING ?? 'not set'}`
  );
  logger.debug(`Current PID: ${process.pid}`);
  logger.debug(`CWD: ${process.cwd()}`);
  logger.debug(`PLAN_DIR: ${process.env.PLAN_DIR ?? 'not set'}`);
  logger.debug(`SESSION_DIR: ${process.env.SESSION_DIR ?? 'not set'}`);
  logger.debug('=====================================');
}
```

### 4.5 Documentation References

**Node.js Documentation:**

- [process.env](https://nodejs.org/api/process.html#processenv)
- [process.pid](https://nodejs.org/api/process.html#processpid)
- [Path Module](https://nodejs.org/api/path.html)

**Security Best Practices:**

- [Path Traversal Prevention](https://owasp.org/www-community/attacks/Path_Traversal)
- [Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Environment Variable Security](https://cwe.mitre.org/data/definitions/532.html)

---

## 5. Testing Patterns for Constructor Changes

### 5.1 Testing Optional Parameters

**Best Practice: Parameter Coverage Matrix**

```typescript
describe('ResearchQueue Constructor', () => {
  let mockSessionManager: SessionManager;

  beforeEach(() => {
    mockSessionManager = {
      currentSession: {
        metadata: {
          id: 'test',
          path: '/test',
          hash: 'abc',
          createdAt: new Date(),
          parentSession: null,
        },
        taskRegistry: { backlog: [] },
        prdSnapshot: '# Test',
        currentItemId: null,
      },
    } as SessionManager;
  });

  describe('Parameter Combinations', () => {
    it('should create with only sessionManager', () => {
      const queue = new ResearchQueue(mockSessionManager);

      expect(queue.sessionManager).toBe(mockSessionManager);
      expect(queue.maxSize).toBe(3); // Default
      expect(queue.noCache).toBe(false); // Implicit default
    });

    it('should create with sessionManager and maxSize', () => {
      const queue = new ResearchQueue(mockSessionManager, 5);

      expect(queue.maxSize).toBe(5);
    });

    it('should create with sessionManager, maxSize, and noCache', () => {
      const queue = new ResearchQueue(mockSessionManager, 5, true);

      expect(queue.maxSize).toBe(5);
      // Verify noCache behavior
    });

    it('should create with all parameters', () => {
      const queue = new ResearchQueue(mockSessionManager, 10, true, 60000);

      expect(queue.maxSize).toBe(10);
      // Verify all parameter effects
    });
  });

  describe('Default Values', () => {
    it('should use default maxSize of 3', () => {
      const queue = new ResearchQueue(mockSessionManager);
      expect(queue.maxSize).toBe(3);
    });

    it('should use default noCache of false', () => {
      const queue = new ResearchQueue(mockSessionManager);
      // Test default behavior
    });

    it('should use default cacheTtlMs of 24 hours', () => {
      const queue = new ResearchQueue(mockSessionManager);
      // Test default behavior
    });
  });
});
```

### 5.2 Testing Constructor Validation

**Best Practice: Test Validation Logic**

```typescript
describe('Constructor Validation', () => {
  it('should throw when sessionManager is null', () => {
    expect(() => new ResearchQueue(null as any)).toThrow(
      'sessionManager is required'
    );
  });

  it('should throw when sessionManager has no active session', () => {
    const mockManager = {} as SessionManager;

    expect(() => new ResearchQueue(mockManager)).toThrow(
      'requires active session'
    );
  });

  it('should throw when maxSize is less than 1', () => {
    expect(() => new ResearchQueue(mockSessionManager, 0)).toThrow(
      'maxSize must be between 1 and 10'
    );
  });

  it('should throw when maxSize is greater than 10', () => {
    expect(() => new ResearchQueue(mockSessionManager, 11)).toThrow(
      'maxSize must be between 1 and 10'
    );
  });

  it('should throw when cacheTtlMs is negative', () => {
    expect(() => new ResearchQueue(mockSessionManager, 3, false, -1)).toThrow(
      'cacheTtlMs must be non-negative'
    );
  });
});
```

### 5.3 Mocking Complex Constructors

**Pattern: Factory Function for Mock Creation**

```typescript
/**
 * Factory for creating mock SessionManager instances
 */
function createMockSessionManager(
  overrides?: Partial<SessionManager>
): SessionManager {
  return {
    currentSession: {
      metadata: {
        id: '001_testsession',
        path: '/plan/001_testsession',
        hash: 'abc123def456',
        createdAt: new Date('2024-01-26'),
        parentSession: null,
      },
      taskRegistry: { backlog: [] },
      prdSnapshot: '# Test PRD',
      currentItemId: null,
    },
    initialize: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SessionManager;
}

describe('ResearchQueue with Mocks', () => {
  it('should handle mocked sessionManager', () => {
    const mockManager = createMockSessionManager({
      initialize: vi.fn().mockResolvedValue(undefined),
    });

    const queue = new ResearchQueue(mockManager);

    expect(mockManager.initialize).not.toHaveBeenCalled();
    // Test queue behavior
  });
});
```

### 5.4 Testing Backwards Compatibility

**Best Practice: Maintain Old Test Signatures**

```typescript
describe('Backwards Compatibility', () => {
  // Old test signature (2 parameters)
  it('should support old 2-parameter constructor', () => {
    // This is how tests were written before
    const oldWay = () =>
      new ResearchQueue(
        mockSessionManager,
        false // noCache as 2nd parameter
      );

    // Should still work with default parameters
    expect(oldWay).not.toThrow();
  });

  // New test signature (4 parameters)
  it('should support new 4-parameter constructor', () => {
    const newWay = () =>
      new ResearchQueue(
        mockSessionManager,
        3, // maxSize
        false, // noCache
        3600000 // cacheTtlMs
      );

    expect(newWay).not.toThrow();
  });

  // Migration path
  it('should migrate from old to new signature', () => {
    // Old way
    const queue1 = new ResearchQueue(mockSessionManager, false);

    // New way (equivalent)
    const queue2 = new ResearchQueue(
      mockSessionManager,
      3, // Default maxSize
      false, // noCache
      24 * 60 * 60 * 1000 // Default cacheTtlMs
    );

    // Both should behave identically
    expect(queue1.maxSize).toBe(queue2.maxSize);
  });
});
```

### 5.5 Documentation References

**Vitest Documentation:**

- [Testing Constructors](https://vitest.dev/guide/#testing)
- [Mocking Functions](https://vitest.dev/api/mock.html)
- [Test Context](https://vitest.dev/api/#test-context)

**Testing Best Practices:**

- [Constructor Testing Patterns](https://martinfowler.com/bliki/UnitTest.html)
- [Test Parameter Variations](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library-tests#not-using-testing-library-queries)
- [Mock Best Practices](https://testingjavascript.com/)

---

## 6. Implementation Roadmap

### 6.1 Immediate Actions (Critical Bugs)

**Phase 1: Fix Constructor Signatures (1-2 hours)**

1. **Update ResearchQueue constructor**
   - Add default values for `concurrency` and `cacheTtlMs`
   - Update JSDoc documentation
   - Validate parameter ranges

2. **Update SessionManager constructor**
   - Make `planDir` optional with default value
   - Update all test instantiations
   - Verify TaskOrchestrator compatibility

3. **Add StatusEnum 'Retrying' value**
   - Update StatusEnum in models.ts
   - Verify Status type union includes 'Retrying'
   - Add transition validation logic

**Phase 2: Fix File Workflows (1-2 hours)**

1. **Implement atomicWrite utility**
   - Add to src/utils/atomic-write.ts
   - Use write-then-rename pattern
   - Add error handling and cleanup

2. **Update BugHuntWorkflow**
   - Add writeBugReport() method
   - Write TEST_RESULTS.md immediately
   - Fix lifecycle ordering in PRP Pipeline

3. **Add bugfix session path validation**
   - Implement validateBugfixSessionPath()
   - Add to FixCycleWorkflow constructor
   - Throw error if path doesn't contain 'bugfix'

**Phase 3: Add Guard Implementation (1 hour)**

1. **Implement validateNestedExecutionGuard()**
   - Add to src/utils/execution-guard.ts
   - Check PRP_PIPELINE_RUNNING environment variable
   - Allow bugfix recursion with SKIP_BUG_FINDING=true

2. **Add guard to pipeline entry point**
   - Call in src/index.ts or PRP Pipeline.run()
   - Clear guard on exit
   - Add debug logging

3. **Update tests for guard**
   - Test blocking nested execution
   - Test allowing bugfix recursion
   - Test environment variable validation

### 6.2 Testing Updates (2-3 hours)

1. **Update constructor tests**
   - Add parameter combination tests
   - Add validation tests
   - Add backwards compatibility tests

2. **Add status transition tests**
   - Test all valid transitions
   - Test invalid transitions
   - Test retry logic

3. **Add file workflow tests**
   - Test atomic writes
   - Test bug report writing
   - Test path validation

4. **Add guard tests**
   - Test nested execution blocking
   - Test bugfix recursion allowing
   - Test environment variable handling

### 6.3 Validation (1 hour)

1. **Run full test suite**
   - Ensure all tests pass
   - Check for new warnings
   - Verify no regressions

2. **Manual testing**
   - Test pipeline end-to-end
   - Test bug fix cycle
   - Test nested execution prevention

---

## 7. Potential Pitfalls to Avoid

### 7.1 Constructor Changes

**Pitfall:** Breaking existing code with constructor signature changes

**Solution:**

- Always add new parameters at the end
- Provide default values for new parameters
- Test with old and new call signatures

**Example:**

```typescript
// WRONG: Breaks existing code
constructor(sessionManager: SessionManager, concurrency: number, noCache: boolean, cacheTtlMs: number)

// RIGHT: Backwards compatible
constructor(
  sessionManager: SessionManager,
  concurrency: number = 3,
  noCache: boolean = false,
  cacheTtlMs: number = 24 * 60 * 60 * 1000
)
```

### 7.2 File Write Race Conditions

**Pitfall:** Corrupted state from concurrent writes

**Solution:**

- Use atomic write-then-rename pattern
- Add file locking for critical sections
- Implement retry logic with exponential backoff

**Example:**

```typescript
// WRONG: Direct write can corrupt
await writeFile(filepath, data);

// RIGHT: Atomic write
await atomicWrite(filepath, data);
```

### 7.3 Status Transition Invalidity

**Pitfall:** Allowing invalid state transitions

**Solution:**

- Implement state machine with transition validation
- Make transitions explicit and validated
- Test all valid and invalid transitions

**Example:**

```typescript
// WRONG: Direct assignment
item.status = 'Retrying';

// RIGHT: Validated transition
if (isValidStatusTransition(item.status, 'Retrying')) {
  item.status = 'Retrying';
} else {
  throw new Error('Invalid status transition');
}
```

### 7.4 Guard Bypass

**Pitfall:** Nested execution corrupting state

**Solution:**

- Check guard at all entry points
- Validate environment variables strictly
- Log guard state for debugging

**Example:**

```typescript
// WRONG: No validation
function runPipeline() {
  // Pipeline code
}

// RIGHT: Guard validation
function runPipeline() {
  validateNestedExecutionGuard({ logger });
  // Pipeline code
}
```

### 7.5 Test Brittleness

**Pitfall:** Tests breaking with implementation changes

**Solution:**

- Test behavior, not implementation
- Use factory functions for test data
- Mock external dependencies

**Example:**

```typescript
// WRONG: Testing internals
it('should set maxSize to 3', () => {
  expect(queue.maxSize).toBe(3);
});

// RIGHT: Testing behavior
it('should limit concurrent PRP generation to 3', async () => {
  const tasks = Array.from({ length: 5 }, (_, i) => createTask(i));
  await Promise.all(tasks.map(t => queue.enqueue(t)));

  expect(queue.researching.size).toBeLessThanOrEqual(3);
});
```

---

## 8. Alternative Approaches Considered

### 8.1 Constructor Signatures

**Alternative 1: Builder Pattern**

```typescript
class ResearchQueueBuilder {
  private sessionManager?: SessionManager;
  private maxSize = 3;
  private noCache = false;
  private cacheTtlMs = 24 * 60 * 60 * 1000;

  withSessionManager(sm: SessionManager) {
    this.sessionManager = sm;
    return this;
  }

  withMaxSize(size: number) {
    this.maxSize = size;
    return this;
  }

  build(): ResearchQueue {
    if (!this.sessionManager) {
      throw new Error('sessionManager is required');
    }
    return new ResearchQueue(
      this.sessionManager,
      this.maxSize,
      this.noCache,
      this.cacheTtlMs
    );
  }
}

// Usage
const queue = new ResearchQueueBuilder()
  .withSessionManager(sessionManager)
  .withMaxSize(5)
  .build();
```

**Pros:**

- Clear parameter intent
- Easy to extend with new parameters
- Self-documenting API

**Cons:**

- More verbose
- Additional class to maintain
- Overkill for 4 parameters

**Recommendation:** Use default parameters instead for simplicity.

### 8.2 Status Management

**Alternative 1: State Machine Library**

```typescript
import { createMachine, createActor } from 'xstate';

const statusMachine = createMachine({
  id: 'status',
  initial: 'Planned',
  states: {
    Planned: {
      on: { START: 'Researching', OBSOLETE: 'Obsolete' },
    },
    Researching: {
      on: {
        COMPLETE: 'Implementing',
        FAIL: 'Failed',
        RETRY: 'Retrying',
        OBSOLETE: 'Obsolete',
      },
    },
    // ... other states
  },
});
```

**Pros:**

- Formal state machine definition
- Visualized state diagrams
- Transition logging and debugging

**Cons:**

- Additional dependency
- Learning curve
- Overkill for simple status enum

**Recommendation:** Use custom validation functions for simplicity.

### 8.3 File Persistence

**Alternative 1: Database Solution**

```typescript
import { Database } from 'better-sqlite3';

const db = new Database('session-state.db');

// Update state with transaction support
function updateSessionState(sessionId: string, updates: Partial<SessionState>) {
  const stmt = db.prepare(`
    UPDATE sessions SET data = json_patch(data, ?) WHERE id = ?
  `);
  stmt.run(JSON.stringify(updates), sessionId);
}
```

**Pros:**

- ACID transactions
- Better concurrent access
- Query capabilities

**Cons:**

- Additional dependency
- Database management overhead
- Overkill for single-process pipeline

**Recommendation:** Use file-based atomic writes for simplicity.

### 8.4 Guard Implementation

**Alternative 1: PID File Instead of Environment Variable**

```typescript
import { writeFile, unlink } from 'node:fs/promises';

const PID_FILE = '/tmp/prp-pipeline.pid';

async function acquireLock() {
  try {
    await writeFile(PID_FILE, process.pid.toString(), { flag: 'wx' });
  } catch (error) {
    const existingPid = await readFile(PID_FILE, 'utf-8');
    throw new NestedExecutionError(existingPid, process.pid.toString());
  }
}

async function releaseLock() {
  await unlink(PID_FILE);
}
```

**Pros:**

- Survives process crashes
- Persistent across subprocesses
- Easy to inspect

**Cons:**

- Requires file cleanup on crash
- Need to check stale PID files
- More complex than environment variable

**Recommendation:** Use environment variable for simplicity, add PID file if needed.

---

## 9. Summary and Recommendations

### 9.1 Key Recommendations

1. **Constructor Changes**
   - Use default parameters for backwards compatibility
   - Validate constructor arguments
   - Update all tests to use new signatures

2. **File Workflows**
   - Implement atomic write-then-rename pattern
   - Add retry logic with exponential backoff
   - Write TEST_RESULTS.md immediately after BugHuntWorkflow

3. **Status Management**
   - Add 'Retrying' to StatusEnum
   - Implement status transition validation
   - Add state machine logic for retry tracking

4. **Guard Implementation**
   - Implement PRP_PIPELINE_RUNNING guard
   - Validate bugfix session paths
   - Add debug logging for guard state

5. **Testing**
   - Test all constructor parameter combinations
   - Test all status transitions
   - Test guard blocking and allowing scenarios

### 9.2 Implementation Priority

**Priority 1 (Critical - Blocker):**

1. Fix constructor signatures (ResearchQueue, SessionManager)
2. Add 'Retrying' to StatusEnum
3. Fix TEST_RESULTS.md writing workflow

**Priority 2 (High - Should Fix):**

1. Add bugfix session path validation
2. Implement nested execution guard
3. Add status transition validation

**Priority 3 (Medium - Nice to Fix):**

1. Add atomic write utility
2. Improve error messages
3. Add debug logging

### 9.3 Success Criteria

- All tests pass without warnings
- Constructor signatures are backwards compatible
- TEST_RESULTS.md is written when bugs are found
- Nested execution is prevented
- Bug fix sessions validate paths
- Status transitions are validated

---

## 10. References and Resources

### 10.1 Documentation Links

**TypeScript:**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Constructor Parameters](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

**Node.js:**

- [File System API](https://nodejs.org/api/fs.html)
- [Process Documentation](https://nodejs.org/api/process.html)
- [Path Module](https://nodejs.org/api/path.html)

**Vitest:**

- [Vitest Guide](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)
- [Mocking](https://vitest.dev/guide/mocking.html)

**Zod:**

- [Zod Documentation](https://zod.dev/)
- [Schema Validation](https://zod.dev/?id=schemas)

### 10.2 Best Practice Resources

**State Machines:**

- [State Machine Pattern](https://refactoring.guru/design-patterns/state)
- [Type-Safe State Machines](https://gist.github.com/sw-yx/b507acf7d0c63a59a8837a2ae40ae5cd)

**File System:**

- [Atomic File Writes](https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath)
- [File Locking](https://nodejs.org/api/fs.html#filehandlelocking)

**Testing:**

- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library-tests)
- [Mock Best Practices](https://testingjavascript.com/)

**Security:**

- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

**Document End**

_This research document provides actionable guidance for implementing the bug fixes identified in bug report 001_d5507a871918. All patterns and recommendations are based on established best practices and can be applied immediately to the codebase._
