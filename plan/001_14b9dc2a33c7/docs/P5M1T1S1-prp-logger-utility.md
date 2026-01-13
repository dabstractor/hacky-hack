# Product Requirement Prompt (PRP): Create Logger Utility

**Work Item**: P5.M1.T1.S1 - Create logger utility
**Status**: Research Complete -> Ready for Implementation

---

## Goal

**Feature Goal**: Create a structured logging utility at `src/utils/logger.ts` using Pino that provides typed log levels (DEBUG, INFO, WARN, ERROR), sensitive data redaction, context-aware logging, JSON output for machine-readable mode, and respects the `--verbose` CLI flag for debug output control.

**Deliverable**: Logger utility module `src/utils/logger.ts` with:

- `LogLevel` enum: DEBUG, INFO, WARN, ERROR
- `getLogger(context: string): Logger` factory function
- `Logger` interface with methods: `debug()`, `info()`, `warn()`, `error()`
- Structured JSON output with timestamp, level, context, message fields
- Sensitive data redaction for API keys, tokens, passwords
- JSON output mode for `--machine-readable` flag (new flag to be added)
- Pretty colored output for development (when not machine-readable)
- Debug level controlled by `--verbose` flag

**Success Definition**:

- Logger utility exists at `src/utils/logger.ts`
- Exports `LogLevel` enum with DEBUG, INFO, WARN, ERROR values
- Exports `getLogger(context: string): Logger` factory function
- `Logger` type with debug(), info(), warn(), error() methods
- All logs include timestamp, level, context, message fields
- Sensitive data (API keys, tokens, passwords) is redacted automatically
- When `--machine-readable` flag is set, output is pure JSON
- When `--verbose` flag is set, DEBUG level logs are output
- All tests pass: `npm run test:run -- tests/unit/utils/logger.test.ts`
- 100% code coverage achieved

## User Persona (if applicable)

**Target User**: PRPPipeline developers and operators

**Use Case**: The logger utility enables:

1. Consistent structured logging across the entire pipeline
2. Debug visibility during development with `--verbose`
3. Machine-readable JSON logs for log aggregation systems
4. Automatic redaction of sensitive data (API keys, tokens)
5. Context-aware logging for debugging complex workflows

**User Journey**:

1. Developer imports `getLogger` from `./utils/logger.js`
2. Developer creates logger with context: `const logger = getLogger('PRPPipeline')`
3. Developer logs events: `logger.info('Starting workflow', { taskId: 'P1.M1.T1' })`
4. In development (no flags): Pretty colored output with context prefix
5. With `--verbose`: Debug logs appear with detailed trace information
6. With `--machine-readable`: Pure JSON output for log aggregation
7. Sensitive data is automatically redacted in all output modes

**Pain Points Addressed**:

- **Inconsistent Logging**: Currently 1,458 console.\* calls with inconsistent formats
- **Sensitive Data Exposure**: No automatic redaction of API keys/tokens
- **No Machine-Readable Output**: Can't integrate with log aggregation tools
- **Verbose Mode Scattered**: Debug logging is scattered with conditional checks
- **No Context Tracking**: Hard to trace which component logged what

## Why

- **Observability**: Structured logging enables better debugging and monitoring
- **Security**: Automatic sensitive data redaction prevents credential leakage
- **CI/CD Integration**: JSON output enables log aggregation in production
- **Developer Experience**: Pretty colored output and context prefixes improve DX
- **Consistency**: Single logger utility replaces scattered console.\* calls
- **Foundation**: This logger will be integrated throughout the pipeline in P5.M1.T1.S2

## What

### Input

- **CLI Flags** (from `src/cli/index.ts`):
  - `--verbose`: Boolean flag for enabling DEBUG level (already implemented)
  - `--machine-readable`: Boolean flag for JSON output (needs to be added)

- **Existing Logging Patterns**:
  - Direct `console.log()` calls throughout codebase (1,458 occurrences)
  - Groundswell's `this.logger` in workflow classes (structured logging)
  - `console.error()` for verbose debugging in `src/index.ts`

- **Codebase Context**:
  - TypeScript project with Vitest testing
  - Existing utils at `src/utils/git-commit.ts` and `src/utils/task-utils.ts`
  - Named exports pattern for utilities
  - 100% code coverage requirement

### State Changes

- **ADD** to `package.json`:
  - `pino`: ^9.x.x (structured logging library)
  - `pino-pretty`: ^11.x.x (dev dependency for pretty output)
  - `@types/pino`: Included with pino package

- **ADD** to `src/cli/index.ts`:
  - `--machine-readable` flag definition (boolean, defaults to false)
  - Add to `CLIArgs` interface

- **CREATE** `src/utils/logger.ts`:
  - `LogLevel` enum export
  - `Logger` interface export
  - `getLogger()` factory function export
  - Internal singleton pattern for Pino instance
  - Redaction configuration
  - Format configuration (pretty vs JSON)

- **CREATE** `tests/unit/utils/logger.test.ts`:
  - Unit tests for all logger functionality
  - 100% coverage of logger utility

### Output

- **Logger Utility Module**: `src/utils/logger.ts`
- **Unit Tests**: `tests/unit/utils/logger.test.ts`
- **CLI Enhancement**: `--machine-readable` flag added
- **Documentation**: JSDoc comments on all exports

### Success Criteria

- [ ] `pino` and `pino-pretty` added to package.json dependencies
- [ ] `--machine-readable` flag added to `src/cli/index.ts`
- [ ] Logger utility created at `src/utils/logger.ts`
- [ ] `LogLevel` enum exported with DEBUG, INFO, WARN, ERROR
- [ ] `Logger` interface exported with debug(), info(), warn(), error()
- [ ] `getLogger(context: string): Logger` exported
- [ ] All logs include timestamp, level, context, message fields
- [ ] Sensitive data redaction configured (password, token, api_key, secret, authorization)
- [ ] Pretty colored output used when `--machine-readable` is false (default)
- [ ] JSON output used when `--machine-readable` is true
- [ ] DEBUG level logs only shown when `--verbose` is true
- [ ] INFO, WARN, ERROR always shown
- [ ] All tests pass: `npm run test:run -- tests/unit/utils/logger.test.ts`
- [ ] 100% code coverage achieved

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement the logger utility successfully?

**Answer**: **YES** - This PRP provides:

