# Python Custom Error Classes Research - P1M3T2S2

## Overview

This directory contains comprehensive research on Python custom error class best practices, specifically tailored for the PRP Pipeline project. The research focuses on creating production-ready error classes with error codes, context objects, and proper exception handling patterns.

**Research Date:** January 27, 2026

**Status:** Complete

---

## Table of Contents

1. [Research Objectives](#research-objectives)
2. [Documents Index](#documents-index)
3. [Key Findings](#key-findings)
4. [Recommended Patterns](#recommended-patterns)
5. [Comparison with Existing TypeScript Implementation](#comparison-with-existing-typescript-implementation)
6. [Actionable Recommendations](#actionable-recommendations)
7. [Testing Guidelines](#testing-guidelines)
8. [References](#references)

---

## Research Objectives

This research addresses the following objectives for the PRP Pipeline:

1. **Error Code Integration**: Understand how to implement type-safe error codes in Python
2. **Best Practices**: Identify production-ready patterns for custom error classes
3. **Exception Inheritance**: Learn proper ways to extend Python's Exception class
4. **Error Message Formatting**: Discover best practices for clear, actionable error messages
5. **Common Gotchas**: Identify pitfalls when creating custom error classes
6. **TypeScript Parity**: Ensure Python patterns match existing TypeScript implementation

---

## Documents Index

### Core Research Documents

| Document | Description | Key Topics |
|----------|-------------|------------|
| **[python-custom-error-best-practices.md](./python-custom-error-best-practices.md)** | Comprehensive best practices guide | Error codes, inheritance, formatting, gotchas, production examples |
| **[quick-reference-python-errors.md](./quick-reference-python-errors.md)** | Quick reference guide | TL;DR patterns, common gotchas, testing examples |
| **[python-error-examples.py](./python-error-examples.py)** | Production-ready code examples | Complete, executable Python code with all patterns |
| **[python-error-testing-patterns.md](./python-error-testing-patterns.md)** | Comprehensive testing guide | pytest patterns, edge cases, integration testing |
| **[typescript-python-comparison.md](./typescript-python-comparison.md)** | TypeScript vs Python comparison | Side-by-side comparison, translation guide |

---

## Key Findings

### 1. Error Code Patterns

**Recommended Approach:** Use `Enum` for type-safe error codes

```python
from enum import Enum

class ErrorCode(str, Enum):
    """Type-safe error codes for pipeline operations."""
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
    SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED"
    TASK_EXECUTION_FAILED = "TASK_EXECUTION_FAILED"
```

**Benefits:**
- Type-safe with IDE autocomplete
- String values for easy serialization
- Enum members are singletons (memory efficient)
- Easy to extend and maintain

**Alternatives:**
- Class attributes (simple, less type-safe)
- Hierarchical code generation (good for large systems)
- Integer codes (less readable, harder to debug)

### 2. Proper Exception Inheritance

**Critical Pattern:** Always call `super().__init__(message)`

```python
class CustomError(Exception):
    def __init__(self, message: str, context: dict | None = None):
        self.context = context or {}
        super().__init__(message)  # CRITICAL: Initialize base Exception
```

**Why This Matters:**
- Sets the error message for `str(error)`
- Preserves stack trace information
- Enables proper exception chaining
- Ensures `raise ... from e` works correctly

### 3. Abstract Base Classes

**Recommended:** Use abstract base classes to enforce contracts

```python
from abc import ABC, abstractmethod

class PipelineError(ABC, Exception):
    @property
    @abstractmethod
    def code(self) -> str:
        """Must be overridden by subclasses."""
        raise NotImplementedError
```

**Benefits:**
- Enforces interface across all error subclasses
- Prevents instantiation of base class
- Provides type safety with static analysis tools
- Documents expected interface clearly

### 4. Context Objects

**Recommended:** Use `dataclass` for type-safe context

```python
from dataclasses import dataclass, field

@dataclass
class ErrorContext:
    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        # Convert to dictionary for logging
        ...
```

**Benefits:**
- Type-safe with IDE support
- Clear field definitions
- Default values for optional fields
- Easy to extend with metadata

**Alternative:** Use plain `dict` for flexibility (less type-safe)

### 5. Exception Chaining

**Critical Pattern:** Use `raise ... from e` to preserve tracebacks

```python
try:
    risky_operation()
except FileNotFoundError as e:
    raise SessionError("Load failed", cause=e) from e
```

**Why This Matters:**
- Preserves original traceback for debugging
- Shows both errors in stack trace
- Makes root cause analysis easier
- Matches Python exception chaining best practices

**Anti-Pattern:**
```python
# BAD: Loses original traceback
try:
    risky_operation()
except FileNotFoundError as e:
    raise SessionError("Load failed")
```

### 6. Serialization for Logging

**Recommended:** Implement `to_dict()` method for structured logging

```python
class PipelineError(Exception):
    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "timestamp": self.timestamp.isoformat(),
            "context": self.context.to_dict(),
        }
```

**Benefits:**
- Compatible with JSON loggers (pino, structlog)
- Easy to parse log files
- Supports monitoring and alerting
- Enables error analytics

### 7. Type Guards

**Recommended:** Use type guards for type narrowing (Python 3.10+)

```python
from typing import TypeGuard

def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    """Type guard for SessionError."""
    return isinstance(error, SessionError)

# Usage
try:
    operation()
except Exception as e:
    if is_session_error(e):
        # e is narrowed to SessionError
        logger.error(e.to_dict())
```

**Benefits:**
- Type-safe error handling
- Better IDE autocomplete
- Catches type errors at static analysis time
- Matches TypeScript type guard patterns

---

## Common Gotchas

### Gotcha 1: Mutable Default Arguments

**BAD:**
```python
class BadError(Exception):
    def __init__(self, message: str, details: list = []):  # Dangerous!
        self.details = details
```

**GOOD:**
```python
class GoodError(Exception):
    def __init__(self, message: str, details: list | None = None):
        self.details = details if details is not None else []
```

**Impact:** Mutable defaults are shared across all instances, causing data corruption.

### Gotcha 2: Forgetting `super().__init__()`

**BAD:**
```python
class BadError(Exception):
    def __init__(self, message: str):
        self.message = message  # Doesn't set base Exception message
```

**GOOD:**
```python
class GoodError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)  # Sets base Exception message
```

**Impact:** Without `super().__init__()`, `str(error)` returns empty string and stack traces are incomplete.

### Gotcha 3: Breaking Exception Chaining

**BAD:**
```python
try:
    risky_operation()
except ValueError as e:
    raise MyCustomError("Something went wrong")  # Loses traceback
```

**GOOD:**
```python
try:
    risky_operation()
except ValueError as e:
    raise MyCustomError("Something went wrong") from e  # Preserves traceback
```

**Impact:** Original traceback is lost, making debugging much harder.

### Gotcha 4: Shadowing Built-in Exception Names

**BAD:**
```python
class ValueError(Exception):  # Don't do this!
    pass
```

**GOOD:**
```python
class ValidationError(Exception):  # Much better!
    pass
```

**Impact:** Shadowing built-in names makes code confusing and can break isinstance checks.

### Gotcha 5: Not Supporting Pickling

**BAD:**
```python
class BadError(Exception):
    def __init__(self, message: str, callback: Callable):
        self.callback = callback  # Unpicklable!
```

**GOOD:**
```python
class GoodError(Exception):
    def __init__(self, message: str, context: dict):
        self.context = context  # Picklable
```

**Impact:** Unpicklable exceptions break multiprocessing and task queue systems.

---

## Recommended Patterns

### Complete Production-Ready Pattern

```python
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, TypeGuard
import json


# 1. Error Codes (Enum-based)
class ErrorCode(str, Enum):
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
    SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED"
    TASK_EXECUTION_FAILED = "TASK_EXECUTION_FAILED"


# 2. Context (Dataclass-based)
@dataclass
class ErrorContext:
    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key in ["session_path", "task_id", "operation"]:
            value = getattr(self, key)
            if value is not None:
                result[key] = value
        result.update(self.metadata)
        return result


# 3. Base Error Class (Abstract)
class PipelineError(ABC, Exception):
    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        self.timestamp = datetime.utcnow()

        # Normalize context
        if isinstance(context, ErrorContext):
            self.context = context
        elif isinstance(context, dict):
            self.context = ErrorContext(**context)
        else:
            self.context = ErrorContext()

        # Initialize base Exception
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
        raise NotImplementedError

    def to_dict(self) -> dict[str, Any]:
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


# 4. Specialized Error Class
class SessionError(PipelineError):
    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
        code: str | None = None,
    ):
        self._code = code or ErrorCode.SESSION_LOAD_FAILED
        super().__init__(message, context, cause)

    @property
    def code(self) -> str:
        return self._code


# 5. Type Guard
def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    return isinstance(error, SessionError)
```

---

## Comparison with Existing TypeScript Implementation

The Python patterns are designed to match the existing TypeScript implementation in `/home/dustin/projects/hacky-hack/src/utils/errors.ts`.

### Key Similarities

1. **Error Codes**: Both use type-safe constants (Enum in Python, const assertion in TypeScript)
2. **Base Class**: Both use abstract base class with code property
3. **Context**: Both provide structured context objects (dataclass in Python, interface in TypeScript)
4. **Serialization**: Both have `to_dict()` / `toJSON()` methods for logging
5. **Type Guards**: Both provide type guard functions for narrowing
6. **Exception Chaining**: Both support preserving original errors

### Key Differences

1. **Type System**: TypeScript uses compile-time checking, Python uses runtime + type hints
2. **Syntax**: TypeScript uses camelCase, Python uses snake_case (PEP 8)
3. **Prototype**: TypeScript needs explicit `Object.setPrototypeOf()`, Python handles automatically
4. **Stack Traces**: TypeScript needs `Error.captureStackTrace()`, Python preserves automatically

See [typescript-python-comparison.md](./typescript-python-comparison.md) for detailed side-by-side comparison.

---

## Actionable Recommendations

### For This PRP (P1M3T2S2)

Based on the research, here are the recommended patterns for implementing Python error classes in the PRP Pipeline:

1. **Use Enum for Error Codes**
   - Type-safe and IDE-friendly
   - Easy to extend and maintain
   - Matches TypeScript const assertion pattern

2. **Use Dataclass for Context**
   - Type-safe with clear field definitions
   - Better than plain dict for IDE support
   - Easy to serialize to dict for logging

3. **Implement Abstract Base Class**
   - Enforces `code` property across all subclasses
   - Provides common serialization logic
   - Prevents direct instantiation

4. **Always Call `super().__init__(message)`**
   - Critical for proper error message handling
   - Preserves stack traces
   - Enables exception chaining

5. **Use `raise ... from e` for Chaining**
   - Preserves original traceback
   - Shows both errors in stack trace
   - Essential for debugging

6. **Implement `to_dict()` for Logging**
   - Compatible with structured logging systems
   - Easy to parse log files
   - Supports monitoring and alerting

7. **Add Type Guards for Type Narrowing**
   - Type-safe error handling
   - Better IDE autocomplete
   - Matches TypeScript patterns

### Testing Recommendations

1. **Test Basic Error Creation**
   - Verify message, code, context
   - Test with different context types
   - Test inheritance chain

2. **Test Exception Chaining**
   - Verify `__cause__` is set correctly
   - Test with `raise ... from e`
   - Verify traceback preservation

3. **Test Serialization**
   - Verify `to_dict()` output format
   - Test with nested errors
   - Verify JSON serialization

4. **Test Type Guards**
   - Verify correct type narrowing
   - Test with different error types
   - Test with None values

5. **Test Edge Cases**
   - Invalid context types
   - None values
   - Empty context

See [python-error-testing-patterns.md](./python-error-testing-patterns.md) for comprehensive testing guidelines.

---

## Testing Guidelines

### Basic Test Structure

```python
import pytest
from python_error_examples import SessionError, ErrorCode, ErrorContext


def test_session_error_creation():
    """Test basic SessionError creation."""
    error = SessionError("Test message")

    assert str(error) == "Test message"
    assert error.code == ErrorCode.SESSION_LOAD_FAILED
    assert error.timestamp is not None


def test_session_error_with_context():
    """Test SessionError with context."""
    ctx = ErrorContext(session_path="/test/path", task_id="P1.M1.T1")
    error = SessionError("Test", context=ctx)

    assert error.session_path == "/test/path"
    assert error.task_id == "P1.M1.T1"


def test_session_error_serialization():
    """Test SessionError serialization."""
    error = SessionError("Test")
    data = error.to_dict()

    assert data["name"] == "SessionError"
    assert data["code"] == ErrorCode.SESSION_LOAD_FAILED
    assert data["message"] == "Test"
    assert "timestamp" in data


def test_exception_chaining():
    """Test exception chaining."""
    try:
        try:
            raise FileNotFoundError("File not found")
        except FileNotFoundError as e:
            raise SessionError("Load failed", cause=e) from e
    except SessionError as e:
        assert e.__cause__ is not None
        assert isinstance(e.__cause__, FileNotFoundError)
```

### Testing Checklist

- [ ] Basic error creation and properties
- [ ] Error code assignment and retrieval
- [ ] Context handling (dict, dataclass, None)
- [ ] Exception chaining (with and without `from`)
- [ ] Serialization (to_dict, to_json)
- [ ] Type guard functions
- [ ] Edge cases (invalid types, None values)
- [ ] Integration with logging
- [ ] Integration with retry/recovery logic

---

## References

### Research Sources

While web search was unavailable at the time of research, this compilation is based on:

1. **Python Official Documentation**
   - Exception hierarchy and built-in exceptions
   - Exception handling best practices
   - `raise` statement documentation

2. **PEP 8 -- Style Guide for Python Code**
   - Naming conventions for exception classes
   - Docstring conventions

3. **Type Annotations (PEP 484, PEP 585)**
   - Type hints for exception handling
   - Type guard patterns (Python 3.10+)

4. **Community Best Practices**
   - Real-world patterns from major Python frameworks (Django, Flask, FastAPI)
   - Common patterns in production Python codebases

5. **Existing Codebase Patterns**
   - `/home/dustin/projects/hacky-hack/src/utils/errors.ts` (TypeScript reference)
   - Architecture documentation in `plan/003_b3d3efdaf0ed/docs/`

### Additional Resources

For further reading, consider:

- Python `abc` module documentation (abstract base classes)
- Python `dataclasses` module documentation
- Python `enum` module documentation
- PEP 484: Type Hints
- PEP 585: Type Hinting Generics In Standard Collections
- pytest documentation for testing patterns

---

## Summary

This research provides a comprehensive foundation for implementing production-ready custom error classes in Python for the PRP Pipeline. The patterns are:

1. **Type-Safe**: Using `Enum` for error codes and `dataclass` for context
2. **Idiomatic**: Following Python best practices and PEP 8 conventions
3. **Maintainable**: Clear structure with abstract base classes and type hints
4. **Testable**: Comprehensive testing patterns and edge case coverage
5. **Compatible**: Matches existing TypeScript implementation patterns

All code examples are production-ready and can be directly adapted for use in the PRP Pipeline project.

---

**Last Updated:** January 27, 2026

**Research Complete:** Yes

**Next Steps:** Implement Python error classes using recommended patterns from [python-error-examples.py](./python-error-examples.py)
