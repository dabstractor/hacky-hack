# TypeScript Error Handling Best Practices Research

Research conducted on: 2026-01-14

## Table of Contents

1. [Custom Error Class Hierarchies](#custom-error-class-hierarchies)
2. [Proper Prototype Chain Setup](#proper-prototype-chain-setup)
3. [toJSON() Implementation for Structured Logging](#tojson-implementation-for-structured-logging)
4. [Error Codes for Programmatic Handling](#error-codes-for-programmatic-handling)
5. [Context Object Patterns](#context-object-patterns)
6. [Reference URLs](#reference-urls)

---

## Custom Error Class Hierarchies

### Pattern: Base Error Class with Type Discrimination

**Recommended approach for creating a type-safe error hierarchy:**

```typescript
// Base custom error class
export abstract class AppError extends Error {
  abstract readonly kind: ErrorKind;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Error kind discriminator
export enum ErrorKind {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL',
}

// Concrete error implementations
export class NetworkError extends AppError {
  readonly kind = ErrorKind.NETWORK;
  constructor(
    message: string,
    public readonly statusCode: number,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }
}

export class ValidationError extends AppError {
  readonly kind = ErrorKind.VALIDATION;
  constructor(
    message: string,
    public readonly field: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, field });
  }
}

export class AuthenticationError extends AppError {
  readonly kind = ErrorKind.AUTHENTICATION;
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
```

### Benefits of this pattern:

1. **Type narrowing with discriminators**: Use `error.kind` for type-safe switching
2. **Consistent base properties**: All errors share `message`, `context`, and stack trace
3. **Extensible**: Easy to add new error types
4. **Type-safe**: TypeScript can narrow types based on the `kind` property

---

## Proper Prototype Chain Setup

### The Critical Importance of `Object.setPrototypeOf()`

TypeScript's compilation target affects how error classes work. For proper `instanceof` checks:

```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);

    // CRITICAL: This ensures instanceof works correctly
    Object.setPrototypeOf(this, CustomError.prototype);

    this.name = 'CustomError';
  }
}
```

### Why this is necessary:

1. **ES5 vs ES2015+ compilation**: When targeting ES5, the prototype chain doesn't get set up correctly
2. **instanceof checks**: Without `Object.setPrototypeOf()`, `instanceof CustomError` returns `false`
3. **Stack trace preservation**: Proper setup maintains readable stack traces

### TypeScript configuration impact:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2015", // or higher
    "useDefineForClassFields": true
  }
}
```

### Testing prototype chain:

```typescript
const error = new CustomError('test');

// Should all be true
console.log(error instanceof CustomError); // true
console.log(error instanceof Error); // true
console.log(error instanceof Object); // true
console.log(Object.getPrototypeOf(error) === CustomError.prototype); // true
```

---

## toJSON() Implementation for Structured Logging

### Pattern: Safe Serialization for Logging

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize error for logging/transport
   * Handles circular references and non-serializable objects
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.serializeContext(this.context),
      cause: this.serializeCause(this.cause),
      stack: this.stack,
      timestamp: new Date().toISOString(),
    };
  }

  private serializeContext(
    context: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      try {
        // Handle Errors
        if (value instanceof Error) {
          serialized[key] = {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        // Handle Dates
        else if (value instanceof Date) {
          serialized[key] = value.toISOString();
        }
        // Handle primitive values and safe objects
        else if (this.isSerializable(value)) {
          serialized[key] = value;
        }
        // Convert to string for non-serializable objects
        else {
          serialized[key] = String(value);
        }
      } catch {
        serialized[key] = '[non-serializable]';
      }
    }

    return serialized;
  }

  private serializeCause(cause: unknown): unknown {
    if (!cause) return undefined;

    if (cause instanceof Error) {
      return {
        name: cause.name,
        message: cause.message,
        stack: cause.stack,
      };
    }

    return cause;
  }

  private isSerializable(value: unknown): boolean {
    if (value === null || value === undefined) return true;

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(item => this.isSerializable(item));
    }

    if (type === 'object') {
      return Object.values(value as object).every(v => this.isSerializable(v));
    }

    return false;
  }
}
```

### Usage with structured logging:

```typescript
// Using a logger like winston or pino
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

try {
  throw new ValidationError('Invalid email', 'email', { value: 'bad@email' });
} catch (error) {
  if (error instanceof AppError) {
    logger.error('Operation failed', error.toJSON());
    // Outputs: {
    //   "level": "error",
    //   "message": "Operation failed",
    //   "name": "ValidationError",
    //   "message": "Invalid email",
    //   "code": "VALIDATION_ERROR",
    //   "context": { "field": "email", "value": "bad@email" },
    //   "stack": "...",
    //   "timestamp": "2026-01-14T..."
    // }
  }
}
```

---

## Error Codes for Programmatic Handling

### Pattern: String-based Error Codes

```typescript
// Define error codes as constants
export const ERROR_CODES = {
  // Network errors (NET_xxx)
  NETWORK_TIMEOUT: 'NET_001',
  NETWORK_CONNECTION_REFUSED: 'NET_002',
  NETWORK_DNS_RESOLUTION_FAILED: 'NET_003',

  // Validation errors (VAL_xxx)
  VALIDATION_REQUIRED_FIELD: 'VAL_001',
  VALIDATION_INVALID_FORMAT: 'VAL_002',
  VALIDATION_OUT_OF_RANGE: 'VAL_003',

  // Authentication errors (AUTH_xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',

  // Not found errors (NF_xxx)
  NOT_FOUND_RESOURCE: 'NF_001',
  NOT_FOUND_USER: 'NF_002',
  NOT_FOUND_ENDPOINT: 'NF_003',

  // Business logic errors (BIZ_xxx)
  BIZ_DUPLICATE_RESOURCE: 'BIZ_001',
  BIZ_CONCURRENT_MODIFICATION: 'BIZ_002',
  BIZ_QUOTA_EXCEEDED: 'BIZ_003',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Base error class with code support
export class CodedError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific error classes
export class NotFoundError extends CodedError {
  constructor(
    resourceType: string,
    resourceId: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${resourceType} with id '${resourceId}' not found`,
      ERROR_CODES.NOT_FOUND_RESOURCE,
      404,
      { resourceType, resourceId, ...context }
    );
    this.name = 'NotFoundError';
  }
}
```

### Programmatic error handling:

```typescript
async function handleRequest() {
  try {
    await someOperation();
  } catch (error) {
    if (error instanceof CodedError) {
      switch (error.code) {
        case ERROR_CODES.AUTH_TOKEN_EXPIRED:
          // Trigger token refresh
          return await refreshToken();

        case ERROR_CODES.NOT_FOUND_RESOURCE:
          // Return 404 response
          return { status: 404, body: error.message };

        case ERROR_CODES.VALIDATION_INVALID_FORMAT:
          // Return validation errors
          return { status: 400, body: error.context };

        default:
          // Log unexpected errors
          logger.error('Unexpected error', error.toJSON());
          return { status: 500, body: 'Internal server error' };
      }
    }
    throw error;
  }
}
```

### Benefits of error codes:

1. **Internationalization**: Map codes to user-facing messages
2. **Monitoring**: Track specific error types in metrics
3. **Retry logic**: Make decisions based on error codes
4. **Client handling**: API consumers can parse codes programmatically
5. **Documentation**: Easy to document all possible error scenarios

---

## Context Object Patterns

### Pattern: Rich Error Context

```typescript
// Context interface for type safety
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// Error class with typed context
export class ContextualError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;

    // Enrich context with metadata
    this.context = {
      ...context,
      timestamp: context?.timestamp || new Date().toISOString(),
    };

    // Chain errors for better debugging
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  // Get root cause of error chain
  getRootCause(): Error {
    let current: Error = this;
    while (current instanceof ContextualError && current.cause) {
      if (current.cause instanceof Error) {
        current = current.cause;
      } else {
        break;
      }
    }
    return current;
  }

  // Get full error chain
  getErrorChain(): Error[] {
    const chain: Error[] = [this];
    let current: Error = this;

    while (current instanceof ContextualError && current.cause) {
      if (current.cause instanceof Error) {
        current = current.cause;
        chain.push(current);
      } else {
        break;
      }
    }

    return chain;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
            }
          : this.cause,
      stack: this.stack,
      chain: this.getErrorChain().map(e => ({
        name: e.name,
        message: e.message,
      })),
    };
  }
}
```

### Context enrichment pattern:

```typescript
// Async context management (using AsyncLocalStorage in Node.js)
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
  correlationId?: string;
}

