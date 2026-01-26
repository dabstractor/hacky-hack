# Product Requirement Prompt (PRP): Enhanced Error Report Generator

---

## Goal

**Feature Goal**: Enhance the `ERROR_REPORT.md` generation in `PRPPipeline` to include: (a) error timeline showing when errors occurred, (b) error stack traces and source context, (c) suggested fixes with links to documentation, (d) related tasks that may be affected by the error, and (e) resume commands and next steps for recovery.

**Deliverable**: Enhanced error report generation at `src/utils/error-reporter.ts` with comprehensive error reporting capabilities, including `ErrorReportBuilder` class, `TimelineTracker` class, `ImpactAnalyzer` class, `RecommendationEngine` class, and `ResumeCommandBuilder` class.

**Success Definition**:

- ERROR_REPORT.md is generated with error timeline showing chronological occurrence
- Stack traces are presented with collapsed library frames and source context
- Each error includes suggested fixes with exact commands
- Affected/dependent tasks are identified and listed with impact level
- Resume commands are generated for each error scenario
- Tests cover all new error reporting functionality
- Integration with existing `PRPPipeline.#generateErrorReport()` method
- Backward compatibility with existing error report format

## User Persona

**Target User**: Developers and project managers using the PRD pipeline who need to understand, diagnose, and recover from errors during pipeline execution.

**Use Case**: When pipeline execution fails, users need to:

- Understand when errors occurred in the execution timeline
- See detailed error context including stack traces
- Get actionable suggestions for fixing errors
- Understand which tasks are affected by each error
- Know exactly what commands to run to resume execution

**User Journey**:

1. Pipeline execution fails with error notification
2. User reviews ERROR_REPORT.md in session directory
3. User reads error timeline to understand chronology
4. User examines detailed error information with stack traces
5. User reviews suggested fixes and runs provided commands
6. User checks affected tasks to understand impact
7. User runs resume command to continue execution
8. Pipeline resumes and completes successfully

**Pain Points Addressed**:

- Current error report lacks chronological context (no timeline)
- Stack traces are truncated without source context
- Generic recommendations don't provide specific actions
- No visibility into which tasks are affected by errors
- No clear resume commands provided
- Difficult to understand error impact on pipeline progress

## Why

- **Debugging Efficiency**: Error timeline helps identify patterns (e.g., all errors occurred after a specific task)
- **Root Cause Analysis**: Detailed stack traces with source context enable faster debugging
- **Actionable Recovery**: Suggested fixes with exact commands reduce manual investigation
- **Impact Visibility**: Understanding affected tasks helps prioritize fix efforts
- **Faster Recovery**: Resume commands eliminate guesswork in continuing execution
- **Better Developer Experience**: Comprehensive error reporting reduces frustration and downtime

## What

**User-Visible Behavior**:

### Enhanced ERROR_REPORT.md Structure

```markdown
# Error Report

**Generated**: 2025-01-24T10:30:45.123Z
**Pipeline Mode**: normal
**Continue on Error**: No
**Session**: 003_b3d3efdaf0ed

## Summary

| Metric       | Count |
| ------------ | ----- |
| Total Tasks  | 45    |
| Completed    | 12    |
| Failed       | 3     |
| Success Rate | 26.7% |

## Error Timeline
```

10:05:23 │ ✓ [P1.M1.T1.S1] Environment setup completed (2m 15s)
10:15:47 │ ✗ [P1.M1.T1.S2] Type validation failed
│ Error: Expected string, got undefined
│ File: src/types/session.ts:45
│
│ ├─ 10:22:15 Retry #1 failed
│ ├─ 10:28:42 Retry #2 failed
│ └─ 10:35:18 Max retries exceeded
│
│ ⚠ Blocking: P1.M1.T1.S3, P1.M1.T2.S1 (waiting 15m)
10:45:30 │ ✗ [P1.M2.T1.S1] Schema validation failed
│ Error: Invalid PRD schema
│ ⚠ Blocking: P1.M2.T2.S1, P1.M2.T3.S1
11:00:00 │ ⏸ Pipeline paused

````

**Timeline Summary**:
- First error at: 10:15:47 (35 minutes after start)
- Error frequency: 3 errors over 55 minutes
- Total blocking time: 15 minutes (continuing)
- Pattern: Errors clustered in Phase 1

## Failed Tasks

### 1. P1.M1.T1.S2: Type validation failed

**Phase**: Foundation
**Milestone**: M1
**Task**: T1
**Failed At**: 2025-01-24T10:15:47.123Z

**Error Details**:
```typescript
Error: Expected string, got undefined
    at validateSessionConfig (src/types/session.ts:45:12)
    at SessionManager.loadSession (src/core/session-manager.ts:123:8)
    at PRPPipeline.executeBacklog (src/workflows/prp-pipeline.ts:892:18)

Context:
  sessionPath: "plan/003_b3d3efdaf0ed"
  taskId: "P1.M1.T1.S2"
  operation: "load_session"
````

**Source Context**:

```typescript
// src/types/session.ts:43-47
43  export function validateSessionConfig(config: unknown): SessionConfig {
44    if (!config || typeof config !== 'object') {
45    throw new TypeError('Expected string, got undefined');
46    }
47  }
```

**Affected Tasks**:

- 🔴 **HIGH IMPACT**: 2 tasks blocked
  - `P1.M1.T1.S3` (Configuration loader) - Direct dependency
  - `P1.M1.T2.S1` (Type definitions) - Same milestone, depends on completion

**Suggested Fixes**:

1. **Verify session configuration file exists**:

   ```bash
   $ ls -la plan/003_b3d3efdaf0ed/config.json
   ```

2. **Validate configuration file format**:

   ```bash
   $ cat plan/003_b3d3efdaf0ed/config.json | jq .
   ```

3. **Re-run type checking**:
   ```bash
   $ npm run check
   ```

**Documentation**:

- Type Validation: https://hacky-hack.dev/docs/types/validation
- Session Configuration: https://hacky-hack.dev/docs/sessions/config

**Resume Commands**:

```bash
# After fixing the issue, retry the failed task:
$ npm run prp -- --task P1.M1.T1.S2 --retry

# Or skip this task if it's non-critical:
$ npm run prp -- --skip P1.M1.T1.S2 --continue

# Or resume from this task with verbose output:
$ npm run prp -- --task P1.M1.T1.S2 --verbose
```

---

### 2. P1.M2.T1.S1: Schema validation failed

**Phase**: Foundation
**Milestone**: M2
**Task**: T1
**Failed At**: 2025-01-24T10:45:30.456Z

**Error Details**:

```typescript
Error: Invalid PRD schema
    at validatePRD (src/utils/prd-validator.ts:78:5)
    at PRPPipeline.parsePRD (src/workflows/prp-pipeline.ts:512:23)

Context:
  prdPath: "PRD.md"
  schemaVersion: "2.0"
  validationErrors: [
    "Missing required field: 'description'",
    "Invalid enum value for 'status'"
  ]
