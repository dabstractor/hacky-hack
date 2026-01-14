---
name: 'Error Hierarchy Implementation - Production-Ready Custom Error Classes'
description: |
---

## Goal

**Feature Goal**: Create a robust error hierarchy in TypeScript with base class, specialized error types, error codes, context objects, and structured logging support via `toJSON()`.

**Deliverable**: `src/utils/errors.ts` with exported `PipelineError` base class and specialized error classes (`SessionError`, `TaskError`, `AgentError`, `ValidationError`), each supporting error codes, context, and `toJSON()` serialization.

**Success Definition**:

- All error classes properly extend `PipelineError` and `Error`
- `instanceof` checks work correctly for all error types
- Each error includes a unique error code from a centralized `ErrorCodes` constant
- `toJSON()` method returns structured data compatible with pino logger
- 100% test coverage passing all validation gates

## User Persona

**Target User**: Internal AI agent and developer users who need programmatic error handling and structured logging for debugging and monitoring.

**Use Case**: When pipeline operations fail (session management, task execution, agent LLM calls, validation), errors are thrown with rich context for debugging and can be logged in structured format for log aggregation.

**User Journey**:

1. Operation fails (e.g., session load, task execution)
2. Specific error thrown with context object (taskId, sessionPath, etc.)
3. Error caught and logged via `logger.error(error.toJSON())`
4. Error code can be checked for programmatic handling (e.g., retry logic)
5. Stack trace and context available in logs for debugging

**Pain Points Addressed**:

- Current `throw new Error()` provides no structured context
- No error codes for programmatic handling
- Errors cannot be serialized for structured logging
- No instanceof type narrowing for specific error types

## Why

- **Business value**: Enables proper retry logic in P5.M4.T1.S2 and P5.M4.T1.S3 by providing error codes for transient vs permanent failures
- **Integration**: Works with existing pino-based logger in `src/utils/logger.ts` for structured logging
- **Problems solved**: Replaces generic `throw new Error()` throughout the codebase with type-safe, context-rich errors

## What

Create `src/utils/errors.ts` with:

1. **ErrorCodes constant**: Object with string error codes (e.g., `PIPELINE_SESSION_LOAD_FAILED`, `PIPELINE_TASK_EXECUTION_FAILED`)
2. **PipelineError base class**: Abstract class extending `Error` with `code`, `context`, `toJSON()`, proper prototype setup
3. **Specialized error classes**: `SessionError`, `TaskError`, `AgentError`, `ValidationError` extending `PipelineError`
4. **Type guards**: `isPipelineError()` and code-specific guards

### Success Criteria

- [ ] All error classes export from `src/utils/errors.ts`
- [ ] `instanceof` works correctly for all error types (verified in tests)
- [ ] `toJSON()` returns serializable object with name, code, message, context, timestamp
- [ ] Error codes follow naming pattern: `PIPELINE_{DOMAIN}_{ACTION}_{OUTCOME}`
- [ ] Context objects are optional Record<string, unknown>
- [ ] 100% code coverage with unit tests

## All Needed Context

### Context Completeness Check

**No Prior Knowledge Test**: A developer unfamiliar with this codebase should be able to implement this PRP successfully using only this document and the referenced files.

### Documentation & References

```yaml
# MUST READ - Internal codebase patterns
- file: src/utils/logger.ts
  why: Understanding pino logger interface and log data structure
  pattern: Logger interface with error(obj, msg?) signature
  gotcha: Errors should be passed as first argument to logger.error()

- file: src/agents/prp-generator.ts
  why: Existing error class patterns (PRPGenerationError, PRPFileError)
  pattern: Custom errors extending Error with readonly properties
  note: Uses simple message concatenation, no error codes or toJSON

- file: src/core/session-utils.ts
  why: SessionFileError pattern for file operations
  pattern: Constructor with path, operation, cause parameters
  note: Stores Node.js errno code from underlying error

- file: src/agents/prp-executor.ts
  why: PRPExecutionError and ValidationError patterns
  pattern: ValidationError includes level, command, stdout, stderr
  note: Multiple validation error patterns exist

- file: src/core/scope-resolver.ts
  why: ScopeParseError pattern with context properties
  pattern: Stores invalidInput and expectedFormat for debugging
  note: Includes toString() override for custom formatting

- file: src/config/types.ts
  why: EnvironmentValidationError pattern
  pattern: Extends Error with missing fields array
  note: Located in types.ts, could be moved to errors.ts

- file: tests/unit/logger.test.ts
  why: Test patterns for utils module
  pattern: describe/it structure with beforeEach/afterEach
  note: Uses Vitest globals (describe, it, expect, beforeEach, afterEach)

- docfile: plan/001_14b9dc2a33c7/P5M4T1S1/research/typescript-error-handling.md
  why: TypeScript error handling best practices with complete examples
  section: "Proper Prototype Chain Setup" and "toJSON() Implementation"

- docfile: plan/001_14b9dc2a33c7/P5M4T1S1/research/error-examples.ts
  why: Complete working examples of error hierarchies
  section: Full file with AppError base class and specialized errors
  note: Includes Result type pattern (optional for future)

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: TypeScript type narrowing with discriminated unions
  critical: Using readonly kind/code properties for type guards

- url: https://nodejs.org/api/errors.html
  why: Node.js Error documentation, cause property, error codes
  critical: The cause property for error chaining
```

