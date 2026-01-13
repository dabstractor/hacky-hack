name: "P5.M1.T1.S2: Integrate Logger Throughout Pipeline"
description: |

---

## Goal

**Feature Goal**: Replace all 100+ console.log/error/warn statements with the structured logger utility created in P5.M1.T1.S1, enabling consistent, production-ready logging with context awareness, correlation IDs, and proper log levels.

**Deliverable**: Codebase-wide integration of structured logging with:

- Component-specific logger instances in all classes
- Context strings ([ComponentName]) preserved from existing patterns
- Correlation IDs for request tracing (workflow/session-level)
- Key events logged at appropriate levels
- Error stack traces captured
- Zero remaining console.log/error/warn in production code paths

**Success Definition**:

- All console.log → logger.info() or logger.debug()
- All console.error → logger.error()
- All console.warn → logger.warn()
- Each component has context-aware logger instance
- Correlation IDs flow through workflows
- Tests pass with new logging
- Log output is structured and parseable

## Why

- **Observability**: Structured logs enable log aggregation (ELK, Datadog, etc.)
- **Debugging**: Component context and correlation IDs make tracing requests through async workflows possible
- **Production Readiness**: JSON output in production mode enables machine-readable log parsing
- **Consistency**: Single logging pattern across entire codebase
- **Performance**: Pino is significantly faster than console logging
- **Security**: Sensitive data redaction prevents API key/token leakage

## What

Migrate all console statements to structured logging following the logger utility contract from P5.M1.T1.S1.

### Scope

**In Scope**:

- All console.log/error/warn in src/ directory (100+ statements)
- Component-specific logger initialization
- Context string assignment ([ComponentName])
- Correlation ID propagation through workflows
- Error stack trace logging

**Out of Scope**:

- Global error handlers in src/index.ts (keep console.error for uncaught exceptions)
- Script utilities (src/scripts/validate-api.ts - uses colored output for CLI)
- Comments and documentation examples
- Groundswell's internal this.logger (do not replace)

### Success Criteria

- [ ] Zero console.log statements in src/ (except comments)
- [ ] Zero console.error statements in src/ production code paths (global handlers exempt)
- [ ] Zero console.warn statements in src/
- [ ] Each class has a logger instance property
- [ ] Context strings match existing [ComponentName] patterns
- [ ] Correlation IDs appear in workflow logs
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] No sensitive data in logs

---

## All Needed Context

### Context Completeness Check

_P5.M1.T1.S1 creates the logger utility. This PRP assumes that contract is fulfilled and integrates it throughout the codebase. The implementing agent has everything needed: console statement inventory, component structure, existing patterns, and best practices._

### Documentation & References

