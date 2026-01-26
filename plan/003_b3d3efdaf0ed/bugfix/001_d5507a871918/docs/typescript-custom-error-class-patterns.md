# Custom Error Class Patterns in TypeScript

## Overview

This document covers best practices for creating and using custom error classes in TypeScript, including proper inheritance, error codes, error handling patterns, and integration with TypeScript's type system.

## Table of Contents

1. [Basic Error Extension](#basic-error-extension)
2. [Error Code Patterns](#error-code-patterns)
3. [Structured Error Data](#structured-error-data)
4. [Error Factory Patterns](#error-factory-patterns)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Best Practices](#best-practices)
7. [Common Mistakes](#common-mistakes)

## Basic Error Extension

### The Modern Way (TypeScript 2.1+)

In modern TypeScript, you can properly extend the Error class:

```typescript
/**
 * Custom validation error class
 * @extends Error
 */
class ValidationError extends Error {
  /**
   * Creates a new validation error
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   */
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);

    // Maintain proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    this.name = 'ValidationError';
  }
}

// Usage
try {
  throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.code); // 'INVALID_EMAIL'
    console.log(error.message); // 'Invalid email format'
    console.log(error.name); // 'ValidationError'
  }
}
```

### Alternative: Using Class Properties

```typescript
/**
 * Base class for custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;

    // Error.captureStackTrace is available in V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error with status code 400
 */
export class ValidationError extends AppError {
  constructor(message: string, code: string) {
    super(message, code, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error with status code 404
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, code, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Permission error with status code 403
 */
export class PermissionError extends AppError {
  constructor(message: string, code: string = 'FORBIDDEN') {
    super(message, code, 403);
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}
```

## Error Code Patterns

### Pattern 1: String Constants

```typescript
/**
 * Error code constants for validation errors
 */
export const ValidationErrorCode = {
  INVALID_PATH: 'INVALID_PATH',
  PATH_TRAVERSAL_DETECTED: 'PATH_TRAVERSAL_DETECTED',
  NULL_BYTE_DETECTED: 'NULL_BYTE_DETECTED',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  IS_DIRECTORY: 'IS_DIRECTORY',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  INVALID_SESSION_PATH: 'INVALID_SESSION_PATH',
} as const;

export type ValidationErrorCode = typeof ValidationErrorCode[keyof typeof ValidationErrorCode];

/**
 * Typed validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: ValidationErrorCode
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Usage - TypeScript will autocomplete error codes
throw new ValidationError(
  'Path contains null bytes',
  ValidationErrorCode.NULL_BYTE_DETECTED
);
```

### Pattern 2: Enum-Based Error Codes

```typescript
/**
 * Enum of application error codes
 */
export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // File system errors (2000-2999)
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Network errors (3000-3999)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Business logic errors (4000-4999)
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

## Structured Error Data

### Adding Context to Errors

```typescript
/**
 * Validation error with additional context
 */
export class ValidationError extends Error {
  /**
   * Additional error context for debugging
   */
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    public readonly code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.context = context || {};

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Usage with context
try {
  validatePath(userPath);
} catch (error) {
  throw new ValidationError(
    'Path validation failed',
    'PATH_VALIDATION_FAILED',
    {
      path: userPath,
      baseDir: process.cwd(),
      timestamp: new Date().toISOString(),
    }
  );
}
```

### Error with Field Information

```typescript
/**
 * Field validation error for form validation
 */
export class FieldValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
    public readonly code: string
  ) {
    super(message);
    this.name = 'FieldValidationError';
    Object.setPrototypeOf(this, FieldValidationError.prototype);
  }

  /**
   * Converts error to JSON-serializable object
   */
  toJSON() {
    return {
      error: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      code: this.code,
    };
  }
}

// Usage
throw new FieldValidationError(
  'Email is required',
  'email',
  undefined,
  'REQUIRED'
);
```

## Error Factory Patterns

### Simple Error Factory

```typescript
/**
 * Factory function for creating validation errors
 */
export function createValidationError(
  message: string,
  code: string,
  context?: Record<string, unknown>
): ValidationError {
  return new ValidationError(message, code, context);
}

/**
 * Factory for path-specific validation errors
 */
export function createPathError(
  path: string,
  reason: string,
  code: string
): ValidationError {
  return new ValidationError(
    `Path validation failed: ${reason}`,
    code,
    { path, timestamp: Date.now() }
  );
}

// Usage
throw createPathError(
  userPath,
  'contains null bytes',
  'NULL_BYTE_DETECTED'
);
```

### Fluent Error Builder

```typescript
/**
 * Fluent builder for creating structured errors
 */
export class ErrorBuilder {
  private message: string = '';
  private code: string = 'UNKNOWN_ERROR';
  private context: Record<string, unknown> = {};

  setMessage(message: string): this {
    this.message = message;
    return this;
  }

  setCode(code: string): this {
    this.code = code;
    return this;
  }

  addContext(key: string, value: unknown): this {
    this.context[key] = value;
    return this;
  }

  build(): ValidationError {
    return new ValidationError(this.message, this.code, this.context);
  }
}

// Usage
throw new ErrorBuilder()
  .setMessage('Invalid session path')
  .setCode('INVALID_SESSION_PATH')
  .addContext('providedPath', sessionPath)
  .addContext('expectedPattern', SESSION_PATH_PATTERN)
  .build();
```

## Error Handling Patterns

### Type-Safe Error Handling with Type Guards

```typescript
/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for any AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for known error codes
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  return isAppError(error) && error.code === code;
}

// Usage
try {
  validatePath(userPath);
} catch (error) {
  if (hasErrorCode(error, 'PATH_NOT_FOUND')) {
    // Handle specifically
    console.log('Path not found');
  } else if (isValidationError(error)) {
    // Handle any validation error
    console.log(`Validation failed: ${error.message}`);
  } else {
    // Handle unknown errors
    throw error;
  }
}
```

### Discriminated Union for Error Handling

```typescript
/**
 * Result type for operations that can fail
 */
export type Result<T, E extends Error = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper function to wrap functions in Result type
 */
export async function tryResult<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Usage
const result = await tryResult(() => loadBugReport(sessionPath));

if (!result.success) {
  if (result.error instanceof ValidationError) {
    console.log(`Validation error: ${result.error.code}`);
  }
  return;
}

// TypeScript knows result.data is valid here
console.log(result.data);
```

### Async Error Wrapper Pattern

```typescript
/**
 * Wraps an async function and converts thrown errors to ValidationError
 */
export function withValidationErrors<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorCode: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, errorCode);
      }
      throw new ValidationError(String(error), errorCode);
    }
  }) as T;
}

