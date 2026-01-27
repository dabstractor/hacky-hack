"""
Production-Ready Python Error Class Examples

This file contains complete, production-ready examples of custom error classes
in Python, following best practices and patterns suitable for the PRP Pipeline.

Examples range from simple to advanced, demonstrating:
- Error code integration (Enum-based)
- Context objects (dict and dataclass)
- Exception chaining
- Serialization for logging
- Type guards
- Testing patterns
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, TypeGuard
import json


# ============================================================================
# ERROR CODES (Enum-based for type safety)
# ============================================================================

class ErrorCode(str, Enum):
    """Type-safe error codes for pipeline operations.

    Format: DOMAIN_ACTION_OUTCOME
    - Domain: SESSION, TASK, AGENT, VALIDATION
    - Action: LOAD, SAVE, EXECUTION, LLM, TIMEOUT
    - Outcome: FAILED, NOT_FOUND, INVALID

    Example:
        >>> ErrorCode.SESSION_LOAD_FAILED
        <ErrorCode.SESSION_LOAD_FAILED: 'SESSION_LOAD_FAILED'>
        >>> ErrorCode.SESSION_LOAD_FAILED.value
        'SESSION_LOAD_FAILED'
    """

    # Session errors
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
    SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED"
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    SESSION_INVALID_BUGFIX_PATH = "SESSION_INVALID_BUGFIX_PATH"

    # Task errors
    TASK_EXECUTION_FAILED = "TASK_EXECUTION_FAILED"
    TASK_VALIDATION_FAILED = "TASK_VALIDATION_FAILED"
    TASK_NOT_FOUND = "TASK_NOT_FOUND"

    # Agent errors
    AGENT_LLM_FAILED = "AGENT_LLM_FAILED"
    AGENT_TIMEOUT = "AGENT_TIMEOUT"
    AGENT_PARSE_FAILED = "AGENT_PARSE_FAILED"

    # Validation errors
    VALIDATION_INVALID_INPUT = "VALIDATION_INVALID_INPUT"
    VALIDATION_MISSING_FIELD = "VALIDATION_MISSING_FIELD"
    VALIDATION_SCHEMA_FAILED = "VALIDATION_SCHEMA_FAILED"
    VALIDATION_CIRCULAR_DEPENDENCY = "VALIDATION_CIRCULAR_DEPENDENCY"
    VALIDATION_NESTED_EXECUTION = "VALIDATION_NESTED_EXECUTION"

    # Resource errors
    RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED"


# ============================================================================
# ERROR CONTEXT (Type-safe using dataclass)
# ============================================================================

@dataclass
class ErrorContext:
    """Type-safe error context for debugging and logging.

    This dataclass provides a structured way to pass context information
    with errors, ensuring type safety and IDE autocomplete support.

    Attributes:
        session_path: Path to session directory
        task_id: Task or subtask ID (e.g., "P1.M1.T1")
        operation: Operation being performed
        user_id: User identifier
        metadata: Additional key-value pairs

    Example:
        >>> ctx = ErrorContext(session_path="/path/to/session", task_id="P1.M1.T1")
        >>> ctx.to_dict()
        {'session_path': '/path/to/session', 'task_id': 'P1.M1.T1',
         'operation': None, 'user_id': None, 'metadata': {}}
    """

    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
    user_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization.

        Filters out None values and merges metadata into the result.

        Returns:
            Dictionary representation of the context
        """
        result: dict[str, Any] = {}
        for key in ["session_path", "task_id", "operation", "user_id"]:
            value = getattr(self, key)
            if value is not None:
                result[key] = value
        result.update(self.metadata)
        return result


# ============================================================================
# BASE ERROR CLASS (Abstract)
# ============================================================================

