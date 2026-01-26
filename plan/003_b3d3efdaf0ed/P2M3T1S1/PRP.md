# Product Requirement Prompt (PRP): Enhanced Logger with Structured Log Levels

---

## Goal

**Feature Goal**: Enhance the existing Pino-based logger (`src/utils/logger.ts`) with configurable log levels (trace, debug, info, warn, error, fatal), correlation ID support for request tracking, and component-level log filtering.

**Deliverable**: Enhanced logger at `src/utils/logger.ts` with new features, `--log-level` CLI option in `src/cli/index.ts`, and comprehensive unit tests in `tests/unit/logger-enhancements.test.ts`.

**Success Definition**:
- All new log levels (trace, fatal) are available and functional
- Correlation IDs are automatically generated and propagated through child loggers
- Component-level log filtering works via binding-based filtering
- CLI option `--log-level` accepts all level values and correctly configures the logger
- All unit tests pass including new correlation ID and filtering tests
- Existing logger functionality remains backward compatible

## User Persona

**Target User**: Developer working on the PRP Pipeline codebase who needs enhanced observability for debugging distributed task execution.

**Use Case**: Developer runs `hack --log-level trace` to get maximum verbosity for debugging a complex multi-agent interaction, with correlation IDs linking logs across different components (TaskOrchestrator, AgentRuntime, etc.).

**User Journey**:
1. Developer encounters an issue in parallel task execution
2. Developer sets `HACKY_LOG_LEVEL=trace` or uses `--log-level trace`
3. Developer sees all log entries with correlation IDs linking related operations
4. Developer can filter logs by component (e.g., only show AgentRuntime logs)
5. Developer quickly identifies the issue through correlated log traces

**Pain Points Addressed**:
- Current logger lacks `trace` level for fine-grained debugging
- No automatic correlation between related log entries across components
- Difficult to trace a single request/operation through multiple agents
- Fatal errors are logged as `error`, making it harder to identify system-critical failures

## Why

- **Debugging distributed systems**: Correlation IDs are essential for tracing operations through multiple agents and components
- **Production debugging**: Trace level provides fine-grained logging without modifying code
- **Log aggregation**: JSON output with correlation IDs enables better filtering in log aggregation tools
- **Fatal error distinction**: Fatal level distinguishes system-critical errors from regular errors
- **Component isolation**: Component filtering reduces log noise when debugging specific parts of the system

## What

### Functional Requirements

**A. New Log Levels**
- Add `TRACE` level (numeric value 10, below debug)
- Add `FATAL` level (numeric value 60, above error)
- Maintain existing `DEBUG`, `INFO`, `WARN`, `ERROR` levels

**B. Correlation IDs**
- Auto-generate unique correlation ID on first logger creation
- Propagate correlation ID through child loggers
- Allow manual correlation ID override via `correlationId` binding
- Format: UUID v4 string

**C. Component Filtering**
- Add `component` binding for categorization (already exists as `context`)
- Enable log filtering based on component/context field
- Support wildcard patterns for component matching

**D. CLI Integration**
- Add `--log-level` option accepting: trace, debug, info, warn, error, fatal
- Support environment variable `HACKY_LOG_LEVEL`
- Validate log level value and default to `info`

**E. Backward Compatibility**
- All existing logger usage continues to work
- Existing tests continue to pass
- No breaking changes to Logger interface

### Success Criteria

- [ ] `LogLevel` enum exports `TRACE` and `FATAL`
- [ ] `getLogger()` accepts new log levels via `level` option
- [ ] Correlation ID is auto-generated and included in all log entries
- [ ] Child loggers inherit parent's correlation ID
- [ ] `--log-level trace` CLI option enables trace-level logging
- [ ] `--log-level fatal` CLI option shows only fatal logs
- [ ] All existing tests in `tests/unit/logger.test.ts` pass
- [ ] New tests in `tests/unit/logger-enhancements.test.ts` pass
- [ ] Documentation in JSDoc comments is updated

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes - this PRP provides:
- Exact current logger implementation with line numbers
- Pino documentation links for all features
- Test patterns from existing logger tests
- CLI argument parsing patterns
- Type definitions and interfaces
- Specific file paths and patterns to follow

### Documentation & References

