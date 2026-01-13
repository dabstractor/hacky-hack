name: "P5.M1.T1.S1: Create Logger Utility"
description: |

---

## Goal

**Feature Goal**: Replace all 135+ console.log statements with a centralized, structured logging utility using pino for performance and production-ready observability.

**Deliverable**: `src/utils/logger.ts` - A comprehensive logging utility module with log levels, context-aware loggers, sensitive data redaction, and machine-readable JSON output support.

**Success Definition**:

- Logger utility exports all required types and functions
- All existing console.log/error/warn statements can be systematically replaced
- Redaction rules protect API keys, tokens, and sensitive data
- --verbose flag enables debug-level logging
- --machine-readable flag enables JSON-only output
- Unit tests pass for all logger functionality

## Why

- **Observability**: Current console statements lack structure, making log aggregation and analysis difficult
- **Performance**: Pino is significantly faster than alternatives (pino vs winston benchmarks show 2-5x throughput advantage)
- **Production Readiness**: Structured JSON logs enable integration with log aggregators (ELK, Datadog, etc.)
- **Security**: Automatic redaction prevents accidental leakage of API keys, tokens, and sensitive data
- **Developer Experience**: Context-aware loggers with consistent formatting reduce cognitive load

## What

Create a structured logging utility module that:

### Core Requirements

- **Log Levels**: DEBUG, INFO, WARN, ERROR enum
- **Logger Factory**: `getLogger(context: string): Logger` function
- **Logger Methods**: `debug()`, `info()`, `warn()`, `error()` with consistent signatures
- **Metadata**: Include timestamp, level, context, message in all log entries
- **Sensitive Data Redaction**: Automatically redact API keys, tokens, passwords, emails
- **Configuration Modes**:
  - Development (default): Pretty-printed with colors for terminal readability
  - Production (--machine-readable): Pure JSON output for log parsing
  - Verbose (--verbose): Enable debug-level output

### Success Criteria

- [ ] Logger module compiles with TypeScript strict mode
- [ ] All log levels respect the configured minimum level
- [ ] Sensitive data redaction works for nested objects
- [ ] Pretty print mode is human-readable with colors
- [ ] Machine-readable mode outputs valid JSON only
- [ ] Context prefixes are consistently applied
- [ ] Unit tests cover all major code paths
- [ ] Zero TypeScript errors with `tsc --noEmit`

---

## All Needed Context

### Context Completeness Check

_The implementing agent has everything needed: codebase structure, existing patterns, CLI integration points, logging library choice rationale, and test patterns._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://getpino.io/#/docs/api
  why: Pino API reference for LoggerOptions, redact configuration, transport setup
  critical: Pino's redact option uses dot-notation paths and supports wildcards

- url: https://getpino.io/#/docs/redaction
  why: Detailed redaction configuration patterns for nested objects
  critical: Redaction paths must be exact - 'apiKey' redacts obj.apiKey but not obj.data.apiKey

- url: https://github.com/pinojs/pino-pretty
  why: Pretty print transport options for development mode
  critical: pino-pretty is a separate package that must be installed as devDependency

- url: https://github.com/pinojs/pino/blob/HEAD/docs/ecosystem.md
  why: Understanding transport options and stream configuration
  critical: For custom transports, use pino.multistream() not direct stream assignment

- file: src/cli/index.ts
  why: Current CLI flag parsing with Commander.js
  pattern: Add --machine-readable flag alongside existing --verbose flag
  gotcha: Commander.js requires both option definition and property on options object

- file: src/index.ts
  why: Main entry point showing verbose flag usage and error handling patterns
  pattern: Lines 102-103 show conditional logging based on verbose flag
  gotcha: Global handlers for uncaughtException use console.error - these remain unchanged

- file: src/config/environment.ts
  why: Configuration module pattern for environment variables
  pattern: configureEnvironment() function, getModel() accessor pattern
  gotcha: Use validateEnvironment() pattern for logger configuration validation

- file: src/scripts/validate-api.ts
  why: Existing colored logging utility for visual reference
  pattern: Lines 27-46 show ANSI color codes and icon prefixes
  gotcha: This is for scripts only - do NOT import this utility

- file: src/core/task-orchestrator.ts
  why: Heaviest console.log usage (45 statements) - primary migration target
  pattern: Log statements use [TaskOrchestrator] prefix extensively
  gotcha: Task state transitions are logged with specific patterns to preserve

- file: src/workflows/prp-pipeline.ts
  why: Second-heaviest logging (30 statements) with emoji prefixes
  pattern: Lines 56-62 show emoji usage for user-facing progress
  gotcha: Preserve emoji prefixes for user-facing logs in dev mode