- Complete CLI flag implementation patterns (--verbose, new --machine-readable)
- Exact file paths and import patterns for utilities
- Naming conventions (feature-utils.ts pattern)
- Test patterns with comprehensive examples
- Pino configuration specifics (redaction, formatters, transports)
- Known gotchas and anti-patterns to avoid
- Validation commands that are project-specific

### Documentation & References

```yaml
# MUST READ - CLI Flag Implementation Pattern
- file: /home/dustin/projects/hacky-hack/src/cli/index.ts
  why: Complete pattern for adding CLI flags with Commander.js
  pattern: Boolean flag definition with default value, type definition in CLIArgs interface
  critical: Lines 112-114 (.option() pattern), lines 48-66 (CLIArgs interface)
  gotcha: Boolean flags MUST have explicit default (false) as third parameter

# MUST READ - Utility Export Pattern
- file: /home/dustin/projects/hacky-hack/src/utils/git-commit.ts
  why: Reference for utility file structure, named exports, JSDoc documentation
  pattern: Module-level JSDoc, named exports, clear function documentation
  critical: Lines 1-21 (module JSDoc), 22-84 (helper functions), 124-206 (main function)
  gotcha: Use named exports only, no default exports

# MUST READ - Utility Export Pattern (Alternative)
- file: /home/dustin/projects/hacky-hack/src/utils/task-utils.ts
  why: Reference for utility with type exports and multiple functions
  pattern: Type exports alongside function exports, comprehensive JSDoc
  critical: Lines 1-18 (module JSDoc), 47-65 (type guard pattern), 63-64 (isSubtask type guard)
  gotcha: Export types alongside functions for TypeScript consumers

# MUST READ - Main Entry Point (Verbose Flag Usage)
- file: /home/dustin/projects/hacky-hack/src/index.ts
  why: How --verbose flag is currently used for conditional logging
  pattern: if (args.verbose) { console.error('[Context] Debug message'); }
  critical: Lines 52-69 (setupGlobalHandlers), 95-107 (verbose logging examples)
  gotcha: console.error used for verbose messages to avoid interfering with stdout

# MUST READ - Test Pattern for Utilities
- file: /home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts
  why: Complete test pattern to follow for utility testing
  pattern: beforeEach with vi.clearAllMocks(), SETUP/EXECUTE/VERIFY comments, describe blocks
  critical: Lines 31-36 (test structure), 38-57 (typical test case)
  gotcha: Import from .js files (ESM build requirement)

# MUST READ - Test Pattern for Pure Functions
- file: /home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts
  why: Test pattern for utilities with factory functions and complex types
  pattern: Factory functions for test data, comprehensive edge case coverage
  critical: Lines 31-90 (factory functions), 92-100 (test backlog creation)
  gotcha: Create reusable factory functions for test data

# MUST READ - Vitest Configuration
- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Test runner configuration, coverage thresholds, path aliases
  pattern: describe/it/expect/vi globals, 100% coverage required
  critical: Lines 15-18 (include patterns), 30-37 (coverage thresholds)
  gotcha: Use .js extension for imports (ESM build)

# REFERENCE - Package.json Scripts
- file: /home/dustin/projects/hacky-hack/package.json
  why: Available test and validation scripts
  pattern: npm run test:run, npm run test:coverage, npm run typecheck
  critical: Lines 29-33 (test scripts), 41 (validate script)
  gotcha: Coverage thresholds enforced - 100% required

# RESEARCH - Pino Documentation (Official)
- url: https://getpino.io/#/docs/api?id=pino
  why: Complete Pino API reference for logger configuration
  section: pino() constructor options, redact option, formatters

- url: https://getpino.io/#/docs/api?id=redaction
  why: Built-in redaction configuration for sensitive data
  section: redact option with wildcard patterns

- url: https://github.com/pinojs/pino-pretty
  why: Pino Pretty for colored development output
  section: Options for colorize, translateTime, ignore

# RESEARCH - Pino TypeScript Usage
- url: https://getpino.io/#/docs/api?id=pino-pino-options
  why: TypeScript-specific configuration and type definitions
  section: Type-safe logger creation, custom serializers

# RESEARCH - Console Log Replacement
- stored: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/P5M1T1S1/research/console-log-analysis.md
  why: Complete analysis of current console.* usage in codebase
  section: Current logging patterns, sensitive data analysis, replacement recommendations
```

### Current Codebase Tree

```bash
hacky-hack/
├── package.json                             # ADD: pino, pino-pretty dependencies
├── vitest.config.ts                         # Test runner configuration
├── tsconfig.json                            # TypeScript configuration
├── src/
│   ├── index.ts                             # Main entry point (uses args.verbose)
│   ├── cli/
│   │   └── index.ts                         # MODIFY: Add --machine-readable flag
│   ├── utils/
│   │   ├── git-commit.ts                    # REFERENCE: Utility pattern (named exports)
│   │   └── task-utils.ts                    # REFERENCE: Utility with type exports
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── git-commit.test.ts           # REFERENCE: Utility test pattern
│   │   │   └── task-utils.test.ts           # REFERENCE: Pure function test pattern
│   │   └── ...
│   └── ...
└── plan/
    └── 001_14b9dc2a33c7/
        └── P5M1T1S1/
            └── PRP.md                        # THIS DOCUMENT
```

### Desired Codebase Tree (files to add)