```

**Affected Tasks**:

- 🟡 **MEDIUM IMPACT**: 2 tasks blocked
  - `P1.M2.T2.S1` (PRD parser) - Depends on valid schema
  - `P1.M2.T3.S1` (Documentation generator) - Needs parsed PRD

**Suggested Fixes**:

1. **Validate PRD structure**:

   ```bash
   $ npm run validate-prd
   ```

2. **Check PRD template compliance**:

   ```bash
   $ npm run check-prd-template -- --fix
   ```

3. **Review required fields**:
   ```bash
   $ cat PRD.md | grep -A 5 "## Description"
   ```

**Resume Commands**:

```bash
# After fixing the PRD:
$ npm run prp -- --task P1.M2.T1.S1 --retry
```

---

## Error Categories

| Category            | Count | Percentage |
| ------------------- | ----- | ---------- |
| **TaskError**       | 2     | 66.7%      |
| **ValidationError** | 1     | 33.3%      |
| **AgentError**      | 0     | 0%         |
| **SessionError**    | 0     | 0%         |
| **Other**           | 0     | 0%         |

## Impact Analysis

**Critical Path Impact**: 🔴 HIGH

- **Phase 1** blocked: 67% complete (2/3 milestones done)
- **Phase 2** cannot start: Blocked by Phase 1 completion
- **Estimated delay**: 30-45 minutes

**Blocked Tasks Summary**:

- Total blocked: 4 tasks
- Direct dependencies: 2 tasks
- Indirect dependencies: 2 tasks
- Blocked milestones: 1 (P1.M2)

**Recovery Priority**:

1. **Fix P1.M1.T1.S2 first** - Blocks 2 tasks, high impact
2. **Fix P1.M2.T1.S1 second** - Blocks 2 tasks, medium impact
3. **Resume from P1.M1.T1.S2** after fix

## Next Steps

1. Review error timeline above to understand error sequence
2. Fix the type validation error in `P1.M1.T1.S2`:
   - Check `src/types/session.ts:45`
   - Verify `plan/003_b3d3efdaf0ed/config.json` exists
3. Fix the schema validation error in `P1.M2.T1.S1`:
   - Run `npm run validate-prd`
   - Update `PRD.md` with required fields
4. Resume pipeline execution:
   ```bash
   $ npm run prp -- --task P1.M1.T1.S2 --retry
   ```

**Report Location**: plan/003_b3d3efdaf0ed/ERROR_REPORT.md

````

### Success Criteria

- [ ] Error timeline shows chronological error occurrence with timestamps
- [ ] Stack traces include source code context (3-5 lines around error)
- [ ] Each error has at least 2 suggested fixes with exact commands
- [ ] Affected tasks are listed with impact level (critical/high/medium/low)
- [ ] Resume commands are generated for each error scenario
- [ ] Documentation links are included for error types
- [ ] Tests verify all new error reporting functionality
- [ ] Integration with existing `PRPPipeline` is seamless

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test Validation**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file paths and line numbers for error report generation
- Complete type definitions for all data structures
- Specific integration points with existing `PRPPipeline`
- Testing patterns and validation commands
- Research findings from CLI error reporting best practices
- All library recommendations with documentation URLs

### Documentation & References

```yaml
# MUST READ - Current Error Report Implementation
- file: src/workflows/prp-pipeline.ts
  why: Contains #generateErrorReport() method (lines 1397-1522) - current implementation to enhance
  pattern: Error categorization, markdown generation, file writing to session directory
  critical: Session path from this.sessionManager.currentSession.metadata.path
  gotcha: Method returns early if #failedTasks.size === 0 - maintain this behavior

- file: src/utils/errors.ts
  why: Error type definitions (PipelineError, TaskError, AgentError, ValidationError, SessionError)
  pattern: Error code constants, toJSON() serialization, timestamp tracking, context attachment
  critical: All errors have timestamp: Date, context?: PipelineErrorContext, stack?: string properties
  gotcha: Use type guards (isTaskError, isAgentError, etc.) for error categorization

- file: src/utils/task-utils.ts
  why: Dependency resolution utilities (getDependencies, findItem, getAllSubtasks)
  pattern: DFS traversal for finding items, dependency graph construction
  critical: getDependencies(subtask, backlog) returns Subtask[] - use for affected task analysis
  gotcha: Dependencies only exist at Subtask level - Phase/Milestone/Task have no dependencies

- file: src/core/models.ts
  why: Type definitions for Phase, Milestone, Task, Subtask, Status, Backlog, SessionState
  pattern: All properties are readonly (immutable), type property for discriminated unions
  critical: Status type is union of specific strings: 'Planned' | 'Researching' | 'Implementing' | 'Complete' | 'Failed' | 'Obsolete'

- file: vitest.config.ts
  why: Test configuration with 100% coverage requirements
  pattern: Uses v8 coverage provider, tests/**/*.{test,spec}.ts pattern
  critical: Global setup in tests/setup.ts validates ANTHROPIC_BASE_URL to prevent accidental API calls
  gotcha: All API-dependent code must be mocked in tests

# MUST READ - Testing Patterns
- file: tests/unit/utils/errors.test.ts
  why: Existing error testing patterns
  pattern: Factory functions for test data, assertion patterns, error instance testing
  critical: Tests mock time, validate error codes, check context serialization

- file: tests/integration/utils/error-handling.test.ts
  why: Integration test patterns for error handling
  pattern: Mock SessionManager, test error tracking in pipeline context
  critical: Tests verify error categorization and reporting

# RESEARCH - CLI Error Reporting Best Practices (External)
- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/01-error-formatting-best-practices.md
  why: Error message structure, formatting patterns, real-world examples
  recommendation: Use structured format with Context, Problem, Impact, Solution sections
  url: https://clig.dev/ - Command-Line Interface Guidelines

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/02-error-timeline-visualization.md
  why: Timeline visualization patterns, chronological display formats
  recommendation: Use vertical timeline with time-stamped events and retry tracking
  pattern: Show cascade effects with wait times between errors

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/03-stack-trace-presentation.md
  why: Stack trace formatting, frame filtering, source context display
  recommendation: Collapse library frames by default, show 3-5 lines of source context
  pattern: Use frame relevance scoring to prioritize user code frames

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/04-suggested-fixes-and-documentation.md
  why: Fix suggestion patterns, documentation linking, command generation
  recommendation: Provide exact copy-pasteable commands, link to docs with anchors
  pattern: Three-level suggestion system (immediate action, understanding, deep dive)

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/05-affected-tasks-and-dependencies.md
  why: Dependency impact analysis, blocked task visualization
  recommendation: Calculate impact level (critical/high/medium/low), show cascade effects
  pattern: Use dependency graph traversal to find downstream tasks

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/06-resume-command-generation.md
  why: Resume command patterns, recovery workflows
  recommendation: Generate multiple recovery options (retry, skip, continue)
  pattern: Skip strategy decision tree based on task criticality and dependents

- docfile: plan/003_b3d3efdaf0ed/P2M3T2S2/research/QUICK_REFERENCE.md
  why: Quick implementation reference with code snippets
  recommendation: Essential patterns for error builder, timeline tracker, impact analyzer
  pattern: Color palette, icon system, impact levels enum

# CRITICAL - Session Directory Structure
- file: plan/003_b3d3efdaf0ed/docs/system_context.md (lines 111-154)
  why: Documents the session directory structure and artifact locations
  pattern: Sessions stored as plan/{sequence}_{hash}/ with ERROR_REPORT.md at root
  critical: ERROR_REPORT.md path: {sessionPath}/ERROR_REPORT.md
````

### Current Codebase Tree

