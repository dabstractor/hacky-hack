# PRP: Implement Task Retry Mechanism

---

## Goal

**Feature Goal**: Implement a TaskRetryManager class that automatically retries failed subtasks due to transient errors (network issues, API rate limits, timeouts) while failing immediately on permanent errors (validation failures, authentication errors).

**Deliverable**:

1. `src/core/task-retry-manager.ts` - TaskRetryManager class with error classification, exponential backoff (1s -> 2s -> 4s -> 8s), artifact preservation, status updates to 'Retrying', and max retry limit (default 3)
2. Integration in TaskOrchestrator.executeSubtask() method
3. `tests/unit/task-retry-manager.test.ts` - Unit tests for retry logic

**Success Definition**:

- TaskRetryManager class exists at specified path with all required methods
- Error classification uses existing `isTransientError()` and `isPermanentError()` from src/utils/retry.ts
- Exponential backoff follows existing `calculateDelay()` formula (baseDelay \* 2^attempt, capped at maxDelay, with jitter)
- Artifacts from failed attempts are preserved (PRP cache, session state)
- Task status updated to 'Retrying' during retry attempts
- Retry attempts logged with context using existing logger
- Task marked as 'Failed' after max retries exhausted
- All unit tests pass with vitest

## User Persona

**Target User**: Backend developer implementing reliability improvements for the PRP Pipeline.

**Use Case**: When a subtask fails due to transient errors (network issues, API rate limits, LLM timeouts), the system should automatically retry before marking the task as failed, reducing manual intervention.

**User Journey**:

1. Developer enables retry mechanism (default: enabled with 3 max attempts)
2. Pipeline executes subtask normally
3. If subtask fails with transient error:
   - TaskRetryManager classifies error as retryable
   - Status updated to 'Retrying'
   - Delay calculated using exponential backoff
   - Retry logged with context
   - Subtask re-executed after delay
4. If max retries exhausted or error is permanent:
   - Task marked as 'Failed'
   - Error logged with full context

**Pain Points Addressed**:

- **Frequent transient failures**: Network issues, API rate limits cause unnecessary task failures
- **Manual intervention required**: Users must manually re-run failed tasks
- **Poor observability**: No visibility into retry attempts
- **No backoff strategy**: Immediate retries may overwhelm services

## Why

- **Current limitation**: Individual task failures don't stop pipeline but no automatic retry exists (from system_context.md and retry-strategy-design.md)
- **Transient failure handling**: Network issues (ECONNRESET, ETIMEDOUT), API rate limits (HTTP 429), and timeouts should trigger automatic retry
- **Permanent failure handling**: Validation errors, authentication failures should fail immediately without wasting retry attempts
- **User experience**: Automatic retry reduces manual intervention for common transient issues
- **Observability**: Structured logging of retry attempts provides visibility into system health

## What

Implement TaskRetryManager class with the following behavior:

### Success Criteria

- [ ] TaskRetryManager class exists at `src/core/task-retry-manager.ts`
- [ ] Error classification uses existing `isTransientError()` and `isPermanentError()` functions
- [ ] Exponential backoff with jitter: 1s -> 2s -> 4s -> 8s (capped at 30s default)
- [ ] Artifacts preserved between retries (PRP cache, session state)
- [ ] Task status updated to 'Retrying' during retry attempts
- [ ] Retry attempts logged with structured context (attempt number, delay, error)
- [ ] Task marked as 'Failed' after max retries (default: 3)
- [ ] Integration in TaskOrchestrator.executeSubtask() wraps PRPRuntime execution
- [ ] Unit tests cover: retry on transient error, no retry on permanent error, max attempts, exponential backoff, state preservation
- [ ] All tests pass with `vitest run`

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:

- Complete analysis of existing retry infrastructure (src/utils/retry.ts)
- Complete error classification functions (isTransientError, isPermanentError)
- TaskOrchestrator execution flow and integration points
- SessionManager state persistence patterns
- Exponential backoff formula with specific values
- Status enum values and progression
- Testing framework (vitest) with specific patterns
- Groundswell reflection research (alternative approach considered, custom implementation chosen)

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Design Document (FROM P3.M2.T1.S1 - CONTRACT)
- docfile: plan/003_b3d3efdaf0ed/docs/retry-strategy-design.md
  why: Complete design specification with error classification matrix, decision tree, configuration values, pseudocode
  section: All sections - especially Section 3 (Retry Strategy Design), Section 4 (Implementation Strategy), Section 5 (Pseudocode)

# Existing Retry Utility (REUSE - Don't reimplement)
- file: src/utils/retry.ts
  why: Complete retry utility with exponential backoff, error classification, jitter
  pattern:
    - isTransientError() (lines 323-361) for error classification
    - isPermanentError() (lines 388-410) for permanent error detection
    - calculateDelay() (lines 246-268) for backoff calculation
    - sleep() (lines 219-221) for async delays
  gotcha:
    - ValidationError is never retryable (line 343)
    - Positive jitter only (line 262) - Math.random() gives [0,1)
    - TRANSIENT_ERROR_CODES set (lines 67-77)
    - RETRYABLE_HTTP_STATUS_CODES set (lines 87-94)