```bash
src/
├── cli/
│   └── index.ts                             # MODIFY: Add --machine-readable flag
│       # Add to CLIArgs interface: machineReadable: boolean
│       # Add .option() call: .option('--machine-readable', 'Enable JSON output', false)
└── utils/
    └── logger.ts                            # CREATE: Logger utility
        # Export: enum LogLevel { DEBUG, INFO, WARN, ERROR }
        # Export: interface Logger { debug(), info(), warn(), error() }
        # Export: function getLogger(context: string): Logger
        # Internal: Pino instance with redaction, formatters

tests/
└── unit/
    └── utils/
        └── logger.test.ts                   # CREATE: Logger utility tests
            # Test: LogLevel enum values
            # Test: getLogger() returns Logger interface
            # Test: Logger methods (debug, info, warn, error)
            # Test: Sensitive data redaction
            # Test: Timestamp in all log entries
            # Test: Context in all log entries
            # Test: Machine-readable mode (JSON)
            # Test: Pretty mode (colored)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Boolean Flags Must Have Explicit Default
// Commander.js boolean flags REQUIRE explicit default value
// Pattern: .option('--flag-name', 'Description', false)
// Gotcha: Omitting third parameter makes flag undefined, not boolean

// CRITICAL: Use .js Extensions for Imports (ESM)
// Vitest uses ESM build, imports must use .js even for .ts files
// Pattern: import { getLogger } from './utils/logger.js'
// Gotcha: Using .ts extension causes module resolution errors

// CRITICAL: Named Exports Only (No Default Exports)
// Codebase convention uses named exports for utilities
// Pattern: export function getLogger() {} not export default function getLogger() {}
// Gotcha: Default exports break tree-shaking and make refactoring harder

// CRITICAL: 100% Code Coverage Required
// Vitest config enforces 100% coverage for all source files
// Pattern: Test happy paths, error paths, and edge cases
// Gotcha: Missing any code path will fail the build

// CRITICAL: Pino Redaction Uses Wildcard Paths
// Redaction supports wildcard patterns for nested objects
// Pattern: redact: ['password', '*.token', 'request.headers.authorization']
// Gotcha: Wildcard * matches any single path segment, ** is not supported

// CRITICAL: Pino Pretty is Dev Dependency Only
// pino-pretty should NOT be used in production
// Pattern: Use pino-pretty only when NODE_ENV === 'development'
// Gotcha: Forgetting environment check causes production pretty print

// CRITICAL: Logger Singleton Pattern
// Only one Pino instance should exist per application
// Pattern: Module-level variable cached after first initialization
// Gotcha: Creating multiple instances causes duplicate log entries

// CRITICAL: Console.Error for Verbose Messages
// Current codebase uses console.error for verbose debug messages
// Pattern: console.error('[Context] Debug message')
// Gotcha: Don't switch to console.log for verbose (breaks stdout parsing)

// CRITICAL: Redaction Happens Before Serialization
// Pino redacts data before converting to JSON string
// Pattern: Fields are replaced with { value: '[REDACTED]' }
// Gotcha: Redacted values still appear in logs, just with placeholder

// CRITICAL: Machine-Readable Flag Does Not Exist Yet
// --machine-readable flag needs to be added to CLI
// Pattern: Add to CLIArgs interface, add .option() call in parseCLIArgs()
// Gotcha: Forgetting to add to interface causes TypeScript errors

// CRITICAL: Logger Context is String, Not Object
// getLogger() takes string context for component identification
// Pattern: getLogger('PRPPipeline') not getLogger({ component: 'PRPPipeline' })
// Gotcha: Context is added as field, not merged with log data

// CRITICAL: Timestamp Format is ISO 8601 by Default
// Pino uses ISO 8601 timestamps (epoch: false is default)
// Pattern: "2024-01-13T10:30:00.000Z" format
// Gotcha: Don't override timestamp formatter unless required

// CRITICAL: Log Level is Integer, Not String
// Pino uses integer log levels internally (30=info, 40=warn, 50=error)
// Pattern: Use string names ('info', 'warn') in API, integers are internal
// Gotcha: Don't use magic numbers, use LogLevel enum

// CRITICAL: Pino Pretty Requires Stream Configuration
// pino-pretty is configured via transport.target, not direct import
// Pattern: transport: { target: 'pino-pretty', options: { colorize: true } }
// Gotcha: Importing pino-pretty directly breaks in ESM builds
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Log level enum matching Pino's internal levels
export enum LogLevel {
  DEBUG = 10, // Silent by default, enabled with --verbose
  INFO = 30, // Always shown
  WARN = 40, // Always shown
  ERROR = 50, // Always shown
}

// Logger interface with typed methods
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>
  ): void;
}

// Internal logger configuration (not exported)
interface LoggerConfig {
  level: LogLevel;
  machineReadable: boolean;
  verbose: boolean;
  context: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY package.json
  - ADD: pino dependency (^9.x.x)
  - ADD: pino-pretty devDependency (^11.x.x)
  - RUN: npm install to install dependencies
  - NAMING: Follow existing dependency version format
  - PLACEMENT: dependencies section (pino), devDependencies (pino-pretty)

Task 2: MODIFY src/cli/index.ts
  - ADD: machineReadable property to CLIArgs interface (line ~65)
  - ADD: .option() call for --machine-readable flag (line ~114)
  - PATTERN: Follow existing boolean flag pattern (.option('--verbose', 'Enable debug logging', false))
  - NAMING: machineReadable: boolean in interface, --machine-readable in option
  - PLACEMENT: After verbose option (maintain alphabetical/logical order)
  - GOTCHA: Boolean flag MUST have explicit default (false) as third parameter

Task 3: CREATE src/utils/logger.ts structure
  - CREATE: File with module-level JSDoc documentation
  - IMPORT: pino from 'pino'
  - DEFINE: LogLevel enum (DEBUG = 10, INFO = 30, WARN = 40, ERROR = 50)
  - DEFINE: Logger interface with debug(), info(), warn(), error() methods
  - EXPORT: LogLevel enum
  - EXPORT: Logger interface
  - FOLLOW pattern: src/utils/git-commit.ts (module JSDoc, export style)
  - NAMING: CamelCase for types, camelCase for functions
  - PLACEMENT: src/utils/logger.ts

Task 4: IMPLEMENT internal Pino configuration in logger.ts
  - CREATE: Module-level variable for Pino instance (singleton pattern)
  - CONFIGURE: redact option with sensitive fields
    - Fields: password, token, api_key, secret, authorization, *.password, *.token
  - CONFIGURE: formatters.level for custom level formatting (string label)
  - CONFIGURE: formatters.log for adding timestamp and context
  - CONFIGURE: timestamp option (iso8601 format)
  - PATTERN: Use conditional pino-pretty transport based on environment and flags
  - GOTCHA: pino-pretty is dev-only, use transport.target not direct import
  - PLACEMENT: Internal (not exported), inside getLogger() factory

Task 5: IMPLEMENT getLogger() factory function in logger.ts
  - IMPLEMENT: function getLogger(context: string): Logger
  - CREATE: Child logger with context binding using pino.child()
  - RETURN: Logger interface object with debug(), info(), warn(), error() methods
  - HANDLE: verbose flag for DEBUG level enablement
  - HANDLE: machineReadable flag for JSON vs pretty output
  - PATTERN: Singleton - reuse existing Pino instance if already initialized
  - NAMING: getLogger (lowercase 'get' prefix, following getDependencies pattern)
  - PLACEMENT: After type definitions, as main export

Task 6: IMPLEMENT Logger methods in getLogger() return
  - IMPLEMENT: debug(message, data) method
    - Conditionally log only when verbose is true
    - Use pinoLogger.debug() internally
  - IMPLEMENT: info(message, data) method
    - Always log (no condition)
    - Use pinoLogger.info() internally
  - IMPLEMENT: warn(message, data) method
    - Always log (no condition)
    - Use pinoLogger.warn() internally
  - IMPLEMENT: error(message, error, data) method
    - Handle Error objects specially (extract message, stack)
    - Always log (no condition)
    - Use pinoLogger.error() internally
  - PATTERN: Merge message and data into single log object
  - GOTCHA: Error.stack only included when verbose is true
  - PLACEMENT: Return object of getLogger() function

Task 7: CREATE tests/unit/utils/logger.test.ts structure
  - CREATE: Test file with module-level JSDoc
  - IMPORT: describe, expect, it, vi, beforeEach, afterEach from 'vitest'
  - IMPORT: LogLevel, getLogger, type Logger from '../../../src/utils/logger.js'
  - SETUP: beforeEach() with vi.clearAllMocks()
  - SETUP: afterEach() with any cleanup if needed
  - FOLLOW pattern: tests/unit/utils/git-commit.test.ts (test structure)
  - NAMING: logger.test.ts (matches source file name)
  - PLACEMENT: tests/unit/utils/logger.test.ts

Task 8: IMPLEMENT tests for LogLevel enum
  - TEST: LogLevel.DEBUG equals 10
  - TEST: LogLevel.INFO equals 30
  - TEST: LogLevel.WARN equals 40
  - TEST: LogLevel.ERROR equals 50
  - PATTERN: describe('LogLevel enum', () => { ... })
  - PLACEMENT: First describe block in test file

Task 9: IMPLEMENT tests for getLogger() factory
  - TEST: getLogger() returns Logger interface
  - TEST: getLogger() with different contexts returns different loggers
  - TEST: getLogger() reuses same Pino instance (singleton)
  - PATTERN: describe('getLogger', () => { ... })
  - PLACEMENT: Second describe block in test file

Task 10: IMPLEMENT tests for Logger.debug() method
  - TEST: debug() does not log when verbose is false
  - TEST: debug() logs when verbose is true
  - TEST: debug() includes context in log output
  - TEST: debug() includes timestamp in log output
  - TEST: debug() includes data in log output
  - PATTERN: describe('Logger.debug', () => { ... })
  - MOCK: Pino instance or capture console output
  - PLACEMENT: Third describe block in test file

Task 11: IMPLEMENT tests for Logger.info(), warn(), error() methods
  - TEST: info() always logs (regardless of verbose)
  - TEST: warn() always logs (regardless of verbose)
  - TEST: error() always logs (regardless of verbose)
  - TEST: error() with Error object includes message and stack (when verbose)
  - TEST: error() without Error object logs message only
  - TEST: All methods include context and timestamp
  - PATTERN: describe('Logger methods', () => { ... })
  - PLACEMENT: Fourth describe block in test file

Task 12: IMPLEMENT tests for sensitive data redaction
  - TEST: Logging object with password field redacts value
  - TEST: Logging object with token field redacts value
  - TEST: Logging object with api_key field redacts value
  - TEST: Logging object with secret field redacts value
  - TEST: Logging object with authorization field redacts value
  - TEST: Nested password.* fields are redacted
  - TEST: Non-sensitive fields are not redacted
  - PATTERN: describe('Sensitive data redaction', () => { ... })
  - VERIFY: Redacted values show as '[REDACTED]' or similar
  - PLACEMENT: Fifth describe block in test file

Task 13: IMPLEMENT tests for machine-readable mode
  - TEST: When machineReadable is true, output is JSON
  - TEST: When machineReadable is false, output is pretty (if dev)
  - TEST: JSON output includes all expected fields
  - PATTERN: describe('Machine-readable mode', () => { ... })
  - MOCK: CLI args or configuration flags
  - PLACEMENT: Sixth describe block in test file

Task 14: VERIFY test coverage
  - RUN: npm run test:coverage -- tests/unit/utils/logger.test.ts
  - VERIFY: 100% coverage for src/utils/logger.ts
  - VERIFY: All branches covered (verbose true/false, machine-readable true/false)
  - VERIFY: All functions covered (getLogger, all Logger methods)
  - GOTCHA: Coverage threshold is enforced - 100% required

Task 15: VERIFY tests pass
  - RUN: npm run test:run -- tests/unit/utils/logger.test.ts
  - VERIFY: All tests pass
  - VERIFY: No flaky tests (run multiple times)
  - VERIFY: Test execution time is reasonable (<5 seconds)

Task 16: VERIFY type checking
  - RUN: npm run typecheck
  - VERIFY: No type errors in src/utils/logger.ts
  - VERIFY: No type errors in tests/unit/utils/logger.test.ts
  - VERIFY: No type errors in src/cli/index.ts (machine-readable addition)

Task 17: VERIFY formatting and linting
  - RUN: npm run format:check -- src/utils/logger.ts tests/unit/utils/logger.test.ts src/cli/index.ts
  - RUN: npm run lint -- src/utils/logger.ts tests/unit/utils/logger.test.ts src/cli/index.ts
  - VERIFY: No formatting issues
  - VERIFY: No linting errors
```

