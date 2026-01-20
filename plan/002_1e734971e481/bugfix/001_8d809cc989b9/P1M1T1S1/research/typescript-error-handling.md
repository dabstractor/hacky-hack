# TypeScript Error Handling Best Practices

## Executive Summary

This document provides comprehensive research on TypeScript error handling best practices for extending Error classes. It covers proper inheritance patterns, prototype chain management, ES2022 features, error serialization, and production-ready patterns with code examples.

**Author:** Research Task P1.M1.T1.S1
**Date:** 2026-01-15
**TypeScript Version:** ES2022 target

---

## Table of Contents

1. [Proper TypeScript Inheritance Patterns for Custom Error Classes](#1-proper-typescript-inheritance-patterns-for-custom-error-classes)
2. [Object.setPrototypeOf() Usage and Why It's Critical](#2-objectsetprototypeof-usage-and-why-its-critical)
3. [ES2022 Error Cause Property and Backwards Compatibility](#3-es2022-error-cause-property-and-backwards-compatibility)
4. [Error Code Assignment Patterns](#4-error-code-assignment-patterns)
5. [Type Guard Function Patterns for Error Type Narrowing](#5-type-guard-function-patterns-for-error-type-narrowing)
6. [toJSON() Method Implementation for Structured Logging](#6-tojson-method-implementation-for-structured-logging)
7. [Context Sanitization Patterns (PII Redaction)](#7-context-sanitization-patterns-pii-redaction)
8. [Circular Reference Handling in Error Serialization](#8-circular-reference-handling-in-error-serialization)
9. [Common Pitfalls and How to Avoid Them](#9-common-pitfalls-and-how-to-avoid-them)
10. [Production Code Best Practices](#10-production-code-best-practices)
11. [Authoritative Sources and References](#11-authoritative-sources-and-references)

---

## 1. Proper TypeScript Inheritance Patterns for Custom Error Classes

### 1.1 Basic Pattern

When extending the Error class in TypeScript, you must follow specific patterns to ensure proper behavior:

```typescript
/**
 * Basic custom error class with proper inheritance
 */
class CustomError extends Error {
  constructor(message: string) {
    super(message);

    // CRITICAL: Set the prototype explicitly
    Object.setPrototypeOf(this, CustomError.prototype);

    // Set the error name for identification
    this.name = 'CustomError';
  }
}

// Usage
const error = new CustomError('Something went wrong');
console.log(error instanceof CustomError); // true
console.log(error instanceof Error);        // true
console.log(error.name);                    // 'CustomError'
```

### 1.2 Pattern with Additional Properties

```typescript
/**
 * Custom error with typed properties
 */
class ValidationError extends Error {
  readonly field: string;
  readonly code: string;

  constructor(field: string, message: string, code: string) {
    super(message);

    // Set prototype before setting properties
    Object.setPrototypeOf(this, ValidationError.prototype);

    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

// Usage
const error = new ValidationError('email', 'Invalid format', 'VALIDATION_ERROR');
console.log(error.field); // 'email'
console.log(error.code);  // 'VALIDATION_ERROR'
```

### 1.3 Abstract Base Class Pattern

```typescript
/**
 * Abstract base error class for enforced structure
 */
abstract class AppError extends Error {
  abstract readonly code: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
  }
}

/**
 * Concrete implementation
 */
class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// Usage - cannot instantiate abstract class directly
// new AppError('message'); // Compile error
const dbError = new DatabaseError('Connection failed', { host: 'localhost' });
console.log(dbError.code);      // 'DATABASE_ERROR'
console.log(dbError.timestamp); // Date object
```

### 1.4 Generic Error Wrapper Pattern

```typescript
/**
 * Generic error wrapper for wrapping unknown errors
 */
class WrappedError extends Error {
  readonly originalError: unknown;
  readonly context?: Record<string, unknown>;

  constructor(message: string, originalError: unknown, context?: Record<string, unknown>) {
    super(message);

    Object.setPrototypeOf(this, WrappedError.prototype);

    this.name = 'WrappedError';
    this.originalError = originalError;
    this.context = context;

    // Capture stack trace excluding this constructor
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WrappedError);
    }
  }

  /**
   * Get the original error message if available
   */
  getOriginalMessage(): string {
    if (this.originalError instanceof Error) {
      return this.originalError.message;
    }
    return String(this.originalError);
  }
}

// Usage
try {
  JSON.parse('{invalid json}');
} catch (error) {
  const wrapped = new WrappedError(
    'Failed to parse configuration',
    error,
    { file: 'config.json' }
  );
  console.log(wrapped.getOriginalMessage()); // "Unexpected token..."
}
```

---

## 2. Object.setPrototypeOf() Usage and Why It's Critical

### 2.1 The Problem: Prototype Chain Breakage

When extending built-in classes like Error in TypeScript/JavaScript, the prototype chain may not be properly established in certain scenarios:

```typescript
/**
 * WITHOUT Object.setPrototypeOf - PROBLEMATIC
 */
class BrokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrokenError';
    // MISSING: Object.setPrototypeOf call
  }
}

const broken = new BrokenError('test');
console.log(broken instanceof BrokenError); // May be false in some environments
console.log(broken instanceof Error);        // May be false in some environments
```

### 2.2 The Solution: Object.setPrototypeOf()

```typescript
/**
 * WITH Object.setPrototypeOf - CORRECT
 */
class CorrectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorrectError';

    // CRITICAL: Restore prototype chain
    Object.setPrototypeOf(this, CorrectError.prototype);
  }
}

const correct = new CorrectError('test');
console.log(correct instanceof CorrectError); // Always true
console.log(correct instanceof Error);        // Always true
```

### 2.3 Why This Is Needed

The prototype chain can break due to:

1. **Transpilation to ES5**: When TypeScript compiles to ES5, the `Error` base class constructor doesn't properly set up inheritance for custom error classes.

2. **Babel/TypeScript transformation**: Some transpilation scenarios don't preserve the prototype chain correctly.

3. **Cross-realm issues**: When passing errors across iframe/worker boundaries.

### 2.4 Best Practice Pattern

```typescript
/**
 * Production-ready pattern with proper prototype handling
 */
class ProductionError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);

    // CRITICAL: Set prototype for instanceof checks
    // ES5 target requires this, but it's best practice even for ES2022
    Object.setPrototypeOf(this, ProductionError.prototype);

    // CRITICAL: Capture proper stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProductionError);
    }

    this.name = 'ProductionError';
    this.code = code;
  }
}
```

### 2.5 Alternative: Using new.target.prototype

```typescript
/**
 * Using new.target for dynamic prototype setting
 */
class DynamicError extends Error {
  constructor(message: string) {
    super(message);

    // Automatically sets prototype to the actual constructor's prototype
    // Works correctly with inheritance
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
  }
}

class ExtendedDynamicError extends DynamicError {
  constructor(message: string) {
    super(message);
    // Prototype automatically set to ExtendedDynamicError.prototype
  }
}
```

### 2.6 Current Project Implementation

The project correctly uses `Object.setPrototypeOf()` in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
export abstract class PipelineError extends Error {
  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);

    // CRITICAL: Set prototype for instanceof to work correctly
    // ES5 target requires this, but it's best practice even for ES2022
    Object.setPrototypeOf(this, new.target.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    // ... rest of constructor
  }
}
```

---

## 3. ES2022 Error Cause Property and Backwards Compatibility

### 3.1 ES2022 Error Cause Feature

ES2022 introduced the `cause` option to the Error constructor, allowing error chaining:

```typescript
/**
 * ES2022 Error cause property usage
 */
try {
  try {
    JSON.parse('{invalid}');
  } catch (parseError) {
    // Chain the error with a cause
    throw new Error('Failed to parse configuration', {
      cause: parseError
    });
  }
} catch (configError) {
  // Access the cause
  if (configError instanceof Error && 'cause' in configError) {
    console.log(configError.cause); // The original parse error
  }
}
```

### 3.2 TypeScript Support

TypeScript 4.7+ includes type definitions for the `cause` property:

```typescript
/**
 * TypeScript 4.7+ type-safe error cause usage
 */
try {
  // some operation
} catch (error) {
  if (error instanceof Error) {
    throw new Error('Operation failed', { cause: error });
  }
}
```

### 3.3 Backwards Compatibility Pattern

For environments that may not support ES2022, use a backwards-compatible pattern:

```typescript
/**
 * Backwards-compatible error cause pattern
 */
class CompatibleError extends Error {
  cause?: Error;

  constructor(
    message: string,
    options?: { cause?: Error }
  ) {
    super(message);

    Object.setPrototypeOf(this, CompatibleError.prototype);

    // Set cause if provided (works in both old and new environments)
    if (options?.cause) {
      // ES2022 standard property
      this.cause = options.cause;

      // Also set via non-standard approach for older environments
      (this as { cause?: Error }).cause = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CompatibleError);
    }

    this.name = 'CompatibleError';
  }
}

// Usage
try {
  throw new Error('Original error');
} catch (originalError) {
  const chained = new CompatibleError('Wrapped error', {
    cause: originalError as Error
  });
  console.log(chained.cause?.message); // 'Original error'
}
```

### 3.4 Type-Safe Cause Access

```typescript
/**
 * Type guard for errors with cause property
 */
function hasCause(error: unknown): error is Error & { cause: unknown } {
  return error instanceof Error && 'cause' in error;
}

/**
 * Usage with type narrowing
 */
try {
  // some operation
} catch (error) {
  if (hasCause(error)) {
    console.log(error.cause); // Type is `unknown`

    if (error.cause instanceof Error) {
      console.log(error.cause.message); // Safe to access
    }
  }
}
```

### 3.5 Current Project Implementation

The project uses a type assertion approach for the `cause` property in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
  super(message);

  Object.setPrototypeOf(this, new.target.prototype);

  // ... other setup

  // Store cause if provided (ES2022+)
  // Using type assertion because cause property is not on Error type in all TypeScript versions
  if (cause) {
    (this as unknown as { cause?: Error }).cause = cause;
  }
}
```

### 3.6 Recommendation for the Project

Given the project uses `target: "ES2022"` in `tsconfig.json`, the implementation should be updated to use the standard ES2022 pattern:

```typescript
/**
 * Recommended update for ES2022 target
 */
constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
  // Use ES2022 cause option
  super(message, { cause });

  Object.setPrototypeOf(this, new.target.prototype);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }

  this.name = this.constructor.name;
  this.context = context;
  this.timestamp = new Date();

  // No need to manually set cause - super() already handles it
}
```

---

## 4. Error Code Assignment Patterns

### 4.1 String Literal Error Codes

```typescript
/**
 * Using string literals for error codes
 */
class PaymentError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    Object.setPrototypeOf(this, PaymentError.prototype);
    this.name = 'PaymentError';
    this.code = code;
  }
}

// Usage
throw new PaymentError('Card declined', 'PAYMENT_DECLINED');
throw new PaymentError('Insufficient funds', 'PAYMENT_INSUFFICIENT_FUNDS');
```

**Problems:**
- No type safety
- Easy to make typos
- No autocomplete

### 4.2 Const Assertion Error Codes (Recommended)

```typescript
/**
 * Type-safe error codes using const assertion
 */
const ErrorCodes = {
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_INSUFFICIENT_FUNDS: 'PAYMENT_INSUFFICIENT_FUNDS',
  PAYMENT_EXPIRED_CARD: 'PAYMENT_EXPIRED_CARD',
  PAYMENT_INVALID_CVV: 'PAYMENT_INVALID_CVV',
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

class PaymentError extends Error {
  readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    Object.setPrototypeOf(this, PaymentError.prototype);
    this.name = 'PaymentError';
    this.code = code;
  }
}

// Usage - fully type-safe with autocomplete
throw new PaymentError('Card declined', ErrorCodes.PAYMENT_DECLINED);
// throw new PaymentError('test', 'INVALID_CODE'); // Compile error!
```

### 4.3 Enum-Based Error Codes

```typescript
/**
 * Using enum for error codes
 */
enum PaymentErrorCode {
  DECLINED = 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS = 'PAYMENT_INSUFFICIENT_FUNDS',
  EXPIRED_CARD = 'PAYMENT_EXPIRED_CARD',
  INVALID_CVV = 'PAYMENT_INVALID_CVV',
}

class PaymentError extends Error {
  readonly code: PaymentErrorCode;

  constructor(message: string, code: PaymentErrorCode) {
    super(message);
    Object.setPrototypeOf(this, PaymentError.prototype);
    this.name = 'PaymentError';
    this.code = code;
  }
}

// Usage
throw new PaymentError('Card declined', PaymentErrorCode.DECLINED);
```

### 4.4 Hierarchical Error Code Pattern

```typescript
/**
 * Hierarchical error codes for better organization
 * Format: <DOMAIN>_<COMPONENT>_<ACTION>_<OUTCOME>
 */
const ErrorCodes = {
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_TIMEOUT: 'DB_TIMEOUT',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',

  // API errors
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  API_TIMEOUT: 'API_TIMEOUT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',

  // Validation errors
  VALIDATION_INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_REQUIRED: 'VALIDATION_MISSING_REQUIRED',
  VALIDATION_FORMAT_ERROR: 'VALIDATION_FORMAT_ERROR',
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Base error class with typed code
 */
abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.context = context;
  }
}

/**
 * Database-specific error
 */
class DatabaseError extends AppError {
  readonly code: ErrorCode;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.DB_QUERY_FAILED,
    context?: Record<string, unknown>
  ) {
    super(message, context);
    Object.setPrototypeOf(this, DatabaseError.prototype);
    this.code = code;
  }
}

// Usage
throw new DatabaseError(
  'Connection timeout',
  ErrorCodes.DB_TIMEOUT,
  { host: 'localhost', port: 5432 }
);
```

### 4.5 Current Project Error Code Pattern

The project uses an excellent hierarchical error code pattern in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
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
  PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY: 'PIPELINE_VALIDATION_CIRCULAR_DEPENDENCY',

  // Resource errors
  PIPELINE_RESOURCE_LIMIT_EXCEEDED: 'PIPELINE_RESOURCE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

---

## 5. Type Guard Function Patterns for Error Type Narrowing

### 5.1 Basic Type Guard

```typescript
/**
 * Basic type guard for custom error
 */
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.name = 'ValidationError';
  }
}

/**
 * Type guard function
 */
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// Usage
try {
  // some operation
} catch (error) {
  if (isValidationError(error)) {
    // error is narrowed to ValidationError
    console.log(error.field);    // Type-safe access
    console.log(error.message);  // Type-safe access
  }
}
```

### 5.2 Type Guard with Property Checking

```typescript
/**
 * Type guard that checks both instance and properties
 */
function isValidationErrorWithField(
  error: unknown,
  field: string
): error is ValidationError {
  return error instanceof ValidationError && error.field === field;
}

// Usage
try {
  throw new ValidationError('email', 'Invalid email format');
} catch (error) {
  if (isValidationErrorWithField(error, 'email')) {
    // Handle email validation error specifically
  }
}
```

### 5.3 Discriminated Union Type Guard

```typescript
/**
 * Using discriminated unions for type narrowing
 */
type AppError =
  | { type: 'network'; message: string; statusCode: number }
  | { type: 'validation'; message: string; field: string }
  | { type: 'database'; message: string; query: string };

function isNetworkError(error: AppError): error is Extract<AppError, { type: 'network' }> {
  return error.type === 'network';
}

function handleAppError(error: AppError) {
  if (isNetworkError(error)) {
    console.log(error.statusCode); // Type-safe
  }
}
```

### 5.4 Error Code-Based Type Guard

```typescript
/**
 * Type guard based on error code
 */
function isSessionError(
  error: unknown
): error is PipelineError & { code: 'PIPELINE_SESSION_LOAD_FAILED' | 'PIPELINE_SESSION_SAVE_FAILED' } {
  return isPipelineError(error) && error.code.startsWith('PIPELINE_SESSION_');
}

// Usage
try {
  // some operation
} catch (error) {
  if (isSessionError(error)) {
    // error.code is narrowed to session-specific codes
    switch (error.code) {
      case 'PIPELINE_SESSION_LOAD_FAILED':
        // Handle load failure
        break;
      case 'PIPELINE_SESSION_SAVE_FAILED':
        // Handle save failure
        break;
    }
  }
}
```

### 5.5 Generic Error Type Guard

```typescript
/**
 * Generic type guard for any Error subclass
 */
function isError<T extends Error>(
  error: unknown,
  constructor: { new (...args: any[]): T }
): error is T {
  return error instanceof constructor;
}

// Usage
class DatabaseError extends Error {
  constructor(public query: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

try {
  throw new DatabaseError('SELECT *', 'Query failed');
} catch (error) {
  if (isError(error, DatabaseError)) {
    console.log(error.query); // Type-safe
  }
}
```

### 5.6 Current Project Type Guards

The project implements comprehensive type guards in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
/**
 * Type guard for PipelineError
 */
export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

/**
 * Type guard for SessionError
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

/**
 * Type guard for TaskError
 */
export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

/**
 * Type guard for AgentError
 */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

---

## 6. toJSON() Method Implementation for Structured Logging

### 6.1 Basic toJSON() Implementation

```typescript
/**
 * Error with toJSON() for structured logging
 */
class LoggableError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    Object.setPrototypeOf(this, LoggableError.prototype);
    this.name = 'LoggableError';
    this.code = code;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
    };
  }
}

// Usage with pino logger
import pino from 'pino';
const logger = pino();

try {
  throw new LoggableError('Operation failed', 'OP_FAILED');
} catch (error) {
  if (error instanceof LoggableError) {
    logger.error(error.toJSON(), 'Operation failed');
  }
}
```

### 6.2 toJSON() with Context

```typescript
/**
 * Error with context and toJSON()
 */
class ContextualError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, ContextualError.prototype);
    this.name = 'ContextualError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }

  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    if (this.context) {
      serialized.context = this.context;
    }

    if (this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }
}
```

### 6.3 toJSON() with Error Cause

```typescript
/**
 * toJSON() that includes error cause
 */
class ChainedError extends Error {
  readonly code: string;
  readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    cause?: Error
  ) {
    super(message);
    Object.setPrototypeOf(this, ChainedError.prototype);
    this.name = 'ChainedError';
    this.code = code;
    this.cause = cause;
  }

  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
    };

    if (this.cause) {
      serialized.cause = {
        name: this.cause.name,
        message: this.cause.message,
      };
    }

    if (this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }
}
```

### 6.4 toJSON() with Circular Reference Handling

```typescript
/**
 * toJSON() with circular reference detection
 */
class CircularSafeError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, CircularSafeError.prototype);
    this.name = 'CircularSafeError';
    this.code = code;
    this.context = context;
  }

  private serializeSafe(value: unknown, seen = new WeakSet()): unknown {
    // Handle primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.serializeSafe(item, seen));
    }

    // Handle circular references
    if (seen.has(value as object)) {
      return '[Circular]';
    }
    seen.add(value as object);

    // Handle errors
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    // Handle plain objects
    const serialized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as object)) {
      serialized[key] = this.serializeSafe(val, seen);
    }
    return serialized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context ? this.serializeSafe(this.context) : undefined,
      stack: this.stack,
    };
  }
}
```

### 6.5 Current Project toJSON() Implementation

The project implements a comprehensive `toJSON()` method in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
export abstract class PipelineError extends Error {
  // ... properties and constructor

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

  // ... sanitization methods (covered in next section)
}
```

---

## 7. Context Sanitization Patterns (PII Redaction)

### 7.1 Basic PII Redaction

```typescript
/**
 * Context sanitization for PII redaction
 */
class SanitizedError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, SanitizedError.prototype);
    this.name = 'SanitizedError';
    this.code = code;
    this.context = context;
  }

  private sanitizeContext(
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    // Sensitive key patterns (lowercase for case-insensitive matching)
    const sensitiveKeys = [
      'password', 'passwd', 'pwd',
      'apikey', 'api_key', 'apisecret', 'api_secret',
      'token', 'accesstoken', 'refreshtoken', 'authtoken',
      'secret', 'privatekey',
      'email', 'emailaddress',
      'phonenumber', 'ssn',
      'authorization',
    ];

    for (const [key, value] of Object.entries(context)) {
      // Check if key is sensitive (case-insensitive)
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context ? this.sanitizeContext(this.context) : undefined,
    };
  }
}

// Usage
const error = new SanitizedError(
  'Authentication failed',
  'AUTH_FAILED',
  {
    email: 'user@example.com',
    password: 'secret123',
    username: 'john_doe',
    api_key: 'sk-1234567890',
  }
);

console.log(error.toJSON());
// Output:
// {
//   name: 'SanitizedError',
//   code: 'AUTH_FAILED',
//   message: 'Authentication failed',
//   context: {
//     email: '[REDACTED]',
//     password: '[REDACTED]',
//     username: 'john_doe',
//     api_key: '[REDACTED]'
//   }
// }
```

### 7.2 Nested Object Sanitization

```typescript
/**
 * Deep sanitization for nested objects
 */
class DeepSanitizedError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, DeepSanitizedError.prototype);
    this.name = 'DeepSanitizedError';
    this.code = code;
    this.context = context;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password', 'passwd', 'pwd',
      'apikey', 'api_key', 'apisecret', 'api_secret',
      'token', 'accesstoken', 'refreshtoken', 'authtoken', 'bearertoken',
      'secret', 'privatekey',
      'email', 'emailaddress',
      'phonenumber', 'ssn',
      'authorization',
    ];

    return sensitivePatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );
  }

  private sanitizeValue(value: unknown): unknown {
    // Handle null and primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    // Handle errors
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    // Handle plain objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeValue(val);
      }
    }
    return sanitized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context ? this.sanitizeValue(this.context) : undefined,
    };
  }
}

