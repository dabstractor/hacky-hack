# TypeScript Error Handling - Quick Reference

## Essential Pattern

```typescript
// The complete, production-ready pattern
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AppError';

    // CRITICAL: Maintains proper stack trace (V8/Node.js)
    Error.captureStackTrace(this, AppError);

    // CRITICAL: Ensures instanceof works correctly
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}
```

## Common Error Classes

```typescript
// 400
class BadRequestError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('BAD_REQUEST', message, 400, context);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

// 401
class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Unauthorized',
    context?: Record<string, unknown>
  ) {
    super('UNAUTHORIZED', message, 401, context);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// 404
class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('NOT_FOUND', message, 404, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// 409
class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('CONFLICT', message, 409, context);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

// 500
class InternalServerError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('INTERNAL_ERROR', message, 500, context);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
```

## Error Codes

```typescript
const ErrorCodes = {
  // Auth
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN: 'AUTH_EXPIRED_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
} as const;
```

## Express Error Handler

```typescript
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error('Error:', err);

  // Convert to AppError if needed
  const error =
    err instanceof AppError ? err : new InternalServerError(err.message);

  // Send response
  res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        context: error.context,
        stack: error.stack,
      }),
    },
  });
}
```

## Async Route Wrapper

```typescript
function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

// Usage
router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found', { userId: req.params.id });
    }
    res.json(user);
  })
);
```

## Result Type Pattern

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function success<T>(data: T): Result<T> {
  return { success: true, data };
}

function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage
async function getUser(id: string): Promise<Result<User>> {
  const user = await db.findUser(id);

  if (!user) {
    return failure(new NotFoundError('User not found'));
  }

  return success(user);
}
```

## Error Serializer

```typescript
function serializeError(error: unknown): Record<string, unknown> {
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

  return { value: error };
}
```

## Winston Logger Setup

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

## Pino Logger Setup

```typescript
import pino from 'pino';

export const logger = pino({
  level: 'info',
  formatters: {
    level: label => ({ level: label }),
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});
```

## Checklist

- [ ] Always call `Object.setPrototypeOf(this, ClassName.prototype)`
- [ ] Always call `Error.captureStackTrace(this, ClassName)`
- [ ] Always set `this.name = ClassName`
- [ ] Implement `toJSON()` for structured logging
- [ ] Use error codes for programmatic handling
- [ ] Include context object for debugging
- [ ] Distinguish operational vs programming errors
- [ ] Use async wrappers for Express routes
- [ ] Serialize errors properly for logging
- [ ] Never expose stack traces in production