- file: src/agents/prp-runtime.ts
  why: Mixed error and info logging patterns
  pattern: [PRPRuntime] Phase: ${subtask.id} pattern for phase tracking
  gotcha: Error patterns like '[Component] Failed: ${id} - ${error}' should be preserved

- file: package.json
  why: Current dependencies - need to add pino and pino-pretty
  pattern: No existing logging dependencies
  gotcha: pino-pretty is a devDependency only, pino is production dependency

- file: tsconfig.json
  why: TypeScript configuration for module resolution
  pattern: Check moduleResolution setting for proper pino imports
  gotcha: pino uses ESM - ensure tsconfig has moduleResolution: "bundler" or "node16"

- docfile: PRD.md
  why: Section 7.3 requirement for structured logging
  section: Section 7 - Improvements for the Rewrite, Point 3
  gotcha: Requirement is "structured logging instead of print -P" - implies bash migration context
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
│   ├── agent-factory.ts
│   ├── prp-executor.ts
│   ├── prp-generator.ts
│   └── prp-runtime.ts
├── cli/                 # CLI argument parsing
│   └── index.ts        # ADD: --machine-readable flag
├── config/              # Configuration modules
│   └── environment.ts
├── core/                # Core business logic
│   ├── prd-differ.ts
│   ├── research-queue.ts
│   ├── session-manager.ts
│   ├── session-utils.ts
│   ├── task-orchestrator.ts
│   └── task-patcher.ts
├── scripts/             # Utility scripts
│   └── validate-api.ts
├── tools/               # MCP tools
├── utils/               # General utilities
│   ├── git-commit.ts
│   ├── task-utils.ts
│   └── logger.ts       # CREATE: New logger utility
├── workflows/           # Workflow orchestrations
│   ├── bug-hunt-workflow.ts
│   ├── delta-analysis-workflow.ts
│   ├── fix-cycle-workflow.ts
│   ├── hello-world.ts
│   └── prp-pipeline.ts
└── index.ts            # Main entry point
```

### Desired Codebase Tree

```bash
src/utils/
├── git-commit.ts      # (existing)
├── task-utils.ts      # (existing)
├── logger.ts          # CREATE: Main logger module
│   ├── LogLevel enum (DEBUG, INFO, WARN, ERROR)
│   ├── Logger interface
│   ├── getLogger() factory function
│   ├── redaction paths configuration
│   └── pino logger instance with conditional transports
└── tests/             # CREATE: Test directory for utils
    └── logger.test.ts # CREATE: Logger unit tests
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Pino configuration gotchas

// 1. Redaction uses exact path matching
// This redacts obj.apiKey but NOT obj.credentials.apiKey
// Use wildcards: ['apiKey', 'credentials.*'] for nested redaction

// 2. Pretty print is separate package
// pino-pretty is NOT bundled with pino
// Must install: npm install pino && npm install -D pino-pretty

// 3. Transport vs stream confusion
// For custom transports use pino.transport() NOT direct stream assignment
// For pretty print use: transport: { target: 'pino-pretty', options: {...} }

// 4. Child loggers inherit redaction
// When using logger.child(), redaction configuration is inherited
// This is desired behavior - don't reconfigure

// 5. JSON mode is pino default
// No special config needed for machine-readable JSON output
// Just don't use pino-pretty transport

// 6. TypeScript types
// Import: import pino, { Logger as PinoLogger } from 'pino'
// Don't use default import only - named import gives proper types

// 7. Level validation
// pino() throws on invalid level strings
// Always validate against known levels before passing to config

// 8. Groundswell Framework
// Groundswell has its own this.logger - DO NOT replace it
// Only replace console.log/error/warn statements
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/utils/logger.ts

/**
 * Log levels enum matching pino standard levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger interface - consistent API across the application
 * Mirrors pino's Logger interface with type safety
 */