```bash
src/
├── workflows/
│   └── prp-pipeline.ts                  # Contains #generateErrorReport() (lines 1397-1522)
├── utils/
│   ├── errors.ts                        # Error type definitions
│   ├── task-utils.ts                    # Dependency resolution utilities
│   ├── logger.ts                        # Logging system
│   └── display/                         # Display utilities (from P2.M3.T2.S1 PRP)
│       ├── status-colors.ts             # Status color mapping
│       ├── table-formatter.ts           # Table formatting with cli-table3
│       └── tree-renderer.ts             # Tree visualization
├── core/
│   ├── models.ts                        # Type definitions
│   └── session-manager.ts               # Session management
└── cli/
    └── index.ts                         # CLI entry point

tests/
├── unit/
│   └── utils/
│       ├── errors.test.ts               # Error type tests
│       └── (new) error-reporter.test.ts # NEW: Error reporter tests
└── integration/
    └── (new) error-report-generation.test.ts # NEW: Integration tests
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── utils/
│   └── errors/                          # NEW: Error utilities directory
│       ├── error-reporter.ts            # NEW: Enhanced error report generation
│       ├── timeline-tracker.ts          # NEW: Timeline tracking and formatting
│       ├── impact-analyzer.ts           # NEW: Dependency impact analysis
│       ├── recommendation-engine.ts     # NEW: Fix suggestion engine
│       ├── resume-command-builder.ts    # NEW: Resume command generation
│       ├── stack-trace-formatter.ts     # NEW: Stack trace presentation
│       └── types.ts                     # NEW: Shared types for error reporting
│
├── workflows/
│   └── prp-pipeline.ts                  # MODIFY: Import and use enhanced error reporter

tests/
├── unit/
│   └── utils/
│       └── errors/                      # NEW: Error utilities tests
│           ├── error-reporter.test.ts   # NEW: Error reporter tests
│           ├── timeline-tracker.test.ts # NEW: Timeline tests
│           ├── impact-analyzer.test.ts  # NEW: Impact analyzer tests
│           ├── recommendation-engine.test.ts # NEW: Recommendation tests
│           ├── resume-command-builder.test.ts # NEW: Command builder tests
│           └── stack-trace-formatter.test.ts # NEW: Stack trace tests
│
└── integration/
    └── error-report-generation.test.ts  # NEW: End-to-end error report tests
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Error tracking uses Map<string, TaskFailure> in PRPPipeline
// Interface at lines 114-119 in prp-pipeline.ts:
// interface TaskFailure {
//   taskId: string;
//   taskTitle: string;
//   error: Error;
//   errorCode?: string;
//   timestamp: Date;
//   phase?: string;
//   milestone?: string;
// }
// Use this exact structure when accessing tracked failures

// CRITICAL: Session path resolution
// Use this.sessionManager.currentSession?.metadata.path
// DO NOT hardcode paths - session directories follow {sequence:03d}_{hash:12h} naming

// CRITICAL: Error type checking
// Use type guards from src/utils/errors.ts:
// - isTaskError(error) for TaskError
// - isAgentError(error) for AgentError
// - isValidationError(error) for ValidationError
// - isSessionError(error) for SessionError
// Do NOT use instanceof directly - type guards handle edge cases

// CRITICAL: Stack trace availability
// Not all errors have stack traces - check for existence before formatting
// Use optional chaining: error.stack?.split('\n')

// CRITICAL: Timestamp handling
// All errors have timestamp: Date property from PipelineError base class
// Use toISOString() for consistent formatting in reports

// CRITICAL: Dependency resolution
// Only Subtask objects have dependencies property
// Use getDependencies(subtask, backlog) from task-utils.ts
// Returns empty array for tasks without dependencies

// CRITICAL: Task hierarchy immutability
// All Phase, Milestone, Task, Subtask properties are readonly
// Never modify task objects directly - use for reporting only

// CRITICAL: Test coverage requirement
// vitest.config.ts enforces 100% coverage for all new code
// Run tests with npm test -- tests/unit/utils/errors/
// Coverage with npm run test:coverage

// CRITICAL: File writing in async context
// Use fs.promises.writeFile, not fs.writeFileSync
// Import with: const { writeFile } = await import('node:fs/promises');

// CRITICAL: Logging in error reporter
// Use logger from PRPPipeline context - do not create new logger instance
// Logger methods: logger.info(), logger.warn(), logger.error(), logger.debug()

// CRITICAL: chalk for terminal colors
// Already installed - use import chalk from 'chalk';
// DO NOT add new color libraries unless absolutely necessary
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
/**
 * Enhanced error reporting types
 * File: src/utils/errors/types.ts
 */

import type {
  Backlog,
  Phase,
  Milestone,
  Task,
  Subtask,
  HierarchyItem,
  Status,
} from '../../core/models.js';
import type { TaskFailure } from '../../workflows/prp-pipeline.js';

/**
 * Timeline entry for error chronology
 */
export interface TimelineEntry {
  /** Timestamp of the event */
  timestamp: Date;
  /** Event severity level */
  level: 'error' | 'warning' | 'info' | 'success';
  /** Task ID associated with event */
  taskId: string;
  /** Event description */
  event: string;
  /** Optional additional details */
  details?: string;
  /** Related events (retries, resolutions) */
  relatedEvents?: TimelineEntry[];
  /** Duration of the event (if applicable) */
  duration?: number;
}

/**
 * Complete error timeline for a session
 */
export interface ErrorTimeline {
  /** Session identifier */
  sessionId: string;
  /** Session start time */
  startTime: Date;
  /** Session end time (if completed) */
  endTime?: Date;
  /** All timeline entries in chronological order */
  entries: TimelineEntry[];
}

/**
 * Source code context around error location
 */
export interface SourceContext {
  /** File path where error occurred */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column?: number;
  /** Source code lines around error (3-5 lines) */
  codeLines: string[];
  /** The specific error line index in codeLines */
  errorLineIndex: number;
}

/**
 * Stack trace frame with relevance scoring
 */
export interface StackFrame {
  /** Function name */
  functionName: string;
  /** File path */
  filePath: string;
  /** Line number */
  line: number;
  /** Column number */
  column?: number;
  /** Whether this is user code (true) or library code (false) */
  isUserCode: boolean;
  /** Relevance score (0-1, higher is more relevant) */
  relevanceScore: number;
}

/**
 * Formatted stack trace with context
 */
export interface FormattedStackTrace {
  /** Error message */
  message: string;
  /** Error type/name */
  errorType: string;
  /** Stack frames sorted by relevance */
  frames: StackFrame[];
  /** Source context for most relevant frame */
  sourceContext?: SourceContext;
}

/**
 * Task impact level
 */
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Impact analysis for a failed task
 */
export interface TaskImpact {
  /** Impact severity level */
  level: ImpactLevel;
  /** Tasks directly affected by this failure */
  affectedTasks: string[];
  /** Phases blocked by this failure */
  blockedPhases: string[];
  /** Milestones blocked by this failure */
  blockedMilestones: string[];
  /** Tasks blocked by this failure */
  blockedTasks: string[];
  /** Whether pipeline can continue with this failure */
  canContinue: boolean;
  /** Suggested action based on impact */
  suggestedAction: 'pause' | 'retry' | 'skip' | 'continue';
  /** Cascade depth (how many tiers of dependents) */
  cascadeDepth: number;
}

/**
 * Suggested fix with command
 */
export interface SuggestedFix {
  /** Fix priority (1=highest) */
  priority: number;
  /** Fix description */
  description: string;
  /** Exact command to run (if applicable) */
  command?: string;
  /** Explanation of why this fix works */
  explanation?: string;
  /** Documentation link */
  docsUrl?: string;
}

/**
 * Resume command options
 */
export interface ResumeCommandOptions {
  /** Session ID */
  sessionId: string;
  /** Failed task ID */
  taskId: string;
  /** Resume strategy */
  strategy: 'retry' | 'skip' | 'continue' | 'interactive';
  /** Additional flags */
  flags?: string[];
  /** Context for the resume */
  context?: string;
}

/**
 * Complete enhanced error report
 */
export interface EnhancedErrorReport {
  /** Report generation timestamp */
  generatedAt: Date;
  /** Pipeline mode */
  pipelineMode: string;
  /** Continue-on-error flag */
  continueOnError: boolean;
  /** Session metadata */
  sessionId: string;
  /** Task statistics */
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    successRate: number;
  };
  /** Error timeline */
  timeline: ErrorTimeline;
  /** Detailed failure information */
  failures: TaskFailure[];
  /** Error categories breakdown */
  errorCategories: Record<string, number>;
  /** Impact analysis for each failure */
  impactAnalysis: Map<string, TaskImpact>;
  /** Suggested fixes for each failure */
  suggestedFixes: Map<string, SuggestedFix[]>;
  /** Resume commands for each failure */
  resumeCommands: Map<string, string[]>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/errors/types.ts
  - IMPLEMENT: All type definitions for error reporting (TimelineEntry, ErrorTimeline, TaskImpact, SuggestedFix, etc.)
  - IMPORT: Types from src/core/models.js and src/workflows/prp-pipeline.js
  - EXPORT: All types for use by other error reporting modules
  - NAMING: PascalCase for interfaces, camelCase for properties, UPPER_CASE for enums
  - PLACEMENT: Error utilities types file

Task 2: CREATE src/utils/errors/stack-trace-formatter.ts
  - IMPLEMENT: StackTraceFormatter class with formatStackTrace(), parseStackTrace(), calculateRelevance(), getSourceContext()
  - PATTERN: Parse error.stack string, filter frames by isUserCode, score relevance by file path patterns
  - FUNCTIONS:
    - parseStackTrace(error: Error): StackFrame[]
    - filterUserFrames(frames: StackFrame[]): StackFrame[]
    - calculateRelevance(frame: StackFrame): number
    - getSourceContext(frame: StackFrame): Promise<SourceContext | undefined>
    - formatStackTrace(error: Error): Promise<FormattedStackTrace>
  - NAMING: StackTraceFormatter class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import types from Task 1

Task 3: CREATE src/utils/errors/timeline-tracker.ts
  - IMPLEMENT: TimelineTracker class with addEntry(), getTimeline(), formatTimeline(), groupByPhase(), groupByTimeWindow()
  - PATTERN: Store entries in array, sort by timestamp, build hierarchical structure for related events
  - FUNCTIONS:
    - addEntry(entry: TimelineEntry): void
    - getTimeline(): ErrorTimeline
    - formatTimeline(format: 'compact' | 'vertical' | 'horizontal'): string
    - groupByPhase(backlog: Backlog): Map<string, TimelineEntry[]>
    - calculateDuration(): number
  - NAMING: TimelineTracker class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import types from Task 1

Task 4: CREATE src/utils/errors/impact-analyzer.ts
  - IMPLEMENT: ImpactAnalyzer class with analyzeImpact(), findDownstream(), findUpstream(), calculateCascadeDepth(), determineImpactLevel()
  - PATTERN: Use DFS to traverse dependency graph, calculate impact level based on blocked tasks
  - FUNCTIONS:
    - analyzeImpact(failedTaskId: string, backlog: Backlog): TaskImpact
    - findDownstream(taskId: string, backlog: Backlog): string[]
    - findUpstream(taskId: string, backlog: Backlog): string[]
    - calculateCascadeDepth(taskId: string, backlog: Backlog): number
    - determineImpactLevel(blockedCount: number, phases: number): ImpactLevel
    - canContinueWithFailure(taskId: string, backlog: Backlog): boolean
  - NAMING: ImpactAnalyzer class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import types from Task 1, utilities from src/utils/task-utils.ts

Task 5: CREATE src/utils/errors/recommendation-engine.ts
  - IMPLEMENT: RecommendationEngine class with generateFixes(), matchErrorPattern(), buildCommand(), getDocsLink()
  - PATTERN: Pattern matching on error codes and messages, template-based fix generation
  - FUNCTIONS:
    - generateFixes(error: Error, context: PipelineErrorContext): SuggestedFix[]
    - matchErrorPattern(error: Error): string | null
    - buildCommand(template: string, params: Record<string, string>): string
    - getDocsLink(errorCode: string): string | undefined
  - NAMING: RecommendationEngine class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import types from Task 1, error types from src/utils/errors.ts

Task 6: CREATE src/utils/errors/resume-command-builder.ts
  - IMPLEMENT: ResumeCommandBuilder class with buildCommand(), buildRetryCommand(), buildSkipCommand(), buildContinueCommand()
  - PATTERN: Builder pattern with fluent API for constructing resume commands
  - FUNCTIONS:
    - buildCommand(options: ResumeCommandOptions): string
    - buildRetryCommand(taskId: string, sessionId: string, flags?: string[]): string
    - buildSkipCommand(taskId: string, sessionId: string, skipDependents?: boolean): string
    - buildContinueCommand(sessionId: string): string
    - buildInteractiveCommand(sessionId: string): string
  - NAMING: ResumeCommandBuilder class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import types from Task 1

Task 7: CREATE src/utils/errors/error-reporter.ts
  - IMPLEMENT: ErrorReportBuilder class with generateReport(), buildSummary(), buildTimeline(), buildFailures(), buildImpactAnalysis(), buildNextSteps()
  - PATTERN: Assemble report from all components, format as markdown
  - INTEGRATION: Use StackTraceFormatter, TimelineTracker, ImpactAnalyzer, RecommendationEngine, ResumeCommandBuilder
  - FUNCTIONS:
    - generateReport(failures: Map<string, TaskFailure>, context: ReportContext): Promise<string>
    - buildSummary(failures: TaskFailure[]): string
    - buildTimeline(timeline: ErrorTimeline): string
    - buildFailures(failures: TaskFailure[], impact: Map<string, TaskImpact>, fixes: Map<string, SuggestedFix[]>, commands: Map<string, string[]>): Promise<string>
    - buildImpactAnalysis(impacts: Map<string, TaskImpact>): string
    - buildNextSteps(failures: TaskFailure[], commands: Map<string, string[]>): string
  - NAMING: ErrorReportBuilder class, camelCase methods
  - PLACEMENT: Error utilities directory
  - DEPENDENCIES: Import from Tasks 1-6

Task 8: MODIFY src/workflows/prp-pipeline.ts
  - IMPORT: ErrorReportBuilder from src/utils/errors/error-reporter.js
  - INTEGRATE: Replace #generateErrorReport() implementation with ErrorReportBuilder
  - PRESERVE: Early return if #failedTasks.size === 0
  - PRESERVE: Session path resolution
  - PRESERVE: Logging pattern
  - UPDATE: Use enhanced error report generation with timeline, impact, fixes, commands
  - NAMING: Keep method name #generateErrorReport() for consistency
  - PLACEMENT: Same location (lines 1397-1522)
  - GOTCHA: Maintain async/await pattern for consistency

Task 9: CREATE tests/unit/utils/errors/error-reporter.test.ts
  - IMPLEMENT: Unit tests for ErrorReportBuilder class
  - MOCK: TaskFailure data, Backlog, SessionManager
  - TEST: generateReport() with various failure scenarios
  - TEST: buildSummary(), buildTimeline(), buildFailures() individually
  - TEST: Markdown output format validation
  - COVERAGE: 100% coverage required for src/utils/errors/error-reporter.ts
  - PATTERN: Follow tests/unit/utils/errors.test.ts patterns
  - PLACEMENT: Unit tests alongside error utilities

Task 10: CREATE tests/unit/utils/errors/timeline-tracker.test.ts
  - IMPLEMENT: Unit tests for TimelineTracker class
  - MOCK: TimelineEntry data
  - TEST: addEntry(), getTimeline(), formatTimeline()
  - TEST: Grouping functions (groupByPhase, groupByTimeWindow)
  - TEST: Duration calculation
  - COVERAGE: 100% coverage required
  - PLACEMENT: Unit tests alongside error utilities

Task 11: CREATE tests/unit/utils/errors/impact-analyzer.test.ts
  - IMPLEMENT: Unit tests for ImpactAnalyzer class
  - MOCK: Backlog with dependency structures
  - TEST: analyzeImpact() with various dependency scenarios
  - TEST: findDownstream(), findUpstream() correctly traverse graph
  - TEST: calculateCascadeDepth() for deep dependencies
  - TEST: determineImpactLevel() returns correct ImpactLevel
  - COVERAGE: 100% coverage required
  - PLACEMENT: Unit tests alongside error utilities

Task 12: CREATE tests/unit/utils/errors/recommendation-engine.test.ts
  - IMPLEMENT: Unit tests for RecommendationEngine class
  - MOCK: Error instances with various codes and messages
  - TEST: generateFixes() returns appropriate suggestions
  - TEST: matchErrorPattern() identifies error patterns
  - TEST: buildCommand() formats commands correctly
  - TEST: getDocsLink() returns valid URLs
  - COVERAGE: 100% coverage required
  - PLACEMENT: Unit tests alongside error utilities

Task 13: CREATE tests/unit/utils/errors/resume-command-builder.test.ts
  - IMPLEMENT: Unit tests for ResumeCommandBuilder class
  - TEST: buildCommand() with various options
  - TEST: buildRetryCommand(), buildSkipCommand(), buildContinueCommand()
  - TEST: Command format validation
  - COVERAGE: 100% coverage required
  - PLACEMENT: Unit tests alongside error utilities

Task 14: CREATE tests/unit/utils/errors/stack-trace-formatter.test.ts
  - IMPLEMENT: Unit tests for StackTraceFormatter class
  - MOCK: Error instances with stack traces
  - MOCK: File system for source context reading
  - TEST: parseStackTrace() correctly parses stack frames
  - TEST: filterUserFrames() correctly identifies user code
  - TEST: calculateRelevance() scores frames appropriately
  - TEST: formatStackTrace() returns FormattedStackTrace with context
  - COVERAGE: 100% coverage required
  - PLACEMENT: Unit tests alongside error utilities

Task 15: CREATE tests/integration/error-report-generation.test.ts
  - IMPLEMENT: End-to-end integration tests for error report generation
  - MOCK: Complete session with tasks.json, PRP files, artifacts
  - MOCK: PRPPipeline with tracked failures
  - TEST: Full ERROR_REPORT.md generation with all sections
  - TEST: Timeline accuracy with real task execution
  - TEST: Impact analysis with real dependency structures
  - TEST: Resume commands are valid and executable
  - TEST: Markdown output is well-formed
  - PATTERN: Follow tests/integration/utils/error-handling.test.ts patterns
  - PLACEMENT: Integration tests directory
```