```yaml
# MUST READ - Pino Documentation
- url: https://getpino.io/#/docs/api?id=logger-level
  why: Pino log level API and level values (trace=10, debug=20, info=30, warn=40, error=50, fatal=60)
  critical: Must use numeric level values for custom levels

- url: https://getpino.io/#/docs/api?id=logger-child
  why: Child logger API for correlation ID propagation
  critical: Child loggers inherit all bindings from parent

- url: https://getpino.io/#/docs/api?id=logger-bindings
  why: Understanding logger bindings for correlation IDs and component filtering
  critical: Bindings are added to every log entry

- url: https://github.com/pinojs/pino-pretty#options
  why: pino-pretty options for development mode formatting
  critical: messageFormat option for context prefix pattern

# MUST READ - Current Implementation
- file: src/utils/logger.ts
  why: Complete current logger implementation to understand patterns
  pattern: LogLevel enum, Logger interface, getLogger factory, child logger pattern
  gotcha: Uses top-level await with createRequire for synchronous pino loading

- file: tests/unit/logger.test.ts
  why: Existing test patterns to follow
  pattern: beforeEach/afterEach with clearLoggerCache(), describe blocks for features
  gotcha: Tests validate interface existence, not actual output (pino output is async)

- file: src/cli/index.ts
  why: CLI argument parsing pattern for --log-level option
  pattern: Commander.js option with environment variable fallback, validation
  gotcha: Use `program.option()` with choices array for level validation

- file: package.json
  why: Verify pino version (^9.14.0) and pino-pretty (^11.3.0)
  critical: Pino v9 supports custom levels, pino-pretty v11 has updated options

# MUST READ - Type Definitions
- file: tsconfig.json
  why: TypeScript configuration for strict mode
  gotcha: strict mode requires proper type annotations

- url: https://www.npmjs.com/package/pino#custom-levels
  why: How to add custom log levels (trace, fatal) to Pino
  critical: Must define custom levels in pino configuration
```

### Current Codebase Tree (relevant sections)

```bash
src/
├── utils/
│   └── logger.ts              # Current logger implementation (397 lines)
├── cli/
│   └── index.ts               # CLI argument parser (778 lines)
└── index.ts                   # Main entry point

tests/
├── unit/
│   ├── logger.test.ts         # Existing logger tests (463 lines)
│   └── setup.ts               # Vitest global setup
└── vitest.config.ts           # Vitest configuration
```

### Desired Codebase Tree (changes only)

