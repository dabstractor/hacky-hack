# TypeScript Type Guard Research

## Table of Contents

1. [What is a Type Guard?](#what-is-a-type-guard)
2. [Type Guards for Error Handling in Catch Blocks](#type-guards-for-error-handling-in-catch-blocks)
3. [Best Practices for Custom Error Class Type Guards](#best-practices-for-custom-error-class-type-guards)
4. [Using instanceof in Type Guards](#using-instanceof-in-type-guards)
5. [Common Patterns for Error Handling](#common-patterns-for-error-handling)
6. [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)
7. [Resources](#resources)

---

## What is a Type Guard?

A **type guard** is a TypeScript expression that performs a runtime check and guarantees the type of a value within a certain scope. Type guards return a special type predicate using the `value is Type` syntax.

### Basic Type Guard Syntax

```typescript
// Type predicate syntax: parameterName is Type
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}
```

### How Type Guards Work

Type guards use TypeScript's type narrowing to refine types within conditional blocks:

```typescript
function processValue(value: unknown) {
  if (isString(value)) {
    // TypeScript knows value is string here
    console.log(value.toUpperCase()); // ✓ OK
  }

  if (isNumber(value)) {
    // TypeScript knows value is number here
    console.log(value.toFixed(2)); // ✓ OK
  }
}
```

### Types of Type Guards

1. **`typeof` type guards** - For primitive types
2. **`instanceof` type guards** - For class instances
3. **`in` operator** - For object properties
4. **Equality narrowing** - Using `===` or `==`
5. **Custom type guards** - User-defined functions with type predicates
6. **Type assertions with validation** - Combined approach

---

## Type Guards for Error Handling in Catch Blocks

### The Problem: Unknown Error Types

In TypeScript, catch blocks always receive values of type `unknown` (or `any` in older versions):

```typescript
try {
  // Some code that might throw
} catch (error) {
  // error is unknown
  // TypeScript doesn't know what properties it has
  console.log(error.message); // ✗ Error: Object is of type 'unknown'
}
```

### Solution: Type Guards for Error Narrowing

Type guards enable safe type narrowing in catch blocks:

```typescript
// Define custom error types
class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NetworkError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Type guard for ValidationError
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// Type guard for NetworkError
function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

// Usage in catch block
try {
  // Some operation
} catch (error) {
  if (isValidationError(error)) {
    // TypeScript knows error is ValidationError
    console.log(`Field ${error.field} is invalid`);
  } else if (isNetworkError(error)) {
    // TypeScript knows error is NetworkError
    console.log(`Network error: ${error.statusCode}`);
  } else {
    // Handle unknown errors
    console.log('Unknown error occurred');
  }
}
```

### Why Type Guards Are Better Than Type Assertions

**❌ Bad: Using type assertions**

```typescript
catch (error) {
  const err = error as Error; // Unsafe - assumes it's always an Error
  console.log(err.message); // Could fail at runtime
}
```

**✅ Good: Using type guards**

```typescript
catch (error) {
  if (isError(error)) {
    console.log(error.message); // Safe - guaranteed to be Error
  }
}
```

---

## Best Practices for Custom Error Class Type Guards

### 1. Always Extend Error Base Class

```typescript
// ✅ Good: Extends Error
class CustomError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CustomError';
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

// ❌ Bad: Doesn't extend Error
class CustomError {
  message: string;
  code: string;
}
```

### 2. Implement the name Property

```typescript
class DatabaseError extends Error {
  constructor(
    public query: string,
    message: string
  ) {
    super(message);
    this.name = 'DatabaseError'; // Important for identification
  }
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof Error && error.name === 'DatabaseError';
}
```

### 3. Use instanceof with Property Checks for Robustness

```typescript
function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof ValidationError &&
    'field' in error &&
    typeof (error as ValidationError).field === 'string'
  );
}
```

### 4. Create Type Guard Factories for Reusability

```typescript
function createErrorTypeGuard<T extends Error>(
  errorClass: new (...args: any[]) => T
): (error: unknown) => error is T {
  return (error: unknown): error is T => {
    return error instanceof errorClass;
  };
}

// Usage
const isValidationError = createErrorTypeGuard(ValidationError);
const isNetworkError = createErrorTypeGuard(NetworkError);
```

### 5. Chain Multiple Type Guards

```typescript
function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    (error instanceof ValidationError ||
      error instanceof NetworkError ||
      error instanceof DatabaseError)
  );
}
```

---

## Using instanceof in Type Guards

### Basic instanceof Usage

```typescript
class UserService {}
class ProductService {}

function isUserService(service: unknown): service is UserService {
  return service instanceof UserService;
}

const service: unknown = new UserService();

if (isUserService(service)) {
  // service is narrowed to UserService
  service.getUser(); // ✓ OK
}
```

### instanceof with Error Classes

```typescript
// Standard Error types
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Type guard with instanceof
function isTypeError(error: unknown): error is TypeError {
  return error instanceof TypeError;
}

function isRangeError(error: unknown): error is RangeError {
  return error instanceof RangeError;
}
```

### Limitations of instanceof

**Problem:** instanceof doesn't work across different execution contexts (iframes, workers)

```typescript
// This might fail if error comes from different context
function isError(error: unknown): error is Error {
  return error instanceof Error; // Can return false for errors from iframes
}
```

**Solution:** Duck typing with property checks

```typescript
function isError(error: unknown): error is Error {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    'name' in error &&
    'stack' in error &&
    typeof (error as Error).message === 'string'
  );
}
```

### instanceof with Custom Prototypes

```typescript
interface ApiError {
  name: string;
  message: string;
  statusCode: number;
}

// Using prototype chain
class ApiErrorImpl extends Error implements ApiError {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiErrorImpl;
}
```

### instanceof Pattern Matching

```typescript
function handleRequest(error: unknown) {
  if (error instanceof ValidationError) {
    return { type: 'validation', field: error.field };
  }

  if (error instanceof NetworkError) {
    return { type: 'network', status: error.statusCode };
  }

  if (error instanceof DatabaseError) {
    return { type: 'database', query: error.query };
  }

  return { type: 'unknown' };
}
```

---

## Common Patterns for Error Handling

### Pattern 1: Discriminated Union Type Guards

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

function isError<T>(
  result: Result<T>
): result is { success: false; error: Error } {
  return result.success === false;
}

// Usage
const result = await fetchUser();

if (isSuccess(result)) {
  console.log(result.data.name);
} else {
  console.log(result.error.message);
}
```

### Pattern 2: Assertion Type Guards

```typescript
function assertIsError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw new Error(`Expected Error, got ${typeof error}`);
  }
}

try {
  // operation
} catch (error) {
  assertIsError(error);
  // error is now narrowed to Error
  console.log(error.message);
}
```

### Pattern 3: Generic Type Guard Factory

```typescript
function hasProperty<K extends PropertyKey>(
  key: K,
  value?: unknown
): <T>(obj: T) => obj is T & Record<K, typeof value> {
  return (obj): obj is T & Record<K, typeof value> => {
    return key in obj && (value === undefined || obj[key as keyof T] === value);
  };
}

// Usage
function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return hasProperty('code')(error);
}
```

### Pattern 4: Type Guard Combinators

```typescript
// AND combinator
function and<T, U>(
  guard1: (value: unknown) => value is T,
  guard2: (value: unknown) => value is U
): (value: unknown) => value is T & U {
  return (value): value is T & U => guard1(value) && guard2(value);
}

// OR combinator
function or<T, U>(
  guard1: (value: unknown) => value is T,
  guard2: (value: unknown) => value is U
): (value: unknown) => value is T | U {
  return (value): value is T | U => guard1(value) || guard2(value);
}

// NOT combinator
function not<T>(
  guard: (value: unknown) => value is T
): (value: unknown) => value is Exclude<unknown, T> {
  return (value): value is Exclude<unknown, T> => !guard(value);
}

// Usage
const isStringWithLength = and(
  isString,
  (val): val is string => val.length > 0
);
```

### Pattern 5: Error Handler with Type Guards

```typescript
type ErrorHandler = {
  canHandle: (error: unknown) => boolean;
  handle: (error: Error) => void;
};

class ErrorHandlerRegistry {
  private handlers: ErrorHandler[] = [];

  register(handler: ErrorHandler) {
    this.handlers.push(handler);
  }

  handle(error: unknown) {
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        handler.handle(error as Error);
        return;
      }
    }

    // Default handler
    console.error('Unhandled error:', error);
  }
}

// Usage
const registry = new ErrorHandlerRegistry();

registry.register({
  canHandle: (error): error is ValidationError =>
    error instanceof ValidationError,
  handle: error => console.log(`Validation failed for ${error.field}`),
});

registry.register({
  canHandle: (error): error is NetworkError => error instanceof NetworkError,
  handle: error => console.log(`Network error: ${error.statusCode}`),
});
```

### Pattern 6: Async Error Type Guards

```typescript
async function isNetworkErrorAsync(
  error: unknown
): Promise<error is NetworkError> {
  if (error instanceof Error && error.name === 'NetworkError') {
    // Additional async validation
    const response = await fetch('/api/validate-error');
    return response.ok;
  }
  return false;
}
```

### Pattern 7: Exhaustive Error Handling

```typescript
type AppError = ValidationError | NetworkError | DatabaseError;

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function handleError(error: AppError) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NetworkError) {
    // Handle network error
  } else if (error instanceof DatabaseError) {
    // Handle database error
  } else {
    // TypeScript ensures all cases are covered
    assertNever(error);
  }
}
```

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Using Type Assertions Instead of Type Guards

**❌ Bad:**

```typescript
catch (error) {
  const err = error as Error; // Unsafe assumption
  console.log(err.message); // Could crash at runtime
}
```

**✅ Good:**

```typescript
catch (error) {
  if (isError(error)) {
    console.log(error.message); // Safe
  }
}
```

### Pitfall 2: Type Guards That Don't Actually Check Types

**❌ Bad:**

```typescript
function isString(value: unknown): value is string {
  return true; // Always returns true - doesn't check!
}
```

**✅ Good:**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'; // Actual runtime check
}
```

