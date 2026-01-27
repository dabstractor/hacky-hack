# TypeScript vs Python: Error Class Pattern Comparison

## Overview

This document provides a detailed comparison between the existing TypeScript error patterns in the PRP Pipeline and their Python equivalents, helping to maintain consistency across the codebase.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [TypeScript Implementation](#typescript-implementation)
3. [Python Implementation](#python-implementation)
4. [Feature Comparison Table](#feature-comparison-table)
5. [Translation Guide](#translation-guide)
6. [Key Differences and Gotchas](#key-differences-and-gotchas)

---

## Core Concepts

Both TypeScript and Python implementations share the same core concepts:

1. **Error Hierarchy**: Base abstract class with specialized subclasses
2. **Error Codes**: Type-safe constants for programmatic error handling
3. **Context Objects**: Structured debugging information
4. **Serialization**: Methods for converting errors to loggable dictionaries
5. **Type Guards**: Functions for type narrowing in catch blocks
6. **Exception Chaining**: Preserving original error information

---

## TypeScript Implementation

### Reference: `/home/dustin/projects/hacky-hack/src/utils/errors.ts`

#### Error Codes

```typescript
export const ErrorCodes = {
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  // ... more codes
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

#### Base Error Class

```typescript
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);

    // CRITICAL: Set prototype for instanceof to work correctly
    Object.setPrototypeOf(this, new.target.prototype);

    // CRITICAL: Capture stack trace (V8/Node.js only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // CRITICAL: Attach context properties directly to error instance
    if (context) {
      Object.assign(this, context);
    }

    // Store cause if provided
    if (cause) {
      (this as unknown as { cause?: Error }).cause = cause;
    }
  }

  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    if (this.context) {
      serialized.context = this.sanitizeContext(this.context);
    }

    if (this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }

  private sanitizeContext(
    context: PipelineErrorContext
  ): Record<string, unknown> {
    // Sensitive data sanitization logic
    // ...
  }
}
```

#### Specialized Error Class

```typescript
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}
```

#### Type Guard

```typescript
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}
```

#### Context Interface

```typescript
export interface PipelineErrorContext extends Record<string, unknown> {
  sessionPath?: string;
  taskId?: string;
  operation?: string;
  cause?: string;
  [key: string]: unknown;
}
```

---

## Python Implementation

#### Error Codes

```python
from enum import Enum

class ErrorCode(str, Enum):
    """Type-safe error codes for pipeline operations."""

    PIPELINE_SESSION_LOAD_FAILED = "PIPELINE_SESSION_LOAD_FAILED"
    PIPELINE_SESSION_SAVE_FAILED = "PIPELINE_SESSION_SAVE_FAILED"
    PIPELINE_TASK_EXECUTION_FAILED = "PIPELINE_TASK_EXECUTION_FAILED"
    # ... more codes
```

#### Base Error Class

```python
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

class PipelineError(ABC, Exception):
    """Abstract base error class for all pipeline operations."""

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        self.timestamp = datetime.utcnow()

        # Normalize context to ErrorContext
        if isinstance(context, ErrorContext):
            self.context = context
        elif isinstance(context, dict):
            self.context = ErrorContext(**context)
        elif context is None:
            self.context = ErrorContext()
        else:
            raise TypeError(
                f"context must be ErrorContext, dict, or None, got {type(context)}"
            )

        # Initialize base Exception with message
        super().__init__(message)

        # Copy context to instance for easy access
        for key, value in self.context.to_dict().items():
            setattr(self, key, value)

        # Store cause for exception chaining
        if cause is not None:
            self.__cause__ = cause

    @property
    @abstractmethod
    def code(self) -> str:
        """Error code - must be overridden by subclasses."""
        raise NotImplementedError("Subclasses must implement the 'code' property")

    def to_dict(self) -> dict[str, Any]:
        """Serialize error to dictionary for structured logging."""
        result: dict[str, Any] = {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "timestamp": self.timestamp.isoformat(),
        }

        if ctx_dict := self.context.to_dict():
            result["context"] = ctx_dict

        if self.__cause__ is not None:
            result["cause"] = {
                "name": self.__cause__.__class__.__name__,
                "message": str(self.__cause__),
            }

        return result

    def to_json(self) -> str:
        """Serialize error to JSON string."""
        return json.dumps(self.to_dict(), indent=2)