# Existing Error Types (KNOW THE HIERARCHY)
- file: src/utils/errors.ts
  why: Error class hierarchy for type checking and error codes
  pattern:
    - PipelineError base class (lines 143-342)
    - ValidationError (never retryable)
    - AgentError with codes: PIPELINE_AGENT_TIMEOUT (retryable), PIPELINE_AGENT_LLM_FAILED (retryable), PIPELINE_AGENT_PARSE_FAILED (not retryable)
  gotcha:
    - ValidationError always has isValidationError() return true
    - isFatalError() checks for fatal pipeline errors
    - Error codes in ErrorCodes enum

# Task Orchestrator (INTEGRATION POINT)
- file: src/core/task-orchestrator.ts
  why: Main integration point for retry logic
  pattern:
    - executeSubtask() method (lines 672-776) - wraps PRPRuntime execution
    - Status setting via setStatus() method
    - Error handling with try-catch
    - Smart commit after success (lines 728-747)
  gotcha:
    - Current flow: try -> execute -> catch -> set Failed -> throw
    - Need to inject retry before setting Failed status
    - currentItemId property (line 99) for logging context

# Session Manager (STATE PERSISTENCE)
- file: src/core/session-manager.ts
  why: State persistence for task status and retry state
  pattern:
    - updateItemStatus() (lines 768-800) for status changes
    - flushUpdates() (lines 670-720) for batch writes
    - currentSession property for accessing taskRegistry
  gotcha:
    - Batch writes are atomic - must call flushUpdates() to persist
    - updateItemStatus() doesn't immediately write to disk
    - Use atomic write pattern for critical state

# Models (TYPE DEFINITIONS)
- file: src/core/models.ts
  why: Subtask interface definition and Status enum
  pattern:
    - Status type (lines 137-143): 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'
    - Subtask interface (lines 231-293): id, type, title, status, story_points, dependencies, context_scope
    - SubtaskSchema (lines 318-335) for validation
  gotcha:
    - Status is a union type, not an enum
    - 'Retrying' status must be added to Status type
    - Subtask properties are readonly (immutable)

# Research Findings (FROM PARALLEL RESEARCH AGENTS)
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/task_execution_flow_analysis.md
  why: Detailed analysis of TaskOrchestrator execution flow and integration points
  section: Integration Points for TaskRetryManager, Current Error Handling Flow

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/error_classification_analysis.md
  why: Complete error class hierarchy and classification matrix
  section: Error Classification Matrix for PRP, Key Findings for TaskRetryManager Implementation

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/exponential_backoff_research.md
  why: Industry best practices and configuration recommendations
  section: Configuration Recommendations, Implementation Examples

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/groundswell_reflection_research.md
  why: Groundswell reflection capabilities (alternative approach)
  section: Recommendation, Implementation Options
  note: Custom implementation chosen for more control and simpler integration

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/retry_testing_patterns.md
  why: Vitest testing patterns for retry mechanisms
  section: Mock Error Creation, Mocking Delays with Fake Timers, Test Naming Conventions

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/artifacts_preservation_research.md
  why: How artifacts are preserved between retries
  section: Retry and Recovery Patterns, Recommended Preservation Patterns

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S2/research/codebase_structure_analysis.md
  why: Files to modify and new files to create
  section: Files Identified for Modification, New Files to Create

# External Research (URLs with section anchors)
- url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  why: AWS best practices for exponential backoff and jitter
  critical: Full jitter recommended: sleep(random(0, min(cap, base * 2^attempt)))
  note: We use positive jitter (existing pattern), which is acceptable

- url: https://github.com/jd/tenacity
  why: Production retry library (Python) for reference patterns
  section: Decorator-based retry configuration
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   ├── prp-runtime.ts         # PRP execution orchestration (called by TaskOrchestrator)
│   │   └── ...
│   ├── cli/
│   │   └── index.ts               # CLI option patterns (lines 192-196, 354-386)
│   ├── core/
│   │   ├── task-orchestrator.ts   # Task execution (lines 672-776) - MAIN INTEGRATION POINT
│   │   ├── session-manager.ts     # State persistence (updateItemStatus, flushUpdates)
│   │   ├── models.ts              # Subtask interface, Status enum
│   │   └── ...
│   ├── utils/
│   │   ├── retry.ts               # Existing retry utility (REUSE isTransientError, isPermanentError, calculateDelay)
│   │   ├── errors.ts              # Error hierarchy (ValidationError, AgentError, etc.)
│   │   └── logger.ts              # Structured logging
│   └── workflows/
│       └── prp-pipeline.ts        # Main pipeline (lines 793-912)
├── tests/
│   └── unit/
│       ├── utils/
│       │   └── retry.test.ts      # Existing retry tests (REFERENCE FOR TESTING PATTERNS)
│       └── ...
└── plan/
    └── 003_b3d3efdaf0ed/
        └── P3M2T1S2/
            ├── PRP.md             # This file
            └── research/          # Research findings from parallel agents
