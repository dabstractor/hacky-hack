# PRP: Design Task Retry Strategy

---

## Goal

**Feature Goal**: Create a comprehensive design document that defines the task retry strategy for automatic retry of failed tasks due to transient errors (network issues, API rate limits, timeouts) while failing immediately on permanent errors (validation failures, authentication errors).

**Deliverable**: Design document `plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md` containing:
- Error classification matrix (retryable vs non-retryable errors)
- Retry configuration (max attempts, exponential backoff)
- State preservation strategy between retries
- User notification patterns
- Integration with existing failure tracking
- Decision matrix and pseudocode

**Success Definition**:
- Design document exists at specified path with all required sections
- Error classification matrix covers all common error types
- Retry configuration includes specific values for max attempts, delays, and backoff
- State preservation approach is clearly defined
- User notification pattern is specified with log levels
- Integration approach with existing failure tracking is documented
- Decision matrix in ASCII-art format is included
- Pseudocode demonstrates the retry logic flow
- All sections reference specific file paths and line numbers from existing codebase

## User Persona

**Target User**: System architect / backend developer implementing the retry mechanism (P3.M2.T1.S2 implementation phase)

**Use Case**: The developer needs a complete specification of:
- Which errors to retry vs fail immediately
- How many times to retry and with what delays
- How to preserve state between retries
- How to notify users of retry attempts
- How to integrate with existing failure tracking

**User Journey**:
1. Developer reads design document to understand requirements
2. Developer identifies integration points in existing codebase
3. Developer implements retry logic using specified configuration
4. Developer tests implementation using specified test cases
5. Developer validates against success criteria in design document

**Pain Points Addressed**:
- **Unclear error classification**: Clear matrix defines retryable vs non-retryable
- **Missing retry strategy**: Specific configuration values provided
- **State management**: Clear approach for preserving retry state
- **User notification**: Specified log levels and message formats
- **Integration confusion**: Exact file paths and line numbers referenced

## Why

- **Current limitation**: Individual task failures don't stop pipeline but no automatic retry exists (from system_context.md)
- **Fix cycle limitation**: Retry exists in fix cycle (max 3 iterations) but not in individual task execution
- **Transient failure handling**: Network issues, API rate limits, and timeouts should trigger automatic retry
- **Permanent failure handling**: Validation errors, authentication failures should fail immediately
- **User experience**: Automatic retry reduces manual intervention for common transient issues
- **Observability**: Structured logging of retry attempts provides visibility into system health

## What

Create a design document that specifies:

### Success Criteria

- [ ] Document exists at `plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md`
- [ ] Error classification matrix with retryable and non-retryable error types
- [ ] Retry configuration section with specific max attempts, delays, and backoff values
- [ ] State preservation strategy for task status and retry count
- [ ] User notification pattern with log levels and message formats
- [ ] Integration section referencing existing failure tracking in `src/workflows/prp-pipeline.ts`
- [ ] ASCII-art decision matrix for error classification
- [ ] Pseudocode for main retry logic
- [ ] All file references include specific line numbers

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: YES - This PRP includes:
- Complete analysis of existing retry patterns from fix cycle
- Complete TaskOrchestrator error handling flow
- Complete PRPPipeline failure tracking system
- Existing retry utility implementation (`src/utils/retry.ts`)
- Industry best practices research with specific URLs
- Error classification framework from existing code
- Configuration patterns from existing CLI options
- Test patterns from existing test suite

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Design Document (OUTPUT - already created as reference)
- docfile: plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md
  why: This is the deliverable for P3.M2.T1.S1 - design specification
  section: All sections

# Existing Retry Implementation
- file: src/utils/retry.ts
  why: Complete retry utility with exponential backoff, error classification, jitter
  pattern: Use isTransientError() for error detection, calculateDelay() for backoff
  gotcha: Positive jitter only (line 262) - Math.random() gives [0,1), always adds variance

