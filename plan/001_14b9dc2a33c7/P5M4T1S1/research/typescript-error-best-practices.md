# TypeScript Error Handling Best Practices (2024-2025)

## Table of Contents

1. [Error Class Inheritance Patterns](#error-class-inheritance-patterns)
2. [Custom Error Classes with Proper Prototype Chain](#custom-error-classes-with-proper-prototype-chain)
3. [Error Codes and Programmatic Error Handling](#error-codes-and-programmatic-error-handling)
4. [Structured Logging with Error Context](#structured-logging-with-error-context)
5. [Enterprise Error Handling Patterns](#enterprise-error-handling-patterns)
6. [Integration with Logging Libraries](#integration-with-logging-libraries)
7. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
8. [Open Source Examples](#open-source-examples)

---

## Error Class Inheritance Patterns

### Basic Error Class Pattern (TypeScript 4.2+)

The most reliable pattern for creating custom error classes in modern TypeScript:

```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';

    // Critical: Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// Usage
try {
  throw new CustomError('Something went wrong');
} catch (error) {
  if (error instanceof CustomError) {
    console.log(error.message); // Works correctly
  }
}
```

### Pattern with Additional Properties

```typescript
class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;
  public readonly statusCode: number;

  constructor(
    message: string,
    field: string,
    code: string = 'VALIDATION_ERROR',
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

### Generic Base Error Class Pattern

For enterprise applications, create a base error class:

```typescript
abstract class AppError extends Error {
  public abstract readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace (V8/Node.js)
    Error.captureStackTrace(this, this.constructor);

    // Critical for proper instanceof checks
    Object.setPrototypeOf(this, this.constructor.prototype);
  }

  // For structured logging
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}
```

---

## Custom Error Classes with Proper Prototype Chain

### The Prototype Chain Problem and Solution

In TypeScript/JavaScript, extending `Error` has historically been problematic due to how `Error` is implemented in different JavaScript engines. Here's the complete solution:

```typescript
// Complete solution for TypeScript 5.0+
class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);

    // Set properties
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;

    // Solution 1: V8/Node.js specific - captures stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }

    // Solution 2: TypeScript prototype chain fix
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// Alternative: Using a factory function
function createErrorClass<T extends string>(className: string, defaultCode: T) {
  return class extends Error {
    public readonly code: T = defaultCode;
    public readonly timestamp: Date = new Date();
    public readonly context?: Record<string, unknown>;

    constructor(message: string, context?: Record<string, unknown>) {
      super(message);
      this.name = className;
      this.context = context;

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }

      Object.setPrototypeOf(this, this.constructor.prototype);
    }

    toJSON() {
      return {
        name: this.name,
        code: this.code,
        message: this.message,
        timestamp: this.timestamp.toISOString(),
        context: this.context,
        stack: this.stack,
      };
    }
  };
}

// Usage
const NotFoundError = createErrorClass('NotFoundError', 'NOT_FOUND' as const);
```

### Complete Error Hierarchy Example

```typescript
// Base error
export abstract class BaseError extends Error {
  public abstract readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, this.constructor.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

// HTTP errors
export class HttpError extends BaseError {
  public readonly statusCode: number;
  abstract readonly code: string;

  constructor(
    message: string,
    statusCode: number,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends HttpError {
  readonly code = 'BAD_REQUEST' as const;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, context);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  readonly code = 'UNAUTHORIZED' as const;
  constructor(
    message: string = 'Unauthorized',
    context?: Record<string, unknown>
  ) {
    super(message, 401, context);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends HttpError {
  readonly code = 'NOT_FOUND' as const;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 404, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// Domain errors
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR' as const;
  public readonly field: string;

  constructor(
    message: string,
    field: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, field });
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DomainError extends BaseError {
  readonly code = 'DOMAIN_ERROR' as const;
}

export class ConflictError extends BaseError {
  readonly code = 'CONFLICT' as const;
}

// Infrastructure errors
export class DatabaseError extends BaseError {
  readonly code = 'DATABASE_ERROR' as const;
  public readonly originalError?: Error;

  constructor(
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, originalMessage: originalError?.message });
    this.originalError = originalError;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalServiceError extends BaseError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as const;
  public readonly service: string;

  constructor(
    message: string,
    service: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, service });
    this.service = service;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}
```

---

## Error Codes and Programmatic Error Handling

### Error Code Conventions

Follow a structured naming convention for error codes:

```typescript
// Error code patterns: {DOMAIN}_{SPECIFIC_ERROR}

// Format: PREFIX_ACTION_CODE (e.g., AUTH_INVALID_TOKEN)
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
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Database
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',

  // External Services
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_INVALID_RESPONSE: 'EXTERNAL_SERVICE_INVALID_RESPONSE',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  BUSINESS_STATE_INVALID: 'BUSINESS_STATE_INVALID',
  BUSINESS_QUOTA_EXCEEDED: 'BUSINESS_QUOTA_EXCEEDED',

  // System
  SYSTEM_INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  SYSTEM_TIMEOUT: 'SYSTEM_TIMEOUT',
  SYSTEM_OVERLOAD: 'SYSTEM_OVERLOAD',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### Error Code Registry Pattern

```typescript
// Error metadata registry
interface ErrorMetadata {
  code: string;
  message: string;
  statusCode: number;
  description: string;
  documentation?: string;
}

const errorRegistry = new Map<string, ErrorMetadata>();

function registerError(metadata: ErrorMetadata): void {
  errorRegistry.set(metadata.code, metadata);
}

function getErrorMetadata(code: string): ErrorMetadata | undefined {
  return errorRegistry.get(code);
}

// Register errors
registerError({
  code: ErrorCodes.RESOURCE_NOT_FOUND,
  message: 'The requested resource was not found',
  statusCode: 404,
  description: 'Indicates that a requested resource could not be found',
  documentation: 'https://docs.example.com/errors#resource-not-found',
});

// Usage in error handling
function handleError(error: unknown): void {
  if (error instanceof AppError) {
    const metadata = getErrorMetadata(error.code);
    if (metadata) {
      console.log(`Error: ${metadata.documentation}`);
    }
  }
}
```

### Programmatic Error Handling

```typescript
// Type-safe error code checking
function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof AppError && error.code === code;
}

// Error handler utility
function handlePossibleError(error: unknown): never {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.RESOURCE_NOT_FOUND:
        throw new NotFoundError(error.message, error.context);

      case ErrorCodes.VALIDATION_INVALID_INPUT:
        throw new ValidationError(
          error.message,
          error.context?.field as string,
          error.context
        );

      case ErrorCodes.AUTH_INVALID_TOKEN:
        throw new UnauthorizedError(error.message, error.context);

      default:
        throw error;
    }
  }
  throw error;
}

// Error recovery pattern
async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  recovery?: (error: Error) => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError && error.isOperational && recovery) {
      return await recovery(error);
    }
    throw error;
  }
}
```

---

## Structured Logging with Error Context

### toJSON Method Implementation

```typescript
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context: Record<string, unknown> = {},
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';

    Error.captureStackTrace(this, AppError);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // Custom serialization for logging
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: new Date().toISOString(),
      // Only include stack in development
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }

  // For console.log
  inspect(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}
```

### Error Serializer for Logging Libraries

```typescript
// Universal error serializer
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
      }),
      // Handle nested errors
      ...(error.cause && { cause: serializeError(error.cause) }),
    };
  }

  if (typeof error === 'object' && error !== null) {
    return {
      ...error,
      error: 'Non-Error object thrown',
    };
  }

  return { value: error, error: 'Non-Error, non-object value thrown' };
}

// Safe stringify that handles circular references
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
```

### Error Context Builder Pattern

```typescript
class ErrorContextBuilder {
  private context: Record<string, unknown> = {};

  add(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  addRequestInfo(request: Request): this {
    this.context = {
      ...this.context,
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    };
    return this;
  }

  addUserInfo(user: { id: string; email?: string }): this {
    this.context = {
      ...this.context,
      userId: user.id,
      userEmail: user.email,
    };
    return this;
  }

  build(): Record<string, unknown> {
    return { ...this.context };
  }
}

// Usage
const context = new ErrorContextBuilder()
  .add('operation', 'createUser')
  .add('attemptedValue', input)
  .addRequestInfo(request)
  .build();

throw new ValidationError('Invalid user data', 'email', context);
```

---

## Enterprise Error Handling Patterns

### Error Handling Middleware (Express.js)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

// Operational vs Programming errors
function isTrustedError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Error response formatter
function formatErrorResponse(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        context: error.context,
      }),
    },
  };
}

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error occurred', {
    error: serializeError(err),
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
  });

  // Handle operational errors
  if (isTrustedError(err)) {
    const appError = err as AppError;
    res.status(appError.statusCode).json(formatErrorResponse(appError));
    return;
  }

  // Handle programming errors
  logger.error('Unexpected error', { error: serializeError(err) });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`, {
    route: `${req.method} ${req.url}`,
  });

  res.status(404).json(formatErrorResponse(error));
}
```