### Current Codebase Tree

```bash
src/
├── agents/
│   ├── agent-factory.ts
│   ├── prp-executor.ts      # Has PRPExecutionError, ValidationError
│   ├── prp-generator.ts     # Has PRPGenerationError, PRPFileError
│   └── prp-runtime.ts       # Has PRPRuntimeError
├── cli/
│   └── index.ts
├── config/
│   ├── constants.ts
│   ├── environment.ts
│   └── types.ts             # Has EnvironmentValidationError
├── core/
│   ├── models.ts
│   ├── scope-resolver.ts    # Has ScopeParseError
│   ├── session-manager.ts
│   ├── session-utils.ts     # Has SessionFileError
│   └── task-orchestrator.ts
├── tools/
│   ├── bash-mcp.ts
│   ├── filesystem-mcp.ts
│   └── git-mcp.ts
├── utils/
│   ├── git-commit.ts
│   ├── logger.ts            # Structured logging with pino
│   ├── progress.ts
│   └── task-utils.ts
└── workflows/
    └── prp-pipeline.ts

tests/
├── unit/
│   ├── logger.test.ts       # Test pattern reference
│   └── utils/
│       ├── git-commit.test.ts
│       └── progress.test.ts
```

### Desired Codebase Tree (After Implementation)

```bash
src/
├── utils/
│   ├── errors.ts            # NEW - Error hierarchy with PipelineError base
│   ├── logger.ts
│   ├── progress.ts
│   ├── git-commit.ts
│   └── task-utils.ts

tests/
├── unit/
│   ├── logger.test.ts
│   └── utils/
│       ├── errors.test.ts   # NEW - 100% coverage for error hierarchy
│       ├── git-commit.test.ts
│       └── progress.test.ts
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: TypeScript ES5 compilation target requires Object.setPrototypeOf()
// The project uses ES2022 target (see tsconfig.json), but best practice is
// to ALWAYS include Object.setPrototypeOf() for compatibility
Object.setPrototypeOf(this, new.target.prototype);

// CRITICAL: Error.captureStackTrace is V8-specific (Node.js)
// Check existence before calling to avoid issues in other environments
if (Error.captureStackTrace) {
  Error.captureStackTrace(this, this.constructor);
}

// CRITICAL: Using 'readonly' properties on custom errors
// This prevents reassignment and enables type narrowing
readonly code: string;
readonly context?: Record<string, unknown>;

// CRITICAL: toJSON() must handle circular references
// Context objects may contain circular references (e.g., parent objects)
// Use try/catch or JSON.stringify safe fallback

// CRITICAL: Stack trace is already a property on Error
// Don't create a stack property in constructor - inherited from Error

// CRITICAL: When using this in constructor for new.target.prototype
// Must use 'new.target' not 'this.constructor' for proper inheritance
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Error codes as const assertion for type safety
export const ErrorCodes = {
  // Session errors
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  PIPELINE_SESSION_SAVE_FAILED: 'PIPELINE_SESSION_SAVE_FAILED',
  PIPELINE_SESSION_NOT_FOUND: 'PIPELINE_SESSION_NOT_FOUND',

  // Task errors
  PIPELINE_TASK_EXECUTION_FAILED: 'PIPELINE_TASK_EXECUTION_FAILED',
  PIPELINE_TASK_VALIDATION_FAILED: 'PIPELINE_TASK_VALIDATION_FAILED',
  PIPELINE_TASK_NOT_FOUND: 'PIPELINE_TASK_NOT_FOUND',

  // Agent errors
  PIPELINE_AGENT_LLM_FAILED: 'PIPELINE_AGENT_LLM_FAILED',
  PIPELINE_AGENT_TIMEOUT: 'PIPELINE_AGENT_TIMEOUT',
  PIPELINE_AGENT_PARSE_FAILED: 'PIPELINE_AGENT_PARSE_FAILED',

  // Validation errors
  PIPELINE_VALIDATION_INVALID_INPUT: 'PIPELINE_VALIDATION_INVALID_INPUT',
  PIPELINE_VALIDATION_MISSING_FIELD: 'PIPELINE_VALIDATION_MISSING_FIELD',
  PIPELINE_VALIDATION_SCHEMA_FAILED: 'PIPELINE_VALIDATION_SCHEMA_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Base error interface for type narrowing
export interface PipelineErrorContext extends Record<string, unknown> {
  sessionPath?: string;
  taskId?: string;
  operation?: string;
  cause?: string;
  [key: string]: unknown;
}

// Abstract base class
export abstract class PipelineError extends Error {
  abstract readonly code: ErrorCode;
  readonly context?: PipelineErrorContext;
  readonly timestamp: Date;

  constructor(message: string, context?: PipelineErrorContext);
  abstract toJSON(): Record<string, unknown>;
}

// Specialized error classes
export class SessionError extends PipelineError {}
export class TaskError extends PipelineError {}
export class AgentError extends PipelineError {}
export class ValidationError extends PipelineError {}

// Type guards
export function isPipelineError(error: unknown): error is PipelineError;
export function isSessionError(error: unknown): error is SessionError;
export function isTaskError(error: unknown): error is TaskError;
export function isAgentError(error: unknown): error is AgentError;
export function isValidationError(error: unknown): error is ValidationError;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/errors.ts
  - IMPLEMENT: ErrorCodes constant with const assertion
  - IMPLEMENT: PipelineErrorContext interface extending Record<string, unknown>
  - IMPLEMENT: PipelineError abstract base class
  - PATTERN: Follow research/typescript-error-handling.md "Proper Prototype Chain Setup"
  - NAMING: PascalCase for classes, UPPER_SNAKE_CASE for error codes
  - PROTOTYPE: Always call Object.setPrototypeOf(this, new.target.prototype)
  - STACK_TRACE: Conditionally call Error.captureStackTrace if available
  - DEPENDENCIES: None (foundational file)

Task 2: IMPLEMENT PipelineError base class methods
  - IMPLEMENT: Constructor with message, optional context, optional cause
  - IMPLEMENT: toJSON() method returning {name, code, message, context, timestamp, stack}
  - PATTERN: Handle circular references in context serialization
  - PATTERN: Sanitize sensitive data (apiKey, token) matching logger.ts REDACT_PATHS
  - RETURN: Plain object compatible with JSON.stringify and pino logger
  - DEPENDENCIES: Task 1 (ErrorCodes, PipelineErrorContext types)

Task 3: IMPLEMENT specialized error classes
  - CREATE: SessionError extending PipelineError
  - CREATE: TaskError extending PipelineError
  - CREATE: AgentError extending PipelineError
  - CREATE: ValidationError extending PipelineError (differentiate from prp-executor.ts ValidationError)
  - EACH: Constructor delegates to super with specific error code
  - EACH: Override code property with specific ErrorCode from ErrorCodes
  - PATTERN: Each class defines its own readonly code property
  - DEPENDENCIES: Task 2 (PipelineError base class)

Task 4: IMPLEMENT type guard functions
  - CREATE: isPipelineError(error: unknown): error is PipelineError
  - CREATE: isSessionError(error: unknown): error is SessionError
  - CREATE: isTaskError(error: unknown): error is TaskError
  - CREATE: isAgentError(error: unknown): error is AgentError
  - CREATE: isValidationError(error: unknown): error is ValidationError
  - PATTERN: Use instanceof checks with type predicates
  - DEPENDENCIES: Task 3 (All error classes defined)

Task 5: CREATE tests/unit/utils/errors.test.ts
  - IMPLEMENT: Tests for ErrorCodes (all codes defined, type safety)
  - IMPLEMENT: Tests for PipelineError (instanceof, toJSON, context)
  - IMPLEMENT: Tests for each specialized error class
  - IMPLEMENT: Tests for type guard functions
  - IMPLEMENT: Tests for prototype chain (instanceof works)
  - IMPLEMENT: Tests for toJSON serialization (includes all fields)
  - IMPLEMENT: Tests for circular reference handling in context
  - PATTERN: Follow tests/unit/logger.test.ts structure
  - COVERAGE: Target 100% (match vitest.config.ts thresholds)
  - DEPENDENCIES: Task 4 (All exports complete)

Task 6: VERIFY integration with existing logger
  - MANUAL TEST: Import errors.ts and logger.ts
  - MANUAL TEST: Throw error, catch it, call logger.error(error.toJSON())
  - VERIFY: JSON output is valid and includes all expected fields
  - DEPENDENCIES: Task 5 (Implementation complete)
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// ERROR CODES PATTERN (Task 1)
// ============================================================================
// Use const assertion for type-safe error codes
export const ErrorCodes = {
  PIPELINE_SESSION_LOAD_FAILED: 'PIPELINE_SESSION_LOAD_FAILED',
  // ... other codes
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// PIPELINE ERROR BASE CLASS (Task 2)
// ============================================================================
export abstract class PipelineError extends Error {
  // Abstract property - each subclass must define
  abstract readonly code: ErrorCode;

  // Optional context object for debugging information
  readonly context?: PipelineErrorContext;

  // Timestamp for when error was created
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

    // Store cause if provided (ES2022+)
    if (cause) {
      (this as unknown as { cause?: Error }).cause = cause;
    }
  }

  /**
   * Serialize error for structured logging
   * Compatible with pino logger in src/utils/logger.ts
   */
  toJSON(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };

    // Add context if present (with sanitization)
    if (this.context) {
      serialized.context = this.sanitizeContext(this.context);
    }

    // Add stack trace (already on Error.prototype)
    if (this.stack) {
      serialized.stack = this.stack;
    }

    return serialized;
  }

  /**
   * Sanitize context object for logging
   * Removes sensitive data matching logger.ts REDACT_PATHS
   */
  private sanitizeContext(
    context: PipelineErrorContext
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      'apiKey',
      'token',
      'password',
      'secret',
      'authorization',
    ];

    for (const [key, value] of Object.entries(context)) {
      // Check if key is sensitive
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Handle nested errors
      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
        };
        continue;
      }

      // Handle circular references
      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = '[non-serializable]';
      }
    }

    return sanitized;
  }
}

// ============================================================================
// SPECIALIZED ERROR CLASSES (Task 3)
// ============================================================================

/**
 * Session management errors
 * Used by: SessionManager, session-utils.ts
 */
export class SessionError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    // Ensure prototype is set for this class
    Object.setPrototypeOf(this, SessionError.prototype);
  }

  // Can add session-specific methods if needed
  isLoadError(): boolean {
    return this.code === ErrorCodes.PIPELINE_SESSION_LOAD_FAILED;
  }
}

/**
 * Task execution errors
 * Used by: TaskOrchestrator, PRPExecutor
 */
export class TaskError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_TASK_EXECUTION_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, TaskError.prototype);
  }
}

/**
 * LLM agent errors
 * Used by: PRPGenerator, PRPExecutor, PRPRuntime
 */
export class AgentError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_AGENT_LLM_FAILED;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Validation errors
 * Used by: PRPExecutor validation gates, scope-resolver.ts
 * NOTE: Different from prp-executor.ts ValidationError
 */
export class ValidationError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_VALIDATION_INVALID_INPUT;

  constructor(message: string, context?: PipelineErrorContext, cause?: Error) {
    super(message, context, cause);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ============================================================================
// TYPE GUARDS (Task 4)
// ============================================================================

/**
 * Type guard for PipelineError
 */
export function isPipelineError(error: unknown): error is PipelineError {
  return error instanceof PipelineError;
}

/**
 * Type guard for SessionError
 */
export function isSessionError(error: unknown): error is SessionError {
  return error instanceof SessionError;
}

/**
 * Type guard for TaskError
 */
export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

/**
 * Type guard for AgentError
 */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

### Integration Points

```yaml
LOGGER:
  - use: src/utils/logger.ts
  - pattern: "logger.error(error.toJSON(), 'Operation failed')"
  - note: error.toJSON() returns object compatible with pino