export interface Logger {
  /** Log at debug level - only shown when --verbose is enabled */
  debug(msg: string, ...args: unknown[]): void;
  debug(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at info level - default production level */
  info(msg: string, ...args: unknown[]): void;
  info(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at warn level - for non-critical issues */
  warn(msg: string, ...args: unknown[]): void;
  warn(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Log at error level - for failures and exceptions */
  error(msg: string, ...args: unknown[]): void;
  error(obj: unknown, msg?: string, ...args: unknown[]): void;

  /** Create a child logger with additional context */
  child(bindings: Record<string, unknown>): Logger;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Minimum log level (default: 'info') */
  level?: LogLevel;
  /** Enable machine-readable JSON output */
  machineReadable?: boolean;
  /** Enable debug-level logging (alias for level: 'debug') */
  verbose?: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD pino dependencies to package.json
  - INSTALL: pino@^9.0.0 as production dependency
  - INSTALL: pino-pretty@^11.0.0 as devDependency
  - INSTALL: @types/pino@^9.0.0 if not bundled (pino includes types as of v9)
  - RUN: npm install pino && npm install -D pino-pretty
  - VERIFY: package.json contains both dependencies

Task 2: MODIFY src/cli/index.ts - Add --machine-readable flag
  - FIND: Lines with existing --verbose flag definition (around line 20-30)
  - ADD: --machine-readable boolean flag option
  - PATTERN: Follow existing Commander.js option pattern
  - PROPERTY: Add machineReadable to options interface
  - INTEGRATION: Pass machineReadable to main() function parameters

Task 3: CREATE src/utils/logger.ts - Core logger module
  - IMPLEMENT: LogLevel enum (DEBUG, INFO, WARN, ERROR)
  - IMPLEMENT: Logger interface with debug(), info(), warn(), error(), child()
  - IMPLEMENT: Sensitive data redaction paths array
  - IMPLEMENT: createLoggerConfig() function for options processing
  - IMPLEMENT: getLogger() factory function with caching
  - IMPLEMENT: Conditional transport setup (pretty print vs JSON)
  - NAMING: camelCase for functions, PascalCase for interfaces/enums
  - PLACEMENT: src/utils/logger.ts
  - EXPORT: LogLevel, Logger interface, getLogger function

Task 4: MODIFY src/index.ts - Integrate logger initialization
  - FIND: Main entry point after CLI parsing (around line 80-90)
  - ADD: Import getLogger from src/utils/logger.ts
  - ADD: Create root logger with context 'App'
  - OPTIONAL: Replace initial console.log statements with logger.info()
  - PRESERVE: Global error handlers (keep console.error for uncaught exceptions)
  - NOTE: Full console.log migration is P5.M1.T1.S2 (future task)

Task 5: CREATE src/utils/tests/logger.test.ts - Unit tests
  - IMPLEMENT: Test LogLevel enum values
  - IMPLEMENT: Test getLogger() returns Logger interface
  - IMPLEMENT: Test child logger creation
  - IMPLEMENT: Test log level filtering (debug ignored when not verbose)
  - IMPLEMENT: Test redaction of sensitive data (apiKey, token, password)
  - IMPLEMENT: Test machine-readable JSON output
  - IMPLEMENT: Test pretty print development output
  - FRAMEWORK: Follow existing test pattern (check if Vitest/Jest is configured)
  - COVERAGE: All exported functions and major code paths
  - PLACEMENT: src/utils/tests/logger.test.ts
```

### Implementation Patterns & Key Details

```typescript
// ===== REDACTION CONFIGURATION =====
// Critical: Redact all sensitive data paths
// Paths are dot-notation for nested objects
const REDACT_PATHS = [
  'apiKey',
  'apiSecret',
  'api_key',
  'api_secret',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'password',
  'passwd',
  'secret',
  'email', // GDPR consideration
  'authorization',
  'Authorization',
  'headers.authorization',
  'headers.Authorization',
  'request.headers.authorization',
  'response.headers["set-cookie"]',
  // Groundswell-specific
  'config.apiKey',
  'environment.ANTHROPIC_AUTH_TOKEN',
  'environment.ANTHROPIC_API_KEY',
];

// ===== LOGGER CONFIGURATION =====
function createLoggerConfig(options: LoggerConfig = {}): pino.LoggerOptions {
  const { level = 'info', machineReadable = false, verbose = false } = options;

  return {
    level: verbose ? 'debug' : level,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]', // Default: '[Redacted]'
      remove: false, // Keep the key with censored value
    },
    // Timestamp in ISO format for log aggregation
    timestamp: pino.stdTimeFunctions.isoTime,
    // Add context field to all logs
    formatters: {
      level: label => {
        return { level: label };
      },
    },
    // Conditional transport for pretty print
    ...(machineReadable
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
              messageFormat: '[{context}] {msg}', // Add context prefix
            },
          },
        }),
  };
}

// ===== LOGGER FACTORY =====
// Use WeakMap for logger instance caching by context
const loggerCache = new WeakMap<object, Logger>();