```bash
# MODIFIED FILES
src/utils/logger.ts            # Add TRACE/FATAL levels, correlation ID, component filtering
src/cli/index.ts               # Add --log-level option

# NEW FILES
tests/unit/logger-enhancements.test.ts   # New tests for enhanced features
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Pino custom levels must be defined in configuration
// To add trace and fatal levels, must pass customLevels option to pino()
// Example:
syncPino({
  customLevels: {
    trace: 10,
    fatal: 60
  },
  level: 'trace'  // Must match key in customLevels
})

// CRITICAL: Pino's createRequire with top-level await is ES module specific
// The current logger uses this pattern - must preserve it:
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const pinoRequire = require('pino');
syncPino = pinoRequire.default ?? pinoRequire;

// GOTCHA: Correlation ID must be added as a binding, not a base field
// WRONG: base: { correlationId: 'xxx' } - this doesn't propagate to children
// RIGHT: Use child() logger with bindings: logger.child({ correlationId: 'xxx' })

// GOTCHA: pino-pretty messageFormat uses {context} and {msg} variables
// Current pattern: messageFormat: '[{context}] {msg}'
// For correlation ID: messageFormat: '[{correlationId}] [{context}] {msg}'

// GOTCHA: Logger caching uses cacheKey based on options
// Adding new options (like logLevel) requires updating getCacheKey()

// GOTCHA: Commander.js option choices only validate string values
// Must handle case-insensitivity: user may type "TRACE" or "trace"

// GOTCHA: Vitest tests must clear logger cache in beforeEach
// Otherwise cached loggers from previous tests interfere
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Enhanced LogLevel enum with new levels
export enum LogLevel {
  TRACE = 'trace',   // NEW: Most verbose level
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',   // NEW: System-critical errors
}

// Enhanced LoggerConfig interface
export interface LoggerConfig {
  level?: LogLevel;           // Now includes trace, fatal
  machineReadable?: boolean;
  verbose?: boolean;
  correlationId?: string;     // NEW: Manual correlation ID override
  component?: string;         // NEW: Explicit component labeling
}

// Pino level mapping for custom levels
const PINO_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE src/utils/logger.ts - Add new log level types
  - MODIFY: LogLevel enum - add TRACE and FATAL values
  - MODIFY: Logger interface - add trace() and fatal() method signatures
  - MODIFY: LoggerConfig interface - add correlationId and component optional fields
  - ADD: PINO_LEVELS constant object mapping level names to numeric values
  - ADD: generateCorrelationId() helper function (UUID v4)
  - NAMING: Follow existing CamelCase for types, UPPER_CASE for constants
  - PLACEMENT: Top of file after existing type definitions

Task 2: UPDATE src/utils/logger.ts - Modify createLoggerConfig function
  - MODIFY: createLoggerConfig() to accept customLevels configuration
  - ADD: customLevels: PINO_LEVELS to pino configuration
  - MODIFY: level validation to accept all 6 levels (trace, debug, info, warn, error, fatal)
  - MODIFY: pino-pretty messageFormat to include correlationId: '[{correlationId}] [{context}] {msg}'
  - ENSURE: Backward compatibility - existing log levels still work
  - GOTCHA: Must add trace() and fatal() methods to wrapPinoLogger return object

Task 3: UPDATE src/utils/logger.ts - Implement correlation ID support
  - MODIFY: getLogger() to auto-generate correlation ID if not provided
  - MODIFY: getLogger() to add correlationId as initial binding
  - MODIFY: child() wrapper to preserve correlationId in bindings
  - ADD: getCorrelationId() helper to extract correlation ID from logger bindings
  - ENSURE: Child loggers inherit parent's correlation ID unless overridden
  - PATTERN: Use crypto.randomUUID() for UUID v4 generation (Node.js 20+)

Task 4: UPDATE src/utils/logger.ts - Update logger caching
  - MODIFY: getCacheKey() to include correlationId and component in cache key
  - MODIFY: Cache invalidation logic to handle new config fields
  - ENSURE: Different correlation IDs create different logger instances
  - GOTCHA: If correlationId is auto-generated, each call might create new logger - consider caching strategy

Task 5: UPDATE src/utils/logger.ts - Add trace and fatal methods to interface
  - MODIFY: wrapPinoLogger() to add trace() and fatal() methods
  - FOLLOW: Existing pattern for debug, info, warn, error methods
  - ENSURE: Both string and object+string call signatures work
  - NAMING: Method names: trace, fatal

Task 6: MODIFY src/cli/index.ts - Add --log-level CLI option
  - ADD: program.option() for --log-level with choices array
  - ADD: Environment variable support: HACKY_LOG_LEVEL
  - ADD: Validation logic for log level value
  - ADD: Level normalization (lowercase) for case-insensitive input
  - ADD: Pass logLevel to logger configuration
  - FIND: Line ~252 where --verbose is defined, add --log-level nearby
  - PATTERN: Follow existing CLI option pattern with .option() and validation
  - GOTCHA: Must update ValidatedCLIArgs interface to include logLevel

Task 7: CREATE tests/unit/logger-enhancements.test.ts
  - IMPLEMENT: Test suite for new log levels (TRACE, FATAL)
  - IMPLEMENT: Test suite for correlation ID generation
  - IMPLEMENT: Test suite for correlation ID propagation to child loggers
  - IMPLEMENT: Test suite for manual correlation ID override
  - IMPLEMENT: Test suite for component filtering
  - FOLLOW: Pattern from tests/unit/logger.test.ts
  - NAMING: Describe blocks: "TRACE level", "FATAL level", "Correlation ID", "Component filtering"
  - COVERAGE: All new features with positive and negative test cases
  - USE: beforeEach(() => clearLoggerCache()) for isolation

Task 8: UPDATE src/utils/logger.ts JSDoc comments
  - MODIFY: Module-level JSDoc to document TRACE and FATAL levels
  - MODIFY: JSDoc to document correlation ID auto-generation
  - MODIFY: JSDoc to document component filtering capability
  - ADD: @example showing correlation ID usage
  - ADD: @example showing trace/fatal level usage
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Custom Pino levels configuration
// CRITICAL: Must define both customLevels and use level key matching custom level name
function createLoggerConfig(options: LoggerConfig = {}): any {
  const baseConfig: any = {
    // Define custom levels with Pino numeric values
    customLevels: {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60,
    },
    // Use level key (not levelLabel) to set minimum level
    level: options.level || LogLevel.INFO,
    // ... rest of config
  };
  return baseConfig;
}

// Pattern 2: Correlation ID generation (Node.js 20+)
import { randomUUID } from 'node:crypto';

function generateCorrelationId(): string {
  return randomUUID();
}

// Pattern 3: Logger with correlation ID
export function getLogger(context: string, options?: LoggerConfig): Logger {
  const config = createLoggerConfig(options);

  // Auto-generate correlation ID if not provided
  const correlationId = options?.correlationId || generateCorrelationId();

  const pinoLogger = syncPino({
    ...config,
    base: {
      context,
      correlationId,  // Add to base fields
    },
  });

  return wrapPinoLogger(pinoLogger);
}

// Pattern 4: Child logger preserves correlation ID
function wrapPinoLogger(pinoLogger: any): Logger {
  return {
    // ... existing methods

    // NEW: trace method
    trace: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.trace(msgOrObj, ...args);
      } else {
        pinoLogger.trace(msgOrObj, msg, ...args);
      }
    },

    // NEW: fatal method
    fatal: (msgOrObj: unknown, msg?: string, ...args: unknown[]) => {
      if (typeof msgOrObj === 'string') {
        pinoLogger.fatal(msgOrObj, ...args);
      } else {
        pinoLogger.fatal(msgOrObj, msg, ...args);
      }
    },

    child: (bindings: Record<string, unknown>) => {
      // CRITICAL: Child loggers inherit correlation ID automatically via pino
      const childPino = pinoLogger.child(bindings);
      return wrapPinoLogger(childPino);
    },
  };
}

// Pattern 5: CLI option with choices and environment variable
// In src/cli/index.ts around line 252:
program
  .option('--log-level <level>', 'Log level (trace, debug, info, warn, error, fatal)')
  .addOption(
    program
      .createOption('--log-level <level>', 'Minimum log level')
      .choices(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default(process.env.HACKY_LOG_LEVEL || 'info')
  )

// Validation in parseCLIArgs():
const logLevel = String(options.logLevel || 'info').toLowerCase();
const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
if (!validLevels.includes(logLevel)) {
  logger.error(`Invalid log level: ${options.logLevel}`);
  process.exit(1);
}
options.logLevel = logLevel;

// Pattern 6: Updated cache key function
function getCacheKey(context: string, options?: LoggerConfig): string {
  const opts = options ?? {};
  return `${context}|${opts.level ?? 'info'}|${opts.machineReadable ?? false}|${opts.verbose ?? false}|${opts.correlationId ?? 'auto'}|${opts.component ?? 'none'}`;
}
```