# Existing Error Classification
- file: src/utils/retry.ts
  why: Error classification functions for determining retryable vs permanent errors
  pattern: isTransientError() (lines 323-361), isPermanentError() (lines 388-410)
  gotcha: ValidationError is never retryable (line 343) - same input produces same error

# Task Orchestrator Error Handling
- file: src/core/task-orchestrator.ts
  why: Current error handling in executeSubtask() method (lines 672-776)
  pattern: Try-catch wraps execution, sets status to Failed, re-throws error
  gotcha: No retry currently implemented - immediate failure on any error

# Fix Cycle Retry Pattern
- file: src/workflows/fix-cycle-workflow.ts
  why: Example of iteration-based retry pattern (lines 305-335)
  pattern: while loop with maxIterations = 3, complete fix→retest cycles
  gotcha: This is NOT individual task retry - it's high-level QA cycle retry

# PRP Executor Fix-and-Retry
- file: src/agents/prp-executor.ts
  why: Fix-and-retry for validation failures (lines 438-457)
  pattern: Max 2 fix attempts, agent-based fixes for validation gate failures
  gotcha: Only retries validation failures, not general task execution errors

# PRP Pipeline Failure Tracking
- file: src/workflows/prp-pipeline.ts
  why: Failure tracking system for error reporting (lines 381-427)
  pattern: #trackFailure() method stores failures in #failedTasks Map
  gotcha: Individual task failures don't stop pipeline (continue to next task)

# PRP Pipeline Task Execution
- file: src/workflows/prp-pipeline.ts
  why: Main execution loop in executeBacklog() (lines 793-912)
  pattern: while (await this.taskOrchestrator.processNextItem())
  gotcha: Try-catch at lines 888-911 catches errors but doesn't retry

# Session Manager State Persistence
- file: src/core/session-manager.ts
  why: State management for task status and retry state
  pattern: updateItemStatus() for status changes, flushUpdates() for batch writes
  gotcha: Batch writes are atomic - use flushUpdates() to persist retry state

# Research Findings (from parallel research agents)
- docfile: plan/003_b3d3efdaf0ed/P3M2T1S1/research/fix_cycle_retry_analysis.md
  why: Analysis of existing retry patterns in fix cycle
  section: Fix Cycle Iteration Logic, Task-Level Error Handling

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S1/research/task_orchestrator_error_analysis.md
  why: Analysis of TaskOrchestrator error handling patterns
  section: Error Handling Patterns, Retry Mechanisms

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S1/research/prp_pipeline_task_execution_analysis.md
  why: Analysis of PRPPipeline task execution and failure handling
  section: Fatal vs Non-Fatal Error Handling, Individual Task Failures vs Pipeline Continuation

- docfile: plan/003_b3d3efdaf0ed/P3M2T1S1/research/retry_strategy_research.md
  why: Industry best practices for retry strategies
  section: Error Classification Framework, Exponential Backoff Patterns, State Preservation

# External Research (URLs with section anchors)
- url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  why: AWS best practices for exponential backoff and jitter
  critical: Full jitter recommended: sleep(random(0, min(cap, base * 2^attempt)))

- url: https://cloud.google.com/iam/docs/request-trial
  why: Google Cloud retry guidelines
  section: Automatic retry strategies

- url: https://learn.microsoft.com/en-us/azure/architecture/patterns/retry
  why: Azure retry pattern documentation
  section: Retry pattern implementation

- url: https://github.com/jd/tenacity
  why: Production retry library (Python) for reference patterns
  section: Decorator-based retry configuration

# Previous PRP (for context)
- docfile: plan/003_b3d3efdaf0ed/P3M1T2S2/PRP.md
  why: Parallel execution context - ResearchQueue configuration pattern
  section: Implementation Tasks, CLI Option Pattern, Integration Points
