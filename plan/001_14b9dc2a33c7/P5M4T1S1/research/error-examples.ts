/**
 * TypeScript Error Handling - Complete Working Examples
 *
 * This file contains production-ready error handling patterns
 * that can be used as a reference or starting point.
 */

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  /**
   * Unique error code for programmatic handling
   */
  public abstract readonly code: string;

  /**
   * HTTP status code (for API errors)
   */
  public readonly statusCode: number;

  /**
   * Whether this is an operational error (expected) or programming error (bug)
   */
  public readonly isOperational: boolean;

  /**
   * Additional context about the error
   */
  public readonly context: Record<string, unknown>;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context: Record<string, unknown> = {}
  ) {
    super(message);

    // Maintain proper stack trace (V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, this.constructor.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
  }

  /**
   * Serialize error for logging
   */
  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
    };

    if (Object.keys(this.context).length > 0) {
      serialized.context = this.context;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }
}

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Standard error codes
 * Format: {DOMAIN}_{SPECIFIC_ERROR}
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Database
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',

  // External Services
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  BUSINESS_STATE_INVALID: 'BUSINESS_STATE_INVALID',

  // System
  SYSTEM_INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  SYSTEM_TIMEOUT: 'SYSTEM_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// HTTP ERRORS
// ============================================================================

/**
 * Base class for HTTP errors
 */
export abstract class HttpError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    code: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, statusCode, true, context);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends HttpError {
  readonly code = ErrorCodes.VALIDATION_INVALID_INPUT;