### Implementation Patterns & Key Details

````typescript
// =============================================================================
// MODULE STRUCTURE (src/utils/logger.ts)
// =============================================================================

/**
 * Logger utility for PRP Pipeline
 *
 * @module utils/logger
 *
 * @remarks
 * Provides structured logging with Pino for consistent observability.
 * Supports sensitive data redaction, machine-readable JSON output,
 * and context-aware logging for debugging complex workflows.
 *
 * @example
 * ```typescript
 * import { getLogger, LogLevel } from './utils/logger.js';
 *
 * const logger = getLogger('PRPPipeline');
 * logger.info('Starting workflow', { taskId: 'P1.M1.T1' });
 * logger.debug('Detailed trace', { internalState: '...' }); // Only with --verbose
 * logger.error('Failed to execute', error, { context: '...' });
 * ```
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Log level enumeration matching Pino's internal numeric levels
 *
 * @remarks
 * Pino uses numeric levels for performance:
 * - DEBUG (10): Detailed trace information, only shown with --verbose
 * - INFO (30): General informational messages
 * - WARN (40): Warning messages for potentially harmful situations
 * - ERROR (50): Error messages for error events
 *
 * @see {@link https://getpino.io/#/docs/api?id=log-levels | Pino Log Levels}
 */
export enum LogLevel {
  /** Detailed trace information (verbose only) */
  DEBUG = 10,
  /** General informational messages */
  INFO = 30,
  /** Warning messages */
  WARN = 40,
  /** Error messages */
  ERROR = 50,
}