### Async Error Wrapper

```typescript
// Wrap async functions to automatically catch errors
export function asyncHandler<T>(fn: (...args: unknown[]) => Promise<T>) {
  return (...args: unknown[]): Promise<T> => {
    return Promise.resolve(fn(...args)).catch(error => {
      // Log and re-throw
      logger.error('Async error', { error: serializeError(error) });
      throw error;
    });
  };
}

// Express route wrapper
export function routeHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// Usage in routes
router.get(
  '/users/:id',
  routeHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: req.params.id });
    }
    res.json(user);
  })
);
```

### Result Type Pattern (Never Throw for Expected Errors)

```typescript
// Result type for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helper functions
function success<T>(data: T): Result<T> {
  return { success: true, data };
}

function failure<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage in service layer
async function createUser(input: CreateUserInput): Promise<Result<User>> {
  try {
    // Validate input
    const validation = validateUserInput(input);
    if (!validation.isValid) {
      return failure(
        new ValidationError('Invalid user input', validation.field, {
          errors: validation.errors,
        })
      );
    }

    // Check if user exists
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      return failure(
        new ConflictError('User with this email already exists', {
          email: input.email,
        })
      );
    }

    // Create user
    const user = await userRepository.create(input);
    return success(user);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

// Usage in controller
async function handleCreateUser(req: Request, res: Response): Promise<void> {
  const result = await createUser(req.body);

  if (!result.success) {
    if (result.error instanceof ValidationError) {
      res.status(400).json({ error: result.error.message });
    } else if (result.error instanceof ConflictError) {
      res.status(409).json({ error: result.error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(201).json(result.data);
}
```