```

### Desired Codebase Tree with Files to be Added and Responsibility of File

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── core/
│   │   ├── task-retry-manager.ts  # NEW: TaskRetryManager class
│   │   │   # Responsibilities:
│   │   │   # - Classify errors as retryable/non-retryable
│   │   │   # - Calculate exponential backoff delays
│   │   │   # - Manage retry state (count, last error, timestamps)
│   │   │   # - Execute task with retry loop
│   │   │   # - Log retry attempts with context
│   │   │   └ - Determine when to stop retrying
│   │   └── ...
│   └── ...
├── tests/
│   └── unit/
│       └── task-retry-manager.test.ts  # NEW: Unit tests for TaskRetryManager
│       # Responsibilities:
│       # - Test retry on transient error
│       # - Test no retry on permanent error
│       # - Test max attempts enforcement
│       # - Test exponential backoff calculation
│       # - Test state preservation
│       # - Test retry attempt logging
│       └ - Test 'Retrying' status updates
└── ...
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ValidationError is NEVER retryable
// File: src/utils/retry.ts, line 343
// Rationale: Same input will always produce same validation error
if (isValidationError(err)) return false;

// CRITICAL: AgentError behavior is selective
// Retryable codes: PIPELINE_AGENT_TIMEOUT, PIPELINE_AGENT_LLM_FAILED
// Non-retryable: PIPELINE_AGENT_PARSE_FAILED
// File: src/utils/retry.ts, lines 336-339
return (
  errorCode === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
  errorCode === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
);

// CRITICAL: Positive jitter only (never subtracts from delay)
// File: src/utils/retry.ts, line 262
// Math.random() gives range [0, 1), ensuring jitter is always >= 0
const jitter = exponentialDelay * jitterFactor * Math.random();

// GOTCHA: Subtask properties are readonly (immutable)
// File: src/core/models.ts, line 231
// Cannot directly modify subtask.status - must use SessionManager.updateItemStatus()
export interface Subtask {
  readonly id: string;
  readonly status: Status; // Cannot assign directly
  // ...
}

// GOTCHA: 'Retrying' status must be added to Status union type
// File: src/core/models.ts, lines 137-143
// Need to add 'Retrying' to the union type
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying' // NEW - Add this
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// CRITICAL: SessionManager uses batch writes
// Must call flushUpdates() to persist retry state immediately
// File: src/core/session-manager.ts, updateItemStatus() method

// GOTCHA: TaskOrchestrator re-throws errors after setting status
// File: src/core/task-orchestrator.ts, line 775
// Pattern: Set status -> Log error -> Re-throw (for upstream handling)
// Need to catch error for retry before re-throwing

// GOTCHA: Research findings are in read-only agent output
// The parallel research agents provided comprehensive findings
// but files may need to be created manually
// Locations: plan/003_b3d3efdaf0ed/P3M2T1S2/research/*.md

// GOTCHA: Groundswell reflection is available but custom implementation chosen
// Groundswell has built-in reflection (enableReflection: true in agent-factory.ts)
// But we chose custom implementation for:
// - More control over retry behavior
// - Simpler integration with TaskOrchestrator
// - Consistent with existing retry utility patterns
```

## Implementation Blueprint

### Data Models and Structure

**1. Extend Status Type (src/core/models.ts)**

Add 'Retrying' status to the Status union type:

```typescript
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Retrying' // NEW - Add this status
  | 'Complete'
  | 'Failed'
  | 'Obsolete';
```

**2. Retry Configuration Interface**

```typescript
// Configuration for task retry behavior
interface TaskRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Base delay before first retry in milliseconds (default: 1000) */
  baseDelay: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay: number;

  /** Exponential backoff multiplier (default: 2) */
  backoffFactor: number;

  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitterFactor: number;

  /** Enable/disable retry globally (default: true) */
  enabled: boolean;
}

const DEFAULT_TASK_RETRY_CONFIG: TaskRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2, // Exponential
  jitterFactor: 0.1, // 10% variance
  enabled: true,
};
```

**3. Retry State Interface**

```typescript
// State tracked for each subtask during retry
interface SubtaskRetryState {
  /** Number of retry attempts made */
  retryAttempts: number;

  /** Last error encountered (for context) */
  lastError?: {
    message: string;
    code?: string;
    timestamp: Date;
  };

  /** Timestamp of first attempt */
  firstAttemptAt?: Date;

  /** Timestamp of last attempt */
  lastAttemptAt?: Date;
}
```

**Note**: Retry state is NOT persisted to Subtask schema (to avoid schema changes). It's tracked in-memory during task execution.

### Implementation Tasks (ordered by dependencies)