```

### Current Codebase Tree

```bash
/home/dustin/projects/hacky-hack
├── src/
│   ├── agents/
│   │   ├── prp-executor.ts        # Has fix-and-retry (lines 438-457)
│   │   ├── prp-runtime.ts         # PRP execution orchestration
│   │   └── prp-generator.ts       # PRP generation
│   ├── cli/
│   │   └── index.ts               # CLI option patterns (lines 192-196, 354-386)
│   ├── core/
│   │   ├── task-orchestrator.ts   # Task execution (lines 672-776)
│   │   ├── session-manager.ts     # State persistence
│   │   ├── research-queue.ts      # PRP generation queue
│   │   └── concurrent-executor.ts # Parallel task execution
│   ├── utils/
│   │   ├── retry.ts               # Existing retry utility (lines 1-705)
│   │   ├── errors.ts              # Error hierarchy
│   │   └── logger.ts              # Structured logging
│   └── workflows/
│       ├── prp-pipeline.ts        # Main pipeline (lines 793-912, 888-911)
│       └── fix-cycle-workflow.ts  # Fix cycle retry (lines 305-335)
├── plan/
│   └── 003_b3d3efdaf0ed/
│       ├── architecture/
│       │   └── retry-strategy-design.md  # OUTPUT: Design document
│       └── P3M2T1S1/
│           ├── PRP.md             # This file
│           └── research/          # Research findings from agents
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: ValidationError is NEVER retryable
// File: src/utils/retry.ts, line 343
// Rationale: Same input will always produce same validation error
if (isValidationError(err)) return false;

// CRITICAL: Positive jitter only (never subtracts from delay)
// File: src/utils/retry.ts, line 262
// Math.random() gives range [0, 1), ensuring jitter is always >= 0
const jitter = exponentialDelay * jitterFactor * Math.random();

// GOTCHA: TaskOrchestrator re-throws errors after setting status
// File: src/core/task-orchestrator.ts, line 775
// Pattern: Set status → Log error → Re-throw (for upstream handling)

// GOTCHA: PRPPipeline catches errors but doesn't retry
// File: src/workflows/prp-pipeline.ts, lines 888-911
// Pattern: Try-catch → Track failure → Continue to next task

// CRITICAL: Fix cycle maxIterations is 3, not 2
// File: src/workflows/fix-cycle-workflow.ts, line 72
// Some comments mention 2, but actual value is 3

// GOTCHA: PRPExecutor fix-and-retry is for validation only
// File: src/agents/prp-executor.ts, lines 438-457
// Max 2 fix attempts, only for validation gate failures

// CRITICAL: isTransientError() checks PipelineError codes
// File: src/utils/retry.ts, lines 333-340
// Only PIPELINE_AGENT_TIMEOUT and PIPELINE_AGENT_LLM_FAILED are retryable

// GOTCHA: HTTP status 429 (rate limit) should get more retries
// Recommendation: 5 retries for rate limits vs 3 for other transient errors

// CRITICAL: SessionManager uses batch writes
// Must call flushUpdates() to persist retry state immediately

// GOTCHA: Error classification order matters
// Check ValidationError BEFORE checking other patterns (line 343)
// Check PipelineError codes BEFORE generic patterns (lines 333-340)
```

## Implementation Blueprint

### Data Models and Structure

Extend the Subtask schema to include retry state:

```typescript
// Add to src/core/models.ts or new retry-state.ts file

interface SubtaskRetryState {
  /** Number of retry attempts made */
  retryAttempts: number;

  /** Last error encountered (for context) */
  lastError?: {
    message: string;
    code?: string;
    timestamp: Date;
  };

  /** Timestamp of first attempt */
  firstAttemptAt?: Date;

  /** Timestamp of last attempt */
  lastAttemptAt?: Date;
}

// Extend existing Subtask interface
interface Subtask {
  // ... existing properties: id, title, status, dependencies ...
  retryState?: SubtaskRetryState;
}

// Retry configuration interface
interface TaskRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Base delay before first retry in milliseconds (default: 1000) */
  baseDelay: number;

  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay: number;

  /** Exponential backoff multiplier (default: 2) */
  backoffFactor: number;

  /** Jitter factor 0-1 for randomization (default: 0.1) */
  jitterFactor: number;

  /** Enable/disable retry globally (default: true) */
  enabled: boolean;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
