# Python Custom Error Class Best Practices

## Overview

This document compiles authoritative best practices for creating custom error classes in Python, with a focus on patterns that include error codes and are suitable for production systems.

## Table of Contents

1. [Basic Patterns](#basic-patterns)
2. [Error Code Integration](#error-code-integration)
3. [Proper Exception Inheritance](#proper-exception-inheritance)
4. [Error Message Formatting](#error-message-formatting)
5. [Common Gotchas](#common-gotchas)
6. [Production-Ready Examples](#production-ready-examples)
7. [Comparison with TypeScript Patterns](#comparison-with-typescript-patterns)

---

## Basic Patterns

### Minimal Custom Exception

```python
class CustomError(Exception):
    """Base exception for custom application errors."""
    pass
```

**Best Practice:** Always inherit from `Exception`, not `BaseException`. The latter is reserved for system-level exceptions like `KeyboardInterrupt` and `SystemExit`.

### Exception with Custom Message

```python
class ValidationError(Exception):
    """Raised when validation fails."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

    def __str__(self) -> str:
        return self.message
```

**Best Practice:** Always call `super().__init__()` to ensure proper initialization of the base Exception class.

---

## Error Code Integration

### Pattern 1: Class-Level Error Codes

```python
class APIError(Exception):
    """API-related errors with numeric codes."""

    # Error codes as class attributes
    INVALID_REQUEST = 1001
    NOT_FOUND = 1002
    PERMISSION_DENIED = 1003
    SERVER_ERROR = 1004

    def __init__(self, message: str, code: int | None = None):
        self.code = code if code is not None else self.INVALID_REQUEST
        super().__init__(f"[{self.code}] {message}")
```

**Usage:**

```python
raise APIError("Resource not found", APIError.NOT_FOUND)
```

### Pattern 2: Enum-Based Error Codes (Recommended)

```python
from enum import Enum

class ErrorCode(str, Enum):
    """String error codes for type safety."""

    INVALID_REQUEST = "ERR_INVALID_REQUEST"
    NOT_FOUND = "ERR_NOT_FOUND"
    PERMISSION_DENIED = "ERR_PERMISSION_DENIED"
    SERVER_ERROR = "ERR_SERVER_ERROR"

    @classmethod
    def all(cls) -> set[str]:
        """Return all error codes as a set."""
        return {member.value for member in cls}


class BusinessError(Exception):
    """Base business logic error."""

    def __init__(
        self,
        message: str,
        code: ErrorCode = ErrorCode.INVALID_REQUEST,
        context: dict[str, object] | None = None
    ):
        self.code = code
        self.context = context or {}
        super().__init__(message)

    def __str__(self) -> str:
        msg = f"[{self.code.value}] {super().__str__()}"
        if self.context:
            msg += f" | Context: {self.context}"
        return msg
```

**Usage:**

```python
raise BusinessError(
    "User not found",
    ErrorCode.NOT_FOUND,
    {"user_id": 123, "operation": "get_profile"}
)
```

### Pattern 3: Hierarchical Error Codes

```python
class ErrorDomain:
    """Error code domains with hierarchical structure."""

    SESSION = "SESSION"
    TASK = "TASK"
    VALIDATION = "VALIDATION"
    AGENT = "AGENT"


def make_error_code(domain: str, action: str, outcome: str) -> str:
    """Create hierarchical error code: DOMAIN_ACTION_OUTCOME."""
    return f"{domain}_{action}_{outcome}"


class PipelineError(Exception):
    """Base pipeline error with hierarchical codes."""

    def __init__(self, message: str, code: str, **context):
        self.code = code
        self.context = context
        super().__init__(message)
```

**Usage:**

```python
code = make_error_code(ErrorDomain.SESSION, "LOAD", "FAILED")
raise PipelineError("Failed to load session", code, session_path="/path/to/session")
```

---

## Proper Exception Inheritance

### Exception Hierarchy

```python
class AppError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, **context):
        self.context = context
        super().__init__(message)
        # Copy context to instance for easy access
        for key, value in context.items():
            setattr(self, key, value)


class DataError(AppError):
    """Data-related errors."""
    pass


class ValidationError(AppError):
    """Validation-related errors."""
    pass


class NetworkError(AppError):
    """Network-related errors."""
    pass
```

**Best Practice:** Create a hierarchy that matches your domain logic, not just error semantics.

### Abstract Base Class Pattern

```python
from abc import ABC

class PipelineError(ABC, Exception):
    """Abstract base for pipeline errors."""

    @property
    def code(self) -> str:
        """Error code - must be overridden by subclasses."""
        raise NotImplementedError("Subclasses must define 'code' property")

    def __init__(self, message: str, context: dict[str, object] | None = None):
        self.context = context or {}
        super().__init__(message)

    def to_dict(self) -> dict[str, object]:
        """Serialize error for logging."""
        return {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "context": self.context,
        }


class SessionError(PipelineError):
    """Session management errors."""

    @property
    def code(self) -> str:
        return "SESSION_LOAD_FAILED"
```

**Best Practice:** Use abstract base classes to enforce interface contracts across error subclasses.

---

## Error Message Formatting

### Format String Best Practices

```python
class ConfigurationError(Exception):
    """Configuration-related errors."""

    def __init__(self, key: str, expected_type: type, actual_value: object):
        self.key = key
        self.expected_type = expected_type
        self.actual_value = actual_value
        self.actual_type = type(actual_value)

        message = (
            f"Configuration error for key '{key}': "
            f"expected type {expected_type.__name__}, "
            f"got {self.actual_type.__name__} (value: {actual_value!r})"
        )
        super().__init__(message)
```

**Best Practice:**

- Use f-strings (Python 3.6+) for formatting
- Use `!r` conversion for values that might contain spaces or be ambiguous
- Include all relevant context in the message for debugging

### Lazy Message Formatting

```python
class DatabaseError(Exception):
    """Database operation errors."""

    def __init__(self, operation: str, table: str, cause: Exception | None = None):
        self.operation = operation
        self.table = table
        self.cause = cause

        parts = [f"Database {operation} failed on table '{table}'"]
        if cause:
            parts.append(f"caused by: {cause}")
        super().__init__(": ".join(parts))
```

**Best Practice:** Build messages progressively when you have optional components.

---

## Common Gotchas

### Gotcha 1: Forgetting `super().__init__()`

```python
# BAD: Missing super call
class BadError(Exception):
    def __init__(self, message: str):
        self.message = message
        # Doesn't set base Exception message!

# GOOD: Call super().__init__()
class GoodError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
```

**Impact:** Without `super().__init__()`, `str(error)` returns empty string and stack traces are incomplete.

### Gotcha 2: Mutable Default Arguments

```python
# BAD: Mutable default argument
class BadError(Exception):
    def __init__(self, message: str, details: list = []):
        self.details = details

# GOOD: Use None as default
class GoodError(Exception):
    def __init__(self, message: str, details: list | None = None):
        self.details = details if details is not None else []
```

**Impact:** Mutable defaults are shared across all instances, causing data corruption.

### Gotcha 3: Breaking Exception Chaining

```python
# BAD: Loses original traceback
try:
    risky_operation()
except ValueError as e:
    raise MyCustomError("Something went wrong")

# GOOD: Preserves original traceback
try:
    risky_operation()
except ValueError as e:
    raise MyCustomError("Something went wrong") from e
```

**Best Practice:** Use `raise ... from e` to preserve the original exception's traceback.

### Gotcha 4: Not Supporting Pickling

```python
# BAD: Exceptions with unpicklable state
class BadError(Exception):
    def __init__(self, message: str, callback: Callable):
        self.callback = callback
        super().__init__(message)

# GOOD: Keep picklable state only
class GoodError(Exception):
    def __init__(self, message: str, context: dict):
        self.context = context
        super().__init__(message)
```

**Impact:** Unpicklable exceptions break multiprocessing and task queue systems like Celery.

### Gotcha 5: Shadowing Built-in Exception Names

```python
# BAD: Shadows built-in ValueError
class ValueError(Exception):  # Don't do this!
    pass

# GOOD: Use descriptive, domain-specific names
class ValidationError(Exception):  # Much better!
    pass
```

**Impact:** Shadowing built-in names makes code confusing and can break isinstance checks.

### Gotcha 6: Incorrect `__reduce__` Implementation

```python
# If you override __reduce__ for custom pickling, you must be careful
class CustomError(Exception):
    def __init__(self, message: str, metadata: dict):
        self.message = message
        self.metadata = metadata
        super().__init__(message)

    def __reduce__(self):
        # Return: (callable, args)
        return (self.__class__, (self.message, self.metadata))
```

**Best Practice:** Only override `__reduce__` if you need custom pickling behavior.

---

## Production-Ready Examples

### Example 1: Full-Featured Error Class

```python
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any
from datetime import datetime


@dataclass
class ErrorContext:
    """Type-safe error context."""

    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for logging."""
        return {
            "session_path": self.session_path,
            "task_id": self.task_id,
            "operation": self.operation,
            "user_id": self.user_id,
            **self.metadata,
        }


class PipelineError(Exception):
    """Production-ready pipeline error."""

    def __init__(
        self,
        message: str,
        code: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        self.code = code
        self.timestamp = datetime.utcnow()

        # Normalize context to ErrorContext
        if isinstance(context, ErrorContext):
            self.context = context
        elif context is None:
            self.context = ErrorContext()
        else:
            self.context = ErrorContext(**context)

        # Build rich message
        self.message = self._build_message(message)

        # Initialize base Exception
        super().__init__(self.message)

        # Store cause for exception chaining
        self.__cause__ = cause

    def _build_message(self, message: str) -> str:
        """Build rich error message."""
        parts = [f"[{self.code}] {message}"]
        if ctx := self.context.to_dict():
            parts.append(f"Context: {ctx}")
        return " | ".join(parts)

    def to_dict(self) -> dict[str, Any]:
        """Serialize for structured logging."""
        result = {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "context": self.context.to_dict(),
        }
        if self.__cause__:
            result["cause"] = {
                "name": self.__cause__.__class__.__name__,
                "message": str(self.__cause__),
            }
        return result

    def __str__(self) -> str:
        return self.message


class SessionError(PipelineError):
    """Session management errors."""

    LOAD_FAILED = "SESSION_LOAD_FAILED"
    SAVE_FAILED = "SESSION_SAVE_FAILED"
    NOT_FOUND = "SESSION_NOT_FOUND"

    def __init__(
        self,
        message: str,
        code: str = LOAD_FAILED,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        super().__init__(message, code, context, cause)
```

**Usage:**

```python
ctx = ErrorContext(
    session_path="/path/to/session",
    task_id="P1.M1.T1",
    operation="load_session"
)
raise SessionError("Failed to load session", SessionError.LOAD_FAILED, ctx)
```

### Example 2: Type Guards (Python 3.10+)

```python
from typing import TypeGuard

def is_session_error(error: BaseException | None) -> TypeGuard[SessionError]:
    """Type guard for SessionError."""
    return isinstance(error, SessionError)

def is_pipeline_error(error: BaseException | None) -> TypeGuard[PipelineError]:
    """Type guard for PipelineError."""
    return isinstance(error, PipelineError)


# Usage
try:
    operation()
except Exception as e:
    if is_session_error(e):
        # e is narrowed to SessionError
        logger.error(e.to_dict())
        if e.code == SessionError.NOT_FOUND:
            # Handle not found
            pass
```

---

## Comparison with TypeScript Patterns

### Similarities

| Pattern         | Python                       | TypeScript                        |
| --------------- | ---------------------------- | --------------------------------- |
| Error codes     | Class attributes or Enum     | const assertion object            |
| Context objects | dict or dataclass            | Interface extending Record        |
| Inheritance     | class CustomError(Exception) | class CustomError extends Error   |
| Type guards     | isinstance() checks          | user-defined type guard functions |
| Serialization   | to_dict() method             | toJSON() method                   |

### Key Differences

1. **Type Safety:** TypeScript requires type assertions for custom errors; Python uses duck typing with optional type hints.
2. **Prototype Chain:** TypeScript needs explicit `Object.setPrototypeOf()`; Python's `super()` handles this automatically.
3. **Stack Traces:** Python preserves tracebacks automatically with `raise ... from`; TypeScript needs `Error.captureStackTrace`.
4. **Serialization:** Python's `to_dict()` returns dictionary; TypeScript's `toJSON()` returns plain object.
5. **Context Access:** TypeScript uses `Object.assign(this, context)`; Python can use `setattr` in a loop or dataclasses.

---

## Actionable Recommendations for This PRP

Based on the existing TypeScript error patterns in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`, here are Python equivalents:

### 1. Error Code Constants

**TypeScript:**

```typescript
export const ErrorCodes = {
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  // ...
} as const;
```

**Python:**

```python
from enum import Enum

class ErrorCode(str, Enum):
    PIPELINE_SESSION_LOAD_FAILED = "PIPELINE_SESSION_LOAD_FAILED"
    PIPELINE_SESSION_SAVE_FAILED = "PIPELINE_SESSION_SAVE_FAILED"
    # ...
```

### 2. Base Error Class

**TypeScript:**

```typescript
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;
  // ...
}
```

**Python:**

```python
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

class PipelineError(ABC, Exception):
    @property
    @abstractmethod
    def code(self) -> str:
        """Must be overridden by subclasses."""
        ...

    def __init__(self, message: str, context: dict[str, Any] | None = None):
        self.context = context or {}
        self.timestamp = datetime.utcnow()
        super().__init__(message)

        # Copy context to instance for easy access
        for key, value in self.context.items():
            setattr(self, key, value)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "timestamp": self.timestamp.isoformat(),
            "context": self.context,
        }
```

### 3. Specialized Error Classes

**TypeScript:**

```typescript
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  // ...
}
```

**Python:**

```python
class SessionError(PipelineError):
    """Session management errors."""

    LOAD_FAILED = "PIPELINE_SESSION_LOAD_FAILED"
    SAVE_FAILED = "PIPELINE_SESSION_SAVE_FAILED"

    def __init__(
        self,
        message: str,
        code: str = LOAD_FAILED,
        context: dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        self._code = code
        super().__init__(message, context)
        if cause:
            self.__cause__ = cause

    @property
    def code(self) -> str:
        return self._code
```

### 4. Type Guards

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

---

## Sources and References

While web search was unavailable at the time of research, this compilation is based on:

1. **Python Official Documentation**
   - Exception hierarchy and built-in exceptions
   - Exception handling best practices
   - `raise` statement documentation

2. **PEP 8 -- Style Guide for Python Code**
   - Naming conventions for exception classes
   - Docstring conventions

3. **Type Annotations Best Practices (PEP 484, PEP 585)**
   - Type hints for exception handling
   - Type guard patterns (Python 3.10+)

4. **Community Best Practices**
   - Real-world patterns from major Python frameworks (Django, Flask, FastAPI)
   - Common patterns in production Python codebases

5. **Existing Codebase Patterns**
   - `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (TypeScript reference implementation)
   - Architecture documentation in `plan/003_b3d3efdaf0ed/docs/`

---

## Summary Checklist

When creating custom error classes in Python:

- [ ] Always inherit from `Exception` (not `BaseException`)
- [ ] Always call `super().__init__(message)` with the message
- [ ] Use `Enum` for type-safe error codes
- [ ] Store context in a `dict` or dataclass
- [ ] Implement `__str__()` for user-friendly messages
- [ ] Implement `to_dict()` for structured logging
- [ ] Use `raise ... from e` for exception chaining
- [ ] Avoid mutable default arguments
- [ ] Keep state picklable for multiprocessing
- [ ] Use descriptive names ending in "Error"
- [ ] Document when/why the exception is raised
- [ ] Create an exception hierarchy for your domain
- [ ] Add type hints for better IDE support
- [ ] Consider type guards for complex error handling