```yaml
# MUST READ - Logger Utility Contract from P5.M1.T1.S1
- file: plan/001_14b9dc2a33c7/P5M1T1S1/PRP.md
  why: Defines the logger interface, getLogger() function, and configuration
  critical: Use getLogger(context: string): Logger pattern, preserve existing [ComponentName] prefixes
  gotcha: Do NOT replace Groundswell's this.logger - only replace console.* statements

- file: plan/001_14b9dc2a33c7/P5M1T1S1/research/structured-logging-best-practices.md
  why: Best practices for component-based logging, correlation IDs, async workflows
  critical: Correlation ID propagation patterns, logger instance management in classes

- file: plan/001_14b9dc2a33c7/P5M1T1S1/research/logging-quick-reference.md
  why: Quick code patterns and common templates
  critical: Logger initialization patterns for classes

# EXTERNAL RESOURCES - TypeScript Structured Logging
- url: https://getpino.io/#/docs/api
  why: Pino Logger API reference for child loggers and context binding
  critical: Use logger.child() for adding context (taskId, correlationId)

- url: https://nodejs.org/api/async_context.html#class-asynclocalstorage
  why: AsyncLocalStorage for automatic correlation ID propagation
  critical: Correlation IDs should flow through async call chains automatically

- url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  why: Error type narrowing for proper error logging
  critical: Use error instanceof Error checks before accessing error.stack

# COMPONENT-SPECIFIC REFERENCES - Files to Modify

# AGENTS LAYER (src/agents/)
- file: src/agents/prp-runtime.ts
  why: 7 console.log + 3 console.error - highest priority agent file
  pattern: Uses [PRPRuntime] prefix extensively
  context: "PRPRuntime"
  gotcha: Do NOT replace Groundswell's this.logger (lines 70-77 use this.logger.debug/info)

- file: src/agents/prp-generator.ts
  why: 2 console.log + 2 console.warn - PRP generation progress logging
  pattern: [PRPGenerator] prefix, retry loop logging
  context: "PRPGenerator"
  gotcha: Log retry attempts with warn level

- file: src/agents/prp-executor.ts
  why: 1 console.log + 1 console.error + 1 console.warn - Execution and validation logging
  pattern: [PRPExecutor] prefix, validation gate failures
  context: "PRPExecutor"
  gotcha: Validation failures should log error details

- file: src/agents/agent-factory.ts
  why: Agent creation - add logging for agent instantiation
  pattern: No existing logging, add new
  context: "AgentFactory"

# CORE LAYER (src/core/)
- file: src/core/task-orchestrator.ts
  why: 35 console.log statements - HEAVIEST logging in codebase
  pattern: [TaskOrchestrator] prefix everywhere, task state transitions
  context: "TaskOrchestrator"
  gotcha: Task execution flow is critical - preserve all state transition logs

- file: src/core/session-manager.ts
  why: Session lifecycle - add logging for session events
  pattern: No existing logging, add new for key events
  context: "SessionManager"
  gotcha: Log session created, delta session initialized, backlog saved

- file: src/core/research-queue.ts
  why: 2 console.error - queue processing errors
  pattern: Logs PRP generation failures, background task errors
  context: "ResearchQueue"
  gotcha: Non-critical errors use warn, critical use error

- file: src/core/task-patcher.ts
  why: 1 console.warn - unimplemented feature warning
  pattern: Warns about 'added' change type not implemented
  context: "TaskPatcher"

# WORKFLOWS LAYER (src/workflows/)
- file: src/workflows/prp-pipeline.ts
  why: 10 console.log - pipeline execution results, QA summary
  pattern: Uses emoji prefixes (🔍, ✅, ❌) for user-facing output
  context: "PRPPipeline"
  gotcha: Preserve emoji prefixes for user-facing logs in dev mode

- file: src/workflows/delta-analysis-workflow.ts
  why: Extend existing logging with correlation IDs
  pattern: Uses Groundswell's this.logger, add correlation IDs
  context: "DeltaAnalysisWorkflow"
  gotcha: Add correlationId to child logger, preserve this.logger usage

- file: src/workflows/bug-hunt-workflow.ts
  why: Extend existing logging with correlation IDs
  pattern: Uses Groundswell's this.logger, add correlation IDs
  context: "BugHuntWorkflow"
  gotcha: Add correlationId to child logger

- file: src/workflows/fix-cycle-workflow.ts
  why: Extend existing logging with correlation IDs
  pattern: Uses Groundswell's this.logger, add correlation IDs
  context: "FixCycleWorkflow"
  gotcha: Add correlationId to child logger

# UTILITIES LAYER (src/utils/)
- file: src/utils/git-commit.ts
  why: 2 console.log + 7 console.error - comprehensive git operation error handling
  pattern: [smartCommit] prefix, returns null on errors
  context: "smartCommit"
  gotcha: All errors return null - don't change behavior, only logging

# CLI LAYER (src/cli/)
- file: src/cli/index.ts
  why: 5 console.error - CLI validation errors with user guidance
  pattern: Validation errors with helpful messages, exits process
  context: "CLI"
  gotcha: Keep process.exit(1) after validation errors

# MAIN ENTRY (src/)
- file: src/index.ts
  why: 17 console.log + 11 console.error - main entry point
  pattern: DRY RUN output, verbose debug logging, pipeline results
  context: "App"
  gotcha: Lines 102-140 are debug messages using console.error - convert to logger.debug()
  gotcha: Keep console.error for global error handlers (lines 55-66)
```

### Console Statement Inventory

```yaml
# SUMMARY OF CONSOLE STATEMENTS TO MIGRATE
total_console_log: 75 statements across 18 files
total_console_error: 19 statements across 9 files
total_console_warn: 6 statements across 5 files
total_to_migrate: 100 statements

# BREAKDOWN BY COMPONENT
src/index.ts:
  - 17 console.log (verbose output, pipeline results)
  - 11 console.error (debug logging + error handling)
  - context: 'App'

src/core/task-orchestrator.ts:
  - 35 console.log (task state, dependency resolution, git commits)
  - 0 console.error (errors handled elsewhere)
  - 0 console.warn (1 in task-patcher.ts)
  - context: 'TaskOrchestrator'

src/agents/prp-runtime.ts:
  - 7 console.log (research phase, implementation phase, artifacts)
  - 3 console.error (execution failures, stack traces)
  - 0 console.warn (1 in file for artifact failures)
  - context: 'PRPRuntime'

src/workflows/prp-pipeline.ts:
  - 10 console.log (QA summary, bug counts, results path)
  - 0 console.error
  - 0 console.warn
  - context: 'PRPPipeline'

src/agents/prp-generator.ts:
  - 2 console.log (generation start, file written)
  - 0 console.error
  - 2 console.warn (retry attempts)
  - context: 'PRPGenerator'

src/utils/git-commit.ts:
  - 2 console.log (commit created, hash confirmation)
  - 7 console.error (validation, git operations)
  - 0 console.warn
  - context: 'smartCommit'

src/cli/index.ts:
  - 0 console.log
  - 5 console.error (validation errors)
  - 0 console.warn
  - context: 'CLI'

src/core/research-queue.ts:
  - 0 console.log
  - 2 console.error (PRP failures, background task errors)
  - 0 console.warn
  - context: 'ResearchQueue'

src/core/task-patcher.ts:
  - 0 console.log
  - 0 console.error
  - 1 console.warn (unimplemented feature)
  - context: 'TaskPatcher'

src/agents/prp-executor.ts:
  - 1 console.log (execution start)
  - 1 console.error (validation failures)
  - 1 console.warn (retry logic)
  - context: 'PRPExecutor'

# FILES WITH NO LOGGING (new logging to add)
src/agents/agent-factory.ts:
  - context: 'AgentFactory'
  - add: Agent creation logging

src/core/session-manager.ts:
  - context: 'SessionManager'
  - add: Session lifecycle logging
```

