# TypeScript/Node.js Best Practices for Validation Guards

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - TypeScript best practices for validation
**Goal:** Document best practices for environment variable validation and error handling

---

## 1. Recommended Pattern for P1M3T2S1

Based on research and codebase patterns, here's the recommended implementation:

```typescript
// Void return guard function - simplest pattern
export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  if (!existingPid) {
    return; // No pipeline running - allow execution
  }

  // Check for legitimate bug fix recursion
  if (
    process.env.SKIP_BUG_FINDING === 'true' && // EXACT string match
    sessionPath.toLowerCase().includes('bugfix') // Case-insensitive check
  ) {
    return; // Legitimate recursion - allow execution
  }

  // Illegitimate nested execution - throw error
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid: process.pid.toString(),
      sessionPath,
    }
  );
}
```

### Key Design Decisions

1. **Void return** - Follows existing validation pattern (validateBugfixSession)
2. **Exact string matching** for `SKIP_BUG_FINDING === 'true'` - prevents 'TRUE', '1', 'yes'
3. **Case-insensitive check** for 'bugfix' - catches 'BugFix', 'BUGFIX'
4. **Custom error class** extending `PipelineError` - consistent error hierarchy
5. **Context object** with PIDs and session path - debugging information

---

## 2. Environment Variable Validation Best Practices

### Exact String Matching (Critical)

```typescript
// ✅ CORRECT: Exact string match
if (process.env.SKIP_BUG_FINDING === 'true') {
  // Handle bug fix mode
}

// ❌ WRONG: Truthy check fails on 'false', '0', etc.
if (process.env.SKIP_BUG_FINDING) {
  // This is WRONG
}

// ❌ WRONG: Case-sensitive check misses 'True', 'TRUE'
if (process.env.SKIP_BUG_FINDING?.toLowerCase() === 'true') {
  // Unnecessary complexity - contract says exact 'true'
}
```

### Case-Insensitive Path Contains Check

```typescript
// ✅ CORRECT: Case-insensitive check
if (sessionPath.toLowerCase().includes('bugfix')) {
  // Handles 'bugfix', 'BugFix', 'BUGFIX'
}

// ❌ WRONG: Case-sensitive check
if (sessionPath.includes('bugfix')) {
  // Misses 'BugFix', 'BUGFIX'
}
```

### Undefined Check Pattern

```typescript
// ✅ CORRECT: Check for undefined/empty
if (!process.env.PRP_PIPELINE_RUNNING) {
  // No pipeline running
}

// Equivalent to:
if (
  process.env.PRP_PIPELINE_RUNNING === undefined ||
  process.env.PRP_PIPELINE_RUNNING === null ||
  process.env.PRP_PIPELINE_RUNNING === ''
) {
  // No pipeline running
}
```

---

## 3. Error Class Design Pattern

### Custom Error Extending PipelineError

```typescript
import { PipelineError, ErrorCodes } from './errors.js';

export class NestedExecutionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_NESTED_EXECUTION;

  constructor(
    message: string,
    context?: PipelineErrorContext & {
      existingPid?: string;
      currentPid?: string;
      sessionPath?: string;
    },
    cause?: Error
  ) {
    super(message, context, cause);
    // CRITICAL: Set prototype for instanceof checks
    Object.setPrototypeOf(this, NestedExecutionError.prototype);
  }
}
```

### Type Guard for Error Handling

```typescript
export function isNestedExecutionError(
  error: unknown
): error is NestedExecutionError {
  return error instanceof NestedExecutionError;
}
```

---

## 4. TypeScript process.env Typing

### Global Interface Extension

```typescript
// global.d.ts or in module file
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PRP_PIPELINE_RUNNING?: string;
      SKIP_BUG_FINDING?: 'true' | undefined;
    }
  }
}

export {};
```

### Type-Safe Getter Pattern

```typescript
function getExecutionGuard(): {
  existingPid: string | undefined;
  isBugfixRecursion: boolean;
} {
  return {
    existingPid: process.env.PRP_PIPELINE_RUNNING,
    isBugfixRecursion: process.env.SKIP_BUG_FINDING === 'true',
  };
}
```

---

## 5. Guard Function Patterns Comparison

### Void Return (Recommended for P1M3T2S1)

```typescript
function validateNestedExecution(sessionPath: string): void {
  if (shouldBlock()) {
    throw new NestedExecutionError(/* ... */);
  }
  // Success: implicit return
}
```

**Pros:** Simple, follows existing pattern, clear intent
**Cons:** Less flexible for error handling

### Type Guard Pattern

```typescript
function isNestedExecutionDetected(sessionPath: string): boolean {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;
  if (!existingPid) return false;

  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.toLowerCase().includes('bugfix');

  return !isBugfixRecursion;
}
```

**Pros:** More flexible, can be used in conditionals
**Cons:** Doesn't follow existing validation pattern

### Assertion Function Pattern

```typescript
function assertNotNestedExecution(sessionPath: string): asserts void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;
  if (!existingPid) return;

  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' &&
    sessionPath.toLowerCase().includes('bugfix');

  if (!isBugfixRecursion) {
    throw new NestedExecutionError(/* ... */);
  }
}
```

**Pros:** Type narrowing, explicit assertion
**Cons:** More complex than needed

---

## 6. Best Practices Summary

### For Environment Variable Validation

✅ Use **exact string matching** for boolean-like variables
✅ Use **case-insensitive checks** for path substrings
✅ **Validate at entry point** - fail fast
✅ **Clear error messages** - include context (PIDs, session path)
✅ **Type-safe access** - use TypeScript features

### For Error Classes

✅ **Always set prototype chain** for instanceof checks
✅ **Use abstract base classes** for related errors
✅ **Include context information** for debugging
✅ **Add error codes** for programmatic handling

### For Guard Functions

✅ **Use void return** for simple validation (recommended)
✅ **Throw specific errors** with context
✅ **Document behavior** clearly
✅ **Add type guards** for error handling

---

## 7. Authoritative Sources

### TypeScript Documentation

- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Assertion Functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-signatures)
- [Error Handling](https://www.typescriptlang.org/docs/handbook/2/classes.html#inheritance)

### Node.js Documentation

- [Process API](https://nodejs.org/api/process.html#processenv)
- [Error Handling](https://nodejs.org/api/errors.html)

### Security Standards

- [OWASP Configuration](https://owasp.org/www-project-application-security-verification-standard/)
- [12-Factor App Config](https://12factor.net/config)

---

## Summary

For P1M3T2S1, the recommended approach is:

1. **Void return guard function** - simplest pattern, follows existing codebase
2. **Custom error class** extending `PipelineError`
3. **Exact string matching** for `SKIP_BUG_FINDING === 'true'`
4. **Case-insensitive check** for `sessionPath.toLowerCase().includes('bugfix')`
5. **Type guard** for error handling in catch blocks
6. **Clear error messages** with context (existingPid, currentPid, sessionPath)

This aligns perfectly with the existing codebase patterns and PRD requirements.