# NOTE: This is a DESIGN task (P3.M2.T1.S1), not an implementation task.
# The actual implementation will be done in P3.M2.T1.S2.
# This PRP creates the DESIGN DOCUMENT only.

Task 1: CREATE design document structure
  IMPLEMENT: Create plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md
  FOLLOW pattern: Existing design documents in plan/003_b3d3efdaf0ed/architecture/
  CONTENT:
    - Executive summary with problem statement
    - Current state analysis (existing retry mechanisms)
    - Error classification matrix (retryable vs non-retryable)
    - Decision tree in ASCII-art format
    - Retry configuration with specific values
    - State preservation strategy
    - User notification pattern
    - Integration with existing failure tracking
    - Pseudocode for retry logic
    - Testing strategy
    - Configuration examples
    - References
  PLACEMENT: plan/003_b3d3efdaf0ed/architecture/
  DEPENDENCIES: None (first task)

Task 2: DOCUMENT error classification matrix
  IMPLEMENT: Create comprehensive error classification table
  FOLLOW pattern: src/utils/retry.ts error classification (lines 323-410)
  CATEGORIES:
    - Retryable: Network errors, HTTP 5xx, HTTP 429, HTTP 408, LLM failures
    - Non-retryable: ValidationError, HTTP 4xx (except 408, 429), Parse errors
  CONFIGURATION:
    - Network errors: max 3 retries
    - Rate limits (429): max 5 retries (more for rate limits)
    - LLM failures: max 5 retries
    - Timeouts: max 3 retries
    - Validation errors: 0 retries (fail immediately)
  PLACEMENT: Section 3.1 of design document
  DEPENDENCIES: Task 1 (document structure exists)

Task 3: CREATE decision tree diagram
  IMPLEMENT: ASCII-art decision tree for error classification
  FLOW: Error received → Check ValidationError → Check isPermanentError() → Check retry count → Calculate delay or fail
  FORMAT: ASCII-art box diagram with decision points
  PLACEMENT: Section 3.2 of design document
  DEPENDENCIES: Task 2 (error categories defined)

Task 4: DOCUMENT retry configuration
  IMPLEMENT: Specify default configuration values
  DEFAULTS:
    - maxAttempts: 3
    - baseDelay: 1000ms
    - maxDelay: 30000ms
    - backoffFactor: 2
    - jitterFactor: 0.1
    - enabled: true
  ADAPTIVE:
    - Rate limits: 5 retries
    - LLM failures: 5 retries
    - Timeouts: 3 retries
  PLACEMENT: Section 3.3 of design document
  DEPENDENCIES: Task 2 (error types inform configuration)

Task 5: DOCUMENT exponential backoff formula
  IMPLEMENT: Formula and example calculations
  FOLLOW pattern: src/utils/retry.ts calculateDelay() (lines 246-268)
  FORMULA: exponentialDelay = min(baseDelay * (backoffFactor ^ attempt), maxDelay)
           jitter = exponentialDelay * jitterFactor * random()
           delay = max(1, floor(exponentialDelay + jitter))
  EXAMPLE: Show delay calculations for attempts 1-5 with specific values
  PLACEMENT: Section 3.4 of design document
  DEPENDENCIES: Task 4 (configuration values needed for examples)

Task 6: DOCUMENT state preservation strategy
  IMPLEMENT: Define what state to preserve and how
  STATE:
    - Task status (via SessionManager.updateItemStatus)
    - Retry count (new: Subtask.retryState.retryAttempts)
    - Last error (new: Subtask.retryState.lastError)
    - Timestamps (firstAttemptAt, lastAttemptAt)
  STORAGE: SessionManager with batch writes (flushUpdates)
  PLACEMENT: Section 3.5 of design document
  DEPENDENCIES: Task 1 (schema extension defined in structure section)