### Current Codebase Tree

```bash
src/
├── agents/              # AI agent implementations
│   ├── agent-factory.ts        # ADD logging
│   ├── prp-executor.ts         # 1 console.log + 1 console.error + 1 console.warn
│   ├── prp-generator.ts        # 2 console.log + 2 console.warn
│   └── prp-runtime.ts          # 7 console.log + 3 console.error
├── cli/                 # CLI argument parsing
│   └── index.ts                # 5 console.error
├── config/              # Configuration modules
│   ├── constants.ts            # Constants
│   └── environment.ts          # Environment configuration
├── core/                # Core business logic
│   ├── prd-differ.ts           # PRD diffing utilities
│   ├── research-queue.ts       # 2 console.error
│   ├── session-manager.ts      # ADD logging
│   ├── session-utils.ts        # Session utilities
│   ├── task-orchestrator.ts    # 35 console.log
│   └── task-patcher.ts         # 1 console.warn
├── models/              # Type definitions
│   └── models.ts               # Core data models
├── scripts/             # Utility scripts (preserve colored output)
│   └── validate-api.ts         # Keep console.log for colored output
├── tools/               # MCP tools
│   ├── bash-tool.ts
│   ├── filesystem-tool.ts
│   └── git-tool.ts
├── utils/               # General utilities
│   ├── git-commit.ts            # 2 console.log + 7 console.error
│   ├── logger.ts                # Created in P5.M1.T1.S1
│   └── task-utils.ts            # Task utilities
├── workflows/           # Workflow orchestrations
│   ├── bug-hunt-workflow.ts     # Uses Groundswell this.logger
│   ├── delta-analysis-workflow.ts # Uses Groundswell this.logger
│   ├── fix-cycle-workflow.ts    # Uses Groundswell this.logger
│   ├── hello-world.ts
│   └── prp-pipeline.ts          # 10 console.log
└── index.ts            # Main entry point (17 console.log + 11 console.error)
```

### Desired Codebase Tree

