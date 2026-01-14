---
name: "Retry Logic Implementation - Exponential Backoff with Transient Error Detection"
description: |

---

## Goal

**Feature Goal**: Create a production-ready retry utility with exponential backoff, jitter, and transient error detection that wraps agent LLM calls and MCP tool executions to handle temporary network failures.

**Deliverable**: `src/utils/retry.ts` with exported `RetryOptions` interface, `retry<T>()` function, and `isTransientError()` predicate, plus integration at 7 agent prompt call sites and MCP tool executions.

**Success Definition**:
- All agent `.prompt()` calls wrapped with retry logic
- MCP tool executions wrapped with retry logic
- Only transient errors trigger retries (network, timeout)
- Validation and permanent errors never retry
- Exponential backoff with jitter implemented
- Logging integration via existing logger utility
- Error hierarchy from P5.M4.T1.S1 used for retry decisions

## User Persona

**Target User**: Internal pipeline execution requiring resilience against transient API failures during LLM agent calls and MCP tool executions.

**Use Case**: When LLM API calls or MCP tool operations fail due to temporary network issues, rate limits, or service interruptions, the operation automatically retries with exponential backoff before failing permanently.

**User Journey**:
1. Agent `.prompt()` call fails with transient error (timeout, network reset)
2. Retry utility catches error and checks if retryable
3. Exponential backoff delay calculated with jitter
4. Warning logged with retry context
5. Retry attempted up to maxAttempts
6. On success: operation continues; on final failure: error propagated

**Pain Points Addressed**:
- Zero error resilience around agent prompt calls
- No retry logic for MCP tool executions
- Pipeline fails on transient network issues
- No differentiation between retryable and permanent errors

## Why

- **Business value**: Reduces pipeline failures due to temporary API issues, improving completion rates
- **Integration**: Works with error hierarchy from P5.M4.T1.S1 to detect transient vs permanent failures
- **Problems solved**: Handles API timeouts, rate limits, network resets without manual intervention

## What

Create `src/utils/retry.ts` with:

1. **RetryOptions interface**: `maxAttempts`, `baseDelay`, `maxDelay`, `backoffFactor`, `jitterFactor`, `isRetryable`, `onRetry`
2. **retry<T>() function**: Generic async retry wrapper with exponential backoff and jitter
3. **isTransientError() predicate**: Detects retryable errors using error codes and patterns
4. **Integration**: Wrap 7 agent prompt call sites and MCP tool executions

### Success Criteria

- [ ] `src/utils/retry.ts` exports RetryOptions interface and retry function
- [ ] Exponential backoff formula: `delay = min(baseDelay * 2^attempt, maxDelay) + jitter`
- [ ] Only transient errors trigger retries (ETIMEDOUT, ECONNRESET, 408, 429, 5xx)
- [ ] Validation/permanent errors never retry (400, 403, 404, ValidationError)
- [ ] Agent prompt calls wrapped at all 7 identified locations
- [ ] MCP tool executions wrapped (bash, git, filesystem)
- [ ] Retry attempts logged with warning level via existing logger
- [ ] 100% test coverage passing all validation gates

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - Error hierarchy from previous work item
- file: src/utils/errors.ts
  why: Provides PipelineError classes with error codes for retry decisions
  pattern: Use ErrorCodes.PIPELINE_AGENT_TIMEOUT, PIPELINE_AGENT_LLM_FAILED
  critical: isAgentError() type guard for transient error detection
  note: This file is created by P5.M4.T1.S1, assume it exists

# MUST READ - Existing retry patterns to follow/consolidate
- file: src/agents/prp-generator.ts
  why: Existing retry implementation (lines 433-494) for pattern reference
  pattern: Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  gotcha: This will be replaced by centralized retry utility

- file: src/agents/prp-executor.ts
  why: Existing retry for validation gates (lines 266-294, sleep utility at 477-485)
  pattern: Similar exponential backoff pattern
  gotcha: Fix-and-retry pattern is different - keeps errors for prompt injection