  constructor(
    message: string = 'Bad request',
    context?: Record<string, unknown>
  ) {
    super(message, 400, ErrorCodes.VALIDATION_INVALID_INPUT, context);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends HttpError {
  readonly code = ErrorCodes.AUTH_INVALID_TOKEN;

  constructor(
    message: string = 'Unauthorized',
    context?: Record<string, unknown>
  ) {
    super(message, 401, ErrorCodes.AUTH_INVALID_TOKEN, context);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends HttpError {
  readonly code = ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS;

  constructor(
    message: string = 'Forbidden',
    context?: Record<string, unknown>
  ) {
    super(message, 403, ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS, context);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends HttpError {
  readonly code = ErrorCodes.RESOURCE_NOT_FOUND;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 404, ErrorCodes.RESOURCE_NOT_FOUND, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends HttpError {
  readonly code = ErrorCodes.RESOURCE_CONFLICT;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, ErrorCodes.RESOURCE_CONFLICT, context);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity
 */
export class UnprocessableEntityError extends HttpError {
  readonly code = ErrorCodes.VALIDATION_INVALID_FORMAT;

  constructor(
    message: string = 'Unprocessable entity',
    context?: Record<string, unknown>
  ) {
    super(message, 422, ErrorCodes.VALIDATION_INVALID_FORMAT, context);
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends HttpError {
  readonly code = ErrorCodes.SYSTEM_TIMEOUT;

  constructor(
    message: string = 'Too many requests',
    context?: Record<string, unknown>
  ) {
    super(message, 429, ErrorCodes.SYSTEM_TIMEOUT, context);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  readonly code = ErrorCodes.SYSTEM_INTERNAL_ERROR;

  constructor(
    message: string = 'Internal server error',
    context?: Record<string, unknown>
  ) {
    super(message, 500, ErrorCodes.SYSTEM_INTERNAL_ERROR, context);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends HttpError {
  readonly code = ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE;

  constructor(
    message: string = 'Service unavailable',
    context?: Record<string, unknown>
  ) {
    super(message, 503, ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE, context);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ============================================================================
// DOMAIN ERRORS
// ============================================================================

/**
 * Validation error
 */
export class ValidationError extends AppError {
  readonly code = ErrorCodes.VALIDATION_INVALID_INPUT;
  readonly field: string;

  constructor(
    message: string,
    field: string,
    context?: Record<string, unknown>
  ) {
    super(message, 400, true, { ...context, field });
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  readonly code = ErrorCodes.DATABASE_QUERY_ERROR;
  readonly originalError?: Error;

  constructor(
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(
      message,
      500,
      true,
      originalError
        ? { ...context, originalMessage: originalError.message }
        : context
    );
    this.originalError = originalError;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  readonly code = ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE;
  readonly service: string;

  constructor(
    message: string,
    service: string,
    context?: Record<string, unknown>
  ) {
    super(message, 503, true, { ...context, service });
    this.service = service;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

// ============================================================================
// ERROR SERIALIZATION UTILITIES
// ============================================================================

/**
 * Serialize an error to a plain object
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return {
      ...error,
      error: 'Non-Error object thrown',
    };
  }

  return { value: error, error: 'Non-Error value thrown' };
}

/**
 * Safely stringify an object, handling circular references
 */
export function safeStringify(obj: unknown, space?: number): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      // Handle errors
      if (value instanceof Error) {
        return serializeError(value);
      }

      // Handle BigInt
      if (typeof value === 'bigint') {
        return value.toString();
      }

      return value;
    },
    space
  );
}

// ============================================================================
// ERROR HANDLER UTILITIES
// ============================================================================

/**
 * Check if an error is an instance of AppError with a specific code
 */
export function isErrorCode(
  error: unknown,
  code: ErrorCode
): error is AppError {
  return error instanceof AppError && error.code === code;
}

/**
 * Check if error is operational (expected) or programming (bug)
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}

/**
 * Convert any error to an AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new InternalServerError(String(error));
}

// ============================================================================
// RESULT TYPE (Never throw for expected errors)
// ============================================================================

/**
 * Result type for operations that can fail
 * This is an alternative to throwing errors for expected failures
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function failure<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Map over the success value of a Result
 */
export function mapResult<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Chain Results together
 */
export async function chainResult<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.success) {
    return await fn(result.data);
  }
  return result;
}

// ============================================================================
// ASYNC ERROR HANDLER
// ============================================================================

/**
 * Wrap an async function to automatically catch and log errors
 */
export function asyncHandler<T>(
  fn: (...args: unknown[]) => Promise<T>
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const serialized = serializeError(error);
      console.error('Async error:', serialized);
      throw error;
    }
  };
}

/**
 * Execute an operation with error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  recovery?: (error: AppError) => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = toAppError(error);

    if (appError.isOperational && recovery) {
      return await recovery(appError);
    }

    throw appError;
  }
}

// ============================================================================
// ERROR CONTEXT BUILDER
// ============================================================================

/**
 * Builder pattern for creating error context
 */
export class ErrorContextBuilder {
  private context: Record<string, unknown> = {};

  add(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  addUser(user: { id: string; email?: string }): this {
    this.context.userId = user.id;
    this.context.userEmail = user.email;
    return this;
  }

  addRequest(request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  }): this {
    this.context.request = {
      method: request.method,
      url: request.url,
      headers: request.headers,
    };
    return this;
  }

  addOperation(operation: string): this {
    this.context.operation = operation;
    return this;
  }

  addTiming(timing: { started: Date; completed: Date }): this {
    this.context.durationMs =
      timing.completed.getTime() - timing.started.getTime();
    return this;
  }

  build(): Record<string, unknown> {
    return { ...this.context };
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Using errors in a service layer
 */
export class UserService {
  async findById(id: string): Promise<Result<NotFoundError, User>> {
    const context = new ErrorContextBuilder()
      .addOperation('findById')
      .add('userId', id)
      .build();

    try {
      // Simulate database lookup
      const user = await this.dbFindById(id);

      if (!user) {
        return failure(
          new NotFoundError('User not found', {
            ...context,
            userId: id,
          })
        );
      }

      return success(user);
    } catch (error) {
      return failure(
        new DatabaseError('Failed to find user', error as Error, context)
      );
    }
  }

  private async dbFindById(id: string): Promise<User | null> {
    // Database implementation
    return null;
  }
}

interface User {
  id: string;
  email: string;
}

/**
 * Example: Using errors in Express middleware
 */
export function expressErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', serializeError(err));

  // Convert to AppError
  const appError = toAppError(err);

  // Send response
  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(process.env.NODE_ENV === 'development' && {
        context: appError.context,
        stack: appError.stack,
      }),
    },
  });
}

/**
 * Example: Using errors in a controller
 */
export async function getUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userService = new UserService();
  const userId = req.params.id;

  const result = await userService.findById(userId);

  if (!result.success) {
    // Pass error to error handler middleware
    return next(result.error);
  }

  res.json(result.data);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { Request, Response, NextFunction } from 'express';