```bash
# No structural changes - same tree structure
# Changes are within files:
# - Import { getLogger } from './utils/logger.js'
# - Add logger instance property to classes
# - Replace console.log with logger.info() or logger.debug()
# - Replace console.error with logger.error()
# - Replace console.warn with logger.warn()
# - Add correlation IDs to workflow loggers
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Logger integration gotchas

// 1. Do NOT replace Groundswell's this.logger
// Workflow classes (BugHuntWorkflow, DeltaAnalysisWorkflow, FixCycleWorkflow)
// extend Groundswell Workflow which has this.logger built-in
// Keep using this.logger for Groundswell-specific logging
// Only replace console.* statements

// 2. Context string preservation
// Existing pattern: console.log('[TaskOrchestrator] message')
// New pattern: logger.info('message') with getLogger('TaskOrchestrator')
// The context is in the getLogger call, not the message

// 3. Correlation ID propagation
// Correlation IDs should be created at workflow entry (PRPPipeline.run())
// Use child logger to add correlationId to all logs in workflow
// const logger = getLogger('PRPPipeline').child({ correlationId })

// 4. Error stack traces
// When logging errors, include stack trace only when available
// Pattern: logger.error({ err: error, stack: error?.stack }, 'Operation failed')
// Pino handles error serialization automatically

// 5. Debug vs Info level
// Use logger.debug() for verbose diagnostic information
// Use logger.info() for important state transitions
// Debug logs only appear when --verbose flag is set

// 6. ES Module imports
// Use .js extension in imports: import { getLogger } from './utils/logger.js'
// This is required for ES module resolution

// 7. Global error handlers
// Keep console.error for uncaughtException and unhandledRejection
// These are in src/index.ts lines 55-66
// Do NOT replace these with logger

// 8. CLI validation errors
// Keep process.exit(1) after validation errors in src/cli/index.ts
// Logger.error() then process.exit(1)

// 9. Utility functions (non-class)
// For utility functions, create logger at module level
// const logger = getLogger('smartCommit');

// 10. Preserving emoji prefixes
// src/workflows/prp-pipeline.ts uses emoji for user-facing logs
// Keep emojis in message: logger.info('🔍 Phase 1: Scope Analysis')

// 11. git-commit.ts error handling
// All errors return null - don't change behavior
// Only change console.error to logger.error

// 12. Verbose logging in src/index.ts
// Lines 102-140 use console.error for debug info
// Convert to logger.debug() not logger.error()
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// Logger interface from P5.M1.T1.S1 (DO NOT MODIFY)
interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  child(bindings: Record<string, unknown>): Logger;
}

// Context string assignments (use these exact strings)
const CONTEXTS = {
  // Main
  App: 'App',
  CLI: 'CLI',

  // Agents
  AgentFactory: 'AgentFactory',
  PRPGenerator: 'PRPGenerator',
  PRPExecutor: 'PRPExecutor',
  PRPRuntime: 'PRPRuntime',

  // Core
  SessionManager: 'SessionManager',
  TaskOrchestrator: 'TaskOrchestrator',
  ResearchQueue: 'ResearchQueue',
  TaskPatcher: 'TaskPatcher',

  // Workflows
  PRPPipeline: 'PRPPipeline',
  DeltaAnalysisWorkflow: 'DeltaAnalysisWorkflow',
  BugHuntWorkflow: 'BugHuntWorkflow',
  FixCycleWorkflow: 'FixCycleWorkflow',

  // Utils
  smartCommit: 'smartCommit',
} as const;

// Correlation ID generation (add to PRPPipeline)
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
# ============================================================
# PHASE 1: AGENTS LAYER (Core execution components)
# ============================================================

Task 1: MODIFY src/agents/prp-runtime.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('PRPRuntime');
  - REPLACE: 7 console.log → logger.info() or logger.debug()
  - REPLACE: 3 console.error → logger.error()
  - PRESERVE: Groundswell's this.logger (lines 70-77)
  - PRESERVE: [PRPRuntime] prefix meaning (now in getLogger context)
  - PATTERN:
      - Research phase: logger.debug({ phase: 'research' }, 'Starting research...')
      - Implementation: logger.info({ phase: 'implementation' }, 'Starting implementation...')
      - Artifacts: logger.debug({ artifactsPath }, 'Artifacts written')
      - Errors: logger.error({ err: error, stack: error?.stack }, 'Execution failed')
  - NAMING: Use 'PRPRuntime' as context string

Task 2: MODIFY src/agents/prp-generator.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('PRPGenerator');
  - REPLACE: 2 console.log → logger.info()
  - REPLACE: 2 console.warn → logger.warn()
  - PRESERVE: Retry loop logic and delay timing
  - PATTERN:
      - Generation start: logger.info({ taskId: task.id }, 'Generating PRP...')
      - Retry: logger.warn({ attempt, error, delay }, 'PRP generation failed, retrying...')
      - Success: logger.info({ prpPath }, 'PRP written')
  - NAMING: Use 'PRPGenerator' as context string

Task 3: MODIFY src/agents/prp-executor.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('PRPExecutor');
  - REPLACE: 1 console.log → logger.info()
  - REPLACE: 1 console.error → logger.error()
  - REPLACE: 1 console.warn → logger.warn()
  - PATTERN:
      - Execution start: logger.info({ prpTaskId }, 'Starting PRP execution...')
      - Validation failure: logger.error({ level, exitCode, stderr }, 'Validation gate failed')
      - Retry: logger.warn({ fixAttempts, maxFixAttempts, delay }, 'Validation failed, retrying...')
  - NAMING: Use 'PRPExecutor' as context string

Task 4: MODIFY src/agents/agent-factory.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_LOGGER: const logger = getLogger('AgentFactory'); (module-level)
  - ADD_LOGGING: Log agent creation at debug level
  - PATTERN:
      - logger.debug({ persona, model }, 'Creating agent...')
  - NAMING: Use 'AgentFactory' as context string

# ============================================================
# PHASE 2: CORE LAYER (Orchestration and state management)
# ============================================================

Task 5: MODIFY src/core/task-orchestrator.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('TaskOrchestrator');
  - REPLACE: 35 console.log → logger.info() or logger.debug()
  - PRESERVE: All state transition messages
  - PATTERN:
      - Task processing: logger.info({ taskId, status }, 'Processing task...')
      - Dependency resolution: logger.debug({ dependencies }, 'Resolved dependencies')
      - Subtask execution: logger.info({ subtaskId }, 'Executing subtask...')
      - Git commit: logger.info({ commitHash }, 'Changes committed')
      - Milestone completion: logger.info({ milestone }, 'Milestone completed')
  - DECIDE:
      - Use logger.debug() for verbose diagnostic info (iteration counts, queue stats)
      - Use logger.info() for state transitions (task started/completed, status changes)
  - NAMING: Use 'TaskOrchestrator' as context string

Task 6: MODIFY src/core/research-queue.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('ResearchQueue');
  - REPLACE: 2 console.error → logger.error() or logger.warn()
  - PATTERN:
      - PRP failure: logger.warn({ taskId, error }, 'PRP generation failed (non-critical)')
      - Background task error: logger.error({ error }, 'Background task failed')
  - NAMING: Use 'ResearchQueue' as context string

Task 7: MODIFY src/core/task-patcher.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_LOGGER: const logger = getLogger('TaskPatcher'); (module-level, utility function)
  - REPLACE: 1 console.warn → logger.warn()
  - PATTERN:
      - Unimplemented feature: logger.warn({ changeType, taskId }, 'Feature not implemented')
  - NAMING: Use 'TaskPatcher' as context string

Task 8: MODIFY src/core/session-manager.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('SessionManager');
  - ADD_LOGGING: Log key session lifecycle events
  - PATTERN:
      - Session created: logger.info({ sessionId, prdPath }, 'Session initialized')
      - Delta session: logger.info({ deltaSessionId, changesCount }, 'Delta session created')
      - Backlog saved: logger.debug({ backlogPath }, 'Backlog persisted')
  - NAMING: Use 'SessionManager' as context string

# ============================================================
# PHASE 3: WORKFLOWS LAYER (Pipeline orchestration)
# ============================================================

Task 9: MODIFY src/workflows/prp-pipeline.ts
  - ADD_IMPORT: import { getLogger } from '../../utils/logger.js';
  - ADD_PROPERTY: private readonly logger = getLogger('PRPPipeline');
  - ADD_PROPERTY: private readonly correlationId: string; (generate in constructor)
  - REPLACE: 10 console.log → logger.info()
  - ADD_CHILD_LOGGER: Create child logger with correlationId for workflow methods
  - PRESERVE: Emoji prefixes in messages for user-friendly output
  - PATTERN:
      - constructor: this.correlationId = generateCorrelationId();
      - Workflow start: this.logger.info({ correlationId: this.correlationId }, 'Pipeline started')
      - QA summary: this.logger.info({ bugsFound, bugDetails }, 'QA Complete')
      - Preserve emojis: this.logger.info('🔍 Phase 1: Scope Analysis')
  - NAMING: Use 'PRPPipeline' as context string
  - GOTCHA: Don't use child logger on this.logger directly - create separate logger for methods

Task 10: MODIFY src/workflows/delta-analysis-workflow.ts
  - ADD_IMPORT: import { getLogger } from '../../utils/logger.js';
  - ADD_PROPERTY: private correlationLogger: Logger; (initialized with correlationId)
  - MODIFY: Initialize correlationLogger in constructor with child logger
  - PRESERVE: Groundswell's this.logger for framework logging
  - ADD: correlationId to relevant log messages
  - PATTERN:
      - constructor: this.correlationLogger = getLogger('DeltaAnalysisWorkflow').child({ correlationId });
      - Analysis: this.correlationLogger.info({ changesCount }, 'Delta analysis complete')
  - NAMING: Use 'DeltaAnalysisWorkflow' as context string
  - GOTCHA: Keep this.logger for Groundswell, use correlationLogger for correlation ID tracking

Task 11: MODIFY src/workflows/bug-hunt-workflow.ts
  - ADD_IMPORT: import { getLogger } from '../../utils/logger.js';
  - ADD_PROPERTY: private correlationLogger: Logger;
  - MODIFY: Initialize correlationLogger in constructor with child logger
  - PRESERVE: Groundswell's this.logger
  - ADD: correlationId to relevant log messages
  - PATTERN: Same as delta-analysis-workflow
  - NAMING: Use 'BugHuntWorkflow' as context string

Task 12: MODIFY src/workflows/fix-cycle-workflow.ts
  - ADD_IMPORT: import { getLogger } from '../../utils/logger.js';
  - ADD_PROPERTY: private correlationLogger: Logger;
  - MODIFY: Initialize correlationLogger in constructor with child logger
  - PRESERVE: Groundswell's this.logger
  - ADD: correlationId to relevant log messages
  - PATTERN: Same as delta-analysis-workflow
  - NAMING: Use 'FixCycleWorkflow' as context string

# ============================================================
# PHASE 4: UTILITIES AND CLI
# ============================================================

Task 13: MODIFY src/utils/git-commit.ts
  - ADD_IMPORT: import { getLogger } from './logger.js';
  - ADD_LOGGER: const logger = getLogger('smartCommit'); (module-level)
  - REPLACE: 2 console.log → logger.info()
  - REPLACE: 7 console.error → logger.error()
  - PRESERVE: All return null behavior (don't change logic)
  - PATTERN:
      - Validation errors: logger.error({ reason }, 'Invalid input')
      - Git operations: logger.error({ operation, error }, 'Git operation failed')
      - Success: logger.info({ commitHash }, 'Commit created')
  - NAMING: Use 'smartCommit' as context string
  - GOTCHA: Keep all return null statements - only change console.* to logger.*

Task 14: MODIFY src/cli/index.ts
  - ADD_IMPORT: import { getLogger } from '../utils/logger.js';
  - ADD_LOGGER: const logger = getLogger('CLI'); (module-level)
  - REPLACE: 5 console.error → logger.error()
  - PRESERVE: process.exit(1) after validation errors
  - PATTERN:
      - logger.error('PRD file not found')
      - process.exit(1)
  - NAMING: Use 'CLI' as context string

# ============================================================
# PHASE 5: MAIN ENTRY POINT
# ============================================================

Task 15: MODIFY src/index.ts
  - ADD_IMPORT: import { getLogger } from './utils/logger.js';
  - ADD_LOGGER: const logger = getLogger('App'); (module-level)
  - REPLACE: 17 console.log → logger.info() or logger.debug()
  - REPLACE: 11 console.error → logger.debug() (lines 102-140 are debug info)
  - PRESERVE: Global error handlers (lines 55-66) - keep console.error
  - PATTERN:
      - DRY RUN: logger.info({ params }, 'DRY RUN mode')
      - Resume mode: logger.info({ sessionId }, 'Resuming session')
      - Pipeline results: logger.info({ tasksCompleted, bugsFound }, 'Pipeline complete')
      - Debug info (was console.error): logger.debug({ scope, mode }, 'Configuration')
  - DECIDE:
      - User-facing output → logger.info()
      - Verbose debug info → logger.debug()
  - NAMING: Use 'App' as context string
  - GOTCHA: Lines 55-66 global error handlers MUST keep console.error

# ============================================================
# PHASE 6: CLEANUP AND VALIDATION
# ============================================================

Task 16: VERIFY no remaining console statements in src/
  - RUN: grep -r "console\.log" src/ --exclude-dir=scripts
  - RUN: grep -r "console\.error" src/ --exclude-dir=scripts | grep -v "global error"
  - RUN: grep -r "console\.warn" src/ --exclude-dir=scripts
  - EXPECTED: Zero results (except global handlers and comments)
  - FIX: Any remaining console statements

Task 17: VERIFY all imports are correct
  - RUN: npx tsc --noEmit
  - FIX: Any import errors (use .js extensions)

Task 18: RUN test suite
  - RUN: npm test
  - FIX: Any test failures related to logging

Task 19: BUILD and verify log output
  - RUN: npm run build
  - RUN: npm start -- --prd path/to/prd.md --verbose
  - VERIFY: Logs appear with context prefixes
  - VERIFY: Debug logs appear with --verbose
  - VERIFY: No sensitive data in logs
```