### Implementation Patterns & Key Details

````typescript
// Pattern 1: Error Report Integration (src/workflows/prp-pipeline.ts)

import { ErrorReportBuilder } from '../utils/errors/error-reporter.js';
import type { TaskFailure } from './models.js'; // Adjust import as needed

// In PRPPipeline class
async #generateErrorReport(): Promise<void> {
  // No failures - skip report generation
  if (this.#failedTasks.size === 0) {
    return;
  }

  this.logger.info('[PRPPipeline] Generating error report', {
    failureCount: this.#failedTasks.size,
  });

  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.logger.warn(
      '[PRPPipeline] Session path not available for error report'
    );
    return;
  }

  try {
    // Build enhanced error report
    const builder = new ErrorReportBuilder(this.logger);
    const reportContent = await builder.generateReport(
      this.#failedTasks,
      {
        sessionPath,
        sessionId: this.sessionManager.currentSession.metadata.hash,
        backlog: this.backlog,
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        pipelineMode: this.mode,
        continueOnError: this.#continueOnError,
        startTime: this.#startTime,
      }
    );

    // Write error report to session directory
    const { resolve } = await import('node:path');
    const { writeFile } = await import('node:fs/promises');
    const reportPath = resolve(sessionPath, 'ERROR_REPORT.md');

    await writeFile(reportPath, reportContent, 'utf-8');
    this.logger.info(`[PRPPipeline] Error report written to ${reportPath}`);
  } catch (error) {
    this.logger.error('[PRPPipeline] Failed to generate error report', { error });
  }
}

