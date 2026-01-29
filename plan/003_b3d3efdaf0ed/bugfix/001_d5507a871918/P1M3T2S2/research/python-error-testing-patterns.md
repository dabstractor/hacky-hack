# Python Custom Error Testing Patterns

## Overview

This document provides comprehensive testing patterns for custom error classes in Python, including pytest examples, edge cases, and best practices.

## Table of Contents

1. [Basic Error Testing](#basic-error-testing)
2. [Context Testing](#context-testing)
3. [Exception Chaining Testing](#exception-chaining-testing)
4. [Serialization Testing](#serialization-testing)
5. [Type Guard Testing](#type-guard-testing)
6. [Edge Cases and Gotchas](#edge-cases-and-gotchas)
7. [Integration Testing](#integration-testing)
8. [Mock Error Patterns](#mock-error-patterns)

---

## Basic Error Testing

### Test Error Creation

```python
import pytest
from python_error_examples import SessionError, ErrorCode, ErrorContext


def test_session_error_creation():
    """Test basic SessionError creation."""
    error = SessionError("Test message")

    assert str(error) == "Test message"
    assert error.code == ErrorCode.SESSION_LOAD_FAILED
    assert error.timestamp is not None
    assert isinstance(error.context, ErrorContext)


def test_session_error_with_code():
    """Test SessionError with custom code."""
    error = SessionError(
        "Test message",
        code=ErrorCode.SESSION_SAVE_FAILED
    )

    assert error.code == ErrorCode.SESSION_SAVE_FAILED


def test_session_error_inheritance():
    """Test that SessionError can be caught as Exception."""
    with pytest.raises(SessionError):
        raise SessionError("Test")

    with pytest.raises(Exception):
        raise SessionError("Test")
```

### Test Error Properties

```python
def test_session_error_is_load_error():
    """Test is_load_error() method."""
    error = SessionError("Test", code=ErrorCode.SESSION_LOAD_FAILED)
    assert error.is_load_error() is True
    assert error.is_save_error() is False


def test_session_error_is_save_error():
    """Test is_save_error() method."""
    error = SessionError("Test", code=ErrorCode.SESSION_SAVE_FAILED)
    assert error.is_save_error() is True
    assert error.is_load_error() is False
```

---

## Context Testing

### Test with Dict Context

```python
def test_session_error_with_dict_context():
    """Test SessionError with dictionary context."""
    ctx_dict = {
        "session_path": "/test/path",
        "task_id": "P1.M1.T1",
    }
    error = SessionError("Test", context=ctx_dict)

    # Context is converted to ErrorContext
    assert isinstance(error.context, ErrorContext)
    assert error.context.session_path == "/test/path"
    assert error.context.task_id == "P1.M1.T1"

    # Properties are copied to instance
    assert error.session_path == "/test/path"
    assert error.task_id == "P1.M1.T1"


def test_session_error_with_empty_context():
    """Test SessionError with empty context."""
    error = SessionError("Test", context={})

    assert error.context.session_path is None
    assert error.context.task_id is None


def test_session_error_with_none_context():
    """Test SessionError with None context."""
    error = SessionError("Test", context=None)

    assert isinstance(error.context, ErrorContext)
    assert error.context.session_path is None
    assert error.context.task_id is None
```

### Test with ErrorContext Dataclass

```python
def test_session_error_with_error_context():
    """Test SessionError with ErrorContext dataclass."""
    ctx = ErrorContext(
        session_path="/test/path",
        task_id="P1.M1.T1",
        operation="load_session",
    )
    error = SessionError("Test", context=ctx)

    assert error.context is ctx
    assert error.session_path == "/test/path"
    assert error.task_id == "P1.M1.T1"
    assert error.operation == "load_session"


def test_error_context_to_dict():
    """Test ErrorContext serialization."""
    ctx = ErrorContext(
        session_path="/test/path",
        task_id="P1.M1.T1",
    )
    result = ctx.to_dict()

    assert result == {
        "session_path": "/test/path",
        "task_id": "P1.M1.T1",
    }
    # None values are filtered out
    assert "operation" not in result
    assert "user_id" not in result


def test_error_context_with_metadata():
    """Test ErrorContext with metadata."""
    ctx = ErrorContext(
        session_path="/test/path",
        metadata={"attempt": 3, "max_attempts": 5},
    )
    result = ctx.to_dict()

    assert result["session_path"] == "/test/path"
    assert result["attempt"] == 3
    assert result["max_attempts"] == 5
```

---

## Exception Chaining Testing

### Test Exception Cause

```python
def test_session_error_with_cause():
    """Test SessionError with underlying cause."""
    original_error = FileNotFoundError("File not found")
    error = SessionError("Load failed", cause=original_error)

    assert error.__cause__ is original_error
    assert isinstance(error.__cause__, FileNotFoundError)
    assert str(error.__cause__) == "File not found"


def test_exception_chaining_in_try_except():
    """Test exception chaining in try/except block."""
    try:
        try:
            raise FileNotFoundError("File not found")
        except FileNotFoundError as e:
            raise SessionError("Load failed", cause=e)
    except SessionError as e:
        assert e.__cause__ is not None
        assert isinstance(e.__cause__, FileNotFoundError)
        assert str(e.__cause__) == "File not found"


def test_exception_traceback_preserved():
    """Test that original traceback is preserved."""
    try:
        try:
            raise ValueError("Original error")
        except ValueError as e:
            raise SessionError("Wrapped error", cause=e)
    except SessionError as e:
        # The cause should be the original ValueError
        assert isinstance(e.__cause__, ValueError)
        # The traceback should show both exceptions
        import traceback
        tb_str = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        assert "ValueError: Original error" in tb_str
        assert "SessionError: Wrapped error" in tb_str
```

### Test Using 'raise ... from'

```python
def test_raise_from_syntax():
    """Test using 'raise ... from' syntax."""
    try:
        try:
            raise FileNotFoundError("File not found")
        except FileNotFoundError as e:
            raise SessionError("Load failed") from e
    except SessionError as e:
        assert e.__cause__ is not None
        assert isinstance(e.__cause__, FileNotFoundError)
        assert e.__cause__.__suppress_context__ is False


def test_raise_from_none():
    """Test using 'raise ... from None' to suppress chaining."""
    try:
        try:
            raise FileNotFoundError("File not found")
        except FileNotFoundError:
            raise SessionError("Load failed") from None
    except SessionError as e:
        # No cause when using 'from None'
        assert e.__cause__ is None
```

---

## Serialization Testing

### Test to_dict() Method

```python
def test_session_error_to_dict():
    """Test SessionError serialization."""
    ctx = ErrorContext(
        session_path="/test/path",
        task_id="P1.M1.T1",
    )
    error = SessionError("Test message", context=ctx)

    result = error.to_dict()

    assert result["name"] == "SessionError"
    assert result["code"] == ErrorCode.SESSION_LOAD_FAILED
    assert result["message"] == "Test message"
    assert "timestamp" in result
    assert result["context"]["session_path"] == "/test/path"
    assert result["context"]["task_id"] == "P1.M1.T1"


def test_error_to_dict_with_cause():
    """Test serialization with cause."""
    original = FileNotFoundError("File not found")
    error = SessionError("Load failed", cause=original)

    result = error.to_dict()

    assert "cause" in result
    assert result["cause"]["name"] == "FileNotFoundError"
    assert result["cause"]["message"] == "File not found"


def test_error_to_dict_with_empty_context():
    """Test serialization with empty context."""
    error = SessionError("Test message")

    result = error.to_dict()

    # Empty context should not be in result
    assert "context" not in result or result["context"] == {}


def test_error_to_json():
    """Test JSON serialization."""
    ctx = ErrorContext(session_path="/test/path")
    error = SessionError("Test message", context=ctx)

    json_str = error.to_json()
    import json
    result = json.loads(json_str)

    assert result["name"] == "SessionError"
    assert result["code"] == ErrorCode.SESSION_LOAD_FAILED
    assert result["message"] == "Test message"
    assert result["context"]["session_path"] == "/test/path"
```

---

## Type Guard Testing

### Test Type Guard Functions

```python
from python_error_examples import (
    is_session_error,
    is_task_error,
    is_validation_error,
    is_pipeline_error,
)


def test_is_session_error():
    """Test SessionError type guard."""
    session_error = SessionError("Test")
    task_error = TaskError("Test")
    standard_error = ValueError("Test")

    assert is_session_error(session_error) is True
    assert is_session_error(task_error) is False
    assert is_session_error(standard_error) is False
    assert is_session_error(None) is False


def test_is_task_error():
    """Test TaskError type guard."""
    session_error = SessionError("Test")
    task_error = TaskError("Test")

    assert is_task_error(session_error) is False
    assert is_task_error(task_error) is True


def test_is_pipeline_error():
    """Test PipelineError type guard (base class)."""
    session_error = SessionError("Test")
    task_error = TaskError("Test")
    standard_error = ValueError("Test")

    # All PipelineError subclasses
    assert is_pipeline_error(session_error) is True
    assert is_pipeline_error(task_error) is True

    # Not PipelineError
    assert is_pipeline_error(standard_error) is False
    assert is_pipeline_error(None) is False


def test_type_narrowing():
    """Test that type guards enable type narrowing."""
    error = SessionError("Test", context={"task_id": "P1.M1.T1"})

    # Without type guard, mypy/pyright doesn't know the type
    if is_session_error(error):
        # After type guard, error is narrowed to SessionError
        # (this would be caught by static type checkers)
        assert error.code == ErrorCode.SESSION_LOAD_FAILED
        assert error.task_id == "P1.M1.T1"
```

---

## Edge Cases and Gotchas

### Test Invalid Context Type

```python
def test_invalid_context_type():
    """Test that invalid context type raises TypeError."""
    with pytest.raises(TypeError, match="context must be ErrorContext, dict, or None"):
        SessionError("Test", context="invalid")  # type: ignore


def test_invalid_context_type_list():
    """Test that list context raises TypeError."""
    with pytest.raises(TypeError, match="context must be ErrorContext, dict, or None"):
        SessionError("Test", context=["invalid"])  # type: ignore
```

### Test Mutable Default Arguments (Gotcha)

```python
# BAD: Don't do this!
class BadError(Exception):
    def __init__(self, message: str, details: list = []):  # Mutable default!
        self.details = details


def test_mutable_default_gotcha():
    """Demonstrate mutable default argument gotcha."""
    # This test shows why mutable defaults are bad

    # Create two errors without providing details
    error1 = BadError("Error 1")
    error2 = BadError("Error 2")

    # Modify error1's details
    error1.details.append("item1")

    # error2's details are also modified! (shared mutable default)
    assert error2.details == ["item1"]  # UNEXPECTED!


# GOOD: Use None as default
class GoodError(Exception):
    def __init__(self, message: str, details: list | None = None):
        self.details = details if details is not None else []


def test_mutable_default_fix():
    """Demonstrate correct mutable default handling."""
    error1 = GoodError("Error 1")
    error2 = GoodError("Error 2")

    error1.details.append("item1")

    # error2's details are independent
    assert error2.details == []  # EXPECTED!
```

### Test Forgetting super().**init**() (Gotcha)

```python
# BAD: Missing super() call
class BadError(Exception):
    def __init__(self, message: str):
        self.message = message
        # Forgot to call super().__init__(message)!


def test_missing_super_init_gotcha():
    """Demonstrate missing super().__init__() gotcha."""
    error = BadError("Test message")

    # str(error) returns empty string because base Exception wasn't initialized
    assert str(error) == ""  # UNEXPECTED!
    assert error.message == "Test message"  # Custom attribute works


# GOOD: Call super().__init__()
class GoodError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)  # Initialize base Exception


def test_super_init_fix():
    """Demonstrate correct super().__init__() usage."""
    error = GoodError("Test message")

    assert str(error) == "Test message"  # EXPECTED!
    assert error.message == "Test message"
```

---

## Integration Testing

### Test with Logging

```python
import logging
from io import StringIO
import json


def test_error_with_structured_logging():
    """Test error integration with structured logging."""
    # Setup logging
    logger = logging.getLogger("test")
    logger.setLevel(logging.ERROR)

    # Capture log output
    log_stream = StringIO()
    handler = logging.StreamHandler(log_stream)
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)

    # Log error
    ctx = ErrorContext(session_path="/test/path", task_id="P1.M1.T1")
    error = SessionError("Load failed", context=ctx)
    logger.error(json.dumps(error.to_dict()))

    # Verify log output
    log_output = log_stream.getvalue()
    log_data = json.loads(log_output.strip())

    assert log_data["name"] == "SessionError"
    assert log_data["code"] == ErrorCode.SESSION_LOAD_FAILED
    assert log_data["context"]["session_path"] == "/test/path"
```

### Test with Retry Logic

```python
def test_fatal_error_detection():
    """Test fatal error detection for retry logic."""
    from python_error_examples import is_fatal_error

    # Fatal errors
    assert is_fatal_error(SessionError("Load failed")) is True

    # Non-fatal errors
    assert is_fatal_error(TaskError("Task failed")) is False

    # Standard errors are non-fatal
    assert is_fatal_error(ValueError("Standard error")) is False

    # None is non-fatal
    assert is_fatal_error(None) is False


def test_continue_on_error_override():
    """Test that continue_on_error overrides all fatal errors."""
    from python_error_examples import is_fatal_error

    fatal_error = SessionError("Load failed")

    # Without override, it's fatal
    assert is_fatal_error(fatal_error, continue_on_error=False) is True

    # With override, it's non-fatal
    assert is_fatal_error(fatal_error, continue_on_error=True) is False
```

### Test with Error Recovery

```python
def test_error_recovery_workflow():
    """Test error recovery in a workflow."""
    results = []

    def operation(step: int):
        if step == 1:
            raise SessionError("Step 1 failed")
        elif step == 2:
            raise TaskError("Step 2 failed")
        return f"Step {step} succeeded"

    # Retry workflow
    for step in [1, 2, 3]:
        try:
            result = operation(step)
            results.append(result)
        except Exception as e:
            if is_fatal_error(e):
                # Fatal error - abort
                results.append(f"FATAL: {e}")
                break
            else:
                # Non-fatal error - continue
                results.append(f"NON-FATAL: {e}")

    assert results == [
        "FATAL: [SESSION_LOAD_FAILED] Step 1 failed",
    ]
```

---

## Mock Error Patterns

### Test with Mocked Errors

```python
from unittest.mock import Mock, patch
import pytest


def test_raise_mocked_error():
    """Test raising a mocked error."""
    # Create a mock error that behaves like SessionError
    mock_error = Mock(spec=SessionError)
    mock_error.code = ErrorCode.SESSION_LOAD_FAILED
    mock_error.session_path = "/test/path"
    mock_error.task_id = "P1.M1.T1"

    # Mock str() to return a message
    mock_error.__str__ = Mock(return_value="Mocked error message")

    assert str(mock_error) == "Mocked error message"
    assert mock_error.code == ErrorCode.SESSION_LOAD_FAILED


def test_mock_error_in_function():
    """Test mocking error in a function."""
    def risky_operation():
        raise SessionError("Operation failed")

    # Patch the risky_operation to avoid raising error
    with patch("__main__.risky_operation", return_value="Success"):
        result = risky_operation()
        assert result == "Success"


def test_mock_error_to_dict():
    """Test mocking to_dict() method."""
    error = SessionError("Test")
    expected_dict = {
        "name": "SessionError",
        "code": ErrorCode.SESSION_LOAD_FAILED,
        "message": "Test",
        "timestamp": "2024-01-01T00:00:00",
    }

    # Mock to_dict to return specific dict
    error.to_dict = Mock(return_value=expected_dict)

    result = error.to_dict()
    assert result == expected_dict
    assert result["timestamp"] == "2024-01-01T00:00:00"
```

### Test with Fixture Errors

```python
@pytest.fixture
def session_error_with_context():
    """Fixture providing a SessionError with context."""
    ctx = ErrorContext(
        session_path="/test/path",
        task_id="P1.M1.T1",
        operation="load_session",
    )
    return SessionError("Load failed", context=ctx)


def test_with_error_fixture(session_error_with_context):
    """Test using error fixture."""
    assert session_error_with_context.code == ErrorCode.SESSION_LOAD_FAILED
    assert session_error_with_context.session_path == "/test/path"
    assert session_error_with_context.task_id == "P1.M1.T1"
    assert session_error_with_context.operation == "load_session"


@pytest.fixture
def session_error_with_cause():
    """Fixture providing a SessionError with cause."""
    original = FileNotFoundError("File not found")
    return SessionError("Load failed", cause=original)


def test_with_cause_fixture(session_error_with_cause):
    """Test using error fixture with cause."""
    assert isinstance(session_error_with_cause.__cause__, FileNotFoundError)
    assert str(session_error_with_cause.__cause__) == "File not found"
```

---

## Parameterized Testing

### Test Multiple Error Codes

```python
@pytest.mark.parametrize(
    "code,expected_method",
    [
        (ErrorCode.SESSION_LOAD_FAILED, "is_load_error"),
        (ErrorCode.SESSION_SAVE_FAILED, "is_save_error"),
    ],
)
def test_session_error_code_methods(code, expected_method):
    """Test SessionError code check methods."""
    error = SessionError("Test", code=code)
    method = getattr(error, expected_method)
    assert method() is True


@pytest.mark.parametrize(
    "error_class,expected_code",
    [
        (SessionError, ErrorCode.SESSION_LOAD_FAILED),
        (TaskError, ErrorCode.TASK_EXECUTION_FAILED),
    ],
)
def test_default_error_codes(error_class, expected_code):
    """Test default error codes for each error class."""
    error = error_class("Test message")
    assert error.code == expected_code
```

---

## Async Error Testing

### Test Async Exception Handling

```python
import pytest_asyncio


async def async_failing_operation():
    """Async operation that raises SessionError."""
    await asyncio.sleep(0.01)
    raise SessionError("Async operation failed")


@pytest.mark.asyncio
async def test_async_error_handling():
    """Test async error handling."""
    with pytest.raises(SessionError) as exc_info:
        await async_failing_operation()

    error = exc_info.value
    assert error.code == ErrorCode.SESSION_LOAD_FAILED
    assert "Async operation failed" in str(error)


@pytest.mark.asyncio
async def test_async_error_recovery():
    """Test async error recovery with non-fatal errors."""
    attempts = []

    for attempt in range(3):
        try:
            await async_failing_operation()
        except SessionError as e:
            attempts.append(e)
            if attempt < 2:
                await asyncio.sleep(0.01)
                continue
            else:
                raise

    assert len(attempts) == 3
    assert all(isinstance(e, SessionError) for e in attempts)
```

---

## Summary Checklist

When testing custom error classes:

- [ ] Test basic error creation and properties
- [ ] Test error code assignment and retrieval
- [ ] Test context handling (dict, dataclass, None)
- [ ] Test exception chaining (with and without `from`)
- [ ] Test serialization (to_dict, to_json)
- [ ] Test type guard functions
- [ ] Test edge cases (invalid types, None values)
- [ ] Test integration with logging
- [ ] Test integration with retry/recovery logic
- [ ] Test async error handling (if applicable)
- [ ] Use parameterized tests for multiple scenarios
- [ ] Create fixtures for common error objects
- [ ] Mock errors when testing error handling logic