// Usage with nested context
const error = new DeepSanitizedError(
  'User creation failed',
  'USER_CREATE_FAILED',
  {
    user: {
      username: 'john_doe',
      email: 'user@example.com',
      password: 'secret123',
    },
    metadata: {
      api_key: 'sk-1234567890',
      request_id: 'req-123',
    },
  }
);
```

### 7.3 Custom Redaction Function

```typescript
/**
 * Custom redaction function pattern
 */
type RedactionFunction = (key: string, value: unknown) => unknown;

class CustomSanitizedError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  private readonly redactFn: RedactionFunction;

  constructor(
    message: string,
    code: string,
    context: Record<string, unknown>,
    redactFn: RedactionFunction
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomSanitizedError.prototype);
    this.name = 'CustomSanitizedError';
    this.code = code;
    this.context = context;
    this.redactFn = redactFn;
  }

  private sanitizeContext(): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(this.context || {})) {
      sanitized[key] = this.redactFn(key, value);
    }

    return sanitized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.sanitizeContext(),
    };
  }
}

// Usage with custom redaction logic
const error = new CustomSanitizedError(
  'Request failed',
  'REQUEST_FAILED',
  {
    url: 'https://api.example.com/users',
    headers: {
      Authorization: 'Bearer token123',
      'Content-Type': 'application/json',
    },
    body: {
      password: 'secret',
      username: 'john',
    },
  },
  (key, value) => {
    // Redact authorization headers
    if (key.toLowerCase() === 'authorization') {
      return '[REDACTED]';
    }

    // Redact passwords
    if (key.toLowerCase() === 'password') {
      return '[REDACTED]';
    }

    // Redact all values in headers object except content-type
    // (This is a simplified example)
    return value;
  }
);
```

### 7.4 Current Project Sanitization Implementation

The project implements comprehensive PII redaction in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`:

```typescript
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
```

---

## 8. Circular Reference Handling in Error Serialization

### 8.1 The Problem

Circular references cause `JSON.stringify()` to throw errors:

```typescript
/**
 * Circular reference problem
 */
const circularObj: any = { name: 'test' };
circularObj.self = circularObj;

try {
  JSON.stringify(circularObj);
  // Throws: TypeError: Converting circular structure to JSON
} catch (error) {
  console.error('Failed to serialize:', error);
}
```

### 8.2 WeakSet-Based Solution

```typescript
/**
 * Circular reference handling with WeakSet
 */
class CircularSafeError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, CircularSafeError.prototype);
    this.name = 'CircularSafeError';
    this.code = code;
    this.context = context;
  }

  private serializeSafe(
    value: unknown,
    seen = new WeakSet<object>()
  ): unknown {
    // Handle primitives and null
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle circular references
    if (seen.has(value as object)) {
      return '[Circular]';
    }

    // Track this object
    seen.add(value as object);

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.serializeSafe(item, seen));
    }

    // Handle errors
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    // Handle plain objects
    const serialized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = this.serializeSafe(val, seen);
    }
    return serialized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context ? this.serializeSafe(this.context) : undefined,
    };
  }
}

// Usage with circular reference
const circular: any = { userId: 123 };
circular.self = circular;

const error = new CircularSafeError(
  'Operation failed',
  'OP_FAILED',
  { user: circular }
);

console.log(JSON.stringify(error.toJSON()));
// No error! Outputs: {"name":"CircularSafeError","code":"OP_FAILED",...}
```