// Pattern 2: Timeline Tracking (src/utils/errors/timeline-tracker.ts)

import type { TimelineEntry, ErrorTimeline } from './types.js';

export class TimelineTracker {
  #entries: TimelineEntry[] = [];
  #sessionId: string;
  #startTime: Date;

  constructor(sessionId: string, startTime: Date) {
    this.#sessionId = sessionId;
    this.#startTime = startTime;
  }

  addEntry(entry: TimelineEntry): void {
    this.#entries.push(entry);
    // Keep entries sorted by timestamp
    this.#entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getTimeline(): ErrorTimeline {
    return {
      sessionId: this.#sessionId,
      startTime: this.#startTime,
      endTime: new Date(),
      entries: this.#entries,
    };
  }

  formatTimeline(format: 'compact' | 'vertical' | 'horizontal' = 'vertical'): string {
    if (this.#entries.length === 0) {
      return 'No events recorded.';
    }

    const lines: string[] = [];

    if (format === 'compact') {
      lines.push('╔═══════════════════════════════════════════════════════════════╗');
      lines.push(`║ Error Timeline: Session ${this.#sessionId.padEnd(35)} ║`);
      lines.push('╠═══════════════════════════════════════════════════════════════╣');
      lines.push('║                                                               ║');

      for (const entry of this.#entries) {
        const time = this.formatTime(entry.timestamp);
        const icon = this.getIcon(entry.level);
        const taskId = entry.taskId.padEnd(18);
        const event = entry.event.substring(0, 30);

        lines.push(`║ ${time} ${icon}  [${taskId}] ${event.padEnd(30)} ║`);

        if (entry.relatedEvents && entry.relatedEvents.length > 0) {
          for (const related of entry.relatedEvents) {
            const relTime = this.formatTime(related.timestamp);
            const relIcon = this.getIcon(related.level);
            lines.push(`║         ↳ ${relTime} ${relIcon} ${related.event.substring(0, 35)} ║`);
          }
        }
      }

      lines.push('║                                                               ║');
      lines.push('╚═══════════════════════════════════════════════════════════════╝');
    } else if (format === 'vertical') {
      lines.push('Error Timeline');
      lines.push('═'.repeat(80));
      lines.push('');

      for (const entry of this.#entries) {
        const time = entry.timestamp.toTimeString().split(' ')[0];
        const icon = this.getIcon(entry.level);
        const coloredLevel = this.colorizeLevel(entry.level);

        lines.push(`${time}  │  ${icon}  [${entry.taskId}] ${entry.event}`);

        if (entry.details) {
          lines.push(`          │     ${entry.details}`);
        }

        if (entry.relatedEvents && entry.relatedEvents.length > 0) {
          for (const related of entry.relatedEvents) {
            const relTime = related.timestamp.toTimeString().split(' ')[0];
            const relIcon = this.getIcon(related.level);
            lines.push(`          │     ${relTime} ${relIcon} ${related.event}`);
          }
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private formatTime(timestamp: Date): string {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getIcon(level: string): string {
    const icons = {
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
      success: '✓',
    };
    return icons[level as keyof typeof icons] || '•';
  }

  private colorizeLevel(level: string): string {
    const colors = {
      error: 'red',
      warning: 'yellow',
      info: 'blue',
      success: 'green',
    };
    return colors[level as keyof typeof colors] || 'white';
  }
}

// Pattern 3: Impact Analysis (src/utils/errors/impact-analyzer.ts)

import { getAllSubtasks, getDependencies, findItem } from '../task-utils.js';
import type { Backlog, Subtask } from '../../core/models.js';
import type { TaskImpact, ImpactLevel } from './types.js';

export class ImpactAnalyzer {
  #backlog: Backlog;

  constructor(backlog: Backlog) {
    this.#backlog = backlog;
  }

  analyzeImpact(failedTaskId: string): TaskImpact {
    // Find downstream tasks (dependents)
    const downstream = this.findDownstream(failedTaskId);

    // Group by hierarchy level
    const blockedPhases = new Set<string>();
    const blockedMilestones = new Set<string>();
    const blockedTasks = new Set<string>();

    for (const taskId of downstream) {
      const parts = taskId.split('.');

      // Phase level
      blockedPhases.add(parts[0]);

      // Milestone level
      if (parts.length >= 2) {
        blockedMilestones.add(`${parts[0]}.${parts[1]}`);
      }

      // Task level
      blockedTasks.add(taskId);
    }

    // Determine impact level
    const level = this.determineImpactLevel(
      blockedPhases.size,
      blockedMilestones.size,
      blockedTasks.size
    );

    // Calculate cascade depth
    const cascadeDepth = this.calculateCascadeDepth(failedTaskId);

    // Determine if pipeline can continue
    const canContinue = this.canContinueWithFailure(failedTaskId);

    // Suggest action based on impact
    const suggestedAction = this.suggestAction(level, canContinue);

    return {
      level,
      affectedTasks: downstream,
      blockedPhases: Array.from(blockedPhases),
      blockedMilestones: Array.from(blockedMilestones),
      blockedTasks: Array.from(blockedTasks),
      canContinue,
      suggestedAction,
      cascadeDepth,
    };
  }

  private findDownstream(taskId: string): string[] {
    const visited = new Set<string>();
    const downstream: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      // Find the item
      const item = findItem(this.#backlog, id);
      if (!item || item.type !== 'Subtask') return;

      // Find tasks that depend on this one
      const allSubtasks = getAllSubtasks(this.#backlog);
      for (const subtask of allSubtasks) {
        if (subtask.dependencies.includes(id) && !visited.has(subtask.id)) {
          downstream.push(subtask.id);
          traverse(subtask.id);
        }
      }
    };

    traverse(taskId);
    return downstream;
  }

  private calculateCascadeDepth(taskId: string): number {
    let maxDepth = 0;

    const traverse = (id: string, currentDepth: number) => {
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }

      const allSubtasks = getAllSubtasks(this.#backlog);
      for (const subtask of allSubtasks) {
        if (subtask.dependencies.includes(id)) {
          traverse(subtask.id, currentDepth + 1);
        }
      }
    };

    traverse(taskId, 0);
    return maxDepth;
  }

  private determineImpactLevel(
    phases: number,
    milestones: number,
    tasks: number
  ): ImpactLevel {
    if (phases >= 2) return 'critical';
    if (phases === 1 || milestones >= 3) return 'high';
    if (milestones >= 1 || tasks >= 5) return 'medium';
    if (tasks >= 1) return 'low';
    return 'none';
  }

  private canContinueWithFailure(taskId: string): boolean {
    // Check if there are any tasks that don't depend on this one
    const allSubtasks = getAllSubtasks(this.#backlog);
    for (const subtask of allSubtasks) {
      if (subtask.id === taskId) continue;

      // Check if this task's dependencies include the failed task
      if (!subtask.dependencies.includes(taskId)) {
        return true;
      }
    }

    return false;
  }

  private suggestAction(
    level: ImpactLevel,
    canContinue: boolean
  ): 'pause' | 'retry' | 'skip' | 'continue' {
    if (level === 'critical') return 'pause';
    if (level === 'high') return 'pause';
    if (canContinue) return 'continue';
    return 'retry';
  }
}

// Pattern 4: Stack Trace Formatting (src/utils/errors/stack-trace-formatter.ts)

import { readFile } from 'node:fs/promises';
import type { StackFrame, FormattedStackTrace, SourceContext } from './types.js';

export class StackTraceFormatter {
  // Patterns for identifying user code vs library code
  readonly #userCodePatterns = [
    /\/src\//,           // Project source code
    /\/lib\//,           // Project library code
    /^\.\/.*\.ts:/,      // Relative TypeScript imports
  ];

  readonly #libraryPatterns = [
    /\/node_modules\//,  // Node.js dependencies
    /internal\//,        // Node.js internals
    /\/\.yarn\//,        // Yarn internals
  ];

  async formatStackTrace(error: Error): Promise<FormattedStackTrace> {
    const frames = this.parseStackTrace(error);
    const userFrames = this.filterUserFrames(frames);

    // Get source context for most relevant frame
    const mostRelevant = userFrames[0];
    let sourceContext: SourceContext | undefined;

    if (mostRelevant) {
      sourceContext = await this.getSourceContext(mostRelevant);
    }

    return {
      message: error.message,
      errorType: error.name,
      frames: userFrames,
      sourceContext,
    };
  }

  parseStackTrace(error: Error): StackFrame[] {
    if (!error.stack) return [];

    const lines = error.stack.split('\n').slice(1); // Skip error message
    const frames: StackFrame[] = [];

    for (const line of lines) {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)/);
      if (!match) continue;

      const [, fnName, filePath, line, col, , fnName2, filePath2, line2, col2] = match;

      const frame: StackFrame = {
        functionName: fnName || fnName2 || '<anonymous>',
        filePath: filePath || filePath2 || '',
        line: parseInt(line || line2, 10),
        column: parseInt(col || col2, 10),
        isUserCode: this.isUserCode(filePath || filePath2 || ''),
        relevanceScore: 0,
      };

      frame.relevanceScore = this.calculateRelevance(frame);
      frames.push(frame);
    }

    return frames.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private filterUserFrames(frames: StackFrame[]): StackFrame[] {
    // Return only user code frames with relevance > 0.3
    return frames.filter(f => f.isUserCode && f.relevanceScore > 0.3);
  }

  private calculateRelevance(frame: StackFrame): number {
    let score = 0.5; // Base score

    // User code gets higher score
    if (frame.isUserCode) {
      score += 0.3;
    }

    // Library code gets lower score
    if (this.#libraryPatterns.some(p => p.test(frame.filePath))) {
      score -= 0.4;
    }

    // Files in /src/ get highest score
    if (/\/src\//.test(frame.filePath)) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private isUserCode(filePath: string): boolean {
    if (!filePath) return false;
    return this.#userCodePatterns.some(p => p.test(filePath));
  }

  private async getSourceContext(frame: StackFrame): Promise<SourceContext | undefined> {
    try {
      const content = await readFile(frame.filePath, 'utf-8');
      const lines = content.split('\n');

      const startLine = Math.max(0, frame.line - 3);
      const endLine = Math.min(lines.length, frame.line + 2);
      const codeLines = lines.slice(startLine, endLine);

      return {
        file: frame.filePath,
        line: frame.line,
        column: frame.column,
        codeLines,
        errorLineIndex: frame.line - startLine - 1,
      };
    } catch {
      // File not readable
      return undefined;
    }
  }
}

// Pattern 5: Recommendation Engine (src/utils/errors/recommendation-engine.ts)

import { ErrorCodes } from '../errors.js';
import type { SuggestedFix, PipelineErrorContext } from './types.js';

export class RecommendationEngine {
  // Error pattern to fix mapping
  readonly #fixPatterns = new Map<string, (error: Error, context: PipelineErrorContext) => SuggestedFix[]>([
    [
      'TYPE_VALIDATION_FAILED',
      (error, context) => [
        {
          priority: 1,
          description: 'Verify type definitions are correct',
          command: 'npm run check',
          explanation: 'Run TypeScript compiler to identify type errors',
          docsUrl: 'https://hacky-hack.dev/docs/types/validation',
        },
        {
          priority: 2,
          description: 'Check type imports and exports',
          command: `grep -r "import.*type" src/`,
          explanation: 'Verify all type imports point to valid definitions',
        },
      ],
    ],
    [
      'FILE_NOT_FOUND',
      (error, context) => [
        {
          priority: 1,
          description: 'Verify file exists',
          command: `ls -la ${context.sessionPath || '.'}`,
          explanation: 'Check if the file exists in the expected location',
        },
        {
          priority: 2,
          description: 'Initialize missing configuration',
          command: 'npm run init-config',
          explanation: 'Create default configuration if missing',
        },
      ],
    ],
    [
      'PIPELINE_AGENT_LLM_FAILED',
      (error, context) => [
        {
          priority: 1,
          description: 'Check API key configuration',
          command: 'echo $ANTHROPIC_API_KEY | wc -c',
          explanation: 'Verify API key is set and not empty',
          docsUrl: 'https://hacky-hack.dev/docs/api-keys',
        },
        {
          priority: 2,
          description: 'Test API connectivity',
          command: 'npm run test-api',
          explanation: 'Verify connection to API endpoint',
        },
      ],
    ],
  ]);

  generateFixes(error: Error, context: PipelineErrorContext): SuggestedFix[] {
    // Check for specific error code patterns
    if ('code' in error && typeof error.code === 'string') {
      const patternFixes = this.#fixPatterns.get(error.code);
      if (patternFixes) {
        return patternFixes(error, context);
      }
    }

    // Generic error handling based on error type
    if (error.message.includes('Cannot find module')) {
      return [
        {
          priority: 1,
          description: 'Install missing dependency',
          command: 'npm install',
          explanation: 'Install all package dependencies',
        },
      ];
    }

    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      return [
        {
          priority: 1,
          description: 'Check file permissions',
          command: 'ls -la',
          explanation: 'Verify you have permission to access the file',
        },
      ];
    }

    // Default generic suggestions
    return [
      {
        priority: 1,
        description: 'Review error details above',
        explanation: 'Check the error message and stack trace for specific issues',
      },
      {
        priority: 2,
        description: 'Check documentation',
        docsUrl: 'https://hacky-hack.dev/docs/errors',
      },
    ];
  }
}

// Pattern 6: Resume Command Builder (src/utils/errors/resume-command-builder.ts)

import type { ResumeCommandOptions } from './types.js';

export class ResumeCommandBuilder {
  buildCommand(options: ResumeCommandOptions): string {
    switch (options.strategy) {
      case 'retry':
        return this.buildRetryCommand(options.taskId, options.sessionId, options.flags);
      case 'skip':
        return this.buildSkipCommand(options.taskId, options.sessionId);
      case 'continue':
        return this.buildContinueCommand(options.sessionId);
      case 'interactive':
        return this.buildInteractiveCommand(options.sessionId);
      default:
        return this.buildRetryCommand(options.taskId, options.sessionId);
    }
  }

  buildRetryCommand(taskId: string, sessionId: string, flags?: string[]): string {
    const parts = ['npm', 'run', 'prd', '--', `--task ${taskId}`];

    if (flags && flags.length > 0) {
      parts.push(...flags);
    }

    return parts.join(' ');
  }

  buildSkipCommand(taskId: string, sessionId: string, skipDependents = false): string {
    const parts = ['npm', 'run', 'prd', '--', `--skip ${taskId}`];

    if (skipDependents) {
      parts.push('--skip-dependents');
    }

    return parts.join(' ');
  }

  buildContinueCommand(sessionId: string): string {
    return `npm run prd -- --continue`;
  }

  buildInteractiveCommand(sessionId: string): string {
    return `npm run prp -- --interactive`;
  }
}

// Pattern 7: Error Report Builder (src/utils/errors/error-reporter.ts)

import type { Logger } from '../logger.js';
import type { TaskFailure } from '../../workflows/prp-pipeline.js';
import type { Backlog } from '../../core/models.js';
import { TimelineTracker } from './timeline-tracker.js';
import { ImpactAnalyzer } from './impact-analyzer.js';
import { RecommendationEngine } from './recommendation-engine.js';
import { ResumeCommandBuilder } from './resume-command-builder.js';
import { StackTraceFormatter } from './stack-trace-formatter.js';
import type { EnhancedErrorReport } from './types.js';

interface ReportContext {
  sessionPath: string;
  sessionId: string;
  backlog: Backlog;
  totalTasks: number;
  completedTasks: number;
  pipelineMode: string;
  continueOnError: boolean;
  startTime: Date;
}

export class ErrorReportBuilder {
  #logger: Logger;
  #timelineTracker: TimelineTracker;
  #impactAnalyzer: ImpactAnalyzer;
  #recommendationEngine: RecommendationEngine;
  #resumeCommandBuilder: ResumeCommandBuilder;
  #stackTraceFormatter: StackTraceFormatter;

  constructor(logger: Logger, startTime: Date, sessionId: string) {
    this.#logger = logger;
    this.#timelineTracker = new TimelineTracker(sessionId, startTime);
    this.#impactAnalyzer = new ImpactAnalyzer(/* backlog passed in generateReport */);
    this.#recommendationEngine = new RecommendationEngine();
    this.#resumeCommandBuilder = new ResumeCommandBuilder();
    this.#stackTraceFormatter = new StackTraceFormatter();
  }

  async generateReport(
    failures: Map<string, TaskFailure>,
    context: ReportContext
  ): Promise<string> {
    // Build timeline from failures
    for (const failure of failures.values()) {
      this.#timelineTracker.addEntry({
        timestamp: failure.timestamp,
        level: 'error',
        taskId: failure.taskId,
        event: `${failure.taskTitle} failed`,
        details: failure.error.message,
      });
    }

    // Analyze impact for each failure
    const impactAnalyzer = new ImpactAnalyzer(context.backlog);
    const impactAnalysis = new Map<string, import('./types.js').TaskImpact>();
    const suggestedFixes = new Map<string, import('./types.js').SuggestedFix[]>();
    const resumeCommands = new Map<string, string[]>();

    for (const [taskId, failure] of failures) {
      // Impact analysis
      const impact = impactAnalyzer.analyzeImpact(taskId);
      impactAnalysis.set(taskId, impact);

      // Suggested fixes
      const fixes = this.#recommendationEngine.generateFixes(
        failure.error,
        { taskId: failure.taskId, sessionPath: context.sessionPath }
      );
      suggestedFixes.set(taskId, fixes);

      // Resume commands
      const commands = [
        this.#resumeCommandBuilder.buildRetryCommand(taskId, context.sessionId),
        this.#resumeCommandBuilder.buildSkipCommand(taskId, context.sessionId),
      ];
      resumeCommands.set(taskId, commands);
    }

