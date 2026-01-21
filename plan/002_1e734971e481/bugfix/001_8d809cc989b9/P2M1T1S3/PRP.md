name: "P2.M1.T1.S3 - Run Instrumented E2E Tests and Analyze Output"
description: |

---

## Goal

**Feature Goal**: Execute instrumented E2E tests with comprehensive debug logging enabled to capture detailed execution traces, then analyze the output to identify the root cause of pipeline failures (success: false, missing files, timeout).

**Deliverable**: A detailed debug analysis document at `plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md` containing:

- Full debug log capture from test execution
- Root cause identification (first failure point, why files not created)
- Timeline analysis of execution flow
- Specific error messages and stack traces
- Recommended fix approach for P2.M1.T2

**Success Definition**:

- E2E tests executed with `--verbose` flag to capture debug logs
- Debug output captured and saved to analysis document
- Root cause clearly identified (session init failure, file creation failure, mock misalignment, or other)
- Analysis provides actionable next steps for fix implementation

## User Persona

**Target User**: Developer implementing bug fixes for the PRP Development Pipeline

**Use Case**: Debugging E2E pipeline test failures where the pipeline returns `success: false` and fails to create required files (`tasks.json`, `prd_snapshot.md`)

**User Journey**:

1. Enable verbose debug logging on E2E test execution
2. Run instrumented pipeline tests and capture full output
3. Analyze debug logs to identify where execution fails
4. Document findings to guide fix implementation
5. Hand off analysis to next subtask (P2.M1.T2) for fix implementation

**Pain Points Addressed**:

- Silent failures in E2E pipeline execution
- Missing files without clear error messages
- Timeout without understanding what's happening
- Lack of visibility into session initialization process

## Why

- **Foundation for Fix Implementation**: Cannot fix what you don't understand. Debug analysis is prerequisite to targeted, effective fixes
- **Prevents Fix-and-Pray Approach**: Analysis ensures fixes address root cause, not symptoms
- **Enables Faster Resolution**: Clear analysis accelerates fix implementation in P2.M1.T2
- **Documents System Behavior**: Analysis becomes permanent record of E2E execution patterns for future debugging

## What

Execute E2E pipeline tests with maximum verbosity to capture debug logs from instrumented PRPPipeline and SessionManager, then analyze output to identify root cause.

### Success Criteria

- [ ] E2E tests executed with debug logging enabled
- [ ] Full debug output captured including session directory path, PRD hash, file operations
- [ ] Analysis document created at specified path with:
  - [ ] Timeline of execution flow
  - [ ] First failure point identified
  - [ ] Root cause diagnosis (permissions? validation? mocks? timing?)
  - [ ] Specific error messages with stack traces
  - [ ] Why `tasks.json` and `prd_snapshot.md` were not created
- [ ] Recommended fix approach documented for next subtask

### Expected Debug Output to Capture

From instrumented PRPPipeline (P2.M1.T1.S1):

- `[PRPPipeline] Starting PRP Pipeline workflow` - with prdPath, scope, mode
- `[PRPPipeline] Session initialized` - with sessionPath, hasExistingBacklog
- `[PRPPipeline] PRD decomposition complete` - with totalPhases, totalTasks
- `[PRPPipeline] Backlog execution complete` - with completedTasks, totalTasks, failedTasks
- `[PRPPipeline] QA cycle complete` - with bugsFound, mode
- `[PRPPipeline] Workflow failed with error` - with errorMessage, errorType, stack (if error)

From instrumented SessionManager (P2.M1.T1.S2):

- `[SessionManager] Starting session initialization` - with prdPath, sessionHash
- `[SessionManager] Computing PRD hash` - with hash value
- `[SessionManager] PRD validation result` - with validation status
- `[SessionManager] Session discovery` - with existing session found or not
- `[SessionManager] Creating session directory` - with directory path
- `[SessionManager] Writing tasks.json` - with file path and result
- `[SessionManager] Writing PRD snapshot` - with file path and result
- `[SessionManager] Session initialization complete` - with duration

From session-utils debug logging:

- `[SessionUtils] Atomic write` - with file path, size, timing
- `[SessionUtils] Directory creation` - with path and mode
- `[SessionUtils] PRD hash computation` - with hash value
- Any `[SessionFileError]` exceptions with full context

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Validation**: This PRP provides:

- Exact test command to run with debug flags
- Expected debug log format and what to look for
- File locations for all relevant components
- Known failure symptoms from PRD Issue 3
- Previous subtask outputs (instrumented code)
- Analysis template structure
- Exit criteria for root cause identification

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/guide/debugging.html
  why: Vitest debugging options, --verbose flag, --debug mode, reporter options
  critical: Use --reporter=verbose for maximum output, --no-coverage for faster execution

- url: https://vitest.dev/guide/cli.html
  why: CLI options for running specific test files with flags
  critical: `vitest run tests/e2e/pipeline.test.ts --verbose --no-coverage`

- file: /home/dustin/projects/hacky-hack/tests/e2e/pipeline.test.ts
  why: Main E2E test file to execute - contains test expectations for session creation, file existence
  pattern: Test structure using temporary directories (mkdtempSync), mock setup in beforeEach, assertions for success flag, prd_snapshot.md, tasks.json
  gotcha: Tests use vi.useRealTimers() for setTimeout in createMockChild - critical for async mock behavior

- file: /home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts
  why: PRPPipeline with debug logging from P2.M1.T1.S1 - source of debug output
  pattern: Lines 1611-1716 contain debug logging added in commit 13fd479
  gotcha: Debug logs only appear when --verbose flag is used (logger checks verbose flag)

- file: /home/dustin/projects/hacky-hack/src/core/session-manager.ts
  why: SessionManager with debug logging from P2.M1.T1.S2 - source of session initialization debug output
  pattern: Lines 213-469 contain comprehensive debug logging for initialization flow
  gotcha: Logger is context-aware: `getLogger('SessionManager')` - check logs use this prefix

- file: /home/dustin/projects/hacky-hack/src/core/session-utils.ts
  why: Session utilities with debug logging for file operations - source of file write debug output
  pattern: Lines 105-151 (atomic writes), 231-254 (hash), 309-347 (directories), 492-531 (tasks.json)
  gotcha: SessionFileError includes path, operation, and underlying error - check for these in output

- file: /home/dustin/projects/hacky-hack/package.json
  why: Test script definitions - need exact command to run
  pattern: `"test:run": "vitest run"` - base command, append file path and flags
  gotcha: Use `npm run test:run -- tests/e2e/pipeline.test.ts --verbose` syntax (double dash separator)

- file: /home/dustin/projects/hacky-hack/vitest.config.ts
  why: Vitest configuration for test environment
  pattern: Test timeout defaults (30000ms), coverage settings, mock setup files
  gotcha: tests/setup.ts contains API endpoint validation - may affect execution

- file: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json
  why: Task hierarchy context - this is P2.M1.T1.S3 (Run instrumented E2E tests and analyze output)
  pattern: Subtask P2.M1.T1.S1 (Complete) - PRPPipeline debug logging added, Subtask P2.M1.T1.S2 (Complete) - SessionManager debug logging added
  gotcha: This is a research/analysis subtask - outputs documentation, not code changes

- docfile: /home/dustin/projects/hacky-hack/plan/002_1e734971e481/bugfix/001_8d809cc989b9/prd_snapshot.md
  why: PRD context - Issue 3 describes the E2E test failures being debugged
  section: "Issue 3: E2E Pipeline Execution Failures" - describes success: false, ENOENT errors, timeout symptoms
```

### Current Codebase Tree

```bash
hacky-hack/
├── src/
│   ├── core/
│   │   ├── session-manager.ts       # Instrumented with debug logging (P2.M1.T1.S2)
│   │   ├── session-utils.ts         # Instrumented with debug logging (P2.M1.T1.S2)
│   │   └── models.ts                # SessionState, Backlog types
│   ├── workflows/
│   │   └── prp-pipeline.ts          # Instrumented with debug logging (P2.M1.T1.S1)
│   └── utils/
│       ├── logger.ts                # Pino logger configuration
│       └── errors.ts                # Error classes (P1 complete)
├── tests/
│   ├── e2e/
│   │   └── pipeline.test.ts         # E2E test suite to execute
│   ├── fixtures/
│   │   └── simple-prd.ts            # Mock PRD for testing
│   └── setup.ts                     # Global test setup with API validation
├── plan/
│   └── 002_1e734971e481/
│       └── bugfix/
│           └── 001_8d809cc989b9/
│               ├── tasks.json       # Task hierarchy
│               ├── architecture/    # Where analysis document will be created
│               └── P2M1T1S3/
│                   └── PRP.md       # This PRP
├── package.json                     # Test scripts: npm run test:run
└── vitest.config.ts                 # Test configuration
```

### Desired Codebase Tree After Implementation

```bash
# No code changes in this subtask - only documentation output