EXISTING ERRORS:
  - future: Migrate PRPGenerationError to extend PipelineError
  - future: Migrate PRPFileError to extend PipelineError
  - future: Migrate PRPExecutionError to extend PipelineError
  - future: Migrate SessionFileError to extend PipelineError
  - note: Out of scope for this PRP, but design should support migration

RETRY LOGIC:
  - link: P5.M4.T1.S2 (retry logic implementation)
  - pattern: 'if (error.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) { retry }'
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after src/utils/errors.ts is created - fix before proceeding
npm run lint -- src/utils/errors.ts --fix     # Auto-format linting issues
npm run type-check                             # TypeScript type checking
npm run format -- src/utils/errors.ts          # Ensure formatting

# Full project validation
npm run lint -- --fix
npm run type-check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test error hierarchy module
npm test -- tests/unit/utils/errors.test.ts --run

# Full utils test suite
npm test -- tests/unit/utils/ --run

# Coverage validation (should match 100% threshold)
npm test -- tests/unit/utils/errors.test.ts --run --coverage

# Expected: All tests pass, 100% coverage. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify imports work correctly
node -e "import { SessionError } from './src/utils/errors.js'; console.log('Import OK');"

# Verify logger integration
node -e "
import { getLogger } from './src/utils/logger.js';
import { SessionError } from './src/utils/errors.js';
const logger = getLogger('Test');
const error = new SessionError('Test error', { sessionPath: '/test' });
logger.error(error.toJSON(), 'Test error logging');
console.log('Logger integration OK');
"