### Implementation Patterns & Key Details

```typescript
// ===== CLASS LOGGER PATTERN =====
// Use this pattern for all classes

import { getLogger } from '../utils/logger.js';
import type { Logger } from '../utils/logger.js';

export class PRPRuntime {
  private readonly logger: Logger;

  constructor(taskOrchestrator: TaskOrchestrator) {
    this.logger = getLogger('PRPRuntime');
    // ... rest of constructor
  }

  async executeSubtask(subtask: Subtask): Promise<void> {
    this.logger.info({ subtaskId: subtask.id }, 'Starting execution');

    try {
      // ... implementation
      this.logger.info({ subtaskId: subtask.id }, 'Execution complete');
    } catch (error) {
      this.logger.error(
        { err: error, stack: error instanceof Error ? error.stack : undefined },
        `Execution failed: ${subtask.id}`
      );
      throw error;
    }
  }
}

// ===== UTILITY MODULE PATTERN =====
// Use this pattern for utility functions

import { getLogger } from './logger.js';

const logger = getLogger('smartCommit');

export async function smartCommit(...): Promise<string | null> {
  if (!sessionPath) {
    logger.error('Invalid session path');
    return null;
  }

  // ... implementation

  logger.info({ commitHash }, 'Commit created');
  return commitHash;
}

// ===== CORRELATION ID PATTERN =====
// Use this pattern for workflows

import { getLogger } from '../../utils/logger.js';
import type { Logger } from '../../utils/logger.js';

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class PRPPipeline {
  private readonly logger: Logger;
  private readonly correlationId: string;

  constructor(prdPath: string, scope?: string, mode: 'full' | 'delta' = 'full') {
    this.correlationId = generateCorrelationId();
    this.logger = getLogger('PRPPipeline').child({ correlationId: this.correlationId });
  }

  async run(): Promise<void> {
    this.logger.info('Pipeline started');

    // All logs in this workflow now include correlationId
    this.logger.info({ phase: 'decompose' }, 'Decomposing PRD');
  }
}

// ===== WORKFLOW WITH GROUNDSWELL LOGGER PATTERN =====
// For workflows extending Groundswell Workflow

import { getLogger } from '../../utils/logger.js';
import type { Logger } from '../../utils/logger.js';

export class BugHuntWorkflow extends Workflow {
  private correlationLogger: Logger; // Separate from Groundswell's this.logger

  constructor(prdContent: string, completedTasks: string[]) {
    super(prdContent, BugHuntAgent);
    const correlationId = generateCorrelationId();
    this.correlationLogger = getLogger('BugHuntWorkflow').child({ correlationId });
  }

  async run(): Promise<BugReport> {
    // Use Groundswell's this.logger for framework logging
    this.logger.info('[BugHuntWorkflow] Phase 1: Scope Analysis');

    // Use correlationLogger for correlation ID tracking
    this.correlationLogger.info({ phase: 'scope-analysis' }, 'Starting scope analysis');
  }
}

// ===== ERROR LOGGING WITH STACK TRACE PATTERN =====
try {
  // ... operation
} catch (error) {
  this.logger.error(
    {
      operation: 'prp-generation',
      err: error,
      // Only include stack if it's an Error
      ...(error instanceof Error && { stack: error.stack })
    },
    'Operation failed'
  );
}

// ===== DEBUG VS INFO DECISION TREE =====
// Use logger.debug() for:
// - Iteration counts
// - Queue statistics
// - Detailed diagnostic information
// - Data structure dumps
// - Only shows with --verbose flag

// Use logger.info() for:
// - State transitions (task started/completed)
// - Milestone achievements
// - Important events (session created, PRP generated)
// - User-facing progress
// - Always shows

// Use logger.warn() for:
// - Non-critical failures
// - Retry attempts
// - Unimplemented features
// - Degraded functionality

// Use logger.error() for:
// - Critical failures
// - Validation failures
// - Operations that block progress
// - Exceptions

// ===== PRESERVING EMOJI PREFIXES =====
// Keep emojis for user-facing logs
this.logger.info('🔍 Phase 1: Scope Analysis');
this.logger.info('✅ All validations passed');
this.logger.info('❌ Validation failed');

// Output: [10:30:45] [PRPPipeline] 🔍 Phase 1: Scope Analysis
// The context prefix is added by pino-pretty, emoji is preserved

// ===== KEY EVENTS TO LOG =====
// Session Manager:
// - Session created (info)
// - Delta session initialized (info)
// - Backlog saved (debug)

// Task Orchestrator:
// - Task processing started (info)
// - Task status changed (info)
// - Subtask execution started (info)
// - Subtask completed (info)
// - Dependency resolution (debug)
// - Git commit created (info)
// - Milestone completed (info)

// PRP Generator:
// - PRP generation started (info)
// - PRP retry attempt (warn)
// - PRP written (info)

// PRP Executor:
// - Execution started (info)
// - Validation failed (error)
// - Fix attempt (warn)

// PRP Runtime:
// - Research phase started (debug)
// - Implementation phase started (info)
// - Artifacts written (debug)
// - Subtask completed (info)
// - Execution failed (error)

// PRP Pipeline:
// - Pipeline started (info with correlationId)
// - QA complete (info with bug counts)
// - Pipeline complete (info with summary)
```