# MUST READ - Agent prompt call sites requiring retry
- file: src/workflows/prp-pipeline.ts:490
  why: Architect agent prompt call needs retry wrapper
  pattern: await architectAgent.prompt(architectPrompt)
  gotcha: Has @ts-expect-error comment for type signature issue

- file: src/workflows/bug-hunt-workflow.ts:251
  why: QA agent prompt call needs retry wrapper
  pattern: (await qaAgent.prompt(prompt)) as TestResults
  gotcha: Type assertion suggests output schema mismatch

- file: src/workflows/delta-analysis-workflow.ts:127
  why: QA agent prompt call needs retry wrapper
  pattern: (await qaAgent.prompt(prompt)) as DeltaAnalysis

- file: src/agents/prp-generator.ts:448
  why: Researcher agent prompt call needs retry wrapper
  pattern: await this.#researcherAgent.prompt(prompt)
  gotcha: Inside method that has existing retry logic (will be consolidated)

- file: src/agents/prp-executor.ts:250
  why: Coder agent prompt call needs retry wrapper
  pattern: await this.#coderAgent.prompt(injectedPrompt)

- file: src/agents/prp-executor.ts:446
  why: Coder agent prompt call for fix attempts needs retry wrapper
  pattern: await this.#coderAgent.prompt(fixPrompt)

# MUST READ - MCP tool execution requiring retry
- file: src/agents/prp-executor.ts:355
  why: BashMCP execution needs retry wrapper
  pattern: await this.#bashMCP.execute_bash({ command, cwd, timeout })
  note: MCP tools extend MCPHandler from groundswell library

- file: src/tools/bash-mcp.ts
  why: Understanding MCP tool structure for error handling
  pattern: Tool executor pattern with return { success, stdout, stderr }

- file: src/tools/git-mcp.ts
  why: Understanding MCP tool structure for git operations

- file: src/tools/filesystem-mcp.ts
  why: Understanding MCP tool structure for file operations

# MUST READ - Logger integration
- file: src/utils/logger.ts
  why: Structured logging with pino for retry attempt logging
  pattern: logger.warn({ attempt, delay, error }, 'Retrying operation')
  gotcha: Use logger.warn() for retry attempts, logger.error() for final failures

# RESEARCH DOCUMENTATION - TypeScript retry best practices
- docfile: plan/001_14b9dc2a33c7/P5M4T1S2/research/typescript-retry-patterns.md
  why: Complete production-ready retry implementation patterns
  section: "Appendix: Complete Implementation Example"
  critical: Jitter implementation, transient error detection, TypeScript type safety

# EXTERNAL REFERENCES
- url: https://www.awsarchitectureblog.com/2015/03/backoff.html
  why: AWS exponential backoff and jitter guidance (prevents thundering herd)
  critical: Full jitter formula: random() * exponentialDelay

- url: https://github.com/vercel/async-retry
  why: Reference implementation for TypeScript retry patterns
  note: Not using library to avoid dependency - implementing similar pattern

- url: https://nodejs.org/api/errors.html#errors_common_system_errors
  why: Node.js error codes for transient error detection
  critical: ETIMEDOUT, ECONNRESET, ECONNREFUSED, ENOTFOUND, EPIPE, EAI_AGAIN
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts         # Agent creation with MCP tools
│   ├── prp-executor.ts          # Has retry patterns (lines 266-294, 477-485)
│   ├── prp-generator.ts         # Has retry patterns (lines 433-494)
│   └── prp-runtime.ts
├── cli/
│   └── index.ts
├── config/
│   ├── constants.ts
│   ├── environment.ts
│   └── types.ts
├── core/
│   ├── models.ts
│   ├── scope-resolver.ts
│   ├── session-manager.ts
│   ├── session-utils.ts
│   └── task-orchestrator.ts
├── tools/
│   ├── bash-mcp.ts              # MCP tool executor
│   ├── filesystem-mcp.ts        # MCP tool executor
│   └── git-mcp.ts               # MCP tool executor
├── utils/
│   ├── errors.ts                # NEW from P5.M4.T1.S1 - Error hierarchy
│   ├── git-commit.ts
│   ├── logger.ts                # Structured logging with pino
│   ├── progress.ts
│   └── task-utils.ts
└── workflows/
    ├── bug-hunt-workflow.ts     # Agent prompt call at line 251
    ├── delta-analysis-workflow.ts # Agent prompt call at line 127
    └── prp-pipeline.ts          # Agent prompt call at line 490