```yaml
# DEPENDENCY ORDER: Status -> RetryManager -> Integration -> Tests

Task 1: MODIFY src/core/models.ts - Add 'Retrying' Status
  IMPLEMENT: Add 'Retrying' to Status union type (line 137-143)
  FOLLOW pattern: Existing Status type definition
  NAMING: Use exact string 'Retrying' (matches other status values)
  VALIDATION: Update StatusEnum Zod schema if it exists
  PLACEMENT: src/core/models.ts, Status type definition

Task 2: CREATE src/core/task-retry-manager.ts - TaskRetryManager Class
  IMPLEMENT: TaskRetryManager class with retry logic
  DEPENDENCIES: Task 1 (needs 'Retrying' status)
  METHODS:
    - constructor(config: TaskRetryConfig)
    - async executeWithRetry<T>(subtask: Subtask, executeFn: () => Promise<T>): Promise<T>
    - classifyError(error: unknown): 'retryable' | 'permanent' | 'unknown'
    - shouldRetry(error: unknown, attempt: number): boolean
    - calculateDelay(attempt: number): number
    - updateRetryState(subtask: Subtask, error: Error, attempt: number): void
  IMPORTS:
    - isTransientError, isPermanentError from '../utils/retry.js'
    - getLogger from '../utils/logger.js'
    - calculateDelay from '../utils/retry.js' (reuse existing)
    - sleep from '../utils/retry.js' (reuse existing)
  NAMING: PascalCase for class, camelCase for methods
  PLACEMENT: src/core/task-retry-manager.ts

Task 3: MODIFY src/core/task-orchestrator.ts - Integrate Retry Manager
  IMPLEMENT: Wrap PRPRuntime execution with retry logic
  DEPENDENCIES: Task 2 (needs TaskRetryManager class)
  MODIFICATIONS:
    - Add #retryManager private property
    - Add retryConfig parameter to constructor
    - Initialize TaskRetryManager in constructor
    - Modify executeSubtask() to use retry wrapper
  INTEGRATION POINT: executeSubtask() method (lines 672-776)
  PATTERN:
    try {
      result = await this.#retryManager.executeWithRetry(subtask, async () => {
        return await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
      });
    } catch (error) {
      // Already handled by retry manager
      throw error;
    }
  PRESERVE: Existing error handling, status updates, smart commit
  PLACEMENT: src/core/task-orchestrator.ts

Task 4: MODIFY src/core/session-manager.ts - Add Status Update Support (if needed)
  IMPLEMENT: Ensure 'Retrying' status is supported in updateItemStatus()
  DEPENDENCIES: Task 1 (Status type must include 'Retrying')
  GOTCHA: May not need modification if updateItemStatus() accepts any Status value
  PLACEMENT: src/core/session-manager.ts

Task 5: CREATE tests/unit/task-retry-manager.test.ts - Unit Tests
  IMPLEMENT: Comprehensive unit tests using vitest
  DEPENDENCIES: Task 2 (TaskRetryManager class exists)
  TEST CASES:
    - should retry on transient error (ECONNRESET, ETIMEDOUT)
    - should not retry on ValidationError
    - should not retry on AgentError with PARSE_FAILED
    - should respect max attempts
    - should use exponential backoff (mock delays with vi.useFakeTimers())
    - should preserve retry state between attempts
    - should log retry attempts with context
    - should update status to 'Retrying' during retry
    - should mark task as 'Failed' after max retries
  FOLLOW pattern: tests/unit/utils/retry.test.ts (existing retry tests)
  MOCKING:
    - vi.useFakeTimers() for delay testing
    - vi.spyOn() for logger calls
    - Mock error creation with error codes
  PLACEMENT: tests/unit/task-retry-manager.test.ts

Task 6: INTEGRATION TEST - End-to-End Retry Flow (Optional)
  IMPLEMENT: Integration test with TaskOrchestrator
  DEPENDENCIES: Task 3 (TaskOrchestrator integration complete)
  TEST CASES:
    - Full retry flow with transient error
    - Failure after max retries
    - Permanent error immediate failure
  PLACEMENT: tests/integration/task-retry-integration.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ================================================================
// PATTERN 1: TaskRetryManager Class Structure
// ================================================================
// File: src/core/task-retry-manager.ts

import {
  isTransientError,
  isPermanentError,
  calculateDelay,
  sleep,
} from '../utils/retry.js';
import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';
import type { Subtask, Status } from './models.js';
import type { SessionManager } from './session-manager.js';

interface TaskRetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitterFactor: number;
  enabled: boolean;
}

interface RetryState {
  retryAttempts: number;
  lastError?: {
    message: string;
    code?: string;
    timestamp: Date;
  };
  firstAttemptAt?: Date;
  lastAttemptAt?: Date;
}

export class TaskRetryManager {
  readonly #logger: Logger;
  readonly #config: TaskRetryConfig;
  readonly #sessionManager: SessionManager;

  constructor(
    config: Partial<TaskRetryConfig> = {},
    sessionManager: SessionManager
  ) {
    this.#logger = getLogger('TaskRetryManager');
    this.#sessionManager = sessionManager;
    this.#config = { ...DEFAULT_TASK_RETRY_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   * @param subtask - The subtask being executed
   * @param executeFn - The function to execute (typically PRPRuntime.executeSubtask)
   * @returns Result of executeFn on success
   * @throws Last error if max retries exhausted or error is permanent
   */
  async executeWithRetry<T>(
    subtask: Subtask,
    executeFn: () => Promise<T>
  ): Promise<T> {
    if (!this.#config.enabled) {
      return await executeFn();
    }

    const retryState: RetryState = {
      retryAttempts: 0,
      firstAttemptAt: new Date(),
    };

    let lastError: Error;

    for (let attempt = 0; attempt < this.#config.maxAttempts; attempt++) {
      try {
        this.#logger.debug(
          {
            subtaskId: subtask.id,
            attempt: attempt + 1,
            maxAttempts: this.#config.maxAttempts,
          },
          `Executing subtask (attempt ${attempt + 1}/${this.#config.maxAttempts})`
        );

        const result = await executeFn();

        // Success - log if we retried
        if (attempt > 0) {
          this.#logger.info(
            {
              subtaskId: subtask.id,
              totalAttempts: attempt + 1,
              durationMs: Date.now() - retryState.firstAttemptAt!.getTime(),
            },
            `Subtask succeeded after ${attempt} retries`
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Classify error
        const errorType = this.classifyError(error);

        // Permanent error - fail immediately
        if (errorType === 'permanent') {
          this.#logger.error(
            {
              subtaskId: subtask.id,
              error: lastError.message,
              errorType,
            },
            `Subtask failed with permanent error: ${lastError.message}`
          );
          throw lastError;
        }

        // Unknown error - treat as non-retryable (fail safe)
        if (errorType === 'unknown') {
          this.#logger.warn(
            {
              subtaskId: subtask.id,
              error: lastError.message,
              errorType,
            },
            `Subtask failed with unknown error type: ${lastError.message}`
          );
          throw lastError;
        }

        // Check if max attempts reached
        if (attempt >= this.#config.maxAttempts - 1) {
          this.#logger.error(
            {
              subtaskId: subtask.id,
              totalAttempts: attempt + 1,
              maxAttempts: this.#config.maxAttempts,
              finalError: lastError.message,
            },
            `Subtask failed after ${attempt + 1} attempts: ${lastError.message}`
          );
          throw lastError;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);

        // Update retry state
        retryState.retryAttempts = attempt + 1;
        retryState.lastError = {
          message: lastError.message,
          code: (lastError as { code?: string }).code,
          timestamp: new Date(),
        };
        retryState.lastAttemptAt = new Date();

        // Update status to 'Retrying'
        await this.#sessionManager.updateItemStatus(
          subtask.id,
          'Retrying',
          `Retrying after ${lastError.message} (attempt ${retryState.retryAttempts}/${this.#config.maxAttempts})`
        );
        await this.#sessionManager.flushUpdates();

        // Log retry attempt
        this.#logger.info(
          {
            subtaskId: subtask.id,
            attempt: retryState.retryAttempts,
            maxAttempts: this.#config.maxAttempts,
            delayMs: delay,
            errorName: lastError.constructor.name,
            errorCode: (lastError as { code?: string }).code,
          },
          `Retrying subtask ${subtask.id} (${retryState.retryAttempts}/${this.#config.maxAttempts}) after ${delay}ms`
        );

        // Wait before retry
        await sleep(delay);
      }
    }

    // Should not reach here
    throw lastError!;
  }

  /**
   * Classify error as retryable, permanent, or unknown
   * Uses existing error classification functions from src/utils/retry.ts
   */
  classifyError(error: unknown): 'retryable' | 'permanent' | 'unknown' {
    if (isPermanentError(error)) {
      return 'permanent';
    }
    if (isTransientError(error)) {
      return 'retryable';
    }
    return 'unknown';
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Reuses existing calculateDelay function from src/utils/retry.ts
   */
  calculateDelay(attempt: number): number {
    return calculateDelay(
      attempt,
      this.#config.baseDelay,
      this.#config.maxDelay,
      this.#config.backoffFactor,
      this.#config.jitterFactor
    );
  }
}