### Integration Points

```yaml
CLI:
  - file: src/cli/index.ts
  - add: --log-level option around line 252 (near --verbose)
  - pattern: Follow existing .option() pattern with choices array
  - environment: HACKY_LOG_LEVEL environment variable support
  - validation: Case-insensitive, validates against allowed values

LOGGER_INIT:
  - file: src/utils/logger.ts
  - modify: getLogger() function to accept and use log level
  - preserve: Existing getLogger('Context', { verbose: true }) pattern
  - ensure: Backward compatibility - existing calls work unchanged

TESTS:
  - file: tests/unit/logger-enhancements.test.ts (NEW)
  - pattern: Follow tests/unit/logger.test.ts structure
  - setup: beforeEach(() => clearLoggerCache())
  - cleanup: afterEach(() => clearLoggerCache())
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run lint               # ESLint check
npm run lint:fix          # Auto-fix linting issues
npm run typecheck         # TypeScript type checking
npm run format:check      # Prettier format check
npm run format            # Auto-format with Prettier

# All-in-one validation
npm run validate          # Runs lint + format:check + typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test enhanced logger features
npm test -- tests/unit/logger-enhancements.test.ts

# Test existing logger (ensure backward compatibility)
npm test -- tests/unit/logger.test.ts

# Test CLI integration
npm test -- tests/unit/cli/index.test.ts

# Run all unit tests
npm run test:run

# With coverage
npm run test:coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test logger at runtime with different levels
NODE_ENV=development tsx src/index.ts --log-level trace
NODE_ENV=development tsx src/index.ts --log-level fatal

# Test environment variable
HACKY_LOG_LEVEL=debug tsx src/index.ts

# Test correlation ID in logs
# Run and grep for correlation ID in output
tsx src/index.ts --log-level info 2>&1 | grep "correlationId"

# Test backward compatibility (existing usage still works)
tsx src/index.ts --verbose

# Test JSON output mode with correlation IDs
tsx src/index.ts --log-level debug --machine-readable | jq .

# Expected: Logs show at configured levels, correlation IDs present, JSON valid
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Validate correlation ID propagation
# Run pipeline and check that related logs share correlation ID
tsx src/index.ts --log-level trace 2>&1 | grep -A 5 "correlationId"

# Validate log level filtering works
# Trace should show everything, fatal should show only fatal logs
tsx src/index.ts --log-level trace 2>&1 | wc -l  # Count lines (high)
tsx src/index.ts --log-level fatal 2>&1 | wc -l  # Count lines (low/zero)

# Validate component filtering
# Logs should include component/context field
tsx src/index.ts --log-level debug 2>&1 | grep '"context"'

# Validate pretty print output format
# Should show: [correlationId] [context] message
tsx src/index.ts --log-level info

# Validate JSON output structure
# Should be valid JSON with correlationId field
tsx src/index.ts --log-level info --machine-readable | jq '.correlationId'

# Test child logger correlation inheritance
# Create a test script that calls logger.child() and verify correlation ID matches
cat > test-correlation.js << 'EOF'
import { getLogger } from './src/utils/logger.js';
const parent = getLogger('Test');
const child = parent.child({ taskId: 'test' });
console.log('Parent and child should share correlation ID');
EOF
tsx test-correlation.js

# Expected: All validation checks pass, correlation IDs propagate correctly
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test:run`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] No formatting issues: `npm run format:check`