const asyncContext = new AsyncLocalStorage<RequestContext>();

// Utility to enrich errors with request context
export function enrichError<T extends Error>(
  error: T,
  additionalContext?: Record<string, unknown>
): T {
  if (error instanceof ContextualError) {
    const requestContext = asyncContext.getStore();
    return Object.assign(error, {
      context: {
        ...error.context,
        ...requestContext,
        ...additionalContext,
      },
    });
  }
  return error;
}

// Usage in request handlers
app.use((req, res, next) => {
  asyncContext.run(
    {
      requestId: crypto.randomUUID(),
      userId: req.user?.id,
      correlationId: req.headers['x-correlation-id'] as string,
    },
    () => next()
  );
});

app.get('/api/resource', async (req, res, next) => {
  try {
    await someOperation();
  } catch (error) {
    // Automatically enrich error with request context
    next(enrichError(error as Error, { operation: 'getResource' }));
  }
});
```

### Context best practices:

1. **PII handling**: Sanitize sensitive data before logging
2. **Size limits**: Truncate large context objects
3. **Type safety**: Use interfaces for context structure
4. **Immutability**: Freeze context after creation
5. **Consistency**: Use standard field names across the codebase

---

## Complete Example: Production-Ready Error System

```typescript
// errors/index.ts

export enum ErrorKind {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL',
}

export const ERROR_CODES = {
  // Network
  NETWORK_TIMEOUT: 'NET_001',
  NETWORK_CONNECTION_FAILED: 'NET_002',

  // Validation
  VALIDATION_INVALID_INPUT: 'VAL_001',
  VALIDATION_MISSING_FIELD: 'VAL_002',

  // Authentication
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',

  // Not found
  NOT_FOUND_RESOURCE: 'NF_001',

  // Conflict
  CONFLICT_DUPLICATE: 'CF_001',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
  [key: string]: unknown;
}