/**
 * Logger interface with typed methods
 *
 * @remarks
 * All methods accept an optional data object for structured logging.
 * The error() method accepts an optional Error object as second parameter.
 */
export interface Logger {
  /**
   * Log debug message (only shown when --verbose is enabled)
   *
   * @param message - Log message
   * @param data - Optional structured data to include in log
   */
  debug(message: string, data?: Record<string, unknown>): void;

  /**
   * Log info message (always shown)
   *
   * @param message - Log message
   * @param data - Optional structured data to include in log
   */
  info(message: string, data?: Record<string, unknown>): void;

  /**
   * Log warning message (always shown)
   *
   * @param message - Log message
   * @param data - Optional structured data to include in log
   */
  warn(message: string, data?: Record<string, unknown>): void;

  /**
   * Log error message (always shown)
   *
   * @param message - Log message
   * @param error - Optional Error object (includes stack trace when verbose)
   * @param data - Optional structured data to include in log
   */
  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>
  ): void;
}

// =============================================================================
// INTERNAL STATE (Singleton Pattern)
// =============================================================================

/**
 * Global logger configuration (set once on first getLogger call)
 *
 * @remarks
 * Cached after first initialization to ensure single Pino instance.
 * Reset in tests with resetLogger() for test isolation.
 */
let globalConfig: {
  verbose: boolean;
  machineReadable: boolean;
} | null = null;

/** Cached Pino instance (singleton pattern) */
let pinoInstance: import('pino').Logger | null = null;

// =============================================================================
// HELPER FUNCTION: Initialize Pino
// =============================================================================

/**
 * Creates or returns cached Pino instance
 *
 * @remarks
 * Uses singleton pattern to ensure only one Pino instance exists.
 * Configures redaction, formatters, and transport based on flags.
 *
 * Pino redaction configuration:
 * - password: Redact top-level password field
 * - token: Redact top-level token field
 * - api_key: Redact top-level api_key field
 * - secret: Redact top-level secret field
 * - authorization: Redact top-level authorization field
 * - *.password: Redact nested password fields (one level deep)
 * - *.token: Redact nested token fields (one level deep)
 *
 * Pino pretty transport (dev only, not machine-readable):
 * - colorize: true (colored output)
 * - translateTime: 'SYS:standard' (human-readable timestamps)
 * - ignore: 'pid,hostname' (exclude process fields)
 */