tests/
├── unit/
│   ├── logger.test.ts
│   └── utils/
│       ├── git-commit.test.ts
│       └── progress.test.ts
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── utils/
│   ├── errors.ts                # From P5.M4.T1.S1
│   ├── retry.ts                 # NEW - Retry utility with exponential backoff
│   ├── logger.ts
│   ├── progress.ts
│   ├── git-commit.ts
│   └── task-utils.ts

tests/
├── unit/
│   ├── logger.test.ts
│   └── utils/
│       ├── errors.test.ts       # From P5.M4.T1.S1
│       ├── retry.test.ts        # NEW - 100% coverage for retry logic
│       ├── git-commit.test.ts
│       └── progress.test.ts
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Error hierarchy from P5.M4.T1.S1 provides error codes
// Use ErrorCodes.PIPELINE_AGENT_TIMEOUT for transient LLM failures
// Use isAgentError() type guard for agent-specific error handling

// CRITICAL: Existing retry patterns use different delay calculations
// prp-generator.ts: Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
// prp-executor.ts: Math.min(baseDelay * Math.pow(2, fixAttempts - 1), maxDelay)
// Standardize on: attempt starting from 0 for consistency

// CRITICAL: Groundswell agent.prompt() may throw different error types
// May need to check error.message patterns for transient detection
// Common patterns: "timeout", "network", "rate limit", "temporarily unavailable"

// CRITICAL: MCP tool errors have { success, stdout, stderr } structure
// Check !result.success for retryable MCP errors
// stderr may contain transient error messages

// CRITICAL: Logger from src/utils/logger.ts uses pino
// Structured logging: logger.warn({ attempt, delay, errorName }, 'Retrying...')
// Use warning level for retries, error for final failures

// CRITICAL: Jitter prevents thundering herd
// Formula: exponentialDelay + (random() - 0.5) * 2 * jitterFactor * exponentialDelay
// Or simpler: exponentialDelay * (1 + (random() - 0.5) * jitterFactor)

// CRITICAL: Only retry transient (temporary) errors
// Transient: ETIMEDOUT, ECONNRESET, ECONNREFUSED, ENOTFOUND, 408, 429, 5xx
// Permanent: 400, 403, 404, ValidationError, parsing errors