# Verify instanceof works correctly
node -e "
import { SessionError, isSessionError } from './src/utils/errors.js';
const error = new SessionError('Test');
console.log('instanceof SessionError:', error instanceof SessionError);
console.log('instanceof Error:', error instanceof Error);
console.log('isSessionError:', isSessionError(error));
"

# Expected: All imports work, logger integration succeeds, instanceof returns true
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual validation: Create comprehensive error scenario
node -e "
import { AgentError, ErrorCodes } from './src/utils/errors.js';

// Test 1: Error with context
const error1 = new AgentError(
  'LLM call failed',
  { taskId: 'P1.M1.T1', attempt: 3, maxAttempts: 5 }
);
console.log('Test 1 - Error with context:');
console.log(JSON.stringify(error1.toJSON(), null, 2));

// Test 2: Error with cause
const original = new Error('Network timeout');
const error2 = new AgentError(
  'Agent operation failed',
  { operation: 'generatePRP' },
  original
);
console.log('\\nTest 2 - Error with cause:');
console.log(JSON.stringify(error2.toJSON(), null, 2));

// Test 3: Type narrowing with error code
const handle = (err: unknown) => {
  if (err instanceof AgentError && err.code === ErrorCodes.PIPELINE_AGENT_TIMEOUT) {
    console.log('\\nTest 3 - Type narrowing: Should retry');
  }
};
handle(error2);
"

