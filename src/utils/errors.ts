/**
 * Error hierarchy for pipeline operations
 *
 * @module utils/errors
 *
 * @remarks
 * Provides a robust error hierarchy with base class, specialized error types,
 * error codes, context objects, and structured logging support via toJSON().
 *
 * Features:
 * - Error codes for programmatic handling (retry logic, monitoring)
 * - Rich context objects for debugging
 * - toJSON() serialization for pino structured logging
 * - Proper prototype chain setup for instanceof checks
 * - Sensitive data sanitization matching logger.ts REDACT_PATHS
 * - Type guard functions for type narrowing
 *
 * @example
 * ```typescript
 * import { SessionError, TaskError, isSessionError } from './utils/errors.js';
 *
 * // Throw error with context
 * throw new SessionError(
 *   'Failed to load session',
 *   { sessionPath: '/path/to/session', taskId: 'P1.M1.T1' }
 * );
 *
 * // Type narrowing in catch block
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (isSessionError(error)) {
 *     // error is narrowed to SessionError
 *     console.log(error.code); // 'PIPELINE_SESSION_LOAD_FAILED'
 *   }
 * }
 *
 * // Structured logging with pino
 * logger.error(error.toJSON(), 'Operation failed');
 * ```
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Error codes for pipeline operations
 *
 * @remarks
 * Format: PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}
 * - Domain: SESSION, TASK, AGENT, VALIDATION
 * - Action: LOAD, SAVE, EXECUTION, LLM, TIMEOUT
 * - Outcome: FAILED, NOT_FOUND, INVALID
 *
 * Using const assertion for type-safe error codes.
 */
export const ErrorCodes = {
  // Session errors
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_SESSION_NOT_FOUND: 'PIPELINE_SESSION_NOT_FOUND',

  // Task errors
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  PIPELINE_TASK_VALIDATION_FAILED: 'PIPELINE_TASK_VALIDATION_FAILED',
  PIPELINE_TASK_NOT_FOUND: 'PIPELINE_TASK_NOT_FOUND',

  // Agent errors
  PIPELINE_AGENT_LLM_FAILED: 'PIPELINE_AGENT_LLM_FAILED',
  PIPELINE_AGENT_TIMEOUT: 'PIPELINE_AGENT_TIMEOUT',
  PIPELINE_AGENT_PARSE_FAILED: 'PIPELINE_AGENT_PARSE_FAILED',

  // Validation errors
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  PIPELINE_VALIDATION_MISSING_FIELD: 'PIPELINE_VALIDATION_MISSING_FIELD',
  PIPELINE_VALIDATION_SCHEMA_FAILED: 'PIPELINE_VALIDATION_SCHEMA_FAILED',
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY:
    'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',
} as const;

/**
 * Type for error code values
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// ERROR CONTEXT INTERFACE
// ============================================================================

/**
 * Error context interface for type-safe debugging information
 *
 * @remarks
 * Extends Record<string, unknown> to allow any properties while
 * documenting common fields used across the codebase.
 */
export interface PipelineErrorContext extends Record<string, unknown> {
  /** Path to session directory */
  sessionPath?: string;
  /** Task or subtask ID */
  taskId?: string;
  /** Operation being performed */
  operation?: string;
  /** Underlying cause description */
  cause?: string;
  /** Additional properties */
  [key: string]: unknown;
}

// ============================================================================
// PIPELINE ERROR BASE CLASS
// ============================================================================

/**
 * Base error class for all pipeline operations
 *
 * @remarks
 * Abstract class that defines the common structure for all pipeline errors.
 * Each specialized error class extends this base and provides a specific
 * error code.
 *
 * Features:
 * - Abstract code property enforced on subclasses
 * - Optional context object for debugging
 * - Timestamp for error tracking
 * - toJSON() for structured logging
 * - Sensitive data sanitization
 * - Circular reference handling
 *
 * @example
 * ```typescript
 * // Cannot instantiate directly (abstract class)
 * // new PipelineError('message'); // ERROR
 *
 * // Use specialized subclasses
 * throw new SessionError('Failed to load session', { sessionPath: '/path' });
 * ```
 */
