# TypeScript Error Class Best Practices - Cheat Sheet

**Quick Reference for Creating BugfixSessionValidationError**

---

## Essential Template (Copy-Paste)

```typescript
export class BugfixSessionValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);

    // CRITICAL: Required for instanceof to work
    Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);

    // Better stack traces in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BugfixSessionValidationError);
    }

    this.name = 'BugfixSessionValidationError';

    // Chain error stacks
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      cause: this.cause
        ? { name: this.cause.name, message: this.cause.message }
        : undefined,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

// Type guard
export function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return error instanceof BugfixSessionValidationError;
}
```

---

## Critical Rules (Must Follow)

### 1. Always Call Object.setPrototypeOf()

```typescript
// ✓ CORRECT
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// ✗ WRONG - instanceof will fail in transpiled code
class CustomError extends Error {
  constructor(message: string) {
    super(message);
    // Missing Object.setPrototypeOf
  }
}
```

### 2. Always Set this.name

```typescript
// ✓ CORRECT
this.name = 'BugfixSessionValidationError';

// ✗ WRONG
// this.name not set - shows as "Error" in logs
```

### 3. Use Error.captureStackTrace (Node.js)

```typescript
// ✓ CORRECT
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, BugfixSessionValidationError);
}

// Optional but recommended for clean stack traces
```

### 4. Make Custom Properties readonly

```typescript
// ✓ CORRECT
constructor(
  public readonly code: string,
  public readonly context?: Record<string, unknown>
)

// ✗ WRONG
constructor(
  public code: string,  // Can be modified
  public context?: Record<string, unknown>  // Can be modified
)
```

### 5. Implement toJSON() for Logging

```typescript
// ✓ CORRECT
toJSON() {
  return {
    name: this.name,
    message: this.message,
    code: this.code,
    // ... other properties
  };
}

// ✗ WRONG
// No toJSON - error doesn't serialize properly for logging
```

---

## Error Code Patterns

### Naming Convention

```
[MODULE]_[CATEGORY]_[SPECIFIC_ERROR]
```

### Examples

```typescript
enum BugfixSessionErrorCode {
  // Module: BUGFIX, Category: SESSION
  INVALID_PATH = 'BUGFIX_SESSION_INVALID_PATH',
  MISSING_FIELD = 'BUGFIX_SESSION_MISSING_FIELD',
  INVALID_JSON = 'BUGFIX_SESSION_INVALID_JSON',
  VALIDATION_FAILED = 'BUGFIX_SESSION_VALIDATION_FAILED',
  FILE_NOT_FOUND = 'BUGFIX_SESSION_FILE_NOT_FOUND',
}
```

### Usage

```typescript
throw new BugfixSessionValidationError(
  'Session file not found',
  BugfixSessionErrorCode.FILE_NOT_FOUND,
  { filePath: '/path/to/file' }
);
```

---

## Type Guard Patterns

### Basic Type Guard

```typescript
function isBugfixSessionValidationError(
  error: unknown
): error is BugfixSessionValidationError {
  return error instanceof BugfixSessionValidationError;
}
```

### Error Code Type Guard

```typescript
function hasErrorCode(
  error: unknown,
  code: string
): error is BugfixSessionValidationError {
  return isBugfixSessionValidationError(error) && error.code === code;
}
```

### Usage

```typescript
try {
  // ... code that throws
} catch (error) {
  if (isBugfixSessionValidationError(error)) {
    // TypeScript knows error is BugfixSessionValidationError
    console.error(error.code);
    console.error(error.context);

    if (hasErrorCode(error, 'BUGFIX_SESSION_FILE_NOT_FOUND')) {
      // Handle specifically
    }
  }
}
```

---

## Common Patterns

### File Not Found

```typescript
if (!fs.existsSync(filePath)) {
  throw new BugfixSessionValidationError(
    `Session file not found: ${filePath}`,
    'BUGFIX_SESSION_FILE_NOT_FOUND',
    { filePath }
  );
}
```

### Invalid JSON

```typescript
try {
  JSON.parse(fileContent);
} catch (parseError) {
  throw new BugfixSessionValidationError(
    'Invalid JSON in session file',
    'BUGFIX_SESSION_INVALID_JSON',
    { filePath },
    parseError as Error // Include cause
  );
}
```

### Missing Required Field

```typescript
if (!session.sessionId) {
  throw new BugfixSessionValidationError(
    'Required field "sessionId" is missing',
    'BUGFIX_SESSION_MISSING_FIELD',
    { filePath, field: 'sessionId', value: undefined }
  );
}
```

### Type Validation