class PipelineError(ABC, Exception):
    """Abstract base error class for all pipeline operations.

    This class defines the common structure and behavior for all pipeline errors:
    - Error codes for programmatic handling
    - Context objects for debugging
    - Timestamps for tracking
    - Serialization for structured logging
    - Exception chaining support

    Cannot be instantiated directly - must be subclassed.

    Example:
        >>> # Cannot instantiate abstract class
        >>> PipelineError("message")
        Traceback (most recent call last):
            ...
        TypeError: Can't instantiate abstract class PipelineError ...

        >>> # Use specialized subclasses
        >>> raise SessionError("Failed to load session")
    """

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
    ):
        """Initialize a PipelineError.

        Args:
            message: Human-readable error message
            context: Error context (ErrorContext, dict, or None)
            cause: Optional underlying exception that caused this error

        Note:
            The error code must be defined by subclasses via the @property decorator.
        """
        self.timestamp = datetime.utcnow()

        # Normalize context to ErrorContext
        if isinstance(context, ErrorContext):
            self.context: ErrorContext = context
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

        # Copy context to instance for easy access (matches TypeScript pattern)
        for key, value in self.context.to_dict().items():
            setattr(self, key, value)

        # Store cause for exception chaining
        if cause is not None:
            self.__cause__ = cause

    @property
    @abstractmethod
    def code(self) -> str:
        """Error code for programmatic handling.

        Must be overridden by subclasses to provide a unique error code.

        Returns:
            String error code (e.g., "SESSION_LOAD_FAILED")
        """
        raise NotImplementedError("Subclasses must implement the 'code' property")

    def to_dict(self) -> dict[str, Any]:
        """Serialize error to dictionary for structured logging.

        Returns a plain object compatible with JSON.stringify, suitable for
        structured logging systems like pino, structlog, or Python's logging module.

        Returns:
            Dictionary containing error details
        """
        result: dict[str, Any] = {
            "name": self.__class__.__name__,
            "code": self.code,
            "message": str(self),
            "timestamp": self.timestamp.isoformat(),
        }

        # Add context if present
        if ctx_dict := self.context.to_dict():
            result["context"] = ctx_dict

        # Add cause if present
        if self.__cause__ is not None:
            result["cause"] = {
                "name": self.__cause__.__class__.__name__,
                "message": str(self.__cause__),
            }

        return result

    def to_json(self) -> str:
        """Serialize error to JSON string.

        Returns:
            JSON string representation of the error
        """
        return json.dumps(self.to_dict(), indent=2)

    def __str__(self) -> str:
        """Return user-friendly error message."""
        parts = [f"[{self.code}] {super().__str__()}"]
        if ctx_dict := self.context.to_dict():
            parts.append(f"Context: {ctx_dict}")
        return " | ".join(parts)


# ============================================================================
# SPECIALIZED ERROR CLASSES
# ============================================================================

class SessionError(PipelineError):
    """Session management errors.

    Used for session load/save operations, session validation, and
    session state management failures.

    Attributes:
        code: Error code (defaults to SESSION_LOAD_FAILED)

    Example:
        >>> raise SessionError(
        ...     "Failed to load session",
        ...     ErrorContext(session_path="/path/to/session", task_id="P1.M1.T1")
        ... )
    """

    # Default error code
    _default_code = ErrorCode.SESSION_LOAD_FAILED

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
        code: str | None = None,
    ):
        """Initialize a SessionError.

        Args:
            message: Human-readable error message
            context: Error context object
            cause: Optional underlying exception
            code: Error code (defaults to SESSION_LOAD_FAILED)
        """
        self._code = code if code is not None else self._default_code
        super().__init__(message, context, cause)

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return self._code

    def is_load_error(self) -> bool:
        """Check if this is a session load error.

        Returns:
            True if error code is SESSION_LOAD_FAILED
        """
        return self._code == ErrorCode.SESSION_LOAD_FAILED

    def is_save_error(self) -> bool:
        """Check if this is a session save error.

        Returns:
            True if error code is SESSION_SAVE_FAILED
        """
        return self._code == ErrorCode.SESSION_SAVE_FAILED


class TaskError(PipelineError):
    """Task execution errors.

    Used for task execution failures, validation failures, and
    task state management issues.

    Attributes:
        code: Error code (always TASK_EXECUTION_FAILED)

    Example:
        >>> raise TaskError(
        ...     "Task execution failed",
        ...     ErrorContext(task_id="P1.M1.T1", operation="execute")
        ... )
    """

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return ErrorCode.TASK_EXECUTION_FAILED


class ValidationError(PipelineError):
    """Validation errors.

    Used for input validation, schema validation, and
    dependency validation failures.

    Attributes:
        code: Error code (defaults to VALIDATION_INVALID_INPUT)

    Example:
        >>> raise ValidationError(
        ...     "Invalid input format",
        ...     ErrorContext(operation="validate_prd"),
        ...     code=ErrorCode.VALIDATION_INVALID_INPUT
        ... )
    """

    # Default error code
    _default_code = ErrorCode.VALIDATION_INVALID_INPUT

    def __init__(
        self,
        message: str,
        context: ErrorContext | dict[str, Any] | None = None,
        cause: BaseException | None = None,
        code: str | None = None,
    ):
        """Initialize a ValidationError.

        Args:
            message: Human-readable error message
            context: Error context object
            cause: Optional underlying exception
            code: Error code (defaults to VALIDATION_INVALID_INPUT)
        """
        self._code = code if code is not None else self._default_code
        super().__init__(message, context, cause)

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return self._code