export abstract class PipelineError extends Error {
  /**
   * Unique error code for programmatic handling
   *
   * @remarks
   * Abstract property - each subclass must define its own code.
   * Used for retry logic, monitoring, and type narrowing.
   */
  abstract readonly code: ErrorCode;

  /**
   * Additional context for debugging
   *
   * @remarks
   * Optional object containing operation-specific debugging information.
   * Sanitized in toJSON() to remove sensitive data.
   */
  readonly context?: PipelineErrorContext;

  /**
   * Timestamp when error was created
   *
   * @remarks
   * ISO 8601 timestamp for error tracking and monitoring.
   */
  readonly timestamp: Date;

  /**
   * Creates a new PipelineError
   *
   * @param message - Human-readable error message
   * @param context - Optional context object with debugging information
   * @param cause - Optional underlying error that caused this error
   *
   * @remarks
   * - Sets prototype explicitly for instanceof checks
   * - Captures stack trace via Error.captureStackTrace (V8/Node.js only)
   * - Stores cause on error instance for error chaining
   */
  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);

    // CRITICAL: Set prototype for instanceof to work correctly
    // ES5 target requires this, but it's best practice even for ES2022
    Object.setPrototypeOf(this, new.target.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js only)
    // Check for existence before calling for cross-platform compatibility
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // Store cause if provided (ES2022+)
    // Using type assertion because cause property is not on Error type in all TypeScript versions
    if (cause) {
      (this as unknown as { cause?: Error }).cause = cause;
    }
  }

  /**
   * Serialize error for structured logging
   *
   * @remarks
   * Returns a plain object compatible with JSON.stringify and pino logger.
   * Handles circular references and sanitizes sensitive data.
   *
   * Output includes:
   * - name: Error class name
   * - code: Error code for programmatic handling
   * - message: Human-readable error message
   * - timestamp: ISO 8601 timestamp
   * - context: Sanitized context object (if provided)
   * - stack: Stack trace (if available)
   *
   * @example
   * ```typescript
   * import { getLogger } from './logger.js';
   * const logger = getLogger('MyComponent');
   *
   * try {
   *   await someOperation();
   * } catch (error) {
   *   if (error instanceof PipelineError) {
   *     logger.error(error.toJSON(), 'Operation failed');
   *   }
   * }
   * ```
   */
  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    // Add context if present (with sanitization)
    if (this.context) {
      serialized.context = this.sanitizeContext(this.context);
    }

    // Add stack trace (inherited from Error.prototype)
    if (this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }

  /**
   * Sanitize context object for logging
   *
   * @remarks
   * Removes sensitive data matching logger.ts REDACT_PATHS patterns.
   * Handles circular references and non-serializable objects.
   *
   * Sensitive keys (case-insensitive):
   * - apiKey, apiSecret, api_key, api_secret
   * - token, accessToken, refreshToken, authToken
   * - password, secret, privateKey
   * - authorization, Authorization
   *
   * @param context - Context object to sanitize
   * @returns Sanitized context object
   * @private
   */
  private sanitizeContext(
    context: PipelineErrorContext
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    // Sensitive key patterns (lowercase for case-insensitive matching)
    const sensitiveKeys = [
      'apikey',
      'apisecret',
      'api_key',
      'api_secret',
      'token',
      'accesstoken',
      'refreshtoken',
      'authtoken',
      'bearertoken',
      'idtoken',
      'sessiontoken',
      'password',
      'passwd',
      'secret',
      'privatekey',
      'private',
      'email',
      'emailaddress',
      'phonenumber',
      'ssn',
      'authorization',
    ];

    for (const [key, value] of Object.entries(context)) {
      // Check if key is sensitive (case-insensitive)
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Handle nested errors
      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
        };
        continue;
      }

      // Handle functions (non-serializable)
      if (typeof value === 'function') {
        sanitized[key] = '[non-serializable]';
        continue;
      }

      // Handle circular references and other non-serializable objects
      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = '[non-serializable]';
      }
    }

    return sanitized;
  }
}