function initializePino(
  verbose: boolean,
  machineReadable: boolean
): import('pino').Logger {
  if (pinoInstance) {
    return pinoInstance;
  }

  const pino = await import('pino');

  // Determine log level based on verbose flag
  const level = verbose ? LogLevel.DEBUG : LogLevel.INFO;

  // Configure pino-pretty transport for development
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const usePretty = !machineReadable && isDevelopment;

  // Create Pino instance
  pinoInstance = pino.pino(
    {
      level: pino.pino.levels.labels[level], // Convert number to string ('debug', 'info')
      redact: [
        'password',
        'token',
        'api_key',
        'secret',
        'authorization',
        '*.password',
        '*.token',
      ],
      formatters: {
        level: label => {
          return { level: label };
        },
        log: object => {
          return { ...object, time: new Date().toISOString() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    usePretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : undefined
  );

  return pinoInstance;
}

// =============================================================================
// MAIN EXPORT: getLogger Factory Function
// =============================================================================

/**
 * Creates a logger instance with the specified context
 *
 * @param context - Component/module identifier for log attribution
 * @returns Logger instance with debug(), info(), warn(), error() methods
 *
 * @remarks
 * **Usage**:
 * ```typescript
 * const logger = getLogger('PRPPipeline');
 * logger.info('Starting workflow');
 * ```
 *
 * **Context Parameter**:
 * - The context string is added to all log entries from this logger
 * - Use component name (e.g., 'PRPPipeline', 'TaskOrchestrator')
 * - Helps identify which component logged which message
 *
 * **Verbose Behavior**:
 * - When `--verbose` flag is set, DEBUG level logs are shown
 * - When `--verbose` flag is not set, DEBUG level logs are suppressed
 * - INFO, WARN, ERROR are always shown regardless of verbose
 *
 * **Machine-Readable Behavior**:
 * - When `--machine-readable` flag is set, output is pure JSON
 * - When `--machine-readable` flag is not set, output is pretty colored (dev only)
 *
 * **Redaction**:
 * - Sensitive fields (password, token, api_key, secret, authorization) are auto-redacted
 * - Nested sensitive fields are also redacted (*.password, *.token)
 * - Redacted values appear as `[Redacted]` in log output
 *
 * @example
 * ```typescript
 * import { getLogger } from './utils/logger.js';
 *
 * const logger = getLogger('MyComponent');
 * logger.info('Processing task', { taskId: 'P1.M1.T1', count: 42 });
 * // Output: {"level":"info","time":"2024-01-13T10:30:00.000Z","context":"MyComponent","message":"Processing task","taskId":"P1.M1.T1","count":42}
 *
 * logger.debug('Internal state', { debugData: '...' });
 * // Only shown when --verbose flag is set
 *
 * logger.error('Failed to process', error, { retryCount: 3 });
 * // Output: {"level":"error","time":"...","context":"MyComponent","message":"Failed to process","error":"Error message","retryCount":3}
 * ```
 */
export function getLogger(
  context: string,
  options?: { verbose?: boolean; machineReadable?: boolean }
): Logger {
  // Initialize global config on first call
  if (globalConfig === null) {
    globalConfig = {
      verbose: options?.verbose ?? false,
      machineReadable: options?.machineReadable ?? false,
    };
  }

  // Get or create Pino instance
  const pinoLogger = initializePino(
    globalConfig.verbose,
    globalConfig.machineReadable
  );

  // Create child logger with context
  const childLogger = pinoLogger.child({ context });

  // Return Logger interface
  return {
    debug(message: string, data?: Record<string, unknown>): void {
      // Only log debug when verbose is enabled
      if (globalConfig!.verbose) {
        childLogger.debug({ ...data }, message);
      }
    },

    info(message: string, data?: Record<string, unknown>): void {
      childLogger.info({ ...data }, message);
    },

    warn(message: string, data?: Record<string, unknown>): void {
      childLogger.warn({ ...data }, message);
    },

    error(
      message: string,
      error?: Error | unknown,
      data?: Record<string, unknown>
    ): void {
      // Extract error information
      const errorInfo: Record<string, unknown> = { ...data };

      if (error instanceof Error) {
        errorInfo.error = error.message;
        // Only include stack trace when verbose is enabled
        if (globalConfig!.verbose && error.stack) {
          errorInfo.stack = error.stack;
        }
      } else if (error !== undefined) {
        errorInfo.error = String(error);
      }

      childLogger.error(errorInfo, message);
    },
  };
}

// =============================================================================
// TEST HELPER: Reset Logger (for test isolation)
// =============================================================================

/**
 * Resets global logger state (for testing only)
 *
 * @remarks
 * Exported only for test isolation. Not used in production code.
 * Call this in test beforeEach to ensure clean state.
 *
 * @example
 * ```typescript
 * import { resetLogger } from './utils/logger.js';
 *
 * beforeEach(() => {
 *   resetLogger();
 * });
 * ```
 */
export function resetLogger(): void {
  globalConfig = null;
  pinoInstance = null;
}
````

### Integration Points

```yaml
CLI_ARGS:
  - modify: src/cli/index.ts
  - add to: CLIArgs interface (line ~65)
    - machineReadable: boolean
  - add to: parseCLIArgs() function (line ~114)
    - .option('--machine-readable', 'Enable JSON output', false)
  - pattern: Follow existing boolean flag pattern (verbose, dry-run, continue)

PACKAGE_JSON:
  - add to: dependencies
    - "pino": "^9.0.0"
  - add to: devDependencies
    - "pino-pretty": "^11.0.0"
  - pattern: Follow existing dependency version format

INDEX_TS:
  - reference: src/index.ts (lines 95-107)
  - pattern: if (args.verbose) { console.error('[Context] Debug message'); }
  - future: Will be replaced with logger usage in P5.M1.T1.S2

WORKFLOW_CLASSES:
  - reference: Groundswell Workflow base class
  - pattern: this.logger.info('[WorkflowClass] Message')
  - future: May migrate to new logger in future work items
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Type check new files
npx tsc --noEmit src/utils/logger.ts
npx tsc --noEmit tests/unit/utils/logger.test.ts
npx tsc --noEmit src/cli/index.ts

# Expected: Zero type errors
# If errors exist, READ output and fix before proceeding

# Format check
npm run format:check -- src/utils/logger.ts tests/unit/utils/logger.test.ts src/cli/index.ts

# Expected: Zero formatting issues
# If issues exist, run npm run format -- to fix

# Lint check
npm run lint -- src/utils/logger.ts tests/unit/utils/logger.test.ts src/cli/index.ts

# Expected: Zero linting errors
# If errors exist, READ output and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run logger tests in isolation
npm run test:run -- tests/unit/utils/logger.test.ts

# Expected output:
// ✓ tests/unit/utils/logger.test.ts (X tests)
//   ✓ LogLevel enum
//     ✓ DEBUG equals 10
//     ✓ INFO equals 30
//     ✓ WARN equals 40
//     ✓ ERROR equals 50
//   ✓ getLogger factory
//     ✓ returns Logger interface
//     ✓ creates different loggers for different contexts
//     ✓ reuses same Pino instance (singleton)
//   ✓ Logger.debug method
//     ✓ does not log when verbose is false
//     ✓ logs when verbose is true
//     ✓ includes context in log output
//     ✓ includes timestamp in log output
//     ✓ includes data in log output
//   ✓ Logger methods (info, warn, error)
//     ✓ info always logs
//     ✓ warn always logs
//     ✓ error always logs
//     ✓ error with Error includes message and stack (verbose)
//     ✓ error without Error logs message only
//   ✓ Sensitive data redaction
//     ✓ redacts password field
//     ✓ redacts token field
//     ✓ redacts api_key field
//     ✓ redacts secret field
//     ✓ redacts authorization field
//     ✓ redacts nested password fields
//     ✓ does not redact non-sensitive fields
//   ✓ Machine-readable mode
//     ✓ outputs JSON when machineReadable is true
//     ✓ outputs pretty when machineReadable is false
//     ✓ JSON includes all expected fields
//
// Test Files  1 passed (1)
// Tests  X passed (X)

# Run with coverage
npm run test:coverage -- tests/unit/utils/logger.test.ts

# Expected: 100% coverage for src/utils/logger.ts
# Coverage report should show:
// % Coverage report
//Statements   : 100% ( X/Y )
//Branches     : 100% ( X/Y )
//Functions    : 100% ( X/Y )
//Lines        : 100% ( X/Y )

# Verify no breaking changes to existing tests
npm run test:run -- tests/unit/utils/
npm run test:run -- tests/unit/cli/

# Expected: All existing tests still pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI argument parsing includes new flag
node dist/cli/index.js --help

# Expected output should include:
// Options:
//   --prd <path>              Path to PRD markdown file
//   --scope <scope>           Scope identifier (e.g., P3.M4, P3.M4.T2)
//   --mode <mode>             Execution mode
//   --continue                Resume from previous session
//   --dry-run                 Show plan without executing
//   --verbose                 Enable debug logging
//   --machine-readable        Enable JSON output          <-- NEW FLAG

# Test logger import works
node -e "const { getLogger, LogLevel } = require('./dist/utils/logger.js'); console.log('Logger imported successfully');"

# Expected: No import errors

# Test basic logging (manual integration test)
cat > /tmp/test-logger.mjs << 'EOF'
import { getLogger } from './src/utils/logger.js';

const logger = getLogger('TestComponent');

console.log('=== Testing info log ===');
logger.info('Info message', { foo: 'bar' });

console.log('\n=== Testing debug log (should be hidden) ===');
logger.debug('Debug message', { internal: 'data' });

console.log('\n=== Testing warn log ===');
logger.warn('Warning message', { code: 123 });

console.log('\n=== Testing error log ===');
const error = new Error('Test error');
logger.error('Error message', error, { context: 'test' });

console.log('\n=== Testing redaction ===');
logger.info('Logging sensitive data', {
  username: 'alice',
  password: 'secret123',
  token: 'abc-def-ghi',
  normalField: 'visible'
});
EOF

tsx /tmp/test-logger.mjs

# Expected output:
// === Testing info log ===
// INFO (TestComponent): Info message  foo="bar"
//
// === Testing debug log (should be hidden) ===
// (no output - debug is hidden by default)
//
// === Testing warn log ===
// WARN (TestComponent): Warning message  code=123
//
// === Testing error log ===
// ERROR (TestComponent): Error message  error="Test error"  context="test"
//
// === Testing redaction ===
// INFO (TestComponent): Logging sensitive data  username="alice" password="[Redacted]" token="[Redacted]" normalField="visible"

# Test with verbose flag (shows debug logs)
cat > /tmp/test-logger-verbose.mjs << 'EOF'
import { getLogger } from './src/utils/logger.js';

const logger = getLogger('TestComponent', { verbose: true });
logger.debug('Debug message (should be visible)', { trace: 'data' });
EOF

tsx /tmp/test-logger-verbose.mjs

# Expected output:
// DEBUG (TestComponent): Debug message (should be visible)  trace="data"

# Test machine-readable mode (JSON output)
NODE_ENV=production tsx -e "
import { getLogger } from './src/utils/logger.js';
const logger = getLogger('TestComponent', { machineReadable: true });
logger.info('Info message', { foo: 'bar' });
"

# Expected output (JSON, single line):
// {"level":"info","time":"2024-01-13T10:30:00.000Z","context":"TestComponent","foo":"bar","msg":"Info message"}
```

### Level 4: Manual Validation (Developer Experience)

```bash
# Test colored output in development (default)
tsx -e "import { getLogger } from './src/utils/logger.js'; const logger = getLogger('ColorTest'); logger.info('This should be colored');"

# Expected: Colored output (if terminal supports colors)

# Test JSON output in production mode
NODE_ENV=production tsx -e "import { getLogger } from './src/utils/logger.js'; const logger = getLogger('JSONTest'); logger.info('This should be JSON');"

# Expected: JSON output (single line, no colors)

# Test verbose mode debugging
tsx -e "import { getLogger } from './src/utils/logger.js'; const logger = getLogger('VerboseTest', { verbose: true }); logger.debug('This debug message should be visible');"

# Expected: Debug log is visible

# Test non-verbose mode (debug hidden)
tsx -e "import { getLogger } from './src/utils/logger.js'; const logger = getLogger('NonVerboseTest'); logger.debug('This debug message should be hidden');"

# Expected: No output (debug is hidden)

# Test multiple loggers with different contexts
tsx -e "
import { getLogger } from './src/utils/logger.js';
const logger1 = getLogger('ComponentA');
const logger2 = getLogger('ComponentB');
logger1.info('Message from A');
logger2.warn('Message from B');
"

# Expected: Both logs with their respective contexts

# Test error logging with stack trace (verbose)
tsx -e "
import { getLogger } from './src/utils/logger.js';
const logger = getLogger('ErrorTest', { verbose: true });
const error = new Error('Test error with stack');
logger.error('Error occurred', error);
"

# Expected: Error log includes stack trace

# Test error logging without stack trace (non-verbose)
tsx -e "
import { getLogger } from './src/utils/logger.js';
const logger = getLogger('ErrorTest');
const error = new Error('Test error without stack');
logger.error('Error occurred', error);
"

# Expected: Error log includes message but not stack trace
```

### Level 5: Regression Testing

```bash
# Run all tests to ensure no breaking changes
npm run test:run

# Expected: All tests pass (existing + new logger tests)

# Run all tests with coverage
npm run test:coverage

# Expected: Coverage report shows 100% for logger, existing coverage maintained

# Type check entire project
npm run typecheck

# Expected: No type errors anywhere in project

# Format check entire project
npm run format:check

# Expected: No formatting issues

# Lint entire project
npm run lint

# Expected: No linting errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `pino` added to package.json dependencies
- [ ] `pino-pretty` added to package.json devDependencies
- [ ] `--machine-readable` flag added to src/cli/index.ts
- [ ] `machineReadable` property added to CLIArgs interface
- [ ] Logger utility created at src/utils/logger.ts
- [ ] `LogLevel` enum exported with DEBUG=10, INFO=30, WARN=40, ERROR=50
- [ ] `Logger` interface exported with debug(), info(), warn(), error() methods
- [ ] `getLogger(context: string): Logger` exported
- [ ] `resetLogger()` exported (for test isolation)
- [ ] All logs include timestamp field
- [ ] All logs include level field
- [ ] All logs include context field
- [ ] All logs include message field
- [ ] Sensitive data redaction configured (password, token, api_key, secret, authorization, _.password, _.token)
- [ ] Pretty colored output used when `--machine-readable` is false (development)
- [ ] JSON output used when `--machine-readable` is true
- [ ] DEBUG level logs only shown when `--verbose` is true
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`
- [ ] No linting errors: `npm run lint`

### Test Validation

- [ ] Test file created at tests/unit/utils/logger.test.ts
- [ ] All tests pass: `npm run test:run -- tests/unit/utils/logger.test.ts`
- [ ] 100% code coverage achieved: `npm run test:coverage -- tests/unit/utils/logger.test.ts`
- [ ] LogLevel enum values tested (DEBUG, INFO, WARN, ERROR)
- [ ] getLogger() factory tested (returns Logger, singleton pattern)
- [ ] Logger.debug() tested (verbose true/false, context, timestamp, data)
- [ ] Logger.info() tested (always logs, context, timestamp, data)
- [ ] Logger.warn() tested (always logs, context, timestamp, data)
- [ ] Logger.error() tested (always logs, Error object handling, stack trace)
- [ ] Sensitive data redaction tested (all sensitive fields)
- [ ] Machine-readable mode tested (JSON vs pretty output)
- [ ] Test isolation verified (resetLogger() in beforeEach)
- [ ] No flaky tests (run multiple times with consistent results)

### Code Quality Validation

- [ ] Follows existing utility patterns (git-commit.ts, task-utils.ts)
- [ ] JSDoc comments on all exports
- [ ] Module-level JSDoc with examples
- [ ] Named exports only (no default exports)
- [ ] File naming matches convention (logger.ts)
- [ ] TypeScript strict mode compliant
- [ ] No any types (use proper types)
- [ ] No console.\* in logger implementation (use Pino)
- [ ] Error handling for invalid inputs
- [ ] Immutable configuration (no mutation after initialization)

### Documentation & Sign-Off

- [ ] JSDoc complete with @remarks, @example, @see tags
- [ ] Usage examples provided
- [ ] Sensitive fields documented
- [ ] Verbose behavior documented
- [ ] Machine-readable behavior documented
- [ ] Research stored in plan/001_14b9dc2a33c7/P5M1T1S1/research/
- [ ] PRP document complete
- [ ] Ready for implementation

---

## Anti-Patterns to Avoid

- ❌ Don't create multiple Pino instances (use singleton pattern)
- ❌ Don't use default export (codebase uses named exports)
- ❌ Don't forget to add --machine-readable to CLIArgs interface
- ❌ Don't forget explicit default (false) for boolean flags in Commander.js
- ❌ Don't use .ts extension in imports (use .js for ESM)
- ❌ Don't skip 100% code coverage (threshold is enforced)
- ❌ Don't use console.log in logger implementation (use Pino)
- ❌ Don't log sensitive data without redaction
- ❌ Don't show DEBUG logs when verbose is false
- ❌ Don't use pino-pretty in production (dev only)
- ❌ Don't import pino-pretty directly (use transport.target)
- ❌ Don't forget to export resetLogger() for test isolation
- ❌ Don't use magic numbers for log levels (use LogLevel enum)
- ❌ Don't forget to handle Error objects in error() method
- ❌ Don't include stack traces when verbose is false
- ❌ Don't mutate configuration after initialization
- ❌ Don't create loggers without context (always specify context string)
- ❌ Don't mix data and error parameters in wrong order
- ❌ Don't use process.exit() in logger (let caller handle errors)

---

## Confidence Score

**10/10** - One-pass implementation success likelihood is very high.

**Rationale**:

- ✅ Complete CLI flag implementation pattern documented
- ✅ Exact utility file structure and export patterns provided
- ✅ Complete Pino configuration specifics (redaction, formatters, transports)
- ✅ Test patterns with comprehensive examples from existing tests
- ✅ All external research documented with specific URLs
- ✅ Known gotchas and anti-patterns well-documented
- ✅ Validation commands are project-specific and executable
- ✅ Task is well-scoped (single utility file + tests + CLI flag)
- ✅ No complex dependencies or integration challenges
- ✅ Clear success criteria with measurable outcomes

**Validation**: This PRP provides:

1. Complete CLI flag implementation pattern (--machine-readable addition)
2. Exact utility file structure following git-commit.ts and task-utils.ts patterns
3. Pino configuration with redaction, formatters, and transport specifics
4. Test patterns with SETUP/EXECUTE/VERIFY structure
5. Known gotchas for boolean flags, ESM imports, singleton pattern
6. Validation commands for type checking, testing, and coverage
7. 100% code coverage requirements and how to achieve them

The risk is minimal because:

1. Creating a logger utility is a well-understood pattern
2. Pino is a mature library with excellent TypeScript support
3. Test patterns are established and clear
4. No complex integration points (logger is standalone)
5. External research confirmed pino is the right choice
6. All configuration details are specified

---

## Research Notes

### Stored Research

The following research findings have been compiled for this PRP:

1. **CLI Argument Parsing** (from codebase exploration)
   - Commander.js version 14.0.2 used for CLI parsing
   - `--verbose` flag implemented at src/cli/index.ts:114
   - Boolean flag pattern: `.option('--verbose', 'Enable debug logging', false)`
   - `--machine-readable` flag does NOT exist (needs to be added)

2. **Console Usage Analysis** (from codebase exploration)
   - 1,458 console.\* occurrences across 134 files
   - Current pattern: console.log for user output, console.error for verbose debug
   - No sensitive data currently logged (good security practice)
   - Groundswell's this.logger used in workflow classes

3. **Utility Directory Patterns** (from codebase exploration)
   - src/utils/ contains git-commit.ts and task-utils.ts
   - Named exports only (no default exports)
   - File naming: feature-name-utils.ts (but this logger is just logger.ts)
   - Comprehensive JSDoc documentation with examples
   - Test files at tests/unit/utils/\*.test.ts

4. **Test Patterns** (from codebase exploration)
   - Vitest with describe/it/expect/vi/beforeEach/afterEach
   - SETUP/EXECUTE/VERIFY comment pattern
   - Factory functions for test data
   - vi.clearAllMocks() in beforeEach for test isolation
   - 100% code coverage enforced by vitest.config.ts

5. **Pino vs Winston Research** (from external research)
   - Pino recommended: better TypeScript support, superior performance
   - Pino has built-in redaction with wildcard patterns
   - pino-pretty for colored development output
   - Stream-based architecture for flexibility
   - Growing ecosystem with modern patterns

6. **Sensitive Data Redaction Research** (from external research)
   - Pino redact option: `['password', 'token', 'api_key', 'secret', '*.password', '*.token']`
   - Redaction happens before serialization
   - Redacted values appear as `[Redacted]` with value placeholder
   - Supports wildcard patterns for nested objects

### External Resources

Research findings are based on:

- Official Pino documentation (https://getpino.io/#/docs/api)
- Pino redaction guide (https://getpino.io/#/docs/api?id=redaction)
- Pino Pretty repository (https://github.com/pinojs/pino-pretty)
- Existing codebase patterns and conventions
- Project-specific test patterns and CLI implementation

### Key Insights

1. **Singleton Pattern Critical**: Only one Pino instance should exist to avoid duplicate logs
2. **Boolean Flag Defaults**: Commander.js requires explicit default (false) for boolean flags
3. **ESM Import Extensions**: Must use .js extension even for .ts files
4. **Redaction Configuration**: Pino's redact option supports wildcards for nested objects
5. **Pretty Output Dev-Only**: pino-pretty should only be used in development (check NODE_ENV)
6. **Verbose Controls DEBUG**: DEBUG level logs only shown when --verbose is true
7. **Machine-Readable Controls Format**: --machine-readable flag enables pure JSON output
8. **100% Coverage Enforced**: Missing any code path will fail the build

---

## Next Steps (After This PRP)

This PRP is for **P5.M1.T1.S1: Create logger utility** only.

The next work item **P5.M1.T1.S2: Integrate logger throughout pipeline** will:

1. Replace console.log calls with getLogger() usage
2. Replace console.error calls with logger.error()
3. Replace verbose console.error checks with logger.debug()
4. Update workflow classes to use new logger instead of Groundswell's this.logger (optional)

Do NOT integrate the logger throughout the codebase in this PRP. That work is scheduled for P5.M1.T1.S2.
