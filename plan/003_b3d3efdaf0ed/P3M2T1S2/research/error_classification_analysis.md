# Error Classification Analysis for TaskRetryManager

## 1. Error Class Hierarchy

### Base Class

- **PipelineError** (abstract, lines 143-342)
  - All pipeline errors inherit from this base class
  - Contains common properties: `code`, `context`, `timestamp`
  - Implements `toJSON()` for structured logging
  - Includes sensitive data sanitization

### Specialized Error Classes

1. **SessionError** (lines 362-380)
   - Code: `PIPELINE_SESSION_LOAD_FAILED`
   - Usage: Session load/save operations
   - **Fatal**: When code is `LOAD_FAILED` or `SAVE_FAILED` (lines 680-684)

2. **TaskError** (lines 396-403)
   - Code: `PIPELINE_TASK_EXECUTION_FAILED`
   - Usage: Task execution failures
   - **Non-fatal**: Always retryable (lines 695-698)

3. **AgentError** (lines 420-427)
   - Code: `PIPELINE_AGENT_LLM_FAILED`
   - Usage: LLM call failures (timeout, API failures, parsing errors)
   - **Transient**: Retryable when code is `TIMEOUT` or `LLM_FAILED` (lines 335-339)

4. **ValidationError** (lines 444-471)
   - Code: Variable (see ErrorCodes below)
   - Usage: Validation failures (schema, circular dependencies, etc.)
   - **Permanent**: Never retryable (lines 342-345, 397-399)
   - Special case: `INVALID_INPUT` for parse_prd is fatal (lines 687-693)

5. **EnvironmentError** (lines 488-495)
   - Code: `PIPELINE_VALIDATION_INVALID_INPUT`
   - Usage: Environment configuration failures
   - **Fatal**: All instances are fatal (lines 674-677)

## 2. Error Codes

### Session Errors

- `PIPELINE_SESSION_LOAD_FAILED`
- `PIPELINE_SESSION_SAVE_FAILED`
- `PIPELINE_SESSION_NOT_FOUND`

### Task Errors

- `PIPELINE_TASK_EXECUTION_FAILED`
- `PIPELINE_TASK_VALIDATION_FAILED`
- `PIPELINE_TASK_NOT_FOUND`

### Agent Errors

- `PIPELINE_AGENT_LLM_FAILED`
- `PIPELINE_AGENT_TIMEOUT`
- `PIPELINE_AGENT_PARSE_FAILED`

### Validation Errors

- `PIPELINE_VALIDATION_INVALID_INPUT`
- `PIPELINE_VALIDATION_MISSING_FIELD`
- `PIPELINE_VALIDATION_SCHEMA_FAILED`
- `PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY`

### Resource Errors

- `PIPELINE_RESOURCE_LIMIT_EXCEEDED`

## 3. Error Classification Functions

### isTransientError() (lines 323-361)

```typescript
export function isTransientError(error: unknown): boolean {
  // Null/undefined check
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;

  // Check PipelineError from P5.M4.T1.S1
  // We need to check the code before type narrowing since AgentError has a fixed code
  if (isPipelineError(err)) {
    const errorCode = err.code;
    // Agent errors are transient if they're timeouts or LLM failures
    return (
      errorCode === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
      errorCode === ErrorCodes.PIPELINE_AGENT_LLM_FAILED
    );
  }

  // ValidationError is never retryable (permanent failure)
  if (isValidationError(err)) {
    return false;
  }

  // Check Node.js system error code
  if (typeof err.code === 'string' && TRANSIENT_ERROR_CODES.has(err.code)) {
    return true;
  }

  // Check HTTP status code (for axios/fetch errors)
  const status = err.response?.status as number | undefined;
  if (typeof status === 'number' && RETRYABLE_HTTP_STATUS_CODES.has(status)) {
    return true;
  }

  // Check error message patterns for transient indicators
  const message = String(err.message ?? '').toLowerCase();
  return TRANSIENT_PATTERNS.some(pattern => message.includes(pattern));
}
```

### isPermanentError() (lines 388-410)

```typescript
export function isPermanentError(error: unknown): boolean {
  // Null/undefined check
  if (error == null || typeof error !== 'object') {
    return false;
  }

  const err = error as RetryableError;

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
  return PERMANENT_PATTERNS.some(pattern => message.includes(pattern));
}
```

### isFatalError() (lines 658-703)

```typescript
export function isFatalError(
  error: unknown,
  continueOnError: boolean = false
): boolean {
  // Override all logic when continueOnError is true
  if (continueOnError) {
    return false;
  }

  // Non-object errors are non-fatal
  if (error == null || typeof error !== 'object') {
    return false;
  }

  // Check for PipelineError instances using type guard
  if (isPipelineError(error)) {
    // FATAL: All EnvironmentError instances
    if (isEnvironmentError(error)) {
      return true;
    }

    // FATAL: SessionError with LOAD_FAILED or SAVE_FAILED codes
    if (isSessionError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED ||
        error.code === ErrorCodes.PIPELINE_SESSION_SAVE_FAILED
      );
    }

    // FATAL: ValidationError for parse_prd operation with INVALID_INPUT code
    if (isValidationError(error)) {
      return (
        error.code === ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT &&
        error.context?.operation === 'parse_prd'
      );
    }

    // NON-FATAL: TaskError and AgentError are individual failures
    if (isTaskError(error) || isAgentError(error)) {
      return false;
    }
  }

  // Default: non-fatal for unknown error types
  return false;
}
```