const DEFAULT_TASK_RETRY_CONFIG: TaskRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.1,
  enabled: true,
};

// ================================================================
// PATTERN 2: TaskOrchestrator Integration
// ================================================================
// File: src/core/task-orchestrator.ts

// In constructor:
import {
  TaskRetryManager,
  type TaskRetryConfig,
} from './task-retry-manager.js';

export class TaskOrchestrator {
  // ... existing properties ...
  readonly #retryManager: TaskRetryManager;

  constructor(
    sessionManager: SessionManager,
    scope?: Scope,
    noCache: boolean = false,
    researchQueueConcurrency: number = 3,
    retryConfig?: Partial<TaskRetryConfig> // NEW PARAMETER
  ) {
    // ... existing constructor code ...

    // Initialize retry manager
    this.#retryManager = new TaskRetryManager(retryConfig, sessionManager);
  }

  // In executeSubtask() method (lines 672-776):
  async executeSubtask(subtask: Subtask): Promise<void> {
    // ... existing setup code ...

    // EXISTING: Set status to 'Implementing'
    await this.setStatus(
      subtask.id,
      'Implementing',
      `Starting implementation: ${subtask.title}`
    );

    try {
      // NEW: Wrap execution in retry logic
      const result = await this.#retryManager.executeWithRetry(
        subtask,
        async () => {
          return await this.#prpRuntime.executeSubtask(subtask, this.#backlog);
        }
      );

      // EXISTING: Handle result
      if (result.success) {
        await this.setStatus(
          subtask.id,
          'Complete',
          'Implementation completed successfully'
        );
      } else {
        await this.setStatus(
          subtask.id,
          'Failed',
          result.error ?? 'Execution failed'
        );
      }
    } catch (error) {
      // EXISTING: Error already handled by retry manager
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.setStatus(
        subtask.id,
        'Failed',
        `Execution failed: ${errorMessage}`
      );

      this.#logger.error(
        {
          subtaskId: subtask.id,
          error: errorMessage,
          ...(error instanceof Error && { stack: error.stack }),
        },
        'Subtask execution failed'
      );