### 8.3 JSON.stringify Replacer Function

```typescript
/**
 * Using JSON.stringify replacer function
 */
class ReplacerError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, ReplacerError.prototype);
    this.name = 'ReplacerError';
    this.code = code;
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    const seen = new WeakSet<object>();

    const replacer = (key: string, value: unknown): unknown => {
      // Handle primitives and null
      if (value === null || typeof value !== 'object') {
        return value;
      }

      // Handle circular references
      if (seen.has(value as object)) {
        return '[Circular]';
      }

      // Track this object
      seen.add(value as object);

      // Handle errors
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
        };
      }

      return value;
    };

    // Create object to serialize
    const obj = {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };

    // Use JSON.parse/stringify with replacer
    return JSON.parse(JSON.stringify(obj, replacer));
  }
}

// Usage
const circular: any = { data: 'test' };
circular.self = circular;

const error = new ReplacerError(
  'Failed',
  'FAIL',
  { circular }
);

console.log(error.toJSON());
// Handles circular reference gracefully
```

### 8.4 Combined Sanitization and Circular Reference Handling

```typescript
/**
 * Combining PII redaction with circular reference handling
 */
class SafeError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, SafeError.prototype);
    this.name = 'SafeError';
    this.code = code;
    this.context = context;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password', 'token', 'secret', 'apikey',
      'email', 'authorization', 'privatekey',
    ];
    return sensitivePatterns.some(pattern =>
      key.toLowerCase().includes(pattern)
    );
  }

  private sanitizeSafe(
    value: unknown,
    seen = new WeakSet<object>()
  ): unknown {
    // Handle primitives and null
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle circular references
    if (seen.has(value as object)) {
      return '[Circular]';
    }

    // Track this object
    seen.add(value as object);

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeSafe(item, seen));
    }

    // Handle errors
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    // Handle functions
    if (typeof value === 'function') {
      return '[Function]';
    }

    // Handle plain objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Check for sensitive keys
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeSafe(val, seen);
      }
    }
    return sanitized;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context ? this.sanitizeSafe(this.context) : undefined,
      stack: this.stack,
    };
  }
}

// Usage with complex context
const circular: any = {
  email: 'user@example.com',
  password: 'secret123'
};
circular.self = circular;

const error = new SafeError(
  'Complex error',
  'COMPLEX_ERROR',
  {
    user: circular,
    metadata: {
      api_key: 'sk-123',
      count: 42,
    },
  }
);

console.log(JSON.stringify(error.toJSON(), null, 2));
// Output handles both circular references and PII redaction
```