    // Build report sections
    const sections: string[] = [];

    sections.push(this.buildHeader(context));
    sections.push(this.buildSummary(failures, context));
    sections.push(this.buildTimeline());
    sections.push(await this.buildFailures(failures, impactAnalysis, suggestedFixes, resumeCommands));
    sections.push(this.buildErrorCategories(failures));
    sections.push(this.buildImpactAnalysis(impactAnalysis));
    sections.push(this.buildNextSteps(failures, resumeCommands, context));

    return sections.join('\n\n');
  }

  private buildHeader(context: ReportContext): string {
    return `# Error Report

**Generated**: ${new Date().toISOString()}
**Pipeline Mode**: ${context.pipelineMode}
**Continue on Error**: ${context.continueOnError ? 'Yes' : 'No'}
**Session**: ${context.sessionId}`;
  }

  private buildSummary(failures: Map<string, TaskFailure>, context: ReportContext): string {
    const failedCount = failures.size;
    const successRate = context.totalTasks > 0
      ? ((context.completedTasks / context.totalTasks) * 100).toFixed(1)
      : '0.0';

    return `## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | ${context.totalTasks} |
| Completed | ${context.completedTasks} |
| Failed | ${failedCount} |
| Success Rate | ${successRate}% |`;
  }

  private buildTimeline(): string {
    const timeline = this.#timelineTracker.getTimeline();
    return `## Error Timeline

\`\`\`
${this.#timelineTracker.formatTimeline('vertical')}
\`\`\`

**Timeline Summary**:
- First error at: ${timeline.entries[0]?.timestamp.toISOString() || 'N/A'}
- Error frequency: ${timeline.entries.length} errors
- Total duration: ${this.formatDuration(timeline.startTime, timeline.endTime || new Date())}`;
  }

  private async buildFailures(
    failures: Map<string, TaskFailure>,
    impactAnalysis: Map<string, import('./types.js').TaskImpact>,
    suggestedFixes: Map<string, import('./types.js').SuggestedFix[]>,
    resumeCommands: Map<string, string[]>
  ): Promise<string> {
    const sections: string[] = ['## Failed Tasks', ''];

    let index = 1;
    for (const [taskId, failure] of failures) {
      sections.push(`### ${index}. ${taskId}: ${failure.taskTitle}`);
      sections.push('');
      sections.push(`**Phase**: ${failure.phase || 'Unknown'}`);
      sections.push(`**Milestone**: ${failure.milestone || 'N/A'}`);
      sections.push(`**Failed At**: ${failure.timestamp.toISOString()}`);
      sections.push('');

      // Stack trace with context
      const stackTrace = await this.#stackTraceFormatter.formatStackTrace(failure.error);
      sections.push('**Error Details**:');
      sections.push('```typescript');
      sections.push(`Error: ${failure.error.message}`);
      sections.push(`    at ${stackTrace.frames[0]?.functionName || '<unknown>'} (${stackTrace.frames[0]?.filePath}:${stackTrace.frames[0]?.line})`);

      for (const frame of stackTrace.frames.slice(1, 4)) {
        sections.push(`    at ${frame.functionName} (${frame.filePath}:${frame.line})`);
      }
      sections.push('```');
      sections.push('');

      // Source context if available
      if (stackTrace.sourceContext) {
        sections.push('**Source Context**:');
        sections.push('```typescript');
        const { codeLines, errorLineIndex } = stackTrace.sourceContext;
        for (let i = 0; i < codeLines.length; i++) {
          const prefix = i === errorLineIndex ? '>' : ' ';
          sections.push(`${prefix} ${stackTrace.sourceContext.line - errorLineIndex + i + i}  ${codeLines[i]}`);
        }
        sections.push('```');
        sections.push('');
      }

      // Impact analysis
      const impact = impactAnalysis.get(taskId);
      if (impact) {
        sections.push(`**Affected Tasks**:`);
        sections.push(`- ${this.getImpactIcon(impact.level)} **${impact.level.toUpperCase()} IMPACT**: ${impact.affectedTasks.length} task${impact.affectedTasks.length !== 1 ? 's' : ''} blocked`);
        for (const task of impact.affectedTasks) {
          sections.push(`  - \`${task}\``);
        }
        sections.push('');
      }

      // Suggested fixes
      const fixes = suggestedFixes.get(taskId);
      if (fixes && fixes.length > 0) {
        sections.push('**Suggested Fixes**:');
        for (const fix of fixes) {
          sections.push(`${fix.priority}. **${fix.description}**`);
          if (fix.command) {
            sections.push(`   \`\`\`bash`);
            sections.push(`   $ ${fix.command}`);
            sections.push(`   \`\`\``);
          }
          if (fix.explanation) {
            sections.push(`   ${fix.explanation}`);
          }
          if (fix.docsUrl) {
            sections.push(`   Documentation: ${fix.docsUrl}`);
          }
          sections.push('');
        }
      }

      // Resume commands
      const commands = resumeCommands.get(taskId);
      if (commands && commands.length > 0) {
        sections.push('**Resume Commands**:');
        sections.push('```bash');
        for (const cmd of commands) {
          sections.push(`# ${this.getCommandDescription(cmd)}`);
          sections.push(`$ ${cmd}`);
        }
        sections.push('```');
      }

      sections.push('---');
      sections.push('');
      index++;
    }

    return sections.join('\n');
  }

  private buildErrorCategories(failures: Map<string, TaskFailure>): string {
    const categories = { taskError: 0, agentError: 0, validationError: 0, sessionError: 0, other: 0 };

    for (const failure of failures.values()) {
      // Categorize based on error constructor name
      const name = failure.error.constructor.name;
      if (name === 'TaskError') categories.taskError++;
      else if (name === 'AgentError') categories.agentError++;
      else if (name === 'ValidationError') categories.validationError++;
      else if (name === 'SessionError') categories.sessionError++;
      else categories.other++;
    }

    return `## Error Categories

| Category | Count | Percentage |
|----------|-------|------------|
| **TaskError** | ${categories.taskError} | ${this.calculatePercentage(categories.taskError, failures.size)}% |
| **ValidationError** | ${categories.validationError} | ${this.calculatePercentage(categories.validationError, failures.size)}% |
| **AgentError** | ${categories.agentError} | ${this.calculatePercentage(categories.agentError, failures.size)}% |
| **SessionError** | ${categories.sessionError} | ${this.calculatePercentage(categories.sessionError, failures.size)}% |
| **Other** | ${categories.other} | ${this.calculatePercentage(categories.other, failures.size)}% |`;
  }

  private buildImpactAnalysis(impactAnalysis: Map<string, import('./types.js').TaskImpact>): string {
    const sections: string[] = ['## Impact Analysis', ''];

    let totalBlocked = 0;
    let totalPhases = new Set<string>();
    let totalMilestones = new Set<string>();

    for (const impact of impactAnalysis.values()) {
      totalBlocked += impact.affectedTasks.length;
      impact.blockedPhases.forEach(p => totalPhases.add(p));
      impact.blockedMilestones.forEach(m => totalMilestones.add(m));
    }

    sections.push(`**Blocked Tasks Summary**:`);
    sections.push(`- Total blocked: ${totalBlocked} tasks`);
    sections.push(`- Blocked phases: ${totalPhases.size}`);
    sections.push(`- Blocked milestones: ${totalMilestones.size}`);
    sections.push('');

    return sections.join('\n');
  }

  private buildNextSteps(
    failures: Map<string, TaskFailure>,
    resumeCommands: Map<string, string[]>,
    context: ReportContext
  ): string {
    const sections: string[] = ['## Next Steps', ''];

    sections.push('1. Review error timeline above to understand error sequence');
    sections.push('2. Fix the errors listed above:');

    let index = 1;
    for (const [taskId, failure] of failures) {
      sections.push(`   ${index}. **${taskId}**: ${failure.error.message}`);
      sections.push(`      - Check: ${failure.phase || 'Unknown phase'}`);
      index++;
    }

    sections.push('3. Resume pipeline execution:');
    const firstTask = failures.keys().next().value;
    const commands = resumeCommands.get(firstTask);
    if (commands && commands.length > 0) {
      sections.push(`   \`\`\`bash`);
      sections.push(`   $ ${commands[0]}`);
      sections.push(`   \`\`\``);
    }

    sections.push('');
    sections.push(`**Report Location**: ${context.sessionPath}/ERROR_REPORT.md`);

    return sections.join('\n');
  }

  private getImpactIcon(level: import('./types.js').ImpactLevel): string {
    const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', none: '⚪' };
    return icons[level];
  }

  private getCommandDescription(command: string): string {
    if (command.includes('--skip')) return 'Skip this task and continue';
    if (command.includes('--retry')) return 'Retry this task';
    if (command.includes('--continue')) return 'Continue from this point';
    return 'Run command';
  }

  private calculatePercentage(value: number, total: number): string {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  }

  private formatDuration(start: Date, end: Date): string {
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}
````