      await this.sessionManager.flushUpdates();
      throw error;
    }

    // ... rest of method (smart commit, etc.) ...
  }
}

// ================================================================
// PATTERN 3: Unit Test Structure
// ================================================================
// File: tests/unit/task-retry-manager.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskRetryManager } from '../../src/core/task-retry-manager.js';
import {
  ValidationError,
  AgentError,
  ErrorCodes,
} from '../../src/utils/errors.js';
import type { Subtask } from '../../src/core/models.js';

describe('TaskRetryManager', () => {
  let mockSessionManager: any;
  let mockSubtask: Subtask;

  beforeEach(() => {
    // Use fake timers for deterministic delay testing
    vi.useFakeTimers();

    // Mock SessionManager
    mockSessionManager = {
      updateItemStatus: vi.fn().mockResolvedValue(undefined),
      flushUpdates: vi.fn().mockResolvedValue(undefined),
    };

    // Mock subtask
    mockSubtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test Subtask',
      status: 'Implementing',
      story_points: 2,
      dependencies: [],
      context_scope:
        'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: Test\n3. LOGIC: Test\n4. OUTPUT: Test',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('retry on transient error', () => {
    it('should retry on ECONNRESET error and succeed', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      // Execute all timers (delays)
      await vi.runAllTimersAsync();

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2); // Initial + 1 retry
      expect(mockSessionManager.updateItemStatus).toHaveBeenCalledWith(
        mockSubtask.id,
        'Retrying',
        expect.stringContaining('ECONNRESET')
      );
    });

    it('should retry on AgentError with PIPELINE_AGENT_TIMEOUT', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new AgentError(
            'Agent timeout',
            ErrorCodes.PIPELINE_AGENT_TIMEOUT,
            {}
          );
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);
      const result = await retryManager.executeWithRetry(
        mockSubtask,
        executeFn
      );

      await vi.runAllTimersAsync();

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(2);
    });
  });

  describe('no retry on permanent error', () => {
    it('should throw immediately for ValidationError', async () => {
      const executeFn = async () => {
        throw new ValidationError('Invalid input', { field: 'test' });
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Invalid input');

      // Should not update status to Retrying
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();

      // Should only attempt once
      vi.runAllTimersAsync();
    });

    it('should throw immediately for AgentError with PARSE_FAILED', async () => {
      const executeFn = async () => {
        throw new AgentError(
          'Parse failed',
          ErrorCodes.PIPELINE_AGENT_PARSE_FAILED,
          {}
        );
      };

      const retryManager = new TaskRetryManager({}, mockSessionManager);

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('Parse failed');

      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });
  });

  describe('max attempts enforcement', () => {
    it('should throw after maxAttempts exhausted', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ETIMEDOUT');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      };

      const retryManager = new TaskRetryManager(
        { maxAttempts: 2 },
        mockSessionManager
      );

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ETIMEDOUT');

      await vi.runAllTimersAsync();

      // Should attempt maxAttempts times
      expect(attempts).toBe(2);
    });
  });

  describe('exponential backoff', () => {
    it('should use exponential backoff between retries', async () => {
      const delays: number[] = [];
      vi.spyOn(global, 'setTimeout').mockImplementation(
        (callback: any, ms?: number) => {
          if (ms !== undefined) {
            delays.push(ms);
          }
          return setTimeout(callback as any, ms ?? 0);
        }
      );

      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        if (attempts < 3) {
          const err = new Error('ECONNRESET');
          (err as { code?: string }).code = 'ECONNRESET';
          throw err;
        }
        return { success: true };
      };

      const retryManager = new TaskRetryManager(
        {
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          jitterFactor: 0, // No jitter for predictable testing
        },
        mockSessionManager
      );

      await retryManager.executeWithRetry(mockSubtask, executeFn);

      // Check exponential backoff: 1000ms, 2000ms
      expect(delays[0]).toBe(1000);
      expect(delays[1]).toBe(2000);
    });
  });

  describe('when disabled', () => {
    it('should not retry when enabled is false', async () => {
      let attempts = 0;
      const executeFn = async () => {
        attempts++;
        const err = new Error('ECONNRESET');
        (err as { code?: string }).code = 'ECONNRESET';
        throw err;
      };

      const retryManager = new TaskRetryManager(
        { enabled: false },
        mockSessionManager
      );

      await expect(
        retryManager.executeWithRetry(mockSubtask, executeFn)
      ).rejects.toThrow('ECONNRESET');

      // Should only attempt once (no retries)
      expect(attempts).toBe(1);
      expect(mockSessionManager.updateItemStatus).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Points

```yaml
STATUS TYPE:
  - modify: src/core/models.ts
  - add: 'Retrying' to Status union type (line 137-143)
  - reason: Track when a task is in retry state

TASK EXECUTION:
  - modify: src/core/task-orchestrator.ts
  - add: #retryManager private property
  - add: retryConfig parameter to constructor
  - modify: executeSubtask() to wrap PRPRuntime execution
  - pattern: Wrap existing try-catch with retry logic

STATE PERSISTENCE:
  - uses: src/core/session-manager.ts (no modification needed)
  - pattern: updateItemStatus() for 'Retrying' status
  - pattern: flushUpdates() to persist immediately

ERROR CLASSIFICATION:
  - uses: src/utils/retry.ts (reuse existing)
  - functions: isTransientError(), isPermanentError()
  - pattern: Use existing type guards

EXPONENTIAL BACKOFF:
  - uses: src/utils/retry.ts (reuse existing)
  - functions: calculateDelay(), sleep()
  - pattern: Reuse existing formula

LOGGING:
  - uses: src/utils/logger.ts (existing)
  - pattern: Structured logging with context
  - levels: info (retry attempts), error (failures), debug (execution)

TESTING:
  - create: tests/unit/task-retry-manager.test.ts
  - framework: vitest (existing)
  - patterns: vi.useFakeTimers(), vi.spyOn(), mock errors
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding

# Type checking with TypeScript
npx tsc --noEmit src/core/task-retry-manager.ts
npx tsc --noEmit src/core/task-orchestrator.ts
npx tsc --noEmit src/core/models.ts

# Linting with ESLint (if configured)
npx eslint src/core/task-retry-manager.ts --fix
npx eslint tests/unit/task-retry-manager.test.ts --fix

# Format with Prettier (if configured)
npx prettier --write src/core/task-retry-manager.ts
npx prettier --write tests/unit/task-retry-manager.test.ts

# Expected: Zero type errors, zero linting errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test TaskRetryManager in isolation
vitest run tests/unit/task-retry-manager.test.ts

# Test with coverage
vitest run tests/unit/task-retry-manager.test.ts --coverage

# Run all unit tests to ensure no regressions
vitest run tests/unit/

# Expected: All tests pass. If failing, debug root cause and fix implementation.

# Common test failures and fixes:
# - "Status type does not include 'Retrying'" -> Add 'Retrying' to Status union type
# - "calculateDelay is not a function" -> Import from src/utils/retry.js
# - "Cannot read property 'updateItemStatus'" -> Mock SessionManager properly
# - "setTimeout is not defined" -> Use vi.useFakeTimers() in beforeEach
```

### Level 3: Integration Testing (System Validation)

```bash
# Test TaskOrchestrator integration
# Create a simple integration test script:

cat > test_retry_integration.ts << 'EOF'
import { TaskRetryManager } from './src/core/task-retry-manager.js';
import type { Subtask } from './src/core/models.js';

const mockSubtask: Subtask = {
  id: 'P1.M1.T1.S1',
  type: 'Subtask',
  title: 'Test Subtask',
  status: 'Implementing',
  story_points: 2,
  dependencies: [],
  context_scope: 'CONTRACT DEFINITION:\n1. RESEARCH NOTE: Test\n2. INPUT: Test\n3. LOGIC: Test\n4. OUTPUT: Test',
};

const mockSessionManager = {
  updateItemStatus: async (id: string, status: string, message: string) => {
    console.log(`[${id}] Status: ${status} - ${message}`);
  },
  flushUpdates: async () => {
    console.log('Flushed updates');
  },
};

const retryManager = new TaskRetryManager({}, mockSessionManager);

let attempts = 0;
const executeFn = async () => {
  attempts++;
  console.log(`Attempt ${attempts}`);
  if (attempts === 1) {
    const err = new Error('ECONNRESET');
    (err as { code?: string }).code = 'ECONNRESET';
    throw err;
  }
  return { success: true };
};

retryManager.executeWithRetry(mockSubtask, executeFn)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error.message));
EOF

# Run the integration test
node --loader tsx test_retry_integration.ts

# Expected: Output shows retry attempt, then success
# [P1.M1.T1.S1] Status: Retrying - Retrying after ECONNRESET (attempt 1/3)
# Attempt 1
# Attempt 2
# Success: { success: true }

# Cleanup
rm test_retry_integration.ts
```

### Level 4: Manual Validation

```bash
# Test with actual pipeline (if integration test passes)

# 1. Create a test PRD with a task that will fail transiently
cat > test-retry-prd.md << 'EOF'
# Test PRD

## P1: Phase 1

### P1.M1: Milestone 1.1

#### P1.M1.T1: Task 1.1.1

##### P1.M1.T1.S1: Test Retry Subtask

This subtask tests retry mechanism.

CONTRACT DEFINITION:
1. RESEARCH NOTE: Test retry
2. INPUT: Test input
3. LOGIC: Simulate transient error on first attempt
4. OUTPUT: Success after retry
EOF

# 2. Run pipeline with retry enabled (default)
npm run dev -- --prd test-retry-prd.md

# 3. Monitor logs for retry attempts
# Expected output:
# [TaskRetryManager] INFO: Retrying subtask P1.M1.T1.S1 (1/3) after 1000ms
# [TaskRetryManager] INFO: Subtask succeeded after 1 retries

# 4. Verify tasks.json shows 'Retrying' status during retry
cat plan/*/tasks.json | grep -A 2 "P1.M1.T1.S1"

# 5. Test with retry disabled
npm run dev -- --prd test-retry-prd.md --task-retry-enabled false

# 6. Cleanup
rm test-retry-prd.md
```

## Final Validation Checklist

### Technical Validation

- [ ] TaskRetryManager class exists at `src/core/task-retry-manager.ts`
- [ ] 'Retrying' status added to Status type in `src/core/models.ts`
- [ ] TaskOrchestrator integrates TaskRetryManager in executeSubtask()
- [ ] All 4 validation levels completed successfully
- [ ] All unit tests pass: `vitest run tests/unit/task-retry-manager.test.ts`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] No linting errors (if ESLint configured)
- [ ] Manual testing successful with transient error

### Feature Validation

- [ ] Retry triggered on transient errors (ECONNRESET, ETIMEDOUT, HTTP 5xx, 429, 408)
- [ ] No retry on permanent errors (ValidationError, AgentError PARSE_FAILED)
- [ ] Max attempts enforced (default 3)
- [ ] Exponential backoff with jitter (1s -> 2s -> 4s -> 8s, capped at 30s)
- [ ] Status updated to 'Retrying' during retry attempts
- [ ] Retry attempts logged with context (attempt, delay, error)
- [ ] Task marked as 'Failed' after max retries exhausted
- [ ] Artifacts preserved between retries (PRP cache, session state)

### Code Quality Validation

- [ ] Follows existing codebase patterns and naming conventions
- [ ] Reuses existing functions from src/utils/retry.ts (isTransientError, isPermanentError, calculateDelay, sleep)
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (see below)
- [ ] Dependencies properly imported
- [ ] JSDoc comments added for public methods
- [ ] Error handling is comprehensive

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose
- [ ] Configuration is well-documented with default values
- [ ] Integration with existing error handling is seamless

---

## Anti-Patterns to Avoid

- **Don't** reimplement isTransientError(), isPermanentError(), calculateDelay(), or sleep() - reuse from src/utils/retry.ts
- **Don't** create a new Status enum - add 'Retrying' to the existing Status union type
- **Don't** modify Subtask interface to add retryState - track retry state in-memory only
- **Don't** forget to call flushUpdates() after updating status to 'Retrying'
- **Don't** use blocking sleep loops - always use async/await with the sleep() function
- **Don't** catch all errors - be specific about which errors to retry
- **Don't** retry ValidationError - it's never retryable (same input = same error)
- **Don't** set jitterFactor to 0 in production - use 0.1 to prevent thundering herd
- **Don't** log at error level for retry attempts - use info level (error only on final failure)
- **Don't** update subtask status directly - always use SessionManager.updateItemStatus()
- **Don't** forget to preserve existing behavior when retry is disabled
- **Don't** add Groundswell reflection dependency - custom implementation is simpler and more controlled
- **Don't** use sync functions in async context - always await async operations
- **Don't** hardcode configuration values - use TaskRetryConfig with defaults
- **Don't** skip testing delay calculation - use vi.useFakeTimers() for deterministic tests

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success

**Rationale**:

- Complete design document exists from P3.M2.T1.S1 with error classification matrix and pseudocode
- Existing retry infrastructure (src/utils/retry.ts) provides reusable functions
- Error classification is comprehensive and well-tested
- Integration point (TaskOrchestrator.executeSubtask) is clearly defined
- Testing patterns are well-established in the codebase (vitest, fake timers, mock errors)
- Parallel research provided comprehensive context on all aspects

**Risk Areas**:

- State persistence complexity (ensuring 'Retrying' status is properly persisted)
- Integration with existing error handling flow (wrapping without breaking existing behavior)
- Test complexity (mocking delays, tracking retry state)

**Mitigation**:

- Design document specifies exact integration points and code patterns
- Existing retry utility functions are reused to minimize risk
- Test patterns from existing retry tests are followed
- Step-by-step validation ensures each component works before integration

---

## Appendix: Error Classification Quick Reference

| Error Type                                   | Retryable | Detection Method                                   | Max Retries              |
| -------------------------------------------- | --------- | -------------------------------------------------- | ------------------------ |
| ValidationError                              | NO        | isValidationError()                                | 0 (fail immediately)     |
| AgentError (TIMEOUT)                         | YES       | errorCode === PIPELINE_AGENT_TIMEOUT               | 3                        |
| AgentError (LLM_FAILED)                      | YES       | errorCode === PIPELINE_AGENT_LLM_FAILED            | 3                        |
| AgentError (PARSE_FAILED)                    | NO        | errorCode === PIPELINE_AGENT_PARSE_FAILED          | 0                        |
| Network errors (ECONNRESET, ETIMEDOUT, etc.) | YES       | TRANSIENT_ERROR_CODES.has(err.code)                | 3                        |
| HTTP 408 (Timeout)                           | YES       | err.response.status === 408                        | 3                        |
| HTTP 429 (Rate Limit)                        | YES       | err.response.status === 429                        | 5 (more for rate limits) |
| HTTP 5xx (Server errors)                     | YES       | err.response.status in [500, 502, 503, 504]        | 3                        |
| HTTP 4xx (other)                             | NO        | err.response.status in [400-407, 410-428, 430-499] | 0                        |
| Unknown errors                               | NO        | Fallback (fail safe)                               | 0                        |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Related Documents**:

- Design Document: plan/003_b3d3efdaf0ed/docs/retry-strategy-design.md
- Previous PRP: plan/003_b3d3efdaf0ed/P3M2T1S1/PRP.md (Retry Strategy Design)