### Circuit Breaker with Error Handling

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number,
    private readonly timeout: number
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        if (fallback) {
          return fallback();
        }
        throw new ExternalServiceError(
          'Circuit breaker is OPEN',
          'circuit-breaker'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime > this.timeout
    );
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## Integration with Logging Libraries

### Winston Integration

```typescript
import winston from 'winston';

// Custom error serializer for Winston
const errorSerializer = winston.format(info => {
  if (info.error instanceof Error) {
    info.error = serializeError(info.error);
  }
  return info;
});

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    errorSerializer(),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-app' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, error, ...meta }) => {
            let msg = `${timestamp} [${level}]: ${message}`;

            if (error) {
              msg += `\n${JSON.stringify(error, null, 2)}`;
            }

            if (Object.keys(meta).length > 0) {
              msg += `\n${JSON.stringify(meta, null, 2)}`;
            }

            return msg;
          }
        )
      ),
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
});

// Usage
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', {
    error,
    context: { operation: 'createUser', userId: '123' },
  });
}
```

### Pino Integration

```typescript
import pino from 'pino';

// Custom error serializer for Pino
const errorSerializer = (err: unknown) => {
  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack,
      ...(err instanceof AppError && {
        code: err.code,
        statusCode: err.statusCode,
        context: err.context,
      }),
    };
  }
  return err;
};

// Create logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: label => {
      return { level: label };
    },
  },
  serializers: {
    err: errorSerializer,
  },
  redact: ['req.headers.authorization'],
  hooks: {
    logMethod(inputArgs, method) {
      const [input, ...rest] = inputArgs;
      if (input instanceof Error) {
        return method.apply(this, [
          { err: input, msg: input.message, ...rest },
        ]);
      }
      return method.apply(this, inputArgs);
    },
  },
});

// Usage
try {
  // Some operation
} catch (error) {
  logger.error({
    err: error,
    operation: 'createUser',
    userId: '123',
  });
}
```

### Error Correlation ID

```typescript
import { AsyncLocalStorage } from 'async_hooks';

// Async local storage for request context
interface RequestContext {
  correlationId: string;
  userId?: string;
  requestId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

// Middleware to set correlation ID
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || crypto.randomUUID();

  asyncLocalStorage.run({ correlationId }, () => {
    res.setHeader('x-correlation-id', correlationId);
    next();
  });
}

// Logger that includes correlation ID
export function getLogger(): pino.Logger {
  const context = asyncLocalStorage.getStore();

  return logger.child({
    correlationId: context?.correlationId,
    userId: context?.userId,
  });
}

// Usage
try {
  const logger = getLogger();
  logger.info('Processing request');
} catch (error) {
  const logger = getLogger();
  logger.error({ err: error }, 'Request failed');
}
```

---

## Common Pitfalls to Avoid

### 1. Not Setting Prototype Chain

❌ **Incorrect:**

```typescript
class BadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadError';
    // Missing: Object.setPrototypeOf
  }
}

const err = new BadError('test');
console.log(err instanceof BadError); // May be false!
```

✅ **Correct:**

```typescript
class GoodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoodError';
    Object.setPrototypeOf(this, GoodError.prototype);
  }
}

const err = new GoodError('test');
console.log(err instanceof GoodError); // true
```

### 2. Not Preserving Stack Trace

❌ **Incorrect:**