### Integration Points

```yaml
LOGGER_DEPENDENCY:
  - depends_on: P5.M1.T1.S1 (logger utility creation)
  - import_from: src/utils/logger.js
  - import_pattern: "import { getLogger } from '../utils/logger.js';"
  - type_import: "import type { Logger } from '../utils/logger.js';"

CORRELATION_IDS:
  - generate_at: PRPPipeline constructor
  - propagate_to: All workflow child loggers
  - format: 'timestamp-random'
  - include_in: All workflow logs

GLOBAL_ERROR_HANDLERS:
  - keep: console.error in src/index.ts lines 55-66
  - reason: Final catch for uncaught exceptions
  - do_not_replace: These specific console.error statements

VERBOSE_FLAG:
  - already_exists: --verbose flag in CLI
  - logger_respects: Debug logs only show with verbose
  - integration: Handled by P5.M1.T1.S1 logger utility

GROUNDSWELL_LOGGER:
  - preserve: this.logger in workflow classes
  - do_not_replace: Groundswell's internal logging
  - add_alongside: correlationLogger for correlation IDs
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npx tsc --noEmit src/{modified_file}.ts

# Format and lint
npm run lint       # or npx eslint src/{modified_file}.ts
npm run format     # or npx prettier --write src/{modified_file}.ts

# Project-wide validation after all changes
npx tsc --noEmit
npm run lint
npm run format

# Expected: Zero TypeScript errors, zero ESLint errors
# If errors exist:
#   - Read error message carefully
#   - Fix import paths (use .js extensions)
#   - Fix type errors
#   - Re-run validation
```