### Integration Points

```yaml
PIPELINE_ERROR_REPORTING:
  - modify: src/workflows/prp-pipeline.ts
  - method: #generateErrorReport() (lines 1397-1522)
  - import: ErrorReportBuilder from '../utils/errors/error-reporter.js'
  - integration: Replace current markdown generation with ErrorReportBuilder.generateReport()
  - preserve: Early return if #failedTasks.size === 0
  - preserve: Session path resolution from this.sessionManager.currentSession.metadata.path
  - preserve: Logging pattern with this.logger.info()

DEPENDENCY_ANALYSIS:
  - use: src/utils/task-utils.ts utilities
  - functions: getDependencies(), findItem(), getAllSubtasks()
  - pattern: DFS traversal for dependency graph analysis

ERROR_TYPE_CHECKING:
  - use: Type guards from src/utils/errors.ts
  - guards: isTaskError(), isAgentError(), isValidationError(), isSessionError()
  - pattern: Use guards instead of instanceof for error categorization

SESSION_METADATA:
  - use: this.sessionManager.currentSession.metadata
  - properties: hash, path, sequence, parentHash
  - pattern: Access via optional chaining - this.sessionManager.currentSession?.metadata.path

FILE_OPERATIONS:
  - use: node:fs/promises
  - functions: writeFile() for ERROR_REPORT.md
  - path: resolve(sessionPath, 'ERROR_REPORT.md')
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run lint        # ESLint with auto-fix
npm run check       # TypeScript compiler check
npm run format      # Prettier formatting

# Or use individual tools
npx eslint src/utils/errors/*.ts --fix
npx tsc --noEmit src/utils/errors/*.ts
npx prettier --write src/utils/errors/*.ts

# Project-wide validation
npm run lint
npm run check
npm run format

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm test -- tests/unit/utils/errors/error-reporter.test.ts
npm test -- tests/unit/utils/errors/timeline-tracker.test.ts
npm test -- tests/unit/utils/errors/impact-analyzer.test.ts
npm test -- tests/unit/utils/errors/recommendation-engine.test.ts
npm test -- tests/unit/utils/errors/resume-command-builder.test.ts
npm test -- tests/unit/utils/errors/stack-trace-formatter.test.ts

# Full test suite for error utilities
npm test -- tests/unit/utils/errors/

# Coverage validation
npm run test:coverage

# Expected: All tests pass, 100% coverage for new code. If failing, debug root cause.
```