Task 7: DOCUMENT user notification pattern
  IMPLEMENT: Progressive disclosure pattern for retry notifications
  LEVELS:
    - Retry 1: Info level, minimal detail
    - Retry 2: Warning level, more detail
    - Retry 3+: Warning level, recommend monitoring
    - Max reached: Error level, action required
    - Permanent error: Error level, fix required
  FORMAT: Use existing logger from src/utils/logger.ts
  PLACEMENT: Section 3.6 of design document
  DEPENDENCIES: Task 5 (delay info for notification), Task 6 (retry state for context)

Task 8: DOCUMENT integration with failure tracking
  IMPLEMENT: Specify how to integrate with existing PRPPipeline failure tracking
  EXISTING: PRPPipeline.#trackFailure() method (lines 381-427)
  EXTENSION: Add retry attempts to TaskFailure interface
  METRICS:
    - Total retry attempts
    - Success after retry count
    - Failure after retry count
    - Retry success rate
  PLACEMENT: Section 3.7 of design document
  DEPENDENCIES: Task 6 (retry state for metrics), Task 7 (notification for tracking)

Task 9: CREATE pseudocode for retry logic
  IMPLEMENT: Language-agnostic pseudocode showing retry flow
  FUNCTIONS:
    - executeSubtaskWithRetry()
    - isRetryableError()
    - updateRetryState()
  STYLE: Clear, readable pseudocode with comments
  PLACEMENT: Section 5 of design document
  DEPENDENCIES: Task 3 (decision tree), Task 5 (backoff calculation), Task 6 (state management)

Task 10: DOCUMENT testing strategy
  IMPLEMENT: Test cases for validation
  UNIT TESTS:
    - Retry on transient error
    - No retry on permanent error
    - Respect max attempts
    - Exponential backoff calculation
    - State preservation
  INTEGRATION TESTS:
    - End-to-end retry flow
    - Failure after max retries
    - Parallel execution with retries
  CHAOS TESTS:
    - Random transient failures
    - Permanent failure rejection
  PLACEMENT: Section 6 of design document
  DEPENDENCIES: Task 9 (pseudocode defines expected behavior)

Task 11: DOCUMENT configuration examples
  IMPLEMENT: Usage examples for different scenarios
  SCENARIOS:
    - Default configuration
    - Aggressive retry (unstable networks)
    - Conservative retry (fast fail)
    - Disabled retry (debugging)
  FORMAT: CLI command examples with configuration values
  PLACEMENT: Section 7 of design document
  DEPENDENCIES: Task 4 (configuration defined)

Task 12: ADD references and appendices
  IMPLEMENT: Complete reference section with all URLs and file paths
  REFERENCES:
    - Internal documents (research findings)
    - Source files (with line numbers)
    - External URLs (with section anchors)
  APPENDICES:
    - Configuration matrix
    - Error codes reference
  PLACEMENT: Section 9 and appendices
  DEPENDENCIES: All previous tasks (complete context needed)
```

### Implementation Patterns & Key Details

```markdown
# Design Document Structure Pattern

Follow this structure for the design document:

1. Executive Summary
   - Problem statement (from system_context.md)
   - Proposed solution
   - Success criteria

2. Current State Analysis
   - Existing retry mechanisms (fix cycle, PRPExecutor, retry utility)
   - Current error handling flow
   - TaskOrchestrator error handling
   - PRPPipeline failure handling

3. Retry Strategy Design
   - 3.1 Error classification matrix (tables for retryable/non-retryable)
   - 3.2 Decision tree (ASCII-art diagram)
   - 3.3 Retry configuration (specific values)
   - 3.4 Exponential backoff with jitter (formula and examples)
   - 3.5 State preservation (schema extensions)
   - 3.6 User notification strategy (progressive disclosure)
   - 3.7 Integration with failure tracking (metrics)

4. Implementation Strategy
   - Integration points (TaskOrchestrator modification)
   - Configuration sources (CLI, env vars, defaults)
   - Backward compatibility

5. Pseudocode
   - Main retry logic
   - Error classification
   - State persistence

6. Testing Strategy
   - Unit tests
   - Integration tests
   - Chaos tests

7. Configuration Examples
   - Default, aggressive, conservative, disabled

8. Monitoring and Observability
   - Metrics to track
   - Dashboard queries

