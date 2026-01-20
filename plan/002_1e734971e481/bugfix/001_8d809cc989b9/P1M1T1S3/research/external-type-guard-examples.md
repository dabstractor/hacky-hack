# TypeScript Type Guards for Error Handling - External Research Examples

> **Note:** Due to web search tool rate limits (monthly limit reached as of January 15, 2026), this document compiles established TypeScript type guard patterns and best practices based on official TypeScript documentation patterns and community best practices.

## Table of Contents

1. [Official TypeScript Resources](#official-typescript-resources)
2. [Type Guards for Custom Error Classes](#type-guards-for-custom-error-classes)
3. [Type Guard Patterns Using instanceof](#type-guard-patterns-using-instanceof)
4. [Error Handling Type Narrowing Best Practices](#error-handling-type-narrowing-best-practices)
5. [Common Open-Source Patterns](#common-open-source-patterns)
6. [Best Practices and Recommendations](#best-practices-and-recommendations)
7. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)

---

## Official TypeScript Resources

### TypeScript Handbook - Type Guards

**Official Documentation:**
- **URL:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Section:** Using Type Predicates
- **Description:** TypeScript's official documentation on type narrowing and type guards

Key concepts from the handbook:

```typescript
// Type Predicate Syntax
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

// Usage
let pet = getSmallPet();
if (isFish(pet)) {
  pet.swim(); // TypeScript knows this is a Fish
}
```

**Related Resources:**
- **Type Narrowing:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Type Assertions:** https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
- **Utility Types:** https://www.typescriptlang.org/docs/handbook/utility-types.html

---

## Type Guards for Custom Error Classes

### Basic Custom Error Class Pattern

```typescript
// Custom Error Base Class
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific Error Types
class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NetworkError extends AppError {
  constructor(
    message: string,
    public endpoint: string,
    public statusCode: number = 500
  ) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}
```

### Type Guards for Custom Errors

```typescript
// Type Guard Functions
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

// Composed Type Guard
function isKnownError(error: unknown): error is AppError | ValidationError | NetworkError | AuthenticationError {
  return (
    error instanceof AppError ||
    error instanceof ValidationError ||
    error instanceof NetworkError ||
    error instanceof AuthenticationError
  );
}
```

### Usage Example

```typescript
function handleError(error: unknown): void {
  if (isValidationError(error)) {
    console.error(`Validation failed on field "${error.field}":`, error.message);
    console.error('Invalid value:', error.value);
    return;
  }

  if (isNetworkError(error)) {
    console.error(`Network error at ${error.endpoint}:`, error.message);
    console.error('Status code:', error.statusCode);
    return;
  }

  if (isAuthenticationError(error)) {
    console.error('Authentication failed:', error.message);
    // Redirect to login
    return;
  }

  if (isAppError(error)) {
    console.error(`Application error [${error.code}]:`, error.message);
    return;
  }

  // Fallback for truly unknown errors
  if (error instanceof Error) {
    console.error('Unexpected error:', error.message);
  } else {
    console.error('Unknown error type:', error);
  }
}
```

---

## Type Guard Patterns Using instanceof

### Pattern 1: Direct instanceof Checks

```typescript
// Simple and straightforward
function processError(error: unknown) {
  if (error instanceof TypeError) {
    // TypeScript knows error is TypeError here
    console.log('Type Error:', error.message);
  } else if (error instanceof RangeError) {
    // TypeScript knows error is RangeError here
    console.log('Range Error:', error.message);
  } else if (error instanceof Error) {
    // TypeScript knows error is Error here
    console.log('General Error:', error.message);
  } else {
    // TypeScript knows error is unknown here
    console.log('Unknown error:', error);
  }
}
```

### Pattern 2: instanceof with Type Predicates

```typescript
// More reusable pattern
function isTypeError(error: unknown): error is TypeError {
  return error instanceof TypeError;
}

function isRangeError(error: unknown): error is RangeError {
  return error instanceof RangeError;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Usage
function processError(error: unknown) {
  if (isTypeError(error)) {
    // Type narrowing works
    error.message; // TypeScript knows this is TypeError
  } else if (isRangeError(error)) {
    error.message; // TypeScript knows this is RangeError
  } else if (isError(error)) {
    error.message; // TypeScript knows this is Error
  }
}
```

### Pattern 3: Hierarchical Error Type Guards

```typescript
// Base error class
class DatabaseError extends Error {
  constructor(
    message: string,
    public query?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// Specialized errors
class ConnectionError extends DatabaseError {
  constructor(message: string, public host: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

class QueryError extends DatabaseError {
  constructor(message: string, query: string, public sqlCode?: string) {
    super(message, query);
    this.name = 'QueryError';
    this.sqlCode = sqlCode;
  }
}

// Type guards
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

function isConnectionError(error: unknown): error is ConnectionError {
  return error instanceof ConnectionError;
}

function isQueryError(error: unknown): error is QueryError {
  return error instanceof QueryError;
}

// Usage with hierarchy
function handleDatabaseError(error: unknown) {
  if (isConnectionError(error)) {
    console.error(`Failed to connect to ${error.host}: ${error.message}`);
  } else if (isQueryError(error)) {
    console.error(`Query failed: ${error.query}`);
    if (error.sqlCode) {
      console.error(`SQL Code: ${error.sqlCode}`);
    }
  } else if (isDatabaseError(error)) {
    console.error(`Database error: ${error.message}`);
  }
}
```

---

## Error Handling Type Narrowing Best Practices

### Best Practice 1: Always Handle Unknown Errors

```typescript
// Good: Comprehensive error handling
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new NetworkError('Failed to fetch', '/api/data', response.status);
    }
    return await response.json();
  } catch (error) {
    if (isNetworkError(error)) {
      // Handle network errors
      throw error;
    } else if (error instanceof Error) {
      // Handle known error types
      throw new AppError(error.message, 'FETCH_ERROR');
    } else {
      // Handle truly unknown errors
      throw new AppError('Unknown error occurred', 'UNKNOWN_ERROR');
    }
  }
}
```

### Best Practice 2: Use Type Guards in Error Middleware

```typescript
// Express.js error handling middleware pattern
function errorHandler(
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (isValidationError(err)) {
    return res.status(400).json({
      error: 'Validation Error',
      field: err.field,
      message: err.message
    });
  }

  if (isNetworkError(err)) {
    return res.status(err.statusCode || 500).json({
      error: 'Network Error',
      endpoint: err.endpoint,
      message: err.message
    });
  }

  if (isAuthenticationError(err)) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: err.message
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : err.message
    });
  }

  // Unknown error
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unknown error occurred'
  });
}
```

### Best Practice 3: Type Guard for Error with Message

```typescript
// Check if error has a message property
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// More comprehensive check
function isErrorLike(error: unknown): error is Error & { message: string; stack?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}
```

### Best Practice 4: Discriminated Union Type Guards

```typescript
// Using discriminated unions for error types
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Type guard for success
function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

// Type guard for error
function isError<E>(result: Result<unknown, E>): result is { success: false; error: E } {
  return result.success === false;
}

// Usage
function processResult<T>(result: Result<T>) {
  if (isSuccess(result)) {
    console.log('Data:', result.data);
  } else if (isError(result)) {
    console.error('Error:', result.error);
  }
}
```

### Best Practice 5: Async Error Type Guard

```typescript
// Type guard for async errors
async function safeAsyncOperation<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new Error(String(error))
    };
  }
}

// Usage
async function fetchData() {
  const result = await safeAsyncOperation(() => fetch('/api/data'));

  if (result.success) {
    return result.data;
  } else {
    console.error('Failed to fetch:', result.error.message);
    throw result.error;
  }
}
```

---

## Common Open-Source Patterns

### Pattern 1: Type Guard Library Pattern

Based on common patterns from libraries like `io-ts` and `zod`:

```typescript
// Generic type guard creator
function createTypeGuard<T>(predicate: (value: unknown) => boolean): (value: unknown) => value is T {
  return predicate as (value: unknown) => value is T;
}

// Usage
const isString = createTypeGuard<string>((value): value is string => {
  return typeof value === 'string';
});

const isNumber = createTypeGuard<number>((value): value is number => {
  return typeof value === 'number';
});

const isError = createTypeGuard<Error>((value): value is Error => {
  return value instanceof Error;
});
```

### Pattern 2: Error Discriminator Pattern

```typescript
// Error types with discriminators
type ApiError = {
  type: 'network_error';
  message: string;
  statusCode: number;
} | {
  type: 'validation_error';
  message: string;
  field: string;
} | {
  type: 'auth_error';
  message: string;
  code: string;
};

// Type guards using discriminators
function isNetworkError(error: ApiError): error is Extract<ApiError, { type: 'network_error' }> {
  return error.type === 'network_error';
}

function isValidationError(error: ApiError): error is Extract<ApiError, { type: 'validation_error' }> {
  return error.type === 'validation_error';
}

function isAuthError(error: ApiError): error is Extract<ApiError, { type: 'auth_error' }> {
  return error.type === 'auth_error';
}

// Usage
function handleApiError(error: ApiError) {
  if (isNetworkError(error)) {
    console.log(`Network error: ${error.statusCode} - ${error.message}`);
  } else if (isValidationError(error)) {
    console.log(`Validation error on field ${error.field}: ${error.message}`);
  } else if (isAuthError(error)) {
    console.log(`Auth error [${error.code}]: ${error.message}`);
  }
}
```

### Pattern 3: Type Guard Composition

```typescript
// Composable type guards
function or<T, U>(
  guard1: (value: unknown) => value is T,
  guard2: (value: unknown) => value is U
): (value: unknown) => value is T | U {
  return (value): value is T | U => guard1(value) || guard2(value);
}

function and<T, U extends T>(
  guard1: (value: unknown) => value is T,
  guard2: (value: T) => value is U
): (value: unknown) => value is U {
  return (value): value is U => guard1(value) && guard2(value as T);
}

function not<T>(
  guard: (value: unknown) => value is T
): (value: unknown) => value is Exclude<unknown, T> {
  return (value): value is Exclude<unknown, T> => !guard(value);
}

// Usage
const isStringOrNumber = or(isString, isNumber);
const isStringWithLength = and(isString, (value): value is string => value.length > 0);
```

### Pattern 4: Error Type Guard with Metadata

```typescript
// Error with metadata
interface ErrorMetadata {
  timestamp: number;
  userId?: string;
  requestId?: string;
}

interface MetadataError extends Error {
  metadata: ErrorMetadata;
}

function isMetadataError(error: unknown): error is MetadataError {
  return (
    error instanceof Error &&
    'metadata' in error &&
    typeof (error as Record<string, unknown>).metadata === 'object'
  );
}

// Enhanced error class
class EnhancedError extends Error implements MetadataError {
  metadata: ErrorMetadata;

  constructor(
    message: string,
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message);
    this.name = 'EnhancedError';
    this.metadata = {
      timestamp: Date.now(),
      ...metadata
    };
    Object.setPrototypeOf(this, EnhancedError.prototype);
  }
}
```

---

## Best Practices and Recommendations

### 1. Always Use Type Predicates

**DO:**
```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}
```

**DON'T:**
```typescript
function isError(error: unknown): boolean {
  return error instanceof Error;
}
```

### 2. Maintain Prototype Chain

**DO:**
```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
```

**DON'T:**
```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    // Missing prototype chain setup
  }
}
```

### 3. Use Specific Type Guards

**DO:**
```typescript
function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
```

**DON'T:**
```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}
// Then manually check properties later
```

### 4. Handle Unknown Errors

**DO:**
```typescript
try {
  // ... code
} catch (error) {
  if (isKnownError(error)) {
    // Handle known errors
  } else if (error instanceof Error) {
    // Handle generic Error
  } else {
    // Handle truly unknown errors
  }
}
```

### 5. Create Reusable Type Guards

**DO:**
```typescript
// In a separate file: typeGuards.ts
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

**Usage:**
```typescript
import { isValidationError, isAppError } from './typeGuards';

function handleError(error: unknown) {
  if (isValidationError(error)) {
    // ...
  }
}
```

### 6. Use Type Guards in Array Methods

**DO:**
```typescript
const errors: unknown[] = [/* ... */];
const appErrors = errors.filter(isAppError);
```

**DON'T:**
```typescript
const errors: unknown[] = [/* ... */];
const appErrors = errors.filter((e): e is AppError => e instanceof AppError);
```

### 7. Type Guard for Error Properties

```typescript
function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

function isErrorWithStatus(error: unknown): error is Error & { status: number } {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  );
}
```

---

## Common Pitfalls to Avoid

### Pitfall 1: Forgetting Object.setPrototypeOf

**Problem:**
```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    // Missing: Object.setPrototypeOf(this, CustomError.prototype);
  }
}

console.log(new CustomError('test') instanceof CustomError); // Might be false in some environments
```

**Solution:**
```typescript
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomError';
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
```

### Pitfall 2: Not Handling Cross-Realm Errors

**Problem:**
```typescript
// iframe or worker context
const error = new Error('test');
error instanceof Error; // Might be false if from different realm
```

**Solution:**
```typescript
function isError(error: unknown): error is Error {
  return (
    error instanceof Error ||
    (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'stack' in error
    )
  );
}
```

### Pitfall 3: Type Guard Returns Wrong Type

**Problem:**
```typescript
function isNumber(value: unknown): value is string { // Wrong type!
  return typeof value === 'number';
}
```

**Solution:**
```typescript
function isNumber(value: unknown): value is number { // Correct type
  return typeof value === 'number';
}
```

### Pitfall 4: Not Narrowing in Else Branch

**Problem:**
```typescript
function processValue(value: string | number) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  }
  // value is still string | number here
}
```

**Solution:**
```typescript
function processValue(value: string | number) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
    return;
  }
  // value is number here
  console.log(value.toFixed(2));
}
```

### Pitfall 5: Type Guard Side Effects

**Problem:**
```typescript
function isValidationErrorWithLogging(error: unknown): error is ValidationError {
  console.log('Checking error:', error); // Side effect
  return error instanceof ValidationError;
}
```

**Solution:**
```typescript
// Keep type guards pure
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// Log separately
function logAndCheckError(error: unknown): error is ValidationError {
  console.log('Checking error:', error);
  return isValidationError(error);
}
```

### Pitfall 6: Overly Complex Type Guards

**Problem:**
```typescript
function isComplexError(error: unknown): error is CustomError & { extra: string } {
  return (
    error instanceof CustomError &&
    'extra' in error &&
    typeof (error as Record<string, unknown>).extra === 'string' &&
    (error as Record<string, unknown>).extra.length > 0 &&
    (error as Record<string, unknown>).extra !== 'invalid'
  );
}
```

**Solution:**
```typescript
// Break down into simpler guards
function isCustomError(error: unknown): error is CustomError {
  return error instanceof CustomError;
}