### 8.5 Current Project Circular Reference Handling

The project handles circular references in `/home/dustin/projects/hacky-hack/src/utils/errors.ts` using a try-catch approach:

```typescript
// Handle circular references and other non-serializable objects
try {
  JSON.stringify(value);
  sanitized[key] = value;
} catch {
  sanitized[key] = '[non-serializable]';
}
```

This is a simple but effective approach. For more robust handling, consider implementing one of the WeakSet-based patterns shown above.

---

## 9. Common Pitfalls and How to Avoid Them

### 9.1 Forgetting Object.setPrototypeOf()

**Pitfall:**
```typescript
class BrokenError extends Error {
  constructor(message: string) {
    super(message);
    // MISSING: Object.setPrototypeOf
  }
}

const error = new BrokenError('test');
console.log(error instanceof BrokenError); // May be false!
```

**Solution:**
```typescript
class CorrectError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CorrectError.prototype);
  }
}
```

### 9.2 Not Setting the Error Name

**Pitfall:**
```typescript
class NamelessError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NamelessError.prototype);
    // Forgetting to set this.name
  }
}

const error = new NamelessError('test');
console.log(error.name); // 'Error' instead of 'NamelessError'
```

**Solution:**
```typescript
class NamedError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, NamedError.prototype);
    this.name = 'NamedError'; // Or: this.name = this.constructor.name;
  }
}
```