plan/002_1e734971e481/bugfix/001_8d809cc989b9/
└── architecture/
    └── e2e-debug-analysis.md        # NEW: Detailed debug analysis document
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Debug logging only appears with --verbose flag
// The logger in src/utils/logger.ts checks the verbose flag before emitting DEBUG level logs
// Without --verbose, debug logs are suppressed and you won't see the instrumented output
// Command MUST include: --verbose flag

// CRITICAL: Vitest mock timing requires real timers
// tests/e2e/pipeline.test.ts line 260: vi.useRealTimers()
// If tests hang or mocks don't fire, check that real timers are active
// The createMockChild function uses setTimeout for async event emission

// CRITICAL: existsSync mock returns true for ALL paths
// tests/e2e/pipeline.test.ts line 60: existsSync: vi.fn(() => true)
// This means the test will pass file existence checks even if files weren't created
// Debug logging is CRITICAL because mock behavior masks the actual problem
// The real issue is in the production code, not masked by mocks

// CRITICAL: readFile mock has conditional logic
// tests/e2e/pipeline.test.ts lines 240-249: Returns different content based on path
// If SessionManager tries to read tasks.json before it's created, mock returns empty JSON
// This can cause validation failures or empty backlog issues

// CRITICAL: Session initialization is complex multi-step process
// From session-manager.ts analysis:
// 1. Hash PRD (SHA-256)
// 2. Validate PRD (PRDValidator)
// 3. Search for existing session
// 4. Load existing OR create new session
// 5. Validate dependencies
// 6. Complete initialization
// Failure could happen at ANY step - debug logs needed to identify which

// CRITICAL: File operations use atomic write pattern
// session-utils.ts writes to temp file then renames
// If rename fails (cross-device, permission), original file is preserved but new one not created
// Look for "[SessionUtils] Atomic write" logs to verify this step

// CRITICAL: Test timeout is 30 seconds
// vitest.config.ts: testTimeout: 30000
// If pipeline takes longer, test will fail with timeout error
// Debug logs should show where execution spends time

// CRITICAL: Pino logger redacts sensitive data
// src/utils/logger.ts: Redacts API keys, tokens automatically
// If you need to see sensitive values in debug, may need to disable redaction temporarily

// CRITICAL: Error handling distinguishes fatal vs non-fatal
// src/utils/errors.ts: isFatalError() function (P1.M2 complete)
// Fatal errors: SessionError, EnvironmentError (halt execution)
// Non-fatal errors: TaskError, AgentError (allow retry)
// Check error type in debug logs to understand failure impact
```

## Implementation Blueprint

### Data Models and Structure

This is a research/analysis task - no new data models. We analyze existing execution flow:

**Session Initialization Flow** (from session-manager.ts):

```typescript
// SessionManager.initialize() execution order:
1. computePRDHash() -> SHA-256 hash of PRD content
2. validatePRD() -> PRDValidator checks structure
3. discoverSession() -> Scan plan/ for matching hash
4. loadSession() OR createNewSession() -> Branch based on discovery
5. validateDependencies() -> Check for circular deps
6. flushUpdates() -> Persist state to disk
```

**PRPPipeline Execution Flow** (from prp-pipeline.ts):

```typescript
// PRPPipeline.run() execution order:
1. Setup -> startTime, status='running'
2. initializeSession() -> Create SessionManager, call initialize()
3. decomposePRD() -> Generate task backlog (if new session)
4. executeBacklog() -> Execute tasks with graceful shutdown
5. runQACycle() -> Run QA bug hunt
6. cleanup() -> Always runs, preserves state
```

**Expected Debug Log Sequence** (what we should see if successful):

```
[timestamp] [PRPPipeline] Starting PRP Pipeline workflow
[timestamp] [SessionManager] Starting session initialization
[timestamp] [SessionManager] Computing PRD hash: <hash>
[timestamp] [SessionManager] PRD validation result: <status>
[timestamp] [SessionManager] Session discovery: <result>
[timestamp] [SessionManager] Creating session directory: <path>
[timestamp] [SessionUtils] Directory created: <path>
[timestamp] [SessionManager] Writing PRD snapshot: <path>
[timestamp] [SessionUtils] Atomic write complete: <path>
[timestamp] [SessionManager] Writing tasks.json: <path>
[timestamp] [SessionUtils] Atomic write complete: <path>
[timestamp] [SessionManager] Session initialization complete: <duration>ms
[timestamp] [PRPPipeline] Session initialized
[timestamp] [PRPPipeline] PRD decomposition complete
[timestamp] [PRPPipeline] Backlog execution complete
[timestamp] [PRPPipeline] QA cycle complete
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: PREPARE - Create analysis document directory
  - CREATE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/ if not exists
  - VERIFY: Write permissions to directory
  - CONTEXT: This is where e2e-debug-analysis.md will be written