```

#### Specialized Error Class

```python
class SessionError(PipelineError):
    """Session management errors."""

    _default_code = ErrorCode.PIPELINE_SESSION_LOAD_FAILED

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
        code: str | None = None,
    ):
        self._code = code if code is not None else self._default_code
        super().__init__(message, context, cause)

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return self._code

    def is_load_error(self) -> bool:
        """Check if this is a session load error."""
        return self._code == ErrorCode.PIPELINE_SESSION_LOAD_FAILED
```

#### Type Guard

```python
from typing import TypeGuard

def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    """Type guard for SessionError."""
    return isinstance(error, SessionError)
```

#### Context Dataclass

```python
from dataclasses import dataclass, field

@dataclass
class ErrorContext:
    """Type-safe error context for debugging and logging."""

    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result: dict[str, Any] = {}
        for key in ["session_path", "task_id", "operation", "user_id"]:
            value = getattr(self, key)
            if value is not None:
                result[key] = value
        result.update(self.metadata)
        return result
```

---

## Feature Comparison Table

| Feature | TypeScript | Python | Notes |
|---------|-----------|--------|-------|
| **Error Codes** | `const` with `as const` | `Enum(str, Enum)` | Both provide type safety |
| **Code Type** | `typeof ErrorCodes[keyof typeof ErrorCodes]` | Enum value type | TypeScript: string literal union, Python: Enum |
| **Base Class** | `extends Error` | `extends Exception` | Both inherit from standard error type |
| **Abstract Property** | `abstract readonly code: ErrorCode` | `@property @abstractmethod def code(self)` | TypeScript uses class property, Python uses property decorator |
| **Context Type** | `interface extends Record<string, unknown>` | `dataclass` or `dict[str, Any]` | TypeScript: interface, Python: dataclass (more structured) |
| **Timestamp** | `new Date()` | `datetime.utcnow()` | Both use ISO 8601 format |
| **Prototype Setup** | `Object.setPrototypeOf(this, new.target.prototype)` | Automatic via `super()` | Python handles this automatically |
| **Stack Trace** | `Error.captureStackTrace(this, this.constructor)` | Automatic | Python preserves traceback automatically |
| **Context Access** | `Object.assign(this, context)` | Loop with `setattr(self, key, value)` | Both copy context to instance |
| **Exception Chaining** | `(this as unknown as { cause?: Error }).cause = cause` | `self.__cause__ = cause` | TypeScript: type assertion, Python: direct assignment |
| **Serialization** | `toJSON(): object` | `to_dict(): dict` | TypeScript returns object, Python returns dict |
| **Serialization Format** | Plain object (implicit JSON) | Dictionary (explicit JSON via `json.dumps()`) | Python requires explicit JSON conversion |
| **Sensitive Data** | Custom sanitization in `sanitizeContext()` | Can be added to `to_dict()` | TypeScript has built-in sanitization |
| **Type Guard** | `function isType(error: unknown): error is Type` | `def is_type(error: object) -> TypeGuard[Type]` | Both use type predicate syntax |
| **Type Guard Check** | `error instanceof Type` | `isinstance(error, Type)` | Different syntax, same semantics |
| **String Conversion** | Implicit via `message` property | Override `__str__()` method | TypeScript: automatic, Python: explicit |
| **Property Access** | `this.context` | `self.context` | Different syntax for property access |
| **Null/None Handling** | `context?: PipelineErrorContext` (optional) | `context: ErrorContext | dict | None` | TypeScript: optional property, Python: Union type |

---

## Translation Guide

### 1. Error Constants

**TypeScript:**
```typescript
export const ErrorCodes = {
  SESSION_LOAD_FAILED: 'SESSION_LOAD_FAILED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

**Python:**
```python
class ErrorCode(str, Enum):
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
```

**Why:**
- TypeScript uses `const` assertion for type-safe string literals
- Python uses `Enum` for type-safe constants with better IDE support

### 2. Abstract Base Class

**TypeScript:**
```typescript
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    // ...
  }
}
```

**Python:**
```python
class PipelineError(ABC, Exception):
    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        super().__init__(message)
        # ...

    @property
    @abstractmethod
    def code(self) -> str:
        raise NotImplementedError
```

**Why:**
- TypeScript: Abstract property using `abstract readonly`
- Python: Abstract property using `@property` and `@abstractmethod` decorators
- Python requires explicit call to `super().__init__(message)` to set the error message

### 3. Context Interface

**TypeScript:**
```typescript
export interface PipelineErrorContext extends Record<string, unknown> {
  sessionPath?: string;
  taskId?: string;
  operation?: string;
  [key: string]: unknown;
}
```

**Python:**
```python
@dataclass
class ErrorContext:
    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        # ...
```

**Why:**
- TypeScript: Interface with optional properties and index signature
- Python: Dataclass with typed fields and default values
- Python dataclasses provide better type safety and IDE autocomplete than plain dicts

### 4. Specialized Error Class

**TypeScript:**
```typescript
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}
```

**Python:**
```python
class SessionError(PipelineError):
    _default_code = ErrorCode.SESSION_LOAD_FAILED

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
        code: str | None = None,
    ):
        self._code = code if code is not None else self._default_code
        super().__init__(message, context, cause)

    @property
    def code(self) -> str:
        return self._code

    def is_load_error(self) -> bool:
        return self._code == ErrorCode.SESSION_LOAD_FAILED
```

**Why:**
- TypeScript: Direct property assignment with type inference
- Python: Private attribute `_code` with `@property` getter
- Python allows overriding code via constructor parameter (more flexible)

### 5. Type Guard

**TypeScript:**
```typescript
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}
```

**Python:**
```python
from typing import TypeGuard

def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    return isinstance(error, SessionError)
```

**Why:**
- TypeScript: `error is Type` as return type annotation
- Python: `TypeGuard[Type]` from typing module (Python 3.10+)
- Both enable type narrowing in catch blocks

### 6. Serialization

**TypeScript:**
```typescript
toJSON(): Record<string, unknown> {
  return {
    name: this.name,
    code: this.code,
    message: this.message,
    timestamp: this.timestamp.toISOString(),
    context: this.context,
  };
}
```

**Python:**
```python
def to_dict(self) -> dict[str, Any]:
    return {
        "name": self.__class__.__name__,
        "code": self.code,
        "message": str(self),
        "timestamp": self.timestamp.isoformat(),
        "context": self.context.to_dict() if self.context else {},
    }

def to_json(self) -> str:
    return json.dumps(self.to_dict(), indent=2)
```

**Why:**
- TypeScript: `toJSON()` returns plain object (implicitly JSON-serializable)
- Python: `to_dict()` returns dict, `to_json()` returns JSON string
- Python requires explicit JSON conversion via `json.dumps()`

### 7. Context Property Access

**TypeScript:**
```typescript
// In constructor
if (context) {
  Object.assign(this, context);
}

// Usage
const error = new SessionError("msg", { sessionPath: "/path" });
console.log(error.sessionPath);  // Direct access
```

**Python:**
```python
# In constructor
for key, value in self.context.to_dict().items():
    setattr(self, key, value)

# Usage
error = SessionError("msg", ErrorContext(session_path="/path"))
print(error.session_path)  # Direct access via setattr
```

**Why:**
- TypeScript: `Object.assign()` copies all properties to instance
- Python: Loop with `setattr()` achieves same result
- Both enable direct property access for convenience

### 8. Exception Chaining

**TypeScript:**
```typescript
// Store cause in constructor
if (cause) {
  (this as unknown as { cause?: Error }).cause = cause;
}

// Usage
try {
  operation();
} catch (e) {
  throw new SessionError("Failed", undefined, e);
}
```

**Python:**
```python
# Store cause in constructor
if cause is not None:
    self.__cause__ = cause

# Usage
try:
    operation()
except Exception as e:
    raise SessionError("Failed", cause=e) from e
```

**Why:**
- TypeScript: Type assertion to access `cause` property (ES2022+)
- Python: Direct assignment to `__cause__` attribute
- Python's `from e` syntax provides better traceback preservation

---

## Key Differences and Gotchas

### 1. Prototype Chain

**TypeScript:**
```typescript
// REQUIRED for instanceof to work
Object.setPrototypeOf(this, new.target.prototype);
```

**Python:**
```python
// AUTOMATIC - no need for manual setup
super().__init__(message)
```

**Gotcha:** Forgetting `Object.setPrototypeOf()` in TypeScript breaks `instanceof` checks. Python handles this automatically via `super()`.

### 2. Stack Trace Capture

**TypeScript:**
```typescript
// REQUIRED for proper stack traces in V8/Node.js
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, this.constructor);
}
```

**Python:**
```python
// AUTOMATIC - tracebacks are preserved automatically
// Use 'raise ... from e' to chain exceptions
```

**Gotcha:** TypeScript requires explicit stack trace capture. Python preserves tracebacks automatically with `raise ... from e`.

### 3. Property Names

**TypeScript:** camelCase (`sessionPath`, `taskId`)

**Python:** snake_case (`session_path`, `task_id`)

**Gotcha:** Follow language conventions. TypeScript uses JavaScript conventions, Python uses PEP 8.

### 4. Null vs None

**TypeScript:**
```typescript
context?: PipelineErrorContext  // undefined or null
if (context) { /* ... */ }
```

**Python:**
```python
context: ErrorContext | dict[str, Any] | None
if context is not None:  # Explicit None check
    # ...
```

**Gotcha:** Python's `if context:` treats empty containers as falsy. Use `is not None` for explicit checks.

### 5. Optional Properties

**TypeScript:**
```typescript
readonly context?: PipelineErrorContext;  // Optional property
```

**Python:**
```python
self.context: ErrorContext = context or ErrorContext()  # Default value
```

**Gotcha:** TypeScript optional properties can be `undefined`. Python uses default values or `None`.

### 6. String Conversion

**TypeScript:**
```typescript
// Automatic - uses message property
super().__init__(message);
```

**Python:**
```python
# May need explicit override
def __str__(self) -> str:
    return f"[{self.code}] {super().__str__()}"
```

**Gotcha:** Override `__str__()` in Python if you need custom string formatting beyond the base message.

### 7. Type System

**TypeScript:** Structural typing (duck typing with type annotations)

**Python:** Duck typing (runtime) + Type hints (static analysis)

**Gotcha:** TypeScript enforces types at compile time. Python relies on static type checkers (mypy, pyright) for type safety.

### 8. Enum Syntax

**TypeScript:**
```typescript
const ErrorCodes = {
  SESSION_LOAD_FAILED: 'SESSION_LOAD_FAILED',
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

**Python:**
```python
class ErrorCode(str, Enum):
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
```

**Gotcha:** TypeScript enums are less ergonomic than Python's `Enum`. Python's `Enum` provides better IDE support and type safety.

---

## Summary

Both TypeScript and Python implementations share the same core design principles:

1. **Type-safe error codes** for programmatic handling
2. **Structured context objects** for debugging
3. **Hierarchical error classes** for domain-specific errors
4. **Serialization methods** for structured logging
5. **Type guards** for type narrowing in catch blocks
6. **Exception chaining** to preserve original error information

The main differences are syntactic, reflecting each language's idioms and type system. When translating between the two:

- Use `Enum` for error codes in Python (TypeScript: `const` with `as const`)
- Use `dataclass` for context in Python (TypeScript: `interface`)
- Use `@property` decorator for abstract properties in Python (TypeScript: `abstract readonly`)
- Use `isinstance()` for type guards in Python (TypeScript: `instanceof`)
- Use `raise ... from e` for exception chaining in Python (TypeScript: `cause` property)
- Follow language conventions: camelCase in TypeScript, snake_case in Python