### Level 2: Console Statement Verification

```bash
# Verify no remaining console statements (except allowed exemptions)
grep -r "console\.log" src/ --exclude-dir=scripts | grep -v "//"
grep -r "console\.error" src/ --exclude-dir=scripts | grep -v "//" | grep -v "global error"
grep -r "console\.warn" src/ --exclude-dir=scripts | grep -v "//"

# Expected: Zero results
# If found:
#   - Review context
#   - Replace with appropriate logger call
#   - Re-run verification

# Verify imports are correct
grep -r "from.*logger" src/ | grep "\.js"

# Expected: All imports use .js extension
# If not:
#   - Fix import paths
#   - Re-run TypeScript compilation
```

### Level 3: Unit Tests (Component Validation)

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- --testPathPattern=task-orchestrator
npm test -- --testPathPattern=prp-runtime
npm test -- --testPathPattern=prp-generator

# Run with coverage
npm test -- --coverage

# Expected: All tests pass
# If failing:
#   - Check if tests mock console output
#   - Update tests to expect logger output
#   - Debug with console.log (temporarily)
#   - Fix and re-run
```

### Level 4: Integration Testing (System Validation)

```bash
# Test logger integration with real execution
npm run build
npm start -- --prd test/fixtures/minimal-test-prd.md --verbose