Task 2: EXECUTE - Run E2E tests with verbose debug logging
  - RUN: npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage
  - CAPTURE: Full stdout and stderr to file (use tee or output redirection)
  - OBSERVE: Look for debug log prefixes: [PRPPipeline], [SessionManager], [SessionUtils]
  - TIMEOUT: If test exceeds 30 seconds, note where execution hangs
  - OUTPUT: Save raw test output to temporary file for analysis

Task 3: ANALYZE - Examine debug logs for failure point
  - SEARCH: For first occurrence of ERROR or errorType in logs
  - IDENTIFY: Last successful debug log before failure
  - EXTRACT: Error messages, stack traces, error codes
  - TRACE: Session initialization flow - which step completed, which failed
  - CHECK: For [SessionFileError] exceptions indicating file operation failures
  - CHECK: For validation failures from PRDValidator
  - CHECK: For timeout patterns (long pauses between logs)

Task 4: DIAGNOSE - Determine root cause
  - IF: No [SessionManager] logs appear -> Logger not working, verbose flag missing
  - IF: Hash computation fails -> PRD file issue, encoding problem
  - IF: PRD validation fails -> PRD structure invalid, validator too strict
  - IF: Session discovery fails -> plan/ directory permission, regex issue
  - IF: Directory creation fails -> File system permissions, disk space
  - IF: tasks.json write fails -> Mock returning invalid data, Zod validation rejection
  - IF: prd_snapshot.md write fails -> File path issue, encoding problem
  - IF: Timeout occurs -> Infinite loop, hanging promise, mock not resolving

Task 5: DOCUMENT - Create comprehensive analysis document
  - CREATE: plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md
  - INCLUDE: Section 1 - Test execution summary (command, duration, result)
  - INCLUDE: Section 2 - Full debug log capture (raw output)
  - INCLUDE: Section 3 - Timeline analysis (execution flow with timestamps)
  - INCLUDE: Section 4 - Failure point identification (where execution stopped)
  - INCLUDE: Section 5 - Root cause diagnosis (why it failed)
  - INCLUDE: Section 6 - Mock behavior analysis (how mocks affected execution)
  - INCLUDE: Section 7 - Recommended fix approach (what to do in P2.M1.T2)
  - FORMAT: Use markdown with code blocks for logs, bullet points for findings

Task 6: VALIDATE - Review analysis completeness
  - VERIFY: Root cause is clearly stated (not just symptoms)
  - VERIFY: Analysis includes specific error messages and stack traces
  - VERIFY: Recommended fix is actionable for next subtask
  - VERIFY: Document is saved at correct path
  - HANDOFF: Mark task P2.M1.T1.S3 complete, ready for P2.M1.T2
```

### Implementation Patterns & Key Details

```bash
# Pattern: Running E2E tests with maximum verbosity
# This captures all debug logs from instrumented code

npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage 2>&1 | tee /tmp/e2e-debug-output.txt

# Breakdown:
# npm run test:run -- - Execute vitest in CI mode (no watch)
# tests/e2e/pipeline.test.ts - Specific test file to run
# --verbose - Enable verbose output (CRITICAL for debug logs)
# --no-coverage - Skip coverage collection (faster, less noise)
# 2>&1 - Capture both stdout and stderr
# | tee /tmp/e2e-debug-output.txt - Save to file while displaying

# Pattern: Grep for specific debug log prefixes
# Filter output to find relevant debug messages

cat /tmp/e2e-debug-output.txt | grep -E "\[(PRPPipeline|SessionManager|SessionUtils)\]"