### Pitfall 3: Forgetting to Check for null/undefined

**❌ Bad:**

```typescript
function isUser(obj: { name?: string }): obj is { name: string } {
  return obj.name !== undefined;
}
```

**✅ Good:**

```typescript
function isUser(obj: unknown): obj is { name: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as any).name === 'string'
  );
}
```

### Pitfall 4: Type Guards That Modify Values

**❌ Bad:**

```typescript
function normalizeAndCheck(value: unknown): value is string {
  if (typeof value === 'string') {
    value = value.trim(); // Modifying parameter
    return true;
  }
  return false;
}
```

**✅ Good:**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function normalize(value: string): string {
  return value.trim();
}
```

### Pitfall 5: Overly Complex Type Guards

**❌ Bad:**

```typescript
function isValidUser(value: unknown): value is User {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    'age' in value &&
    'address' in value &&
    'phone' in value &&
    'preferences' in value &&
    // ... 20 more checks
  );
}
```

**✅ Good:**

```typescript
function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.age === 'number' &&
    isAddress(obj.address) &&
    isPhone(obj.phone) &&
    isPreferences(obj.preferences)
  );
}
```

### Pitfall 6: Not Considering Prototype Chain Issues

**❌ Bad:**

```typescript
// Fails across iframe boundaries
function isError(error: unknown): error is Error {
  return error instanceof Error;
}
```

**✅ Good:**

```typescript
function isError(error: unknown): error is Error {
  return (
    error instanceof Error ||
    // Fallback for cross-frame errors
    (typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'stack' in error)
  );
}
```

### Pitfall 7: Type Guards in Array Methods

**❌ Bad:**

```typescript
// TypeScript doesn't narrow in filter callbacks
const strings = values.filter(isString);
// strings is still (string | number)[]