```typescript
if (typeof session.steps !== 'number') {
  throw new BugfixSessionValidationError(
    `Expected "steps" to be number, got ${typeof session.steps}`,
    'BUGFIX_SESSION_INVALID_TYPE',
    {
      filePath,
      field: 'steps',
      expectedType: 'number',
      actualType: typeof session.steps,
    }
  );
}
```

### Multiple Validation Errors

```typescript
const errors: ValidationErrorItem[] = [
  { field: 'sessionId', message: 'Required', value: undefined },
  { field: 'filePath', message: 'Invalid path', value: '???' },
];

throw new BugfixSessionValidationError(
  `Validation failed with ${errors.length} error(s)`,
  'BUGFIX_SESSION_VALIDATION_FAILED',
  {
    filePath,
    validationErrors: errors,
    errorCount: errors.length,
  }
);
```

---

## Testing Checklist

### Must Test

```typescript
describe('BugfixSessionValidationError', () => {
  // ✓ Test basic construction
  it('should create error with message and code');

  // ✓ Test prototype chain
  it('should be instanceof Error');
  it('should be instanceof BugfixSessionValidationError');
  it('should maintain instanceof after throw/catch');

  // ✓ Test serialization
  it('should serialize to JSON');
  it('should include stack in development only');

  // ✓ Test type guards
  it('should identify BugfixSessionValidationError');
  it('should narrow type correctly');

  // ✓ Test error cause
  it('should chain error stacks');
  it('should include cause in toJSON()');
});
```

---

## Quick Reference: What to Include vs Exclude

### ✓ Include in Context

- File paths (not contents)
- Field names
- Type information
- Validation rule names
- Expected vs actual values
- Session IDs (non-sensitive identifiers)

### ✗ Exclude from Context

- Passwords
- API keys
- Tokens
- File contents
- Personal data (PII)
- Database connection strings
- Internal secrets

---

## Common Pitfalls

### Problem: instanceof Returns False

```typescript
// Cause: Missing Object.setPrototypeOf()
// Fix:
Object.setPrototypeOf(this, BugfixSessionValidationError.prototype);
```

### Problem: Stack Trace is Ugly

```typescript
// Cause: Not using Error.captureStackTrace()
// Fix:
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, BugfixSessionValidationError);
}
```

### Problem: Error Shows as "Error" in Logs

```typescript
// Cause: Not setting this.name
// Fix:
this.name = 'BugfixSessionValidationError';
```

### Problem: Can't Serialize Error

```typescript
// Cause: Not implementing toJSON()
// Fix:
toJSON() {
  return { /* plain object */ };
}
```

### Problem: Type Assertions Needed Everywhere

```typescript
// Cause: Not using type guards
// Fix:
if (isBugfixSessionValidationError(error)) {
  // TypeScript knows the type
}
```

---

## tsconfig.json Requirements

```json
{
  "compilerOptions": {
    "target": "ES2015", // or higher (ES2016, ES2018, ES2020, etc.)
    "lib": ["ES2015"]
  }
}
```

**Why:** ES5 target breaks Error prototype chain. ES2015+ works correctly.

---

## Environment-Specific Behavior

### Development (NODE_ENV=development)

```typescript
{
  name: 'BugfixSessionValidationError',
  message: 'Validation failed',
  code: 'VALIDATION_ERROR',
  context: { /* ... */ },
  stack: 'BugfixSessionValidationError: ...',  // ✓ Included
}
```

### Production (NODE_ENV=production)

```typescript
{
  name: 'BugfixSessionValidationError',
  message: 'Validation failed',
  code: 'VALIDATION_ERROR',
  context: { /* ... */ },
  stack: undefined,  // ✗ Excluded for security
}
```

---

## Quick Usage Examples

### Throwing

```typescript
throw new BugfixSessionValidationError(
  'Session validation failed',
  'VALIDATION_ERROR',
  { filePath: '/path/to/session.json' }
);
```

### Catching

```typescript
try {
  validateSession(session);
} catch (error) {
  if (isBugfixSessionValidationError(error)) {
    logger.error('Validation failed', error.toJSON());
  }
}
```

### Logging

```typescript
// Structured logging
logger.error({
  error: error.toJSON(),
  timestamp: new Date().toISOString(),
});

// Console logging
console.error(error);
console.error(JSON.stringify(error, null, 2));
```

---

## Key Takeaways (5 Critical Points)

1. **Always use `Object.setPrototypeOf()`** - Required for instanceof
2. **Always set `this.name`** - For proper error identification
3. **Implement `toJSON()`** - For structured logging
4. **Create type guards** - For type-safe error handling
5. **Use error codes** - For programmatic error handling

---

**Version:** 1.0
**Last Updated:** 2026-01-26