// CRITICAL: Use async sleep, not blocking
// BAD: const start = Date.now(); while (Date.now() - start < ms) {}
// GOOD: await new Promise(resolve => setTimeout(resolve, ms))
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Retry configuration interface
export interface RetryOptions {
  maxAttempts?: number;      // Default: 3
  baseDelay?: number;        // Default: 1000ms
  maxDelay?: number;         // Default: 30000ms
  backoffFactor?: number;    // Default: 2
  jitterFactor?: number;     // Default: 0.1 (10% jitter)
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

// Transient error detection predicate
export function isTransientError(error: unknown): boolean;

// Main retry function
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/retry.ts with core types and utilities
  - IMPLEMENT: RetryOptions interface with all configuration properties
  - IMPLEMENT: TRANSIENT_ERROR_CODES Set with Node.js error codes
  - IMPLEMENT: RETRYABLE_HTTP_STATUS Set with HTTP status codes
  - IMPLEMENT: sleep() async utility function
  - IMPLEMENT: calculateDelay() helper with exponential backoff and jitter
  - PATTERN: Follow typescript-retry-patterns.md "Appendix: Complete Implementation Example"
  - NAMING: camelCase for interface properties, PascalCase for types
  - DEPENDENCIES: None (foundational file)

Task 2: IMPLEMENT isTransientError() predicate
  - CREATE: isTransientError(error: unknown): boolean function
  - CHECK: Node.js error codes (ETIMEDOUT, ECONNRESET, ECONNREFUSED, etc.)
  - CHECK: HTTP status codes (408, 429, 500, 502, 503, 504)
  - CHECK: Error message patterns ("timeout", "network", "temporarily unavailable")
  - INTEGRATE: Use PipelineError from src/utils/errors.ts for error code checking
  - PATTERN: Check error.code for PIPELINE_AGENT_TIMEOUT, PIPELINE_AGENT_LLM_FAILED
  - RETURN: true for retryable errors, false for permanent failures
  - DEPENDENCIES: Task 1 (TRANSIENT_ERROR_CODES, RETRYABLE_HTTP_STATUS constants)

Task 3: IMPLEMENT retry<T>() main function
  - CREATE: async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>
  - DESTRUCTURE: options with defaults (maxAttempts: 3, baseDelay: 1000, maxDelay: 30000)
  - LOOP: for attempt from 0 to maxAttempts - 1
  - TRY: await fn() and return result on success
  - CATCH: Store error, check if retryable via isRetryable or isTransientError
  - THROW: If not retryable or last attempt, throw original error
  - CALCULATE: delay using exponential backoff with jitter
  - LOG: via onRetry callback or integrate with logger from src/utils/logger.ts
  - AWAIT: sleep(delay) before next attempt
  - PATTERN: Follow typescript-retry-patterns.md complete implementation example
  - DEPENDENCIES: Task 1 (sleep, calculateDelay), Task 2 (isTransientError)

Task 4: INTEGRATE logger with retry utility
  - IMPORT: getLogger from src/utils/logger.ts
  - IMPLEMENT: Default onRetry handler that logs with warning level
  - LOG STRUCTURE: { attempt, delayMs, errorName, errorCode, errorMessage }
  - MESSAGE: "Retrying operation after {delay}ms (attempt {attempt}/{maxAttempts})"
  - LEVEL: Use logger.warn() for retry attempts
  - DEPENDENCIES: Task 3 (retry function with onRetry callback)

Task 5: CREATE tests/unit/utils/retry.test.ts
  - IMPLEMENT: Tests for RetryOptions defaults
  - IMPLEMENT: Tests for isTransientError with various error types
  - IMPLEMENT: Tests for exponential backoff calculation
  - IMPLEMENT: Tests for jitter randomization (delay varies)
  - IMPLEMENT: Tests for maxAttempts limit (throws after N attempts)
  - IMPLEMENT: Tests for non-retryable errors (throws immediately)
  - IMPLEMENT: Tests for successful retry (eventually succeeds)
  - IMPLEMENT: Tests for onRetry callback invocation
  - PATTERN: Follow tests/unit/logger.test.ts structure
  - COVERAGE: Target 100% (match vitest.config.ts thresholds)
  - DEPENDENCIES: Task 4 (complete retry implementation)

Task 6: WRAP agent prompt calls with retry
  - MODIFY: src/agents/prp-generator.ts line 448
    WRAP: await this.#researcherAgent.prompt(prompt) with retry()
    REPLACE: Existing retry loop (lines 433-494) with retry() call
    CONFIG: maxAttempts: 3, baseDelay: 1000, maxDelay: 30000

  - MODIFY: src/agents/prp-executor.ts line 250
    WRAP: await this.#coderAgent.prompt(injectedPrompt) with retry()
    CONFIG: Same retry configuration

  - MODIFY: src/agents/prp-executor.ts line 446
    WRAP: await this.#coderAgent.prompt(fixPrompt) with retry()
    CONFIG: Same retry configuration

  - MODIFY: src/workflows/prp-pipeline.ts line 490
    WRAP: await architectAgent.prompt(architectPrompt) with retry()
    IMPORT: Add import { retry } from '../utils/retry.js'
    CONFIG: Same retry configuration