export function getLogger(context: string, options?: LoggerConfig): Logger {
  const cacheKey = { context, options };

  // Check cache first
  if (loggerCache.has(cacheKey)) {
    return loggerCache.get(cacheKey)!;
  }

  // Create new logger
  const config = createLoggerConfig(options);
  const pinoLogger = pino({
    ...config,
    // Add context as default field
    base: {
      context,
    },
  });

  // Create wrapper that ensures context is always present
  const logger: Logger = {
    debug: (msgOrObj, msg?, ...args) =>
      pinoLogger.debug(msgOrObj, msg, ...args),
    info: (msgOrObj, msg?, ...args) => pinoLogger.info(msgOrObj, msg, ...args),
    warn: (msgOrObj, msg?, ...args) => pinoLogger.warn(msgOrObj, msg, ...args),
    error: (msgOrObj, msg?, ...args) =>
      pinoLogger.error(msgOrObj, msg, ...args),
    child: bindings => {
      const childPino = pinoLogger.child(bindings);
      return {
        debug: (msgOrObj, msg?, ...args) =>
          childPino.debug(msgOrObj, msg, ...args),
        info: (msgOrObj, msg?, ...args) =>
          childPino.info(msgOrObj, msg, ...args),
        warn: (msgOrObj, msg?, ...args) =>
          childPino.warn(msgOrObj, msg, ...args),
        error: (msgOrObj, msg?, ...args) =>
          childPino.error(msgOrObj, msg, ...args),
        child: moreBindings =>
          childPino.child(moreBindings) as unknown as Logger,
      };
    },
  };

  // Cache the logger
  loggerCache.set(cacheKey, logger);
  return logger;
}

// ===== USAGE PATTERNS =====

// Basic usage - get context-aware logger
const logger = getLogger('TaskOrchestrator');
logger.info('Task execution started');
// Output (dev): [10:30:45] [TaskOrchestrator] Task execution started
// Output (prod): {"level":"info","time":"2025-01-13T10:30:45.000Z","context":"TaskOrchestrator","msg":"Task execution started"}

// With data object
logger.info(
  { taskId: 'P1.M1.T1', status: 'in_progress' },
  'Task status changed'
);

// Child logger for additional context
const taskLogger = logger.child({ taskId: 'P1.M1.T1' });
taskLogger.info('Starting execution');

// Sensitive data auto-redacted
logger.info({ apiKey: 'sk-1234567890', userId: 'abc' }, 'API call');
// Output: {"apiKey":"[REDACTED]","userId":"abc",...}

// Debug only shows when --verbose
logger.debug('Detailed diagnostic information');
```

### Integration Points

```yaml
CLI_FLAGS:
  - file: src/cli/index.ts
  - add_option: '--machine-readable'
  - type: boolean
  - default: false
  - description: "Enable machine-readable JSON output"

MAIN_ENTRY:
  - file: src/index.ts
  - import: import { getLogger } from './utils/logger.js'
  - usage: const logger = getLogger('App', { verbose, machineReadable })
  - preserve: Keep console.error in global handlers (uncaughtException, unhandledRejection)

PACKAGE_JSON:
  - add_dependency: "pino": "^9.0.0"
  - add_devDependency: "pino-pretty": "^11.0.0"

TYPESCRIPT:
  - verify: tsconfig.json has "moduleResolution": "bundler" or "node16"
  - import_style: Use ES modules with .js extension in imports
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after creating logger.ts
npx tsc --noEmit src/utils/logger.ts

# Format and lint the new file
npm run lint       # or npx eslint src/utils/logger.ts if no script
npm run format     # or npx prettier --write src/utils/logger.ts

# Project-wide validation
npm run check      # or npx tsc --noEmit && npm run lint
npm run test:lint  # If exists

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Read error message carefully
#   - Fix type issues first
#   - Then fix lint issues
#   - Re-run validation before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the logger module specifically
npm test -- src/utils/tests/logger.test.ts

# If using Vitest (check which test runner is configured)
npx vitest run src/utils/tests/logger.test.ts

# If using Jest
npx jest src/utils/tests/logger.test.ts

# Run with coverage
npm test -- --coverage src/utils/tests/logger.test.ts

# Expected: All tests pass, coverage >80%
# If failing:
#   - Read test output carefully
#   - Debug with console.log (temporarily) to see values
#   - Fix implementation or update test if logic was wrong
#   - Re-run tests until all pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Test CLI flag parsing
npm run build
node dist/cli/index.js --help | grep machine-readable

# Test basic logger usage
node -e "
  const { getLogger } = require('./dist/utils/logger.js');
  const logger = getLogger('Test');
  logger.info('Test message');
  logger.error({ apiKey: 'secret123' }, 'Error with API key');
