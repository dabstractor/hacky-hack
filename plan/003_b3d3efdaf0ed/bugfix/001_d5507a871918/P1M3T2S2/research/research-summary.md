# Research Summary: Python Custom Error Classes

## Objective Completed

Comprehensive research on Python custom error class best practices has been completed and stored in:

```
/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/research/
```

## Deliverables

### 1. **python-custom-error-best-practices.md** (19KB)

Comprehensive guide covering:

- Basic error class patterns
- Error code integration (Enum-based)
- Proper exception inheritance
- Error message formatting
- Common gotchas and pitfalls
- Production-ready examples
- Comparison with TypeScript patterns

### 2. **quick-reference-python-errors.md** (7KB)

Quick reference guide with:

- TL;DR recommended pattern
- Usage examples
- Common gotchas table
- Error code patterns
- TypeScript vs Python comparison
- Testing checklist

### 3. **python-error-examples.py** (22KB, validated syntax)

Production-ready code examples including:

- Complete error class hierarchy
- Error codes using Enum
- ErrorContext dataclass
- Base PipelineError abstract class
- Specialized error classes (SessionError, TaskError, ValidationError)
- Type guard functions
- Fatal error detection utility
- Executable demonstration code

### 4. **python-error-testing-patterns.md** (21KB)

Comprehensive testing guide with:

- Basic error testing patterns
- Context testing
- Exception chaining testing
- Serialization testing
- Type guard testing
- Edge cases and gotchas
- Integration testing
- Mock error patterns
- Parameterized testing
- Async error testing

### 5. **typescript-python-comparison.md** (21KB)

Side-by-side comparison of:

- Error code definitions
- Base class implementations
- Context object patterns
- Specialized error classes
- Type guard implementations
- Serialization methods
- Translation guide
- Key differences and gotchas

### 6. **sources-and-references.md** (9.8KB)

Complete reference documentation:

- Python official documentation sources
- PEP references (PEP 8, PEP 484, PEP 585)
- Community best practices (Django, Flask, FastAPI)
- Code quality resources (mypy, pyright, pytest)
- Existing TypeScript implementation patterns
- Recommended books, blogs, and videos
- Research methodology and limitations

### 7. **README.md** (19KB)

Main research document with:

- Research objectives
- Documents index
- Key findings
- Recommended patterns
- Comparison with existing TypeScript implementation
- Actionable recommendations
- Testing guidelines

## Key Findings

### 1. Error Code Patterns

**Recommended:** Use `Enum` for type-safe error codes

```python
class ErrorCode(str, Enum):
    SESSION_LOAD_FAILED = "SESSION_LOAD_FAILED"
    SESSION_SAVE_FAILED = "SESSION_SAVE_FAILED"
```

### 2. Proper Exception Inheritance

**Critical:** Always call `super().__init__(message)`

```python
class CustomError(Exception):
    def __init__(self, message: str, context: dict | None = None):
        self.context = context or {}
        super().__init__(message)  # CRITICAL
```

### 3. Abstract Base Classes

**Recommended:** Use abstract base classes to enforce contracts

```python
class PipelineError(ABC, Exception):
    @property
    @abstractmethod
    def code(self) -> str:
        raise NotImplementedError
```

### 4. Context Objects

**Recommended:** Use `dataclass` for type-safe context

```python
@dataclass
class ErrorContext:
    session_path: str | None = None
    task_id: str | None = None
    operation: str | None = None
```

### 5. Exception Chaining

**Critical:** Use `raise ... from e` to preserve tracebacks

```python
try:
    risky_operation()
except FileNotFoundError as e:
    raise SessionError("Load failed", cause=e) from e
```

### 6. Serialization for Logging

**Recommended:** Implement `to_dict()` method

```python
def to_dict(self) -> dict[str, Any]:
    return {
        "name": self.__class__.__name__,
        "code": self.code,
        "message": str(self),
        "timestamp": self.timestamp.isoformat(),
        "context": self.context.to_dict(),
    }
```

## Common Gotchas Identified

1. **Mutable Default Arguments** - Don't use `def __init__(self, ctx={})`
2. **Forgetting `super().__init__()`** - Breaks message handling and tracebacks
3. **Breaking Exception Chaining** - Always use `raise ... from e`
4. **Shadowing Built-in Names** - Don't create `class ValueError(Exception)`
5. **Not Supporting Pickling** - Avoid unpicklable state in errors
6. **Incorrect `__reduce__` Implementation** - Only override if necessary

## Actionable Recommendations for PRP Pipeline

1. ✅ Use Enum for error codes (type-safe, IDE-friendly)
2. ✅ Use dataclass for context (structured, type-safe)
3. ✅ Implement abstract base class (enforces contracts)
4. ✅ Always call `super().__init__(message)` (critical)
5. ✅ Use `raise ... from e` for chaining (preserves tracebacks)
6. ✅ Implement `to_dict()` for logging (structured logging)
7. ✅ Add type guards for type narrowing (Python 3.10+)

## Testing Guidelines

All error classes should be tested for:

- Basic creation and properties
- Error code assignment
- Context handling (dict, dataclass, None)
- Exception chaining (with and without `from`)
- Serialization (to_dict, to_json)
- Type guard functions
- Edge cases (invalid types, None values)
- Integration with logging
- Integration with retry/recovery logic

## Compatibility with TypeScript Implementation

The Python patterns are designed to match the existing TypeScript implementation in:

- Error codes (Enum vs const assertion)
- Base class structure (ABC vs abstract class)
- Context objects (dataclass vs interface)
- Serialization (to_dict vs toJSON)
- Type guards (isinstance vs instanceof)
- Exception chaining (from e vs cause property)

## Files Location

All research files are stored in:

```
/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S2/research/
```

**File Sizes:**

- python-custom-error-best-practices.md: 19KB
- python-error-examples.py: 22KB (validated ✓)
- python-error-testing-patterns.md: 21KB
- quick-reference-python-errors.md: 7KB
- typescript-python-comparison.md: 21KB
- sources-and-references.md: 9.8KB
- README.md: 19KB

**Total:** 7 documents, ~117KB of comprehensive research

## Next Steps

1. Review the README.md for overview
2. Study python-error-examples.py for production-ready code
3. Refer to quick-reference-python-errors.md for TL;DR patterns
4. Use python-error-testing-patterns.md for testing guidance
5. Consult typescript-python-comparison.md when translating TypeScript patterns

---

**Research Status:** ✅ Complete

**Date:** January 27, 2026

**Validation:** Python syntax validated ✓