# Pattern: Find error messages in output
# Identify where errors occurred

cat /tmp/e2e-debug-output.txt | grep -iE "(error|Error|ERROR|failed|Failed|FAILED)"

# Pattern: Extract timestamps for timeline analysis
# Build execution timeline from log timestamps

cat /tmp/e2e-debug-output.txt | grep -oE "\[[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}\]" | sort -u
```

```markdown
# Pattern: Analysis document structure

# Template for e2e-debug-analysis.md

# E2E Pipeline Debug Analysis

## Executive Summary

- **Test Command**: `npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage`
- **Execution Date**: [timestamp]
- **Test Result**: [PASS/FAIL/TIMEOUT]
- **Root Cause**: [One-sentence summary]

## Test Execution Summary

- Duration: [X seconds]
- Tests Run: [X tests]
- Tests Passed: [X tests]
- Tests Failed: [X tests]
- First Failure: [test name]

## Debug Log Capture

<details>
<summary>Full Test Output (click to expand)</summary>
```

[PASTE RAW TEST OUTPUT HERE]

```
</details>

## Timeline Analysis
| Time | Component | Event | Details |
|------|-----------|-------|---------|
| 00:00.000 | PRPPipeline | Starting workflow | prdPath: [path] |
| 00:00.123 | SessionManager | Initialize started | prdPath: [path] |
| ... | ... | ... | ... |

## Failure Point Identification
**Last Successful Log**: [log message]
**First Error Log**: [log message]
**Failure Location**: [Component:Method:Line]

## Root Cause Diagnosis
**Primary Issue**: [Description]
**Contributing Factors**:
- [Factor 1]
- [Factor 2]

**Evidence**:
- [Error message 1]
- [Stack trace excerpt]
- [Missing file: path]

## Mock Behavior Analysis
**readFile Mock**:
- Called: [X] times
- Paths requested: [list]
- Returns: [description]

**existsSync Mock**:
- Behavior: Always returns true
- Impact: Masks actual file system issues

**createAgent Mock**:
- Called: [X] times
- Agent types created: [list]

## Recommended Fix Approach
**For P2.M1.T2.S1 (Session initialization fix)**:
- [Specific action to take]

**For P2.M1.T2.S2 (tasks.json creation fix)**:
- [Specific action to take]

**For P2.M1.T2.S3 (prd_snapshot.md creation fix)**:
- [Specific action to take]

## Appendix: Additional Context
- [Relevant code snippets]
- [Related issues]
- [Similar problems]
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - command: 'npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage'
  - expected_duration: '< 30 seconds per test'
  - expected_output: 'Debug logs with [PRPPipeline], [SessionManager], [SessionUtils] prefixes'

DEBUG_LOGGING:
  - source: 'src/workflows/prp-pipeline.ts (lines 1611-1716)'
  - source: 'src/core/session-manager.ts (lines 213-469)'
  - source: 'src/core/session-utils.ts (lines 105-531)'
  - trigger: '--verbose flag enables DEBUG level logs'

OUTPUT_LOCATION:
  - file: 'plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md'
  - format: 'Markdown with code blocks and tables'
  - sections: 'Summary, Logs, Timeline, Failure Point, Root Cause, Recommendations'

HANDOFF:
  - to: 'P2.M1.T2 (Fix identified E2E pipeline issues)'
  - provides: 'Root cause diagnosis and recommended fix approach'
  - enables: 'Targeted fix implementation based on analysis'
```

## Validation Loop

### Level 1: Test Execution Verification (Immediate Feedback)

```bash
# Verify test command works
npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage

# Expected output:
# - Tests start executing
# - Debug logs appear (if verbose flag working)
# - Tests complete or timeout
# - Exit code indicates pass/fail

# If no tests run:
# Check: File path is correct (tests/e2e/pipeline.test.ts)
# Check: vitest.config.ts include pattern matches test file
# Check: No syntax errors in test file

# If no debug logs appear:
# Check: --verbose flag is present
# Check: Logger configuration in src/utils/logger.ts
# Check: Instrumented code is actually being executed (not mocked out)
```

### Level 2: Log Capture Validation (Component Validation)

```bash
# Verify debug logs are present in output
npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage 2>&1 | grep "\[PRPPipeline\]"

# Expected: Multiple log lines with [PRPPipeline] prefix
# If none: Instrumentation not loaded or verbose flag not working