```typescript
class BadError extends Error {
  constructor(message: string) {
    super(message);
    // Missing: Error.captureStackTrace
  }
}
```

✅ **Correct:**

```typescript
class GoodError extends Error {
  constructor(message: string) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GoodError);
    }
    Object.setPrototypeOf(this, GoodError.prototype);
  }
}
```

### 3. Losing Error Information When Catching

❌ **Incorrect:**

```typescript
try {
  await someOperation();
} catch (error) {
  throw new Error('Operation failed'); // Loses original error
}
```

✅ **Correct:**

```typescript
try {
  await someOperation();
} catch (error) {
  throw new DatabaseError(
    'Operation failed',
    error instanceof Error ? error : undefined,
    { operation: 'someOperation' }
  );
}
```

### 4. Not Distinguishing Operational vs Programming Errors

❌ **Incorrect:**

```typescript
// Throwing programming errors for expected conditions
if (!user) {
  throw new Error('User not found'); // This is operational, not programming
}
```

✅ **Correct:**

```typescript
// Use operational errors for expected conditions
if (!user) {
  throw new NotFoundError('User not found', { userId: id });
}
```

### 5. Logging Errors but Not Handling Them

❌ **Incorrect:**

```typescript
try {
  await operation();
} catch (error) {
  logger.error(error);
  // Error is logged but not handled
}
```

✅ **Correct:**

```typescript
try {
  await operation();
} catch (error) {
  logger.error(error);
  // Either re-throw or handle appropriately
  throw error; // or provide fallback
}
```

### 6. Not Using Error Codes for Programmatic Handling

❌ **Incorrect:**

```typescript
try {
  await operation();
} catch (error) {
  if (error.message.includes('not found')) {
    // Fragile: depends on exact message wording
  }
}
```

✅ **Correct:**

```typescript
try {
  await operation();
} catch (error) {
  if (
    error instanceof AppError &&
    error.code === ErrorCodes.RESOURCE_NOT_FOUND
  ) {
    // Robust: uses error code
  }
}
```

---

## Open Source Examples

### TypeScript Error Libraries

1. **@ts-stack/error**
   - Repository: https://github.com/ts-stack/error
   - Well-typed custom error classes for TypeScript

2. **common-errors**
   - Repository: https://github.com/nickbalestra/common-errors
   - Collection of standard error classes

3. **@financial-times/error-handler**
   - Repository: https://github.com/Financial-Times/error-handler
   - Enterprise error handling middleware

4. **http-errors**
   - Repository: https://github.com/jshttp/http-errors
   - HTTP error constructors

### Real-World Examples

1. **NestJS**
   - Repository: https://github.com/nestjs/nest
   - Excellent error handling patterns in `/packages/common/exceptions`

2. **TypeORM**
   - Repository: https://github.com/typeorm/typeorm
   - Database error handling in `/src/error`

3. **Prisma**
   - Repository: https://github.com/prisma/prisma
   - Error handling in `/packages/client/src/errors`

4. **tRPC**
   - Repository: https://github.com/trpc/trpc
   - Type-safe error handling patterns

5. **Next.js**
   - Repository: https://github.com/vercel/next.js
   - Error handling middleware and components

### Official Documentation

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/2/classes.html
- Node.js Error Documentation: https://nodejs.org/api/errors.html
- MDN Error Documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

---

## Summary of Best Practices

### DO:

✅ Always call `Object.setPrototypeOf()` when extending Error
✅ Use `Error.captureStackTrace()` for proper stack traces
✅ Define error codes for programmatic error handling
✅ Implement `toJSON()` for structured logging
✅ Distinguish between operational and programming errors
✅ Use async error wrappers in Express routes
✅ Include correlation IDs for distributed tracing
✅ Serialize errors properly for logging libraries
✅ Use Result types for operations that can fail
✅ Implement error handlers with proper HTTP status codes

### DON'T:

❌ Rely on instanceof without setting prototype
❌ Throw plain Error objects
❌ Use string matching for error detection
❌ Log errors without handling them
❌ Lose original error context when re-throwing
❌ Include sensitive data in error context
❌ Expose stack traces in production

---

## Additional Resources

### Books

- "Node.js Design Patterns" by Mario Casciaro
- "Programming TypeScript" by Boris Cherny

### Articles

- "Error Handling in Node.js" - Node.js Documentation
- "Advanced Error Handling in TypeScript" - Medium articles
- "Building Robust Node.js Applications" - various blog posts

### Tools

- **serialize-error**: https://github.com/sindresorhus/serialize-error
- **fast-safe-stringify**: https://github.com/EvanOxfeld/node-fast-safe-stringify
- **@sentry/node**: Error tracking and monitoring

---

**Last Updated:** January 2025
**Maintained by:** Research compilation for TypeScript error handling best practices