# Verify output format:
#   - Logs have context prefixes: [App], [TaskOrchestrator], etc.
#   - Debug logs appear (verbose mode)
#   - Structured data appears in logs
#   - No sensitive data (API keys, tokens) in output

# Test without verbose (default mode)
npm start -- --prd test/fixtures/minimal-test-prd.md

# Verify:
#   - Debug logs do NOT appear
#   - Info and warn logs appear
#   - Error logs appear

# Test correlation IDs in workflows
npm start -- --prd test/fixtures/minimal-test-prd.md 2>&1 | grep correlationId

# Verify:
#   - Correlation IDs appear in workflow logs
#   - Same correlationId throughout workflow execution

# Test JSON output mode
npm start -- --prd test/fixtures/minimal-test-prd.md --machine-readable | jq .

# Verify:
#   - Valid JSON output
#   - context field in each log entry
#   - correlationId in workflow logs

# Expected:
#   - All modes produce valid output
#   - No sensitive data leaked
#   - Correlation IDs trace workflow execution
```

### Level 5: Log Output Quality Validation

```bash
# Capture logs to file for inspection
npm start -- --prd test/fixtures/minimal-test-prd.md --verbose > /tmp/logs.txt 2>&1

# Check for required log patterns
grep "\[App\]" /tmp/logs.txt | head -5
grep "\[TaskOrchestrator\]" /tmp/logs.txt | head -5
grep "\[PRPPipeline\]" /tmp/logs.txt | head -5
grep "correlationId" /tmp/logs.txt | head -5

# Verify no sensitive data
grep -i "api[_-]?key\|token\|password\|secret" /tmp/logs.txt

# Expected:
#   - Context prefixes appear throughout
#   - Correlation IDs in workflow logs
#   - No sensitive data (API keys, tokens) visible

# Verify error logging with stack traces
# (Trigger an error case and check stack trace appears)
npm start -- --prd path/to/invalid-prd.md 2>&1 | grep -A 5 "Stack trace"

# Expected:
#   - Stack traces appear in error logs
#   - Error context included
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation succeeds: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] All tests pass: `npm test`
- [ ] Zero console.log in src/ (excl. comments and scripts/)
- [ ] Zero console.error in src/ (excl. global handlers)
- [ ] Zero console.warn in src/ (excl. comments)

### Feature Validation

- [ ] All classes have logger instance property
- [ ] All modules have module-level logger (utilities)
- [ ] Context strings match specification ([ComponentName])
- [ ] Correlation IDs appear in workflow logs
- [ ] Debug logs only show with --verbose
- [ ] Error logs include stack traces
- [ ] Sensitive data is redacted
- [ ] Emoji prefixes preserved in PRPPipeline

### Integration Validation

- [ ] Logger imports use .js extension
- [ ] Global error handlers unchanged (src/index.ts)
- [ ] Groundswell's this.logger preserved in workflows
- [ ] CLI validation errors still exit process
- [ ] git-commit.ts still returns null on errors

### Code Quality Validation

- [ ] Follows existing codebase patterns
- [ ] No new files created (only modifications)
- [ ] ES module import pattern preserved
- [ ] Error handling behavior unchanged
- [ ] User-facing output preserved (emojis, formatting)

---

## Anti-Patterns to Avoid

- ❌ Don't replace Groundswell's this.logger - it's framework internal
- ❌ Don't use console.log anywhere in production code paths
- ❌ Don't forget .js extension in imports (ES modules requirement)
- ❌ Don't change error handling behavior - only change logging
- ❌ Don't log entire large objects - be selective about fields
- ❌ Don't create multiple logger instances per component - use one instance
- ❌ Don't use correlationId outside of workflows - not needed elsewhere
- ❌ Don't remove global error handlers' console.error - keep them
- ❌ Don't log sensitive data even if redaction should catch it
- ❌ Don't use logger.info() for verbose debug - use logger.debug()
- ❌ Don't mix correlationLogger with this.logger in workflows - keep separate
- ❌ Don't forget to include error.stack when logging errors
- ❌ Don't change git-commit.ts return behavior - only logging

---

## Success Metrics

**Confidence Score: 9/10**

**Rationale**:

- Comprehensive console statement inventory (100 statements identified)
- Clear file-by-file migration plan with dependencies
- Logger utility contract well-defined from P5.M1.T1.S1
- Existing patterns documented and preserved
- Correlation ID strategy clear
- Validation steps comprehensive
- External research provides best practices

**Implementation Success Factors**:

1. All console statements systematically replaced
2. Context strings consistently applied
3. Correlation IDs enable workflow tracing
4. Tests pass with new logging
5. No regression in functionality
6. Log output is structured and parseable
7. Sensitive data protected by redaction

**Risk Mitigation**:

- File-by-file approach prevents overwhelming changes
- Preserving existing patterns maintains consistency
- Clear gotchas prevent common mistakes
- Comprehensive validation catches issues early