### Level 3: Integration Testing (System Validation)

```bash
# Test error report generation with real pipeline
npm run build  # Build the project

# Create test session with failures
mkdir -p /tmp/test-error-report/plan/001_testsession/prps
mkdir -p /tmp/test-error-report/plan/001_testsession/artifacts

# Run pipeline with known failure
cd /tmp/test-error-report
node /home/dustin/projects/hacky-hack/dist/cli/index.js \
  --prd /home/dustin/projects/hacky-hack/PRD.md \
  --scope P2.M3.T2.S2 \
  --plan /tmp/test-error-report/plan

# Verify ERROR_REPORT.md was generated
cat /tmp/test-error-report/plan/001_testsession/ERROR_REPORT.md

# Validate report structure
grep -q "## Error Timeline" /tmp/test-error-report/plan/001_testsession/ERROR_REPORT.md
grep -q "## Failed Tasks" /tmp/test-error-report/plan/001_testsession/ERROR_REPORT.md
grep -q "## Impact Analysis" /tmp/test-error-report/plan/001_testsession/ERROR_REPORT.md
grep -q "## Next Steps" /tmp/test-error-report/plan/001_testsession/ERROR_REPORT.md

# Expected: Report generated with all sections, markdown is well-formed.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual Testing Scenarios

# Scenario 1: Verify error timeline format
cat plan/*/ERROR_REPORT.md | grep -A 50 "## Error Timeline"
# Verify: Chronological order, timestamps, icons, related events

# Scenario 2: Verify stack trace presentation
cat plan/*/ERROR_REPORT.md | grep -A 20 "Error Details"
# Verify: Stack frames shown, source context included, most relevant frame first

# Scenario 3: Verify impact analysis
cat plan/*/ERROR_REPORT.md | grep -A 20 "Affected Tasks"
# Verify: Blocked tasks listed, impact level shown, cascade depth calculated

# Scenario 4: Verify suggested fixes
cat plan/*/ERROR_REPORT.md | grep -A 10 "Suggested Fixes"
# Verify: At least 2 fixes per error, commands are copy-pasteable, docs links included

# Scenario 5: Verify resume commands
cat plan/*/ERROR_REPORT.md | grep -A 5 "Resume Commands"
# Verify: Commands are valid npm/prp commands, multiple options provided

# Scenario 6: Test with multiple concurrent errors
# Trigger pipeline with multiple failures
# Verify: Timeline shows all errors, impact analysis aggregates correctly

# Scenario 7: Test backward compatibility
# Ensure existing ERROR_REPORT.md readers still work
# Verify: All previous sections preserved, new sections additive

# Expected: All scenarios work correctly, output is readable and actionable.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run check`
- [ ] No formatting issues: `npm run format` then `git diff` shows no unintended changes
- [ ] 100% test coverage for new code: `npm run test:coverage` shows 100% for src/utils/errors/

### Feature Validation

- [ ] Error timeline shows chronological occurrence with timestamps
- [ ] Stack traces include source context (3-5 lines)
- [ ] Each error has at least 2 suggested fixes
- [ ] Affected tasks listed with impact level
- [ ] Resume commands generated for each error
- [ ] Documentation links included
- [ ] Integration with existing PRPPipeline seamless
- [ ] Backward compatibility maintained

### Code Quality Validation

- [ ] Follows existing codebase patterns (error handling, logging, file operations)
- [ ] File placement matches desired codebase tree structure
- [ ] Type safety maintained (no `any` types without justification)
- [ ] Error messages are helpful and actionable
- [ ] Code is self-documenting with clear names
- [ ] Complex logic has explanatory comments

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Public APIs have JSDoc comments
- [ ] Research documents referenced in PRP
- [ ] Integration points clearly documented
- [ ] Gotchas and library quirks documented

---

## Anti-Patterns to Avoid

- **Don't** break existing ERROR_REPORT.md consumers - maintain backward compatibility
- **Don't** use synchronous file operations - always use `fs.promises` in async context
- **Don't** hardcode session paths - use `sessionManager.currentSession.metadata.path`
- **Don't** skip type guards - use `isTaskError()`, etc. for error categorization
- **Don't** assume stack traces exist - check for `error.stack` before parsing
- **Don't** create new logger instances - use logger from PRPPipeline context
- **Don't** add new color libraries - use existing `chalk` installation
- **Don't** skip tests - 100% coverage is required by vitest.config.ts
- **Don't** mock time in tests incorrectly - use proper vi.useFakeTimers()
- **Don't** forget to handle edge cases - empty failures, missing session, invalid task IDs
- **Don't** generate duplicate content - each section should be unique
- **Don't** make the report too verbose - keep it concise while comprehensive