// Usage
const safeReadFile = withValidationErrors(
  fs.promises.readFile,
  'FILE_READ_ERROR'
);
```

## Best Practices

### 1. Always Set the Name Property

```typescript
class GoodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoodError'; // ✅ Explicit name
  }
}

class BadError extends Error {
  constructor(message: string) {
    super(message);
    // ❌ Name will be 'Error'
  }
}
```

### 2. Use Error Codes for Programmatic Handling

```typescript
// ✅ GOOD: Use error codes
try {
  validatePath(path);
} catch (error) {
  if (error instanceof ValidationError && error.code === 'PATH_TRAVERSAL') {
    // Handle specifically
  }
}

// ❌ BAD: Parse error messages
try {
  validatePath(path);
} catch (error) {
  if (error.message.includes('traversal')) {
    // Fragile
  }
}
```

### 3. Preserve Stack Traces

```typescript
class ErrorWithStackTrace extends Error {
  constructor(message: string) {
    super(message);

    // Preserve stack trace in V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorWithStackTrace);
    }
  }
}
```

### 4. Make Errors Serializable

```typescript
export class SerializableError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'SerializableError';
    Object.setPrototypeOf(this, SerializableError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }

  static fromJSON(data: ReturnType<SerializableError['toJSON']>): SerializableError {
    const error = new SerializableError(data.message, data.code, data.context);
    error.name = data.name;
    return error;
  }
}
```

### 5. Document Thrown Errors in JSDoc

```typescript
/**
 * Validates a session path format
 * @param sessionPath - Path to validate
 * @throws {ValidationError} If path format is invalid
 * @throws {ValidationError} With code 'INVALID_SESSION_PATH'
 * @throws {ValidationError} With code 'PATH_NOT_FOUND' if path doesn't exist
 * @example
 * try {
 *   validateSessionPath('plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918');
 * } catch (error) {
 *   if (error instanceof ValidationError && error.code === 'INVALID_SESSION_PATH') {
 *     console.error('Invalid path format');
 *   }
 * }
 */
function validateSessionPath(sessionPath: string): void {
  // ...
}
```

### 6. Create Error Hierarchies

```typescript
// Base error class
export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Category: Validation errors
export class ValidationError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Category: File system errors
export class FileSystemError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