  - MODIFY: src/workflows/bug-hunt-workflow.ts line 251
    WRAP: (await qaAgent.prompt(prompt)) as TestResults with retry()
    IMPORT: Add import { retry } from '../utils/retry.js'
    CONFIG: Same retry configuration

  - MODIFY: src/workflows/delta-analysis-workflow.ts line 127
    WRAP: (await qaAgent.prompt(prompt)) as DeltaAnalysis with retry()
    IMPORT: Add import { retry } from '../utils/retry.js'
    CONFIG: Same retry configuration
  - DEPENDENCIES: Task 4 (retry function complete)

Task 7: WRAP MCP tool executions with retry
  - MODIFY: src/agents/prp-executor.ts line 355
    WRAP: await this.#bashMCP.execute_bash(...) with retry()
    CUSTOM isRetryable: Check !result.success and stderr for transient errors
    CONFIG: maxAttempts: 2 (file operations should retry less), baseDelay: 500
  - DEPENDENCIES: Task 4 (retry function complete)

Task 8: CONSOLIDATE existing retry patterns
  - REMOVE: Retry loop from src/agents/prp-generator.ts (lines 433-494)
  - REMOVE: Sleep utility from src/agents/prp-executor.ts (lines 477-485)
  - KEEP: Fix-and-retry logic in prp-executor.ts (lines 266-294) - different pattern
  - REPLACE: All with centralized retry() utility
  - DEPENDENCIES: Task 6, Task 7 (all integrations complete)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// RETRY OPTIONS INTERFACE (Task 1)
// ============================================================================
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;

  /** Base delay before first retry in milliseconds (default: 1000) */
  baseDelay?: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay?: number;

  /** Exponential backoff multiplier (default: 2) */
  backoffFactor?: number;

  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitterFactor?: number;