"

# Test verbose mode
node -e "
  const { getLogger } = require('./dist/utils/logger.js');
  const logger = getLogger('Test', { verbose: true });
  logger.debug('This should appear');
  logger.info('This should also appear');
"

# Test machine-readable mode
node -e "
  const { getLogger } = require('./dist/utils/logger.js');
  const logger = getLogger('Test', { machineReadable: true });
  logger.info({ data: 'test' }, 'JSON output');
" | jq .

# Test redaction
node -e "
  const { getLogger } = require('./dist/utils/logger.js');
  const logger = getLogger('Test');
  logger.info({ apiKey: 'sk-secret', token: 'token123' }, 'Check redaction');
" | jq .

# Expected:
#   - --machine-readable appears in help output
#   - Pretty print mode shows colored output with [Test] prefix
#   - Debug only appears in verbose mode
#   - JSON mode outputs valid JSON parseable by jq
#   - Redacted values show [REDACTED] not actual values
```

### Level 4: End-to-End Validation

```bash
# Run the full application with new logger
npm run build
npm start -- --prd path/to/prd.md --verbose

# Check logs are properly formatted
# Should see:
#   - [App] context prefix
#   - [TaskOrchestrator] context in orchestrator logs (if migrated)
#   - Colored output in dev mode
#   - Timestamps in HH:MM:ss format

# Test machine-readable mode
npm start -- --prd path/to/prd.md --machine-readable | jq .

# Should see pure JSON output parseable by jq
# All logs should be valid JSON objects

# Test redaction with real PRD
npm start -- --prd path/to/prd.md 2>&1 | grep -i "anthropic_api_key"

# Should NOT see actual API key values in output
# Should see [REDACTED] if API key is logged

# Expected:
#   - Application runs without errors
#   - Logs are properly formatted with context
#   - No sensitive data leaked in logs
#   - Machine-readable mode outputs valid JSON
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint` (or `npx eslint src/`)
- [ ] Formatting correct: `npm run format` (or `npx prettier --check src/`)
- [ ] All tests pass: `npm test`
- [ ] Coverage meets threshold: `npm test -- --coverage` (>80%)

### Feature Validation

- [ ] LogLevel enum exports all four levels
- [ ] getLogger() function returns Logger interface
- [ ] Child logger creation preserves redaction config
- [ ] Debug logs only appear when --verbose is enabled
- [ ] Pretty print mode shows colored output with context prefix
- [ ] Machine-readable mode outputs pure JSON
- [ ] Sensitive data (apiKey, token, password) is redacted in all modes
- [ ] Nested object redaction works (e.g., obj.credentials.apiKey)

### Integration Validation

- [ ] --machine-readable flag added to CLI
- [ ] Main entry point imports and initializes logger
- [ ] package.json has pino and pino-pretty dependencies
- [ ] Global error handlers still use console.error (not replaced)

### Code Quality Validation

- [ ] File placed at src/utils/logger.ts
- [ ] Exports match specification (LogLevel, Logger, getLogger)
- [ ] Naming conventions followed (camelCase functions, PascalCase types)
- [ ] JSDoc comments present for public API
- [ ] No console.log statements in logger.ts itself (use pino internally)

---

## Anti-Patterns to Avoid

- ❌ Don't use winston - pino is specified in contract and has better performance
- ❌ Don't skip redaction configuration - sensitive data leakage is a security issue
- ❌ Don't use process.env directly - get configuration from parameters
- ❌ Don't create loggers in loops - use child() for additional context
- ❌ Don't mix console.log and logger - this creates inconsistent output
- ❌ Don't forget to install pino-pretty as devDependency - it's separate from pino
- ❌ Don't use default import only - import pino + named imports for types
- ❌ Don't replace Groundswell's this.logger - only replace console.\* statements
- ❌ Don't log entire large objects - be selective about what to log
- ❌ Don't use synchronous logging - pino is async by default, keep it that way

---

## Success Metrics

**Confidence Score: 9/10**

**Rationale**:

- Codebase analysis provides complete context of existing patterns
- Pino is well-documented with established best practices
- Redaction requirements are clear and well-defined
- CLI integration points are identified
- Test framework usage exists in the project

**Implementation Success Factors**:

1. Logger module compiles and exports correct types
2. All unit tests pass with good coverage
3. CLI flag integration works correctly
4. No regression in existing functionality
5. Foundation laid for systematic console.log migration (P5.M1.T1.S2)