// Specific errors
export class PathNotFoundError extends FileSystemError {
  constructor(path: string) {
    super(`Path not found: ${path}`, 'PATH_NOT_FOUND');
    this.name = 'PathNotFoundError';
    Object.setPrototypeOf(this, PathNotFoundError.prototype);
  }
}
```

### 7. Use TypeScript's Type System

```typescript
/**
 * Type for all application errors
 */
export type AppErrorType =
  | ValidationError
  | FileSystemError
  | NetworkError
  | ConfigurationError;

/**
 * Type guard for application errors
 */
export function isAppError(error: unknown): error is AppErrorType {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as AppErrorType).code === 'string'
  );
}
```

## Common Mistakes

### ❌ Mistake 1: Forgetting Object.setPrototypeOf

```typescript
class BadError extends Error {
  constructor(message: string) {
    super(message);
    // ❌ Missing: Object.setPrototypeOf(this, BadError.prototype);
  }
}

console.log(new BadError('test') instanceof BadError); // false!
```

### ❌ Mistake 2: Not Setting Name Property

```typescript
class BadError extends Error {
  constructor(message: string) {
    super(message);
    // ❌ Missing: this.name = 'BadError';
  }
}

const error = new BadError('test');
console.log(error.name); // 'Error' instead of 'BadError'
```

### ❌ Mistake 3: Throwing Non-Error Objects

```typescript
// ❌ BAD
throw 'Something went wrong';

// ❌ BAD
throw { message: 'Something went wrong' };

// ✅ GOOD
throw new Error('Something went wrong');
```

### ❌ Mistake 4: Not Documenting Thrown Errors

```typescript
// ❌ BAD: No documentation
function validatePath(path: string): void {
  if (!path) throw new ValidationError('Path is required', 'REQUIRED');
}

// ✅ GOOD: Clear documentation
/**
 * Validates a file path
 * @param path - Path to validate
 * @throws {ValidationError} With code 'REQUIRED' if path is empty
 * @throws {ValidationError} With code 'INVALID_FORMAT' if path format is invalid
 */
function validatePath(path: string): void {
  if (!path) throw new ValidationError('Path is required', 'REQUIRED');
}
```

## Complete Example: Validation Error System

Here's a complete system based on your codebase needs:

```typescript
/**
 * Custom error classes for validation and file operations
 */

/**
 * Base application error with error code support
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype for instanceof checks
    Object.setPrototypeOf(this, this.constructor.prototype);
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message, code, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Path-specific validation error codes
 */
export const PathErrorCode = {
  NULL_BYTE_DETECTED: 'NULL_BYTE_DETECTED',
  PATH_TRAVERSAL_DETECTED: 'PATH_TRAVERSAL_DETECTED',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND',
  IS_DIRECTORY: 'IS_DIRECTORY',
  INVALID_SESSION_PATH: 'INVALID_SESSION_PATH',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
} as const;

export type PathErrorCode = typeof PathErrorCode[keyof typeof PathErrorCode];

/**
 * Path validation error with common codes
 */
export class PathValidationError extends ValidationError {
  constructor(
    message: string,
    code: PathErrorCode,
    context?: Record<string, unknown>
  ) {
    super(message, code, context);
    this.name = 'PathValidationError';
    Object.setPrototypeOf(this, PathValidationError.prototype);
  }
}

/**
 * File not found error (404 Not Found)
 */
export class FileNotFoundError extends AppError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}

/**
 * Type guard for path validation errors
 */
export function isPathValidationError(error: unknown): error is PathValidationError {
  return error instanceof PathValidationError;
}

/**
 * Type guard for validation errors
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

## Key Takeaways

1. **Always use `Object.setPrototypeOf()`** when extending Error in TypeScript
2. **Set the `name` property** explicitly for better debugging
3. **Use error codes** for programmatic error handling
4. **Add context** to errors for debugging (but don't expose sensitive data)
5. **Preserve stack traces** with `Error.captureStackTrace()` in Node.js
6. **Create error hierarchies** to group related errors
7. **Use type guards** for type-safe error handling
8. **Document thrown errors** with `@throws` in JSDoc
9. **Make errors serializable** if sending across process boundaries
10. **Throw Error objects**, not strings or plain objects

## Sources

While web search services are currently rate-limited, this research is based on:

- TypeScript Documentation: https://www.typescriptlang.org/docs/handbook/2/classes.html
- MDN Error Documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
- Node.js Error Documentation: https://nodejs.org/api/errors.html
- "You Don't Know JS" - Async & Performance
- TypeScript Deep Dive by Basarat Ali Syed