### 9.3 Not Capturing Stack Trace Properly

**Pitfall:**
```typescript
class StackError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, StackError.prototype);
    // Missing Error.captureStackTrace
  }
}

// Stack trace will point to the Error constructor, not the throw site
```

**Solution:**
```typescript
class ProperStackError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ProperStackError.prototype);

    // Capture stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProperStackError);
    }
  }
}
```

### 9.4 Using instanceof with Unknown Errors

**Pitfall:**
```typescript
try {
  // some operation
} catch (error) {
  if (error instanceof MyCustomError) {
    // TypeScript may not narrow the type correctly
    console.log(error.code); // Type error!
  }
}
```

**Solution:**
```typescript
// Use type guard function
function isMyCustomError(error: unknown): error is MyCustomError {
  return error instanceof MyCustomError;
}

try {
  // some operation
} catch (error) {
  if (isMyCustomError(error)) {
    console.log(error.code); // Type-safe!
  }
}
```

### 9.5 Not Handling Non-Error Objects in Catch Blocks

**Pitfall:**
```typescript
try {
  throw 'string error'; // or throw null, throw 123, etc.
} catch (error) {
  console.log(error.message); // Runtime error!
}
```

**Solution:**
```typescript
try {
  throw 'string error';
} catch (error) {
  // Guard against non-error objects
  if (error instanceof Error) {
    console.log(error.message); // Type-safe
  } else {
    console.log(String(error)); // Handle non-error objects
  }
}
```

### 9.6 Leaking Sensitive Data in Error Messages

**Pitfall:**
```typescript
try {
  await authenticateUser(username, password);
} catch (error) {
  throw new Error(`Authentication failed for ${username} with password ${password}`);
  // Leaks credentials in logs!
}
```

**Solution:**
```typescript
try {
  await authenticateUser(username, password);
} catch (error) {
  throw new AuthenticationError(
    'Authentication failed',
    { username }, // Don't include password
    error as Error
  );
}
```

### 9.7 Not Implementing toJSON() for Structured Logging

**Pitfall:**
```typescript
class LogError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

// Logging directly may not serialize properly
logger.info(error); // May not include all properties
```

**Solution:**
```typescript
class LoggableError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

// Proper structured logging
logger.info(error.toJSON()); // All properties included
```