export abstract class AppError extends Error {
  abstract readonly kind: ErrorKind;

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly context?: ErrorContext,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      kind: this.kind,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.sanitizeContext(this.context),
      cause: this.cause ? this.serializeCause(this.cause) : undefined,
      stack: this.stack,
    };
  }

  private sanitizeContext(context?: ErrorContext): ErrorContext | undefined {
    if (!context) return undefined;

    // Remove sensitive fields
    const { password, token, apiKey, ...safe } = context as any;
    return safe;
  }

  private serializeCause(cause: Error): object {
    return {
      name: cause.name,
      message: cause.message,
    };
  }
}

export class ValidationError extends AppError {
  readonly kind = ErrorKind.VALIDATION;

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.VALIDATION_INVALID_INPUT,
    field?: string,
    context?: ErrorContext
  ) {
    super(message, code, 400, { ...context, field });
  }
}

export class NotFoundError extends AppError {
  readonly kind = ErrorKind.NOT_FOUND;

  constructor(
    resourceType: string,
    resourceId: string,
    code: ErrorCode = ERROR_CODES.NOT_FOUND_RESOURCE,
    context?: ErrorContext
  ) {
    super(`${resourceType} with id '${resourceId}' not found`, code, 404, {
      ...context,
      resourceType,
      resourceId,
    });
  }
}

export class ConflictError extends AppError {
  readonly kind = ErrorKind.CONFLICT;

  constructor(
    message: string,
    code: ErrorCode = ERROR_CODES.CONFLICT_DUPLICATE,
    context?: ErrorContext
  ) {
    super(message, code, 409, context);
  }
}

// Type guard for narrowing
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Error handler middleware for Express
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: {
        kind: error.kind,
        code: error.code,
        message: error.message,
        context:
          process.env.NODE_ENV === 'development' ? error.context : undefined,
      },
    });
  } else {
    res.status(500).json({
      error: {
        kind: ErrorKind.INTERNAL,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
```

---

## Reference URLs

### Official Documentation

1. **TypeScript Handbook - Type Narrowing**
   - URL: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
   - Covers: Using type predicates, discriminated unions for error handling

2. **Node.js Error Documentation**
   - URL: https://nodejs.org/api/errors.html
   - Covers: Error creation, error codes, the `cause` property

3. **TypeScript Deep Dive - Error Handling**
   - URL: https://basarat.gitbook.io/typescript/type-system/exceptions
   - Covers: Exception handling patterns in TypeScript

### Community Resources

4. **Node.js Best Practices**
   - URL: https://github.com/goldbergyoni/nodebestpractices
   - Section: Error Handling Best Practices
   - Covers: Error handling patterns, logging, monitoring

5. **TypeScript Error Handling Guide**
   - URL: (Various community blogs - search for "typescript error handling best practices")
   - Topics covered: Custom error classes, error serialization

### Structured Logging

6. **Winston Documentation**
   - URL: https://github.com/winstonjs/winston
   - Covers: Structured logging, error formatting

7. **Pino Documentation**
   - URL: https://getpino.io/
   - Covers: High-performance structured logging for Node.js

### Error Handling Patterns

8. **Neverthrow Library**
   - URL: https://github.com/supermacro/neverthrow
   - Covers: Functional error handling with Result types

9. **Effect-TS**
   - URL: https://github.com/Effect-TS/effect
   - Covers: Comprehensive error management with functional programming

### Additional Resources

10. **V8 Stack Trace API**
    - URL: https://v8.dev/docs/stack-trace-api
    - Covers: Error.stack, structured stack traces

11. **MDN Error Documentation**
    - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    - Covers: Error object, custom error types

---

## Key Takeaways

### 1. Always Set Prototype Correctly

```typescript
Object.setPrototypeOf(this, new.target.prototype);
```

### 2. Use Discriminated Unions for Type Safety

```typescript
abstract readonly kind: ErrorKind;
// Allows: if (error.kind === ErrorKind.VALIDATION) { ... }
```

### 3. Implement toJSON() for Logging

- Handle circular references
- Sanitize sensitive data
- Include error codes and context

### 4. Define Clear Error Codes

- Use prefixes (NET*, VAL*, AUTH\_)
- Map to HTTP status codes
- Support i18n

### 5. Enrich Errors with Context

- Use AsyncLocalStorage for request-scoped context
- Include operation metadata
- Support error chaining with `cause`

### 6. Make Errors Serializable

- Safe for transport across boundaries
- Compatible with structured logging
- Preserve debugging information

---

## Further Research Topics

1. **Error Monitoring Integration**: Sentry, DataDog, New Relic
2. **Retry Strategies**: Exponential backoff with error code checking
3. **Circuit Breakers**: Error rate monitoring and circuit breaking
4. **Error Telemetry**: Correlating errors across distributed systems
5. **Testing Error Scenarios**: Unit testing error handling logic