# Verify SessionManager logs
npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage 2>&1 | grep "\[SessionManager\]"

# Expected: Multiple log lines with [SessionManager] prefix
# If none: SessionManager not executing or logger not working

# Verify SessionUtils logs
npm run test:run -- tests/e2e/pipeline.test.ts --verbose --no-coverage 2>&1 | grep "\[SessionUtils\]"

# Expected: Log lines for file operations (atomic writes, directory creation)
# If none: File operations not executing or not reaching instrumented code
```

### Level 3: Analysis Document Validation (System Validation)

```bash
# Verify analysis document was created
ls -la plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md

# Expected: File exists with non-zero size
# If missing: Task 5 (DOCUMENT) not completed

# Verify document contains required sections
grep -E "^(# Executive Summary|# Test Execution|# Debug Log|# Timeline|# Failure Point|# Root Cause|# Mock Behavior|# Recommended Fix)" \
  plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md

# Expected: All 8 section headers present
# If missing: Document incomplete

# Verify document has actual content (not just template)
wc -l plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md

# Expected: > 100 lines (for comprehensive analysis)
# If < 50 lines: Document is template-only, not filled with actual findings
```

### Level 4: Root Cause Validation (Domain-Specific Validation)

````bash
# Verify root cause is clearly stated
grep -A 5 "## Root Cause Diagnosis" \
  plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md

# Expected: Clear statement of primary issue
# Example: "Primary Issue: SessionManager.createSessionDirectory() fails due to missing plan/ directory"

# Verify recommendations are actionable
grep -A 10 "## Recommended Fix Approach" \
  plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md

# Expected: Specific actions, not vague suggestions
# Good: "Add check for plan/ directory existence in SessionManager.initialize() line 350"
# Bad: "Fix session initialization"

# Verify analysis references actual debug output
grep "```" plan/002_1e734971e481/bugfix/001_8d809cc989b9/architecture/e2e-debug-analysis.md | wc -l

# Expected: Multiple code blocks (at least 4) with actual log excerpts
# If 0-2 code blocks: Analysis is opinion-based, not data-driven
````

## Final Validation Checklist

### Technical Validation

- [ ] E2E tests executed with --verbose flag
- [ ] Full test output captured (stdout + stderr)
- [ ] Debug logs present in output ([PRPPipeline], [SessionManager], [SessionUtils])
- [ ] Test execution took < 60 seconds (or timeout documented)
- [ ] Analysis document created at specified path
- [ ] Document is > 100 lines (comprehensive, not template)

### Analysis Quality Validation

- [ ] Root cause clearly identified (not just symptoms described)
- [ ] First failure point specified with log line reference
- [ ] Error messages and stack traces included from output
- [ ] Timeline analysis shows execution flow
- [ ] Mock behavior documented (readFile, existsSync, createAgent)
- [ ] Analysis is data-driven (references actual logs, not assumptions)

### Handoff Validation

- [ ] Recommended fix approach is specific and actionable
- [ ] Recommendations map to P2.M1.T2 subtasks (S1, S2, S3)
- [ ] Analysis document includes enough context for fix implementation
- [ ] Next subtask (P2.M1.T2) can proceed without additional research

### Documentation & Deployment

- [ ] Analysis document follows template structure
- [ ] Code blocks properly formatted with ``` fences
- [ ] Tables (if used) have proper markdown syntax
- [ ] File paths are accurate and absolute
- [ ] Timestamps and commands preserved for reproducibility

---

## Anti-Patterns to Avoid

- ❌ Don't run tests without --verbose flag (debug logs won't appear)
- ❌ Don't skip capturing full output (need raw logs for analysis)
- ❌ Don't analyze test output without examining actual debug logs (guessing vs data-driven)
- ❌ Don't document symptoms without identifying root cause (won't lead to effective fix)
- ❌ Don't create vague recommendations ("fix the code" vs "add directory check at line 350")
- ❌ Don't skip mock behavior analysis (mocks are critical to E2E test execution)
- ❌ Don't assume file operations succeeded without verification (existsSync mock masks issues)
- ❌ Don't ignore timeout patterns (may indicate infinite loops or hanging promises)
- ❌ Don't forget to document the actual test command used (reproducibility)
- ❌ Don't write analysis as template without filling in actual findings (waste of time)