const numbers = values.filter(v => !isString(v));
// numbers is (string | number)[]
```

**✅ Good:**

```typescript
// Use type assertion after filter
const strings = values.filter(isString) as string[];

// Or use a custom type-safe filter
function filterBy<T>(
  arr: unknown[],
  guard: (value: unknown) => value is T
): T[] {
  return arr.filter(guard) as T[];
}

const strings = filterBy(values, isString); // string[]
```

### Pitfall 8: Forgetting to Handle Unknown Cases

**❌ Bad:**

```typescript
try {
  // operation
} catch (error) {
  if (isNetworkError(error)) {
    // handle network error
  }
  // What about other errors? They're silently ignored!
}
```

**✅ Good:**

```typescript
try {
  // operation
} catch (error) {
  if (isNetworkError(error)) {
    // handle network error
  } else if (isValidationError(error)) {
    // handle validation error
  } else {
    // Always have a fallback
    console.error('Unexpected error:', error);
    throw error; // Re-throw if you can't handle it
  }
}
```

### Pitfall 9: Type Guards with Side Effects

**❌ Bad:**

```typescript
function isUserWithLogging(value: unknown): value is User {
  console.log('Checking if user...'); // Side effect!
  return value instanceof User;
}
```

**✅ Good:**

```typescript
function isUser(value: unknown): value is User {
  return value instanceof User;
}

