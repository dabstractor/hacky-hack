# Quick Reference: Python Error Class Patterns

## TL;DR - Recommended Pattern

```python
from enum import Enum
from typing import Any
from datetime import datetime

class ErrorCode(str, Enum):
    """Type-safe error codes."""
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
    SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED"
    TASK_EXECUTION_FAILED = "TASK_EXECUTION_FAILED"

class PipelineError(Exception):
    """Base error class for pipeline operations."""

    def __init__(
        self,
        message: str,
        code: str,
        context: dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        self.code = code
        self.context = context or {}
        self.timestamp = datetime.utcnow()
        super().__init__(message)

        # Copy context to instance for easy access
        for key, value in self.context.items():
            setattr(self, key, value)

        # Store cause for exception chaining
        if cause:
            self.__cause__ = cause

    def to_dict(self) -> dict[str, Any]:
        """Serialize for structured logging."""
        return {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "timestamp": self.timestamp.isoformat(),
            "context": self.context,
        }

class SessionError(PipelineError):
    """Session management errors."""

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.SESSION_LOAD_FAILED,
        context: dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        super().__init__(message, code, context, cause)
```

## Usage Examples

### Basic Usage

```python
# Simple error
raise SessionError("Failed to load session")

# Error with context
raise SessionError(
    "Failed to load session",
    ErrorCode.SESSION_LOAD_FAILED,
    {"session_path": "/path/to/session", "task_id": "P1.M1.T1"}
)

# Error with cause
try:
    load_session()
except FileNotFoundError as e:
    raise SessionError(
        "Session file not found",
        ErrorCode.SESSION_LOAD_FAILED,
        {"session_path": path},
        cause=e
    )
```

### Type Guards (Python 3.10+)

```python
from typing import TypeGuard

def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    """Type guard for SessionError."""
    return isinstance(error, SessionError)

try:
    operation()
except Exception as e:
    if is_session_error(e):
        # e is narrowed to SessionError
        logger.error(e.to_dict())
        if e.session_path:
            cleanup_session(e.session_path)
```

### Structured Logging

```python
import logging
import json

logger = logging.getLogger(__name__)

try:
    operation()
except PipelineError as e:
    logger.error(
        "Pipeline error occurred",
        extra={"error_dict": e.to_dict()}
    )

# Or with JSON logger
try:
    operation()
except PipelineError as e:
    logger.error(json.dumps(e.to_dict()))
```

## Common Gotchas (Quick Reference)

| Gotcha | Bad | Good |
|--------|-----|------|
| Missing super() | `self.message = message` | `super().__init__(message)` |
| Mutable defaults | `def __init__(self, ctx={})` | `def __init__(self, ctx=None); self.ctx = ctx or {}` |
| Lost traceback | `raise CustomError("msg")` | `raise CustomError("msg") from e` |
| Wrong inheritance | `class E(BaseException)` | `class E(Exception)` |
| Shadow built-ins | `class ValueError(Exception)` | `class ValidationError(Exception)` |

## Error Code Patterns

### Pattern 1: Class Attributes (Simple)

```python
class APIError(Exception):
    INVALID_REQUEST = 1001
    NOT_FOUND = 1002

    def __init__(self, message: str, code: int = INVALID_REQUEST):
        self.code = code
        super().__init__(f"[{code}] {message}")
```

### Pattern 2: Enum (Recommended)

```python
class ErrorCode(str, Enum):
    INVALID_REQUEST = "ERR_INVALID_REQUEST"
    NOT_FOUND = "ERR_NOT_FOUND"

class APIError(Exception):
    def __init__(self, message: str, code: ErrorCode = ErrorCode.INVALID_REQUEST):
        self.code = code.value
        super().__init__(f"[{self.code}] {message}")
```

### Pattern 3: Hierarchical

```python
def make_code(domain: str, action: str, outcome: str) -> str:
    return f"{domain}_{action}_{outcome}"

class SessionError(Exception):
    def __init__(self, message: str, action: str = "load", outcome: str = "failed"):
        code = make_code("SESSION", action, outcome)
        self.code = code
        super().__init__(f"[{code}] {message}")
```

## Testing Custom Errors

```python
import pytest

def test_session_error_creation():
    error = SessionError("Test message", ErrorCode.SESSION_LOAD_FAILED)
    assert str(error) == "Test message"
    assert error.code == ErrorCode.SESSION_LOAD_FAILED

def test_session_error_with_context():
    ctx = {"session_path": "/test/path", "task_id": "P1.M1.T1"}
    error = SessionError("Test", ErrorCode.SESSION_LOAD_FAILED, ctx)
    assert error.context == ctx
    assert error.session_path == "/test/path"  # Context copied to instance
    assert error.task_id == "P1.M1.T1"

def test_session_error_serialization():
    error = SessionError("Test", ErrorCode.SESSION_LOAD_FAILED, {"key": "value"})
    data = error.to_dict()
    assert data["name"] == "SessionError"
    assert data["code"] == ErrorCode.SESSION_LOAD_FAILED
    assert data["message"] == "Test"
    assert "timestamp" in data
    assert data["context"] == {"key": "value"}

def test_exception_chaining():
    try:
        try:
            raise FileNotFoundError("File not found")
        except FileNotFoundError as e:
            raise SessionError("Load failed", ErrorCode.SESSION_LOAD_FAILED, cause=e)
    except SessionError as e:
        assert e.__cause__ is not None
        assert isinstance(e.__cause__, FileNotFoundError)
        assert str(e.__cause__) == "File not found"
```

## Comparison: TypeScript vs Python

| Feature | TypeScript | Python |
|---------|------------|--------|
| Error codes | `const ErrorCodes = { ... } as const` | `class ErrorCode(str, Enum)` |
| Base class | `extends Error` | `extends Exception` |
| Context | `interface Context extends Record` | `dict[str, Any]` or `dataclass` |
| Prototype setup | `Object.setPrototypeOf(this, ...)` | Automatic via `super()` |
| Serialization | `toJSON(): object` | `to_dict(): dict` |
| Type guard | `function isType(error: unknown): error is Type` | `def is_type(error: object) -> TypeGuard[Type]` |
| Property access | `this.context` | `self.context` |
| Stack trace | `Error.captureStackTrace()` | Automatic |
| Exception chaining | `new Error("msg", { cause })` | `raise ... from e` |

## Checklist for New Error Classes

- [ ] Inherit from `Exception`
- [ ] Call `super().__init__(message)` first
- [ ] Store error code as instance attribute
- [ ] Accept optional context dict
- [ ] Accept optional cause exception
- [ ] Copy context to instance attributes
- [ ] Implement `to_dict()` for logging
- [ ] Consider `__str__()` override
- [ ] Add docstring
- [ ] Add type hints
- [ ] Write unit tests
- [ ] Consider pickling support (if using multiprocessing)