class BugfixSessionValidationError(PipelineError):
    """Error thrown when bugfix session validation fails.

    Thrown when attempting to execute bug fix tasks outside of a bugfix session.
    This prevents state corruption from creating fix tasks in feature implementation
    sessions or other non-bugfix contexts.

    Example:
        >>> if not session_path.includes('bugfix'):
        ...     raise BugfixSessionValidationError(
        ...         'Bug fix tasks can only be executed within bugfix sessions.',
        ...         ErrorContext(session_path=session_path)
        ...     )
    """

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return ErrorCode.SESSION_INVALID_BUGFIX_PATH


class NestedExecutionError(PipelineError):
    """Nested PRP Pipeline execution errors.

    Used when PRP Pipeline execution is attempted while already running.
    Only bug fix sessions with SKIP_BUG_FINDING=true are allowed to recurse.

    Attributes:
        existing_pid: PID of the existing pipeline process
        current_pid: PID of the current process
        session_path: Path to the current session

    Example:
        >>> if process.env.PRP_PIPELINE_RUNNING and not is_legitimate_recursion:
        ...     raise NestedExecutionError(
        ...         'Nested PRP Pipeline execution detected.',
        ...         ErrorContext(
        ...             session_path=session_path,
        ...             metadata={"existing_pid": existing_pid, "current_pid": current_pid}
        ...         )
        ...     )
    """

    @property
    def code(self) -> str:
        """Return the error code for this exception."""
        return ErrorCode.VALIDATION_NESTED_EXECUTION


# ============================================================================
# TYPE GUARDS
# ============================================================================

def is_session_error(error: object | None) -> TypeGuard[SessionError]:
    """Type guard for SessionError.

    Enables type narrowing in catch blocks when using isinstance checks.

    Args:
        error: Object to check

    Returns:
        True if error is an instance of SessionError

    Example:
        >>> try:
        ...     operation()
        ... except Exception as e:
        ...     if is_session_error(e):
        ...         # e is narrowed to SessionError
        ...         print(f"Session error: {e.session_path}")
    """
    return isinstance(error, SessionError)


def is_task_error(error: object | None) -> TypeGuard[TaskError]:
    """Type guard for TaskError.

    Args:
        error: Object to check

    Returns:
        True if error is an instance of TaskError
    """
    return isinstance(error, TaskError)


def is_validation_error(error: object | None) -> TypeGuard[ValidationError]:
    """Type guard for ValidationError.

    Args:
        error: Object to check

    Returns:
        True if error is an instance of ValidationError
    """
    return isinstance(error, ValidationError)


def is_pipeline_error(error: object | None) -> TypeGuard[PipelineError]:
    """Type guard for PipelineError.

    Returns True for any PipelineError subclass.

    Args:
        error: Object to check

    Returns:
        True if error is an instance of PipelineError
    """
    return isinstance(error, PipelineError)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def is_fatal_error(
    error: object | None,
    continue_on_error: bool = False,
) -> bool:
    """Determine if an error should be treated as fatal.

    Fatal errors halt pipeline execution, while non-fatal errors
    allow continuation with error tracking.

    Fatal error types:
    - SessionError with LOAD_FAILED or SAVE_FAILED error codes
    - ValidationError with NESTED_EXECUTION code
    - BugfixSessionValidationError (all instances)
    - NestedExecutionError (all instances)

    Non-fatal error types:
    - TaskError (all instances)
    - ValidationError with non-nested codes
    - All standard Error types (Error, TypeError, etc.)
    - Non-object values (None, strings, numbers, etc.)

    Args:
        error: Unknown error to evaluate for fatality
        continue_on_error: If True, all errors are treated as non-fatal

    Returns:
        True if error is fatal (should abort), False otherwise

    Example:
        >>> try:
        ...     pipeline_operation()
        ... except Exception as e:
        ...     if is_fatal_error(e):
        ...         raise  # Re-raise fatal errors
        ...     track_error(e)  # Track non-fatal errors
    """
    # Override all logic when continue_on_error is True
    if continue_on_error:
        return False

    # Non-object errors are non-fatal
    if error is None or not isinstance(error, BaseException):
        return False

    # Check for PipelineError instances
    if is_pipeline_error(error):
        # FATAL: BugfixSessionValidationError and NestedExecutionError
        if isinstance(error, (BugfixSessionValidationError, NestedExecutionError)):
            return True

        # FATAL: SessionError with LOAD_FAILED or SAVE_FAILED codes
        if is_session_error(error):
            return error.is_load_error() or error.is_save_error()

        # FATAL: ValidationError for nested execution
        if is_validation_error(error):
            return error.code == ErrorCode.VALIDATION_NESTED_EXECUTION

        # NON-FATAL: TaskError and other ValidationErrors
        return False

    # Default: non-fatal for unknown error types
    return False