// Log separately
if (isUser(value)) {
  console.log('Found user:', value);
}
```

### Pitfall 10: Not Testing Type Guards

**❌ Bad:**

```typescript
// No tests - how do you know it works?
function isUser(value: unknown): value is User {
  return value instanceof User;
}
```

**✅ Good:**

```typescript
// Write tests for type guards
describe('isUser', () => {
  it('should return true for User instances', () => {
    const user = new User('John');
    expect(isUser(user)).toBe(true);
  });

  it('should return false for non-User objects', () => {
    expect(isUser({})).toBe(false);
    expect(isUser(null)).toBe(false);
    expect(isUser(undefined)).toBe(false);
  });
});
```

---

## Resources

### Official TypeScript Documentation

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript Handbook - Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [TypeScript Declaration Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#generics)

### Blog Posts and Tutorials

- [TypeScript Type Guards](https://mariusschulz.com/blog/typescript-2-0-type-guards) by Marius Schulz
- [Type Guards and Differentiating Types](https://basarat.gitbook.io/typescript/type-system/typeguard) by basarat
- [Advanced Type Guards in TypeScript](https://www.angulararchitects.io/aktuelles/advanced-type-guards-in-typescript/)
- [TypeScript Type Guard Patterns](https://dev.to/davemental/type-guards-and-type-predicates-in-typescript-4h42)
- [Error Handling in TypeScript](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)

### GitHub Examples

- [DefinitelyTyped - type-guards.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/type-guards/type-guards.d.ts)
- [TypeScript Compiler - type guards implementation](https://github.com/microsoft/TypeScript/search?q=type+guard)

### Books

- "Programming TypeScript" by Boris Cherny
- "Effective TypeScript" by Dan Vanderkam
- "Learning TypeScript" by Josh Goldberg

### Community Resources

- [TypeScript Community Discord](https://discord.gg/typescript)
- [Stack Overflow - Type Guards](https://stackoverflow.com/questions/tagged/typescript+type-guard)
- [Reddit - r/typescript](https://www.reddit.com/r/typescript/)

---

## Summary

### Key Takeaways

1. **Type guards use `value is Type` syntax** to tell TypeScript's compiler about runtime type checks
2. **Always validate types in catch blocks** - never assume unknown errors are Error instances
3. **Use `instanceof` for class hierarchies** but add property checks for robustness
4. **Write pure type guards** - avoid side effects and complex logic
5. **Test your type guards** - they're runtime code that needs verification
6. **Handle unknown cases** - always have a fallback for unrecognized types
7. **Combine type guards** - use combinators for complex type checking logic

### Best Practices Checklist

- [ ] Type guards return boolean and use type predicate syntax
- [ ] Runtime checks are thorough and accurate
- [ ] Type guards handle null/undefined appropriately
- [ ] No type assertions used instead of guards
- [ ] Type guards are pure functions (no side effects)
- [ ] All error cases are handled (exhaustive checking)
- [ ] Type guards are unit tested
- [ ] instanceof combined with property checks for robustness
- [ ] Cross-frame considerations for instanceof
- [ ] Documentation for custom type guards

---

_Last updated: January 2026_
_TypeScript Version: 5.x_