### 9.8 Circular References in Context Objects

**Pitfall:**
```typescript
const context: any = { taskId: '123' };
context.self = context;

const error = new Error('Failed');
// @ts-ignore
error.context = context;

JSON.stringify(error); // Throws!
```

**Solution:**
```typescript
const context: any = { taskId: '123' };
context.self = context;

class SafeError extends Error {
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.context = context;
  }

  toJSON(): Record<string, unknown> {
    const seen = new WeakSet();

    const safeStringify = (obj: unknown): unknown => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (seen.has(obj as object)) return '[Circular]';
      seen.add(obj as object);
      // ... rest of implementation
    };

    return {
      name: this.name,
      message: this.message,
      context: this.context ? safeStringify(this.context) : undefined,
    };
  }
}

const error = new SafeError('Failed', context);
JSON.stringify(error.toJSON()); // No error!
```

---

## 10. Production Code Best Practices

### 10.1 Complete Production-Ready Error Class

```typescript
/**
 * Production-ready error class with all best practices
 */
abstract class AppError extends Error {
  // Abstract properties - must be implemented by subclasses
  abstract readonly code: string;
  abstract readonly statusCode: number;

  // Standard properties
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;
  readonly cause?: Error;
  readonly requestId?: string;
  readonly userId?: string;

  // Sensitive key patterns for redaction
  private static readonly SENSITIVE_KEYS = [
    'password', 'passwd', 'pwd',
    'apikey', 'api_key', 'apisecret', 'api_secret',
    'token', 'accesstoken', 'refreshtoken', 'authtoken',
    'secret', 'privatekey',
    'email', 'emailaddress',
    'phonenumber', 'ssn',
    'authorization',
  ];

  constructor(
    message: string,
    statusCode: number,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);

    // CRITICAL: Set prototype for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.context = context;
    this.cause = cause;
    this.timestamp = new Date();

    // Extract request/user ID from context if available
    if (context?.requestId) this.requestId = String(context.requestId);
    if (context?.userId) this.userId = String(context.userId);
  }

  /**
   * Serialize error for structured logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      context: this.context ? this.sanitizeContext(this.context) : undefined,
      cause: this.cause ? this.serializeCause(this.cause) : undefined,
      stack: this.stack,
    };
  }

  /**
   * Sanitize context object to remove PII
   */
  private sanitizeContext(
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      // Check if key is sensitive (case-insensitive)
      if (AppError.SENSITIVE_KEYS.some(sk =>
        key.toLowerCase().includes(sk)
      )) {
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

      // Handle circular references
      sanitized[key] = this.safeStringify(value);
    }

    return sanitized;
  }

  /**
   * Serialize error cause
   */
  private serializeCause(cause: Error): Record<string, unknown> {
    return {
      name: cause.name,
      message: cause.message,
    };
  }

  /**
   * Safely stringify value handling circular references
   */
  private safeStringify(value: unknown, seen = new WeakSet<object>()): unknown {
    // Handle primitives
    if (value === null || typeof value !== 'object') {
      return value;
    }

    // Handle circular references
    if (seen.has(value as object)) {
      return '[Circular]';
    }
    seen.add(value as object);

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.safeStringify(item, seen));
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = this.safeStringify(val, seen);
    }
    return result;
  }

  /**
   * Check if error is retryable based on status code
   */
  isRetryable(): boolean {
    return this.statusCode >= 500 || this.statusCode === 429;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Concrete implementation: Database Error
 */
class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 500, context, cause);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Concrete implementation: Validation Error
 */
class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 400, context, cause);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Type guard for database errors
 */
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Usage example
 */
async function handleDatabaseOperation() {
  try {
    await database.query('SELECT * FROM users');
  } catch (error) {
    throw new DatabaseError(
      'Failed to query users',
      {
        query: 'SELECT * FROM users',
        requestId: 'req-123',
        userId: 'user-456',
      },
      error as Error
    );
  }
}

/**
 * Error handling middleware example
 */
function errorHandler(error: unknown, request: any) {
  if (error instanceof AppError) {
    // Log with structured data
    console.error(JSON.stringify(error.toJSON()));

    // Handle based on error type
    if (isDatabaseError(error)) {
      // Database-specific handling
      if (error.isRetryable()) {
        // Retry logic
      }
    }

    // Send response
    return {
      status: error.statusCode,
      body: {
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      },
    };
  }

  // Handle unknown errors
  console.error('Unknown error:', error);
  return {
    status: 500,
    body: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}
```

### 10.2 Error Handling Best Practices Checklist

**When Creating Error Classes:**
- ✅ Always call `Object.setPrototypeOf(this, ClassName.prototype)`
- ✅ Set `this.name` to the class name
- ✅ Call `Error.captureStackTrace()` if available
- ✅ Implement `toJSON()` for structured logging
- ✅ Sanitize PII from context objects
- ✅ Handle circular references in serialization
- ✅ Use const assertions for type-safe error codes
- ✅ Include timestamp for debugging
- ✅ Support error chaining with `cause` property

**When Throwing Errors:**
- ✅ Use specific error types, not generic Error
- ✅ Include helpful context (without PII)
- ✅ Chain errors using the `cause` property
- ✅ Use error codes for programmatic handling
- ✅ Include requestId/userId for tracing