# ============================================================================
# EXAMPLES AND DEMONSTRATIONS
# ============================================================================

def example_basic_usage():
    """Demonstrate basic error usage."""
    print("=== Basic Usage Examples ===\n")

    # Simple error
    print("1. Simple error:")
    try:
        raise SessionError("Failed to load session")
    except SessionError as e:
        print(f"   Message: {e}")
        print(f"   Code: {e.code}")

    # Error with context
    print("\n2. Error with context:")
    try:
        ctx = ErrorContext(session_path="/path/to/session", task_id="P1.M1.T1")
        raise SessionError("Failed to load session", ctx)
    except SessionError as e:
        print(f"   Message: {e}")
        print(f"   Session path: {e.session_path}")
        print(f"   Task ID: {e.task_id}")

    # Error serialization
    print("\n3. Error serialization:")
    try:
        ctx = ErrorContext(session_path="/path/to/session", task_id="P1.M1.T1")
        raise SessionError("Failed to load session", ctx)
    except SessionError as e:
        print(f"   JSON:\n{e.to_json()}")


def example_exception_chaining():
    """Demonstrate exception chaining."""
    print("\n=== Exception Chaining Examples ===\n")

    # Chaining with 'from'
    print("1. Using 'raise ... from':")
    try:
        try:
            raise FileNotFoundError("Session file not found: /path/to/session.json")
        except FileNotFoundError as e:
            ctx = ErrorContext(session_path="/path/to/session")
            raise SessionError("Failed to load session", ctx, cause=e)
    except SessionError as e:
        print(f"   Main error: {e}")
        print(f"   Cause: {e.__cause__}")
        print(f"   Cause type: {e.__cause__.__class__.__name__}")


def example_type_guards():
    """Demonstrate type guard usage."""
    print("\n=== Type Guard Examples ===\n")

    errors = [
        SessionError("Session failed"),
        TaskError("Task failed"),
        ValidationError("Validation failed"),
        ValueError("Standard error"),
    ]

    for error in errors:
        try:
            raise error
        except Exception as e:
            print(f"   {e.__class__.__name__}:", end=" ")
            if is_session_error(e):
                print("is SessionError ✅")
            elif is_task_error(e):
                print("is TaskError ✅")
            elif is_validation_error(e):
                print("is ValidationError ✅")
            else:
                print("is custom PipelineError ❌")


def example_fatal_error_detection():
    """Demonstrate fatal error detection."""
    print("\n=== Fatal Error Detection Examples ===\n")

    test_cases = [
        ("Session load error", SessionError("Load failed")),
        ("Task error", TaskError("Task failed")),
        ("Nested execution error", NestedExecutionError("Nested detected")),
        ("Standard error", ValueError("Standard error")),
    ]

    for name, error in test_cases:
        try:
            raise error
        except Exception as e:
            fatal = is_fatal_error(e)
            print(f"   {name}: {'FATAL' if fatal else 'NON-FATAL'}")


def example_structured_logging():
    """Demonstrate structured logging integration."""
    print("\n=== Structured Logging Examples ===\n")

    import logging
    import sys

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
    )
    logger = logging.getLogger(__name__)

    try:
        ctx = ErrorContext(
            session_path="/path/to/session",
            task_id="P1.M1.T1",
            operation="load_session",
        )
        raise SessionError("Failed to load session", ctx)
    except SessionError as e:
        logger.error("Pipeline error occurred", extra={"error": e.to_dict()})


if __name__ == "__main__":
    # Run all examples
    example_basic_usage()
    example_exception_chaining()
    example_type_guards()
    example_fatal_error_detection()
    example_structured_logging()