# Verify circular reference handling
node -e "
import { SessionError } from './src/utils/errors.js';

// Create circular reference
const circular: Record<string, unknown> = { name: 'test' };
circular.self = circular;

const error = new SessionError('Circular test', { data: circular });
const json = error.toJSON();
console.log('Circular reference handled:', typeof json.context?.data === 'object');
"

# Expected: All tests pass, circular references handled, no crashes
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test -- tests/unit/utils/errors.test.ts --run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] No formatting issues: `npm run format -- --check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: Level 3 integration commands pass
- [ ] Error codes are unique and follow naming pattern
- [ ] instanceof checks work for all error types
- [ ] toJSON() returns valid JSON with all expected fields
- [ ] Context sanitization removes sensitive data

### Code Quality Validation

- [ ] Follows existing codebase patterns (matches SessionFileError, PRPGenerationError patterns)
- [ ] File placement matches desired codebase tree
- [ ] Prototype chain correctly set up (verified by instanceof tests)
- [ ] Circular references handled gracefully in toJSON()
- [ ] Integration with logger.ts verified

### Documentation & Deployment

- [ ] Code is self-documenting with clear JSDoc comments
- [ ] Error classes exported correctly for use across codebase
- [ ] Type guards work as expected for type narrowing

---

## Anti-Patterns to Avoid

- ❌ Don't use `this.constructor` for Object.setPrototypeOf - use `new.target.prototype`
- ❌ Don't forget to call `Object.setPrototypeOf` in each subclass constructor
- ❌ Don't create non-serializable context objects (functions, symbols)
- ❌ Don't include sensitive data in context (apiKey, token, password)
- ❌ Don't skip circular reference handling in toJSON()
- ❌ Don't create error codes that don't follow the `PIPELINE_{DOMAIN}_{ACTION}` pattern
- ❌ Don't use sync Error.captureStackTrace without checking for its existence
- ❌ Don't make `code` property non-readonly (should be compile-time constant per class)
- ❌ Don't include stack trace as own property (inherited from Error)
- ❌ Don't use generic `Error` when specific error type is available