### Feature Validation

- [ ] TRACE level logs output when `--log-level trace` is set
- [ ] FATAL level logs output at highest priority
- [ ] Correlation ID is auto-generated on first logger creation
- [ ] Correlation ID appears in all log entries
- [ ] Child loggers inherit parent's correlation ID
- [ ] Correlation ID can be manually overridden via config
- [ ] CLI option `--log-level` accepts all 6 values
- [ ] Environment variable `HACKY_LOG_LEVEL` works
- [ ] Pretty print shows: `[correlationId] [context] message`
- [ ] JSON output includes `correlationId` field
- [ ] Existing logger tests pass (backward compatibility)

### Code Quality Validation

- [ ] Follows existing codebase patterns (Logger interface, wrapPinoLogger pattern)
- [ ] File placement matches desired structure (no new files except tests)
- [ ] Anti-patterns avoided (no sync operations in async context, proper type safety)
- [ ] JSDoc comments updated with new features
- [ ] Tests follow existing patterns (beforeEach with clearLoggerCache)

### Documentation & Deployment

- [ ] Logger module JSDoc documents TRACE and FATAL levels
- [ ] Logger module JSDoc documents correlation ID feature
- [ ] Logger module JSDoc includes usage examples
- [ ] CLI help shows `--log-level` option: `tsx src/index.ts --help`
- [ ] No breaking changes to existing Logger interface

---

## Anti-Patterns to Avoid

- ❌ Don't modify existing LogLevel enum values (must remain strings)
- ❌ Don't break existing Logger interface (only add methods, don't remove/change)
- ❌ Don't use synchronous UUID generation in hot paths (use crypto.randomUUID() which is fast)
- ❌ Don't create correlation ID for every getLogger() call (causes cache misses)
- ❌ Don't ignore existing cache invalidation logic when adding new config fields
- ❌ Don't hardcode log level values in CLI (use choices array for validation)
- ❌ Don't forget to update ValidatedCLIArgs interface when adding CLI options
- ❌ Don't skip testing backward compatibility (existing tests must pass)
- ❌ Don't use console.log directly for correlation ID (must use logger bindings)
- ❌ Don't modify protected files (PRD.md, tasks.json, etc.) - you're enhancing logger only