**When Catching Errors:**
- ✅ Use type guard functions for type narrowing
- ✅ Check `instanceof` before accessing properties
- ✅ Handle non-error objects in catch blocks
- ✅ Log errors with structured data
- ✅ Don't leak sensitive data in error messages
- ✅ Implement retry logic for transient failures

### 10.3 Project-Specific Recommendations

Based on the analysis of `/home/dustin/projects/hacky-hack/src/utils/errors.ts`, here are specific recommendations:

1. **Update cause handling for ES2022:**
   Since the project uses `target: "ES2022"`, update the constructor to use the native `cause` option:

   ```typescript
   constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
     // Use ES2022 cause option
     super(message, { cause });

     Object.setPrototypeOf(this, new.target.prototype);
     // ... rest of constructor
   }
   ```

2. **Enhance circular reference handling:**
   The current try-catch approach works, but consider implementing a WeakSet-based solution for more robust handling.

3. **Add status code property:**
   Consider adding HTTP status codes for better API integration:

   ```typescript
   abstract class PipelineError extends Error {
     abstract readonly code: ErrorCode;
     readonly statusCode: number = 500; // Default
     // ... rest of implementation
   }
   ```

4. **Add retryability method:**
   Add a helper method for retry logic:

   ```typescript
   isRetryable(): boolean {
     return this.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT ||
            this.code === ErrorCodes.PIPELINE_AGENT_LLM_FAILED;
   }
   ```

5. **Consider adding error severity:**
   Add severity levels for monitoring/alerting:

   ```typescript
   readonly severity: 'low' | 'medium' | 'high' | 'critical';
   ```

---

## 11. Authoritative Sources and References

### 11.1 TypeScript Documentation

- **TypeScript Handbook - Narrowing**
  https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - Covers type guards and type narrowing in catch blocks

- **TypeScript Handbook - Type Guards**
  https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
  - Official documentation on type guard functions

### 11.2 ECMAScript Standards

- **ECMAScript 2022 Specification - Error Objects**
  https://tc39.es/ecma262/2022/#sec-error-objects
  - Official specification for Error constructor options including `cause`

- **TC39 Proposal - Error Cause**
  https://github.com/tc39/proposal-error-cause
  - Proposal and rationale for the Error cause feature

### 11.3 MDN Web Docs

- **Error - JavaScript | MDN**
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
  - Comprehensive documentation on Error objects

- **Object.setPrototypeOf() - JavaScript | MDN**
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf
  - Documentation on prototype manipulation

### 11.4 Node.js Documentation

- **Error | Node.js v20 Documentation**
  https://nodejs.org/docs/latest-v20.x/api/errors.html
  - Node.js-specific error handling patterns

- **Error.captureStackTrace() | Node.js**
  https://nodejs.org/docs/latest-v20.x/api/errors.html#errorcapturestacktracetargetobjectconstructoropt
  - V8-specific stack trace capturing

### 11.5 Best Practice Articles

- **"Proper Error Handling in TypeScript"**
  https://dev.to/mgranicz/better-error-handling-in-typescript-3m5l
  - Community best practices

- **"TypeScript Error Handling: The Complete Guide"**
  https://kentcdodds.com/blog/use-a-error-boundary-to-handle-errors-in-react
  - Comprehensive error handling patterns

### 11.6 Structured Logging

- **Pino - High Performance Node.js Logger**
  https://getpino.io/
  - Documentation on structured logging patterns

- **Winston Logger**
  https://github.com/winstonjs/winston
  - Popular logging library with error handling examples

### 11.7 Security Considerations

- **OWASP Logging Cheat Sheet**
  https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html
  - Security best practices for logging

- **"Preventing PII Leakage in Error Messages"**
  https://cwe.mitre.org/data/definitions/209.html
  - Common Weakness Enumeration on information exposure

### 11.8 Testing Error Handling

- **Vitest - Testing Thrown Errors**
  https://vitest.dev/guide/assertions.html#toThrow
  - Documentation on testing error handling with Vitest

---

## Appendix: Quick Reference

### A.1 Minimal Custom Error Template

```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
    this.name = 'CustomError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}
```

### A.2 Production-Ready Error Template

```typescript
class ProductionError extends Error {
  readonly code: string;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, ProductionError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProductionError);
    }
    this.name = 'ProductionError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}
```

### A.3 Type Guard Template

```typescript
function isProductionError(error: unknown): error is ProductionError {
  return error instanceof ProductionError;
}
```

---

**End of Document**

---

## Implementation Notes for P1.M1.T1.S1

This research document provides the foundation for improving error handling in the hacky-hack project. Key findings:

1. **Current Implementation Strengths:**
   - Proper use of `Object.setPrototypeOf()`
   - Good error code hierarchy
   - Comprehensive PII redaction
   - Type guard functions implemented
   - toJSON() method for structured logging

2. **Areas for Improvement:**
   - Update to use ES2022 native `cause` property
   - Enhance circular reference handling with WeakSet
   - Add status codes for API integration
   - Add retryability helper methods
   - Consider adding severity levels

3. **Next Steps:**
   - Review and update error constructors to use ES2022 cause option
   - Implement WeakSet-based circular reference handling
   - Add error code status code mapping
   - Create integration tests for error serialization
   - Document error handling patterns in project docs