9. References
   - Internal documents
   - Source files with line numbers
   - External URLs

Appendices:
- A: Configuration matrix
- B: Error codes reference
```

### Integration Points

```yaml
DESIGN INTEGRATION:
  - output: plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md
  - references:
    - src/utils/retry.ts (existing retry utility)
    - src/core/task-orchestrator.ts (future integration point)
    - src/workflows/prp-pipeline.ts (failure tracking)
    - src/workflows/fix-cycle-workflow.ts (retry pattern reference)

RESEARCH INTEGRATION:
  - inputs:
    - plan/003_b3d3efdaf0ed/P3M2T1S1/research/fix_cycle_retry_analysis.md
    - plan/003_b3d3efdaf0ed/P3M2T1S1/research/task_orchestrator_error_analysis.md
    - plan/003_b3d3efdaf0ed/P3M2T1S1/research/prp_pipeline_task_execution_analysis.md
    - plan/003_b3d3efdaf0ed/P3M2T1S1/research/retry_strategy_research.md

EXTERNAL REFERENCES:
  - AWS: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  - GCP: https://cloud.google.com/iam/docs/request-trial
  - Azure: https://learn.microsoft.com/en-us/azure/architecture/patterns/retry

FUTURE IMPLEMENTATION (P3.M2.T1.S2):
  - modify: src/core/task-orchestrator.ts
    changes:
      - Add #executeWithRetry() method
      - Wrap executeSubtask() with retry logic
      - Add retry configuration parameter

  - modify: src/core/session-manager.ts
    changes:
      - Add updateRetryState() method
      - Add getRetryState() method
      - Add clearRetryState() method

  - modify: src/cli/index.ts
    changes:
      - Add --task-retry-max-attempts option
      - Add --task-retry-base-delay option
      - Add --task-retry-max-delay option
      - Add --task-retry-enabled option
```

## Validation Loop

### Level 1: Design Document Completeness (Immediate Validation)

```bash
# Verify design document exists and contains all required sections

# Check file exists
test -f plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md

# Check for required sections (grep for section headers)
grep -E "^(##|###)" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md | grep -E "(Executive Summary|Current State|Retry Strategy|Error Classification|Decision Tree|Configuration|State Preservation|User Notification|Integration|Pseudocode|Testing Strategy|References)"

# Expected: All section headers present
# If any section missing, add it before proceeding
```

### Level 2: Content Quality Validation

```bash
# Verify design document contains specific content

# Check for error classification table
grep -A 20 "Error Classification Matrix" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md

# Check for decision tree ASCII art
grep -A 30 "DECISION TREE" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md

# Check for configuration values
grep -E "(maxAttempts|baseDelay|maxDelay)" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md

# Check for file references with line numbers
grep -E "src/.*\.ts.*line[s]? [0-9]+" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md

# Expected: All content present with specific values
# If any content missing or generic, add specific details
```

### Level 3: Cross-Reference Validation

```bash
# Verify all referenced files exist

# Extract file paths from design document and check existence
grep -oE "src/[a-z/_-]+\.ts" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md | sort -u | while read f; do
  test -f "$f" && echo "✓ $f exists" || echo "✗ $f NOT FOUND"
done

# Extract research file paths and check existence
grep -oE "plan/.*P3M2T1S1.*\.md" plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md | while read f; do
  test -f "$f" && echo "✓ $f exists" || echo "✗ $f NOT FOUND"
done

# Expected: All referenced files exist
# If any file not found, verify correct path or file was created
```

### Level 4: Design Consistency Validation

```bash
# Verify design is internally consistent

# Check error classification matches existing code
# (Design document retryable errors should match src/utils/retry.ts isTransientError())

# Check configuration values are reasonable
# (maxAttempts 1-10, delays in milliseconds, backoffFactor 1-3)

# Check pseudocode matches decision tree
# (Decision tree branches should match pseudocode logic)

# Check all sections reference specific line numbers
# (No generic "see file X" without line numbers)