function hasExtraProperty(error: unknown): error is CustomError & { extra: string } {
  return (
    isCustomError(error) &&
    'extra' in error &&
    typeof error.extra === 'string'
  );
}

// Then combine
if (hasExtraProperty(error) && error.extra.length > 0 && error.extra !== 'invalid') {
  // ...
}
```

---

## Additional Resources

### Official TypeScript Documentation
- **Type Narrowing:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- **Type Predicates:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
- **Everyday Types:** https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

### Recommended Reading
- **TypeScript Deep Dive - Type Guards:** https://basarat.gitbook.io/typescript/type-system/typeguard
- **Effectivestyle - TypeScript Error Handling:** (Various community resources)

### Community Examples
- Search GitHub for "instanceof Error" in TypeScript repositories
- Search for "type guard" in popular TypeScript projects
- Review error handling patterns in Express.js, NestJS, and other frameworks

---

## Summary

TypeScript type guards for error handling provide:

1. **Type Safety:** Compile-time type checking for runtime errors
2. **Better IDE Support:** Autocomplete and IntelliSense for error properties
3. **Maintainability:** Clear, reusable error type checking logic
4. **Error Discrimination:** Easy differentiation between error types
5. **Type Narrowing:** Automatic type narrowing in conditional blocks

**Key Takeaways:**
- Always use type predicates (`value is Type`) for type guards
- Maintain prototype chain when extending Error
- Handle unknown errors gracefully
- Create reusable, composable type guards
- Keep type guards pure and simple
- Use `instanceof` for built-in Error types
- Create custom type guards for your error classes

---

## Notes

- This document was created on January 15, 2026
- Web search tools were rate-limited, so this compilation is based on established TypeScript patterns and best practices
- For the most current information, always refer to the official TypeScript documentation
- Consider using established type validation libraries like `zod`, `io-ts`, or `runtypes` for complex type guarding needs