## 4. Transient Error Detection Patterns

### Node.js System Error Codes (lines 67-77)

```typescript
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET', // Connection reset by peer
  'ECONNREFUSED', // Connection refused
  'ETIMEDOUT', // Connection timeout
  'ENOTFOUND', // DNS lookup failed
  'EPIPE', // Broken pipe
  'EAI_AGAIN', // DNS temporary failure
  'EHOSTUNREACH', // Host unreachable
  'ENETUNREACH', // Network unreachable
  'ECONNABORTED', // Connection aborted
]);
```

### HTTP Status Codes (lines 87-94)

```typescript
const RETRYABLE_HTTP_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);
```

### Transient Message Patterns (lines 102-113)

```typescript
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
```

### Permanent Message Patterns (lines 122-130)

```typescript
const PERMANENT_PATTERNS = [
  'validation failed',
  'invalid input',
  'unauthorized',
  'forbidden',
  'not found',
  'authentication failed',
  'parse error',
];
```

## 5. Error Usage Patterns

### ValidationError (Never Retry)

- **Location**: Lines 445-471 in errors.ts
- **Usage**:
  - SessionManager PRD validation (lines 260-268)
  - DependencyValidator circular dependencies
  - PRPExecutor validation gates
- **Pattern**: Always thrown for validation failures
- **Classification**: Permanent (never retryable)

### AgentError (Retryable for specific codes)

- **Location**: Lines 420-427 in errors.ts
- **Usage**: LLM call failures (PRPGenerator, PRPExecutor, PRPRuntime)
- **Retryable When**:
  - `PIPELINE_AGENT_TIMEOUT` (line 337)
  - `PIPELINE_AGENT_LLM_FAILED` (line 338)
- **Not Retryable When**:
  - `PIPELINE_AGENT_PARSE_FAILED` (lines 192-198 in retry.test.ts)

### TaskError (Always Retryable)

- **Location**: Lines 396-403 in errors.ts
- **Usage**: Task execution failures
- **Classification**: Non-fatal (always retryable)
- **Pattern**: Individual task failures don't halt pipeline

### SessionError (Context-dependent)

- **Location**: Lines 362-380 in errors.ts
- **Usage**: Session load/save operations
- **Fatal When**:
  - `PIPELINE_SESSION_LOAD_FAILED` (line 682)
  - `PIPELINE_SESSION_SAVE_FAILED` (line 683)
- **Non-fatal When**: Other session-related codes

## 6. Error Classification Matrix for PRP

| Error Type                                        | Retryable | Reason                                                 | Special Cases                             |
| ------------------------------------------------- | --------- | ------------------------------------------------------ | ----------------------------------------- |
| **ValidationError**                               | NO        | Invalid input will always fail validation              | `parse_prd` with `INVALID_INPUT` is fatal |
| **AgentError** with `PIPELINE_AGENT_TIMEOUT`      | YES       | Temporary timeout, may resolve on retry                | Gets exponential backoff                  |
| **AgentError** with `PIPELINE_AGENT_LLM_FAILED`   | YES       | LLM API issues typically transient                     | Gets exponential backoff                  |
| **AgentError** with `PIPELINE_AGENT_PARSE_FAILED` | NO        | Parse errors indicate invalid output                   | Non-retryable                             |
| **TaskError**                                     | YES       | Individual task failure, pipeline continues            | All instances retryable                   |
| **SessionError** with `LOAD_FAILED`/`SAVE_FAILED` | NO        | Session state corruption                               | Fatal, halts pipeline                     |
| **SessionError** (other codes)                    | YES       | Session issues typically transient                     | Context-dependent                         |
| **EnvironmentError**                              | NO        | Configuration issues require manual fix                | All instances fatal                       |
| **Standard Error** (TypeError, etc.)              | YES       | Standard errors treated as transient                   | Unknown patterns retryable                |
| **Node.js System Errors**                         | YES/NO    | Based on error code (see TRANSIENT_ERROR_CODES)        | Network-related retryable                 |
| **HTTP Errors**                                   | YES/NO    | Based on status code (see RETRYABLE_HTTP_STATUS_CODES) | 408/429/5xx retryable                     |

## 7. Key Findings for TaskRetryManager

1. **Only 2 error types are permanently non-retryable**:
   - ValidationError (all instances)
   - AgentError with `PIPELINE_AGENT_PARSE_FAILED`

2. **Most AgentErrors are retryable**:
   - Only timeout and LLM failure codes get retries
   - Parse failures are non-retryable

3. **Session errors are context-dependent**:
   - Load/save failures are fatal
   - Other session issues may be retryable

4. **All TaskErrors are retryable**:
   - Individual failures don't stop the pipeline
   - Retries should use exponential backoff

5. **Existing retry logic is comprehensive**:
   - Node.js system error codes
   - HTTP status codes
   - Error message patterns
   - PipelineError hierarchy integration

6. **Special considerations**:
   - Rate limiting (429) gets more retries
   - Timeouts (408) get exponential backoff
   - HTTP 5xx errors get retries
   - Client errors (4xx except 408/429) are permanent