# Expected: Consistent design with specific references
# If inconsistencies found, resolve before finalizing
```

## Final Validation Checklist

### Design Document Validation

- [ ] Design document exists at `plan/003_b3d3efdaf0ed/architecture/retry-strategy-design.md`
- [ ] All required sections present (Executive Summary through References)
- [ ] Error classification matrix with specific error types
- [ ] Decision tree in ASCII-art format
- [ ] Retry configuration with specific values (maxAttempts, baseDelay, etc.)
- [ ] State preservation strategy defined
- [ ] User notification pattern specified
- [ ] Integration with existing failure tracking documented
- [ ] Pseudocode for retry logic included
- [ ] All file references include specific line numbers
- [ ] All research files referenced correctly
- [ ] External URLs with section anchors included

### Content Quality Validation

- [ ] Error classification covers retryable and non-retryable errors
- [ ] Configuration values are specific (not "to be determined")
- [ ] Decision tree is readable and complete
- [ ] Pseudocode is clear and matches design
- [ ] Testing strategy includes unit, integration, and chaos tests
- [ ] Configuration examples cover different scenarios
- [ ] References include internal docs, source files, and external URLs

### Integration Validation

- [ ] References existing retry utility (`src/utils/retry.ts`)
- [ ] References TaskOrchestrator (`src/core/task-orchestrator.ts`)
- [ ] References PRPPipeline (`src/workflows/prp-pipeline.ts`)
- [ ] References fix cycle pattern (`src/workflows/fix-cycle-workflow.ts`)
- [ ] References research findings from parallel agents
- [ ] All line numbers are accurate for referenced code

### Deliverable Validation

- [ ] Design document is the primary deliverable (this is P3.M2.T1.S1 - DESIGN task)
- [ ] No code implementation required (implementation is P3.M2.T1.S2)
- [ ] Design document is sufficient for implementer to build retry mechanism
- [ ] Design document passes "No Prior Knowledge" test
- [ ] All open questions documented (if any)

---

## Anti-Patterns to Avoid

- **Don't** implement code in this PRP (this is a DESIGN task, not implementation)
- **Don't** use generic references (always include specific line numbers)
- **Don't** create a design that requires new dependencies (use existing retry utility)
- **Don't** propose retry for validation errors ( ValidationError is never retryable)
- **Don't** ignore existing error classification (use isTransientError() from retry.ts)
- **Don't** create a design that breaks backward compatibility (retry should be opt-out-able)
- **Don't** forget to document the "why" behind each design decision
- **Don't** use negative jitter (existing implementation uses positive-only jitter)
- **Don't** mix up fix cycle iteration with task retry (different mechanisms)
- **Don't** create a design without testing strategy (chaos testing is important for retry)

---

## Design Principles

1. **Reuse Existing Infrastructure**: Leverage `src/utils/retry.ts` for error classification and backoff calculation
2. **Fail Fast on Permanent Errors**: ValidationError and authentication errors should fail immediately
3. **Progressive Disclosure**: Early retries show minimal detail, later retries show full context
4. **Observable**: All retry attempts logged with structured context for monitoring
5. **Configurable**: All parameters configurable via CLI, environment variables, or config file
6. **Backward Compatible**: Existing behavior preserved when retry disabled
7. **Stateful**: Retry state persisted for crash recovery and resumption
8. **Idempotent**: Retry operations are safe to repeat (same input after successful retry)

---

## Success Metrics

**Confidence Score**: 9/10 for one-pass implementation success in P3.M2.T1.S2

**Rationale**:
- Design document provides complete specification
- All error types classified with specific retry counts
- Configuration values are specified (not TBD)
- Integration points are clearly identified
- Existing retry utility can be reused
- Testing strategy is comprehensive

**Risk Areas**:
- State persistence complexity (retry state schema extension)
- Integration with existing SessionManager batch writes
- Parallel execution retry isolation (if concurrent tasks retry)

**Mitigation**:
- Design document includes specific schema extensions
- SessionManager integration clearly specified
- Parallel retry state isolation addressed in design