  /** Custom predicate to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;

  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

// ============================================================================
// TRANSIENT ERROR CONSTANTS (Task 1)
// ============================================================================
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',    // Connection reset by peer
  'ECONNREFUSED',  // Connection refused
  'ETIMEDOUT',     // Connection timeout
  'ENOTFOUND',     // DNS lookup failed
  'EPIPE',         // Broken pipe
  'EAI_AGAIN',     // DNS temporary failure
  'EHOSTUNREACH',  // Host unreachable
  'ENETUNREACH',   // Network unreachable
]);

const RETRYABLE_HTTP_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

// ============================================================================
// SLEEP UTILITY (Task 1)
// ============================================================================
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// DELAY CALCULATION WITH EXPONENTIAL BACKOFF AND JITTER (Task 1)
// ============================================================================
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number,
  jitterFactor: number
): number {
  // Exponential backoff: baseDelay * (backoffFactor ^ attempt)
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );

  // Full jitter: add randomization to prevent thundering herd
  // jitterFactor 0.1 means +/- 10% of exponentialDelay
  const jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;
  const delay = Math.max(0, Math.floor(exponentialDelay + jitter));

  return delay;
}

// Example delays with baseDelay=1000, backoffFactor=2, jitterFactor=0.1:
// Attempt 0: 1000ms +/- 100ms  (900-1100ms)
// Attempt 1: 2000ms +/- 200ms  (1800-2200ms)
// Attempt 2: 4000ms +/- 400ms  (3600-4400ms)
// Attempt 3: 8000ms +/- 800ms  (7200-8800ms)
// Attempt 4: 16000ms +/- 1600ms (14400-17600ms)
// Attempt 5+: 30000ms (capped) +/- 3000ms (27000-33000ms)

// ============================================================================
// TRANSIENT ERROR DETECTION (Task 2)
// ============================================================================
export function isTransientError(error: unknown): boolean {
  // Null/undefined check
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const err = error as Record<string, unknown>;

  // Check Node.js system error code
  if (typeof err.code === 'string' && TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  // Check PipelineError from P5.M4.T1.S1
  // Import { isAgentError, ErrorCodes } from './errors.js'
  if (isAgentError(err)) {
    // Agent errors are transient if they're timeouts or LLM failures
    return (
      err.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
      err.code === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
    );
  }

  // Check HTTP status code (for axios/fetch errors)
  const status = err.response?.status as number | undefined;
  if (typeof status === 'number' && RETRYABLE_HTTP_STATUS_CODES.has(status)) {
    return true;
  }

  // Check error message patterns for transient indicators
  const message = String(err.message ?? '').toLowerCase();
  const TRANSIENT_PATTERNS = [
    'timeout',
    'network error',
    'temporarily unavailable',
    'service unavailable',
    'connection reset',
    'connection refused',
    'rate limit',
    'too many requests',
    'econnreset',
    'etimedout',
  ];

  return TRANSIENT_PATTERNS.some((pattern) => message.includes(pattern));
}

// NEVER RETRY these errors:
// - ValidationError (invalid input, retrying won't help)
// - Authentication errors (401, 403)
// - Not found errors (404)
// - Parsing errors (malformed response)
// - Import { isValidationError } from './errors.js'
export function isPermanentError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const err = error as Record<string, unknown>;

  // Check ValidationError from P5.M4.T1.S1
  if (isValidationError(err)) {
    return true;
  }

  // Check HTTP client errors (except 408 timeout and 429 rate limit)
  const status = err.response?.status as number | undefined;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return status !== 408 && status !== 429;
  }

  // Check error message for permanent indicators
  const message = String(err.message ?? '').toLowerCase();
  const PERMANENT_PATTERNS = [
    'validation failed',
    'invalid input',
    'unauthorized',
    'forbidden',
    'not found',
    'authentication failed',
    'parse error',
  ];

  return PERMANENT_PATTERNS.some((pattern) => message.includes(pattern));
}

// ============================================================================
// MAIN RETRY FUNCTION (Task 3)
// ============================================================================
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitterFactor = 0.1,
    isRetryable = isTransientError,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Attempt the operation
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryable(error)) {
        // Non-retryable error - throw immediately
        throw error;
      }

      // Check if this was the last attempt
      if (attempt >= maxAttempts - 1) {
        // Last attempt failed - throw the error
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(
        attempt,
        baseDelay,
        maxDelay,
        backoffFactor,
        jitterFactor
      );

      // Call retry callback if provided
      onRetry?.(attempt + 1, error, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

// ============================================================================
// DEFAULT ON RETRY HANDLER WITH LOGGER (Task 4)
// ============================================================================
import { getLogger } from './logger.js';

const logger = getLogger('retry');

export function createDefaultOnRetry(operationName: string) {
  return (attempt: number, error: unknown, delay: number) => {
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.warn(
      {
        operation: operationName,
        attempt,
        maxAttempts: 3, // Could be passed in
        delayMs: delay,
        errorName,
        errorMessage,
      },
      `Retrying ${operationName} after ${delay}ms (attempt ${attempt})`
    );
  };
}

// ============================================================================
// AGENT PROMPT WRAPPER (Task 6 - Helper)
// ============================================================================
export async function retryAgentPrompt<T>(
  agentPromptFn: () => Promise<T>,
  context: { agentType: string; operation: string }
): Promise<T> {
  return retry(agentPromptFn, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    onRetry: createDefaultOnRetry(`${context.agentType}.${context.operation}`),
  });
}

// ============================================================================
// MCP TOOL WRAPPER (Task 7 - Helper)
// ============================================================================
export async function retryMcpTool<T>(
  toolFn: () => Promise<T>,
  context: { toolName: string; operation: string }
): Promise<T> {
  return retry(toolFn, {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 5000,
    isRetryable: (error) => {
      // MCP tool errors may have different structure
      if (error == null || typeof error !== 'object') {
        return false;
      }
      const err = error as Record<string, unknown>;

      // Check for transient error patterns in MCP errors
      const message = String(err.message ?? '').toLowerCase();
      return isTransientError(error) || message.includes('temporarily');
    },
    onRetry: createDefaultOnRetry(`${context.toolName}.${context.operation}`),
  });
}
```

### Integration Points

```yaml
ERROR HIERARCHY:
  - import from: src/utils/errors.ts
  - pattern: "import { isAgentError, isValidationError, ErrorCodes } from './errors.js'"
  - use: Check error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT for transient detection

LOGGER:
  - import from: src/utils/logger.ts
  - pattern: "import { getLogger } from './logger.js'"
  - use: Log retry attempts with warning level

AGENT CALLS:
  - modify: src/agents/prp-generator.ts:448
    before: const result = await this.#researcherAgent.prompt(prompt);
    after: const result = await retry(() => this.#researcherAgent.prompt(prompt), { ... });

  - modify: src/agents/prp-executor.ts:250
    before: const coderResponse = await this.#coderAgent.prompt(injectedPrompt);
    after: const coderResponse = await retry(() => this.#coderAgent.prompt(injectedPrompt), { ... });

  - modify: src/workflows/prp-pipeline.ts:490
    add import: "import { retry } from '../utils/retry.js';"
    wrap: await retry(() => architectAgent.prompt(architectPrompt), { ... });

MCP TOOLS:
  - modify: src/agents/prp-executor.ts:355
    before: const result = await this.#bashMCP.execute_bash({ command, cwd, timeout });
    after: const result = await retry(() => this.#bashMCP.execute_bash(...), { ... });
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after src/utils/retry.ts is created - fix before proceeding
npm run lint -- src/utils/retry.ts --fix     # Auto-format linting issues
npm run type-check                             # TypeScript type checking
npm run format -- src/utils/retry.ts          # Ensure formatting

# Full project validation after all modifications
npm run lint -- --fix
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test retry utility module
npm test -- tests/unit/utils/retry.test.ts --run

# Full utils test suite
npm test -- tests/unit/utils/ --run

# Coverage validation (should match 100% threshold)
npm test -- tests/unit/utils/retry.test.ts --run --coverage

# Expected: All tests pass, 100% coverage. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify imports work correctly
node -e "import { retry, isTransientError } from './src/utils/retry.js'; console.log('Import OK');"

# Verify retry logic with mock failure
node -e "
import { retry } from './src/utils/retry.js';

let attempts = 0;
const result = await retry(async () => {
  attempts++;
  if (attempts < 3) {
    throw new Error('ETIMEDOUT');
  }
  return 'success';
}, { maxAttempts: 5, baseDelay: 100 });

console.log('Retry test passed, attempts:', attempts, 'result:', result);
"

# Verify transient error detection
node -e "
import { isTransientError } from './src/utils/retry.js';

const timeoutErr = { code: 'ETIMEDOUT', message: 'Connection timeout' };
console.log('ETIMEDOUT is transient:', isTransientError(timeoutErr));

const notFoundErr = { response: { status: 404 }, message: 'Not found' };
console.log('404 is not transient:', !isTransientError(notFoundErr));
"

# Verify non-transient errors throw immediately
node -e "
import { retry } from './src/utils/retry.js';

try {
  await retry(async () => {
    const err = new Error('Validation failed');
    (err as any).code = 'VALIDATION_ERROR';
    throw err;
  }, { maxAttempts: 5 });
  console.log('ERROR: Should have thrown immediately');
} catch (e) {
  console.log('Correct: Non-transient error thrown immediately');
}
"

# Expected: All imports work, retry logic works, transient detection works
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual validation: Test with actual agent prompt call pattern
node -e "
import { retry } from './src/utils/retry.js';

// Simulate agent prompt call with transient failure
let callCount = 0;
const mockAgent = {
  prompt: async (prompt: string) => {
    callCount++;
    if (callCount === 1) {
      const err = new Error('Request timeout');
      (err as any).code = 'ETIMEDOUT';
      throw err;
    }
    return { content: 'Success after retry' };
  }
};

const result = await retry(
  () => mockAgent.prompt('test prompt'),
  {
    maxAttempts: 3,
    baseDelay: 100,
    onRetry: (attempt, error, delay) => {
      console.log(\`Retry \${attempt} after \${delay}ms: \${error.message}\`);
    }
  }
);

console.log('Agent prompt retry test passed, calls:', callCount);
"

# Test exponential backoff timing
node -e "
import { retry } from './src/utils/retry.js';

const delays: number[] = [];
const startTime = Date.now();

try {
  await retry(async () => {
    delays.push(Date.now() - startTime);
    const err = new Error('ECONNRESET');
    (err as any).code = 'ECONNRESET';
    throw err;
  }, { maxAttempts: 4, baseDelay: 200, jitterFactor: 0 });
} catch (e) {
  console.log('Delays between attempts:');
  for (let i = 1; i < delays.length; i++) {
    console.log(\`  Delay \${i}: \${delays[i] - delays[i-1]}ms\`);
  }
}
"

# Test jitter randomization
node -e "
import { retry } from './src/utils/retry.js';

const delays: number[] = [];

for (let i = 0; i < 10; i++) {
  const start = Date.now();
  try {
    await retry(async () => {
      throw new Error('ETIMEDOUT');
    }, { maxAttempts: 2, baseDelay: 1000, jitterFactor: 0.2 });
  } catch (e) {
    delays.push(Date.now() - start);
  }
}

const uniqueDelays = new Set(delays.map(d => Math.floor(d / 100) * 100));
console.log('Unique delay values (should vary due to jitter):', Array.from(uniqueDelays).sort());
"

# Test MCP tool error pattern
node -e "
import { retry, isTransientError } from './src/utils/retry.js';

// Simulate MCP tool error
const mcpError = {
  message: 'Command failed: Connection timeout',
  stderr: 'ETIMEDOUT',
  success: false
};

console.log('MCP timeout error is transient:', isTransientError(mcpError));
"

# Expected: All creative validations pass, delays follow exponential pattern, jitter creates variance
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/retry.test.ts --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: Level 3 integration commands pass
- [ ] Exponential backoff produces correct delays (1s, 2s, 4s, 8s...)
- [ ] Jitter creates variance in retry delays
- [ ] Transient errors trigger retries (ETIMEDOUT, ECONNRESET, 5xx)
- [ ] Permanent errors throw immediately (400, 404, ValidationError)
- [ ] Agent prompt calls wrapped at all 7 locations
- [ ] MCP tool executions wrapped
- [ ] Retry attempts logged with warning level

### Code Quality Validation

- [ ] Follows existing codebase patterns (matches prp-generator.ts retry structure)
- [ ] File placement matches desired codebase tree
- [ ] Consolidates duplicate retry patterns from prp-generator.ts and prp-executor.ts
- [ ] Integration with logger.ts verified (structured logging)
- [ ] Integration with errors.ts verified (error code checking)
- [ ] Sleep utility uses async/await, not blocking

### Documentation & Deployment

- [ ] Code is self-documenting with clear JSDoc comments
- [ ] Retry options interface exported for external configuration
- [ ] Type-safe generic implementation supports all return types
- [ ] Helper functions (retryAgentPrompt, retryMcpTool) exported for convenience

---

## Anti-Patterns to Avoid

- ❌ Don't retry all errors - check if error is retryable first
- ❌ Don't use fixed delay - implement exponential backoff
- ❌ Don't skip jitter - causes thundering herd problem
- ❌ Don't use blocking sleep - use async setTimeout wrapper
- ❌ Don't retry validation errors - permanent failures won't change
- ❌ Don't set maxAttempts too high - wastes time on permanent failures
- ❌ Don't forget to log retry attempts - makes debugging impossible
- ❌ Don't lose original error stack trace - preserve for debugging
- ❌ Don't retry non-idempotent operations without careful consideration
- ❌ Don't create infinite retry loops - always set maxAttempts limit