// ============================================================================
// SPECIALIZED ERROR CLASSES
// ============================================================================

/**
 * Session management errors
 *
 * @remarks
 * Used by SessionManager, session-utils.ts for session load/save operations.
 *
 * @example
 * ```typescript
 * throw new SessionError(
 *   'Failed to load session',
 *   { sessionPath: '/path/to/session', taskId: 'P1.M1.T1' }
 * );
 * ```
 */
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // Ensure prototype is set for this class
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  /**
   * Check if this is a session load error
   *
   * @remarks
   * Convenience method for checking specific error codes.
   */
  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}

/**
 * Task execution errors
 *
 * @remarks
 * Used by TaskOrchestrator, PRPExecutor for task execution failures.
 *
 * @example
 * ```typescript
 * throw new TaskError(
 *   'Task execution failed',
 *   { taskId: 'P1.M1.T1', attempt: 3, maxAttempts: 5 }
 * );
 * ```
 */
export class TaskError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, TaskError.prototype);
  }
}

/**
 * LLM agent errors
 *
 * @remarks
 * Used by PRPGenerator, PRPExecutor, PRPRuntime for LLM call failures.
 * Covers timeouts, API failures, and response parsing errors.
 *
 * @example
 * ```typescript
 * throw new AgentError(
 *   'LLM call failed',
 *   { taskId: 'P1.M1.T1', operation: 'generatePRP', attempt: 3 }
 * );
 * ```
 */
export class AgentError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_AGENT_LLM_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Validation errors
 *
 * @remarks
 * Used by PRPExecutor validation gates, scope-resolver.ts.
 * Different from prp-executor.ts ValidationError (has level, command, stdout, stderr).
 *
 * @example
 * ```typescript
 * throw new ValidationError(
 *   'Invalid scope format',
 *   { invalidInput: 'P1.X', expectedFormat: 'P1.M1' }
 * );
 * ```
 */
export class ValidationError extends PipelineError {
  readonly code: ErrorCode;

  constructor(
    message: string,
    context?: PipelineErrorContext,
    errorCodeOrCause?: ErrorCode | Error
  ) {
    // Determine if third argument is an error code or a cause
    let errorCode: ErrorCode;
    let cause: Error | undefined;

    if (errorCodeOrCause) {
      if (typeof errorCodeOrCause === 'string') {
        errorCode = errorCodeOrCause;
      } else {
        cause = errorCodeOrCause;
        errorCode = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
      }
    } else {
      errorCode = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;
    }

    super(message, context, cause);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.code = errorCode;
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for PipelineError
 *
 * @remarks
 * Returns true if the error is an instance of PipelineError.
 * Enables type narrowing in catch blocks.
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   if (isPipelineError(error)) {
 *     // error is narrowed to PipelineError
 *     console.log(error.code);
 *     logger.error(error.toJSON(), 'Operation failed');
 *   }
 * }
 * ```
 */
export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

/**
 * Type guard for SessionError
 *
 * @remarks
 * Returns true if the error is an instance of SessionError.
 * Use for session-specific error handling.
 *
 * @example
 * ```typescript
 * if (isSessionError(error)) {
 *   // error is narrowed to SessionError
 *   if (error.isLoadError()) {
 *     // Handle session load failure
 *   }
 * }
 * ```
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

/**
 * Type guard for TaskError
 *
 * @remarks
 * Returns true if the error is an instance of TaskError.
 * Use for task-specific error handling.
 */
export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

/**
 * Type guard for AgentError
 *
 * @remarks
 * Returns true if the error is an instance of AgentError.
 * Use for agent/LLM-specific error handling and retry logic.
 *
 * @example
 * ```typescript
 * if (isAgentError(error)) {
 *   // Check error code for retry logic
 *   if (error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) {
 *     // Retry the operation
 *   }
 * }
 * ```
 */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/**
 * Type guard for ValidationError
 *
 * @remarks
 * Returns true if the error is an instance of ValidationError.
 * Use for validation-specific error handling.
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
