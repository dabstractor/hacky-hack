# Product Requirement Prompt (PRP): Add Debug Logging for Guard Context

---

## Goal

**Feature Goal**: Add debug logging that displays all guard-relevant context (PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING, PRP_PIPELINE_RUNNING) to enable effective troubleshooting of nested execution guard issues.

**Deliverable**: Modified `PRPPipeline.run()` method with a single debug log statement that outputs all four guard context fields in the specified format.

**Success Definition**:

- Debug log message appears after validation passes and after PRP_PIPELINE_RUNNING is set
- Log message contains all 4 required fields: PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING, PRP_PIPELINE_RUNNING
- Log message uses exact format: `Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}`
- Log only appears when debug mode is enabled (--log-level debug or --verbose)
- No regressions to existing functionality

## User Persona

**Target User**: System operators and developers troubleshooting guard-related issues

**Use Case**: When nested execution guards prevent pipeline execution or behave unexpectedly, operators need visibility into all guard-relevant context to diagnose the issue

**User Journey**:

1. Operator encounters nested execution guard error or unexpected guard behavior
2. Operator enables debug mode with `--log-level debug` flag
3. PRP Pipeline runs and outputs guard context information
4. Operator uses this information to diagnose why guard is blocking or allowing execution

**Pain Points Addressed**:

- Currently no visibility into guard context when troubleshooting
- Difficult to determine why nested execution validation is failing
- No way to verify environment variables are set correctly
- Cannot see session paths during guard validation

## Why

- **Troubleshooting Efficiency**: Reduces time to diagnose guard-related issues from hours to minutes
- **Operational Visibility**: Provides complete context of guard state without manual environment inspection
- **Debugging Support**: Essential for implementing and validating guard functionality (PRD §9.2.5 requirement)
- **Production Readiness**: Guards are critical infrastructure; debug logging is necessary for production operations

## What

### User-Visible Behavior

**No direct user-visible changes** - this is infrastructure-level debug logging.

**Observable behavior:**

- When `--log-level debug` is enabled, a single log line appears after validation passes:
  ```
  `
  [timestamp] [DEBUG] [PRPPipeline] Guard Context: PLAN_DIR=/home/user/project/plan, SESSION_DIR=/home/user/project/plan/001_abc123, SKIP_BUG_FINDING=false, PRP_PIPELINE_RUNNING=12345
  `
  ```
- Log shows absolute paths for directories
- Log shows raw string values for environment variables (not parsed booleans)
- Log only appears in debug mode, not in normal operation

### Success Criteria

- [ ] Debug log appears after PRP_PIPELINE_RUNNING is set (P1.M3.T2.S4 dependency)
- [ ] Debug log contains all 4 required fields in specified order
- [ ] Debug log uses exact format specified in task description
- [ ] Debug log only appears when debug mode is enabled
- [ ] PLAN_DIR shows absolute path from sessionManager.planDir
- [ ] SESSION_DIR shows absolute path from currentSession.metadata.path or 'not set'
- [ ] SKIP_BUG_FINDING shows raw env var value or 'false'
- [ ] PRP_PIPELINE_RUNNING shows raw env var value or 'not set'
- [ ] No errors when currentSession is null ( SESSION_DIR = 'not set')
- [ ] All existing tests pass
- [ ] New tests cover guard context logging behavior

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:

- Exact file location and line number for modification
- Complete code example with all 4 field extractions
- Logger usage patterns from existing codebase
- SessionManager API documentation with null safety patterns
- Environment variable access patterns with default values
- Test structure and validation commands
- All dependencies on previous subtasks are documented

### Documentation & References

```yaml
# MUST READ - Previous subtask PRP (dependency)
- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S4/PRP.md
  why: Defines PRP_PIPELINE_RUNNING implementation that this task depends on
  section: "Implementation Blueprint - Task 2: Set PRP_PIPELINE_RUNNING"
  critical: |
    - PRP_PIPELINE_RUNNING is set after SessionManager creation (line ~1700)
    - Variable is set to currentPid (string representation of process.pid)
    - Debug logging occurs when guard is set: 'Set PRP_PIPELINE_RUNNING=<pid>'
    - This task's logging must be AFTER that set operation

# MUST READ - Implementation target
- file: src/workflows/prp-pipeline.ts
  why: Target file for modification - contains run() method where logging must be added
  pattern: |
    - Lines 1665-1811: Complete run() method implementation
    - Lines 1709-1735: Validation sequence (validateNestedExecution, error handling)
    - Lines 1714-1720: Debug logging pattern to follow
    - Line ~1738: PRP_PIPELINE_RUNNING is set (from P1.M3.T2.S4)
    - Line ~1742: Workflow execution begins (insert logging before this)
  gotcha: |
    - Must place logging AFTER PRP_PIPELINE_RUNNING is set (P1.M3.T2.S4)
    - Must place BEFORE workflow execution begins
    - Use this.logger (not this.correlationLogger) for guard operations
    - Follow template literal pattern from lines 1714-1720

# MUST READ - Logger patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S5/research/00_logger_infrastructure.md
  why: Complete research on logging infrastructure and debug mode detection
  section: "Implementation Guidance for Guard Context Logging"
  critical: |
    - Use this.logger.debug() for guard context logging
    - Debug mode is enabled via --log-level debug or --verbose flag
    - Follow template literal format: `[PRPPipeline] <message>`
    - Logger will only output debug messages when debug mode is enabled

# MUST READ - SessionManager API
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S5/research/01_session_manager_api.md
  why: Complete API documentation for accessing planDir and session metadata
  section: "Implementation Guidance for Guard Context Logging"
  critical: |
    - PLAN_DIR: Access via sessionManager.planDir (readonly string property)
    - SESSION_DIR: Access via sessionManager.currentSession?.metadata.path
    - CRITICAL: currentSession may be null, use optional chaining and nullish coalescing
    - Pattern: `const sessionDir = this.sessionManager.currentSession?.metadata.path ?? 'not set';`

# MUST READ - Environment variable patterns
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S5/research/02_environment_variable_patterns.md
  why: Complete research on environment variable access patterns in codebase
  section: "Implementation Guidance for Guard Context Logging"
  critical: |
    - Use nullish coalescing for default values: `process.env.VAR ?? 'default'`
    - Display raw string values, not parsed booleans
    - SKIP_BUG_FINDING: `process.env.SKIP_BUG_FINDING ?? 'false'`
    - PRP_PIPELINE_RUNNING: `process.env.PRP_PIPELINE_RUNNING ?? 'not set'`

# MUST READ - Validation logging placement
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S5/research/03_prp_pipeline_validation_logging.md
  why: Analysis of existing validation logging patterns and placement
  section: "Key Placement for New Guard Context Logging"
  critical: |
    - Insert after line ~1738 (PRP_PIPELINE_RUNNING is set)
    - Insert before line ~1742 (workflow execution begins)
    - Follow pattern from lines 1714-1720 for validation-related logging
    - Use template literal format, not object-based logging

# MUST READ - Architecture requirements
- docfile: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S5/research/04_architecture_requirements.md
  why: Complete requirements from PRD §9.2.5 and architecture documents
  section: "Required Debug Logging Format"
  critical: |
    - Exact format: 'Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}'
    - Required fields in specific order
    - Default values: 'false' for SKIP_BUG_FINDING, 'not set' for PRP_PIPELINE_RUNNING

# REFERENCE - Previous subtask implementation
- file: plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/P1M3T2S3/PRP.md
  why: Defines validateNestedExecution function that must complete before this logging
  section: "Implementation Blueprint"
  note: This subtask (P1.M3.T2.S5) depends on S3 (validation) and S4 (guard variable) being complete

# REFERENCE - Existing test structure
- file: tests/unit/nested-execution-guard.test.ts
  why: Existing test structure for guard functionality
  pattern: Lines 46-98: Basic guard functionality tests
  note: New tests should follow this pattern
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── workflows/
│   └── prp-pipeline.ts          # TARGET FILE - Add guard context logging
│       ├── run()                 # Lines 1665-1811 - Add logging here
│       │   ├── Lines 1709-1735: Validation sequence
│       │   ├── Line ~1738: PRP_PIPELINE_RUNNING is set (from P1.M3.T2.S4)
│       │   ├── INSERT HERE: Guard context logging (this task)
│       │   └── Line ~1742: Workflow execution begins
│       ├── this.logger           # Use for debug logging
│       └── this.sessionManager   # Source for PLAN_DIR and SESSION_DIR
├── core/
│   └── session-manager.ts        # Provides planDir and currentSession
└── utils/
    ├── logger.ts                 # Logger implementation
    └── validation/
        └── execution-guard.ts    # Uses SKIP_BUG_FINDING and PRP_PIPELINE_RUNNING

tests/
├── unit/
│   ├── nested-execution-guard.test.ts  # Guard tests (already exist)
│   └── workflows/
│       └── prp-pipeline.test.ts        # Pipeline tests (may need updates)
└── integration/
    └── prp-pipeline-integration.test.ts # Integration tests
```

### Desired Codebase Tree (No New Files)

```bash
# No new files needed - only modification to existing file

src/
└── workflows/
    └── prp-pipeline.ts          # MODIFIED - Add guard context logging
        └── run()                 # Add debug logging after guard is set
            │   ├── Extract 4 fields (planDir, sessionDir, skipBugFinding, running)
            │   ├── Log with template literal format
            │   └── Place after line ~1738 (PRP_PIPELINE_RUNNING set)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: currentSession may be null during early initialization
// WRONG:
const sessionDir = this.sessionManager.currentSession.metadata.path; // Throws if null

// RIGHT:
const sessionDir =
  this.sessionManager.currentSession?.metadata.path ?? 'not set';

// CRITICAL: Display raw string values, not parsed booleans
// WRONG:
const skipBugFinding = process.env.SKIP_BUG_FINDING === 'true'; // Converts to boolean

// RIGHT:
const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false'; // Keep as string

// CRITICAL: Must log AFTER PRP_PIPELINE_RUNNING is set (P1.M3.T2.S4)
// If logging before, PRP_PIPELINE_RUNNING will show 'not set' instead of actual PID

// GOTCHA: Use this.logger, not this.correlationLogger
// Guard operations are infrastructure-level, use base logger

// PATTERN: Template literal format for multi-field messages
// From lines 1714-1720 in prp-pipeline.ts
this.logger.debug(
  `[PRPPipeline] Checking for nested execution at ${sessionPath}`
);

// PATTERN: Debug logging automatically suppressed when not in debug mode
// Logger checks log level internally, no need to check in code
// Just call this.logger.debug() and logger handles it

// GOTCHA: PRP_PIPELINE_RUNNING is set to PID string in P1.M3.T2.S4
// Format: process.env.PRP_PIPELINE_RUNNING = currentPid (where currentPid is string)
// So when we log it, it will be a PID number like '12345', not 'not set'
```

## Implementation Blueprint

### Data Models and Structure

No new data models needed. Implementation uses:

- `this.sessionManager.planDir` - String property for plan directory path
- `this.sessionManager.currentSession?.metadata.path` - Session directory path (nullable)
- `process.env.SKIP_BUG_FINDING` - Environment variable for bug finding skip flag
- `process.env.PRP_PIPELINE_RUNNING` - Environment variable set by P1.M3.T2.S4
- `this.logger` - Logger instance from base Workflow class

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: LOCATE exact insertion point in src/workflows/prp-pipeline.ts
  - FIND: Line where PRP_PIPELINE_RUNNING is set (from P1.M3.T2.S4, ~line 1738)
  - FIND: Line where workflow execution begins (after SessionManager initialization, ~line 1742)
  - VERIFY: validateNestedExecution() is called before this point (line 1717)
  - CONFIRM: This location is after validation passes and after guard is set

Task 2: EXTRACT all 4 required fields with proper null safety
  - EXTRACT: const planDir = this.sessionManager.planDir;
  - EXTRACT: const sessionDir = this.sessionManager.currentSession?.metadata.path ?? 'not set';
  - EXTRACT: const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';
  - EXTRACT: const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';
  - SAFETY: Use optional chaining and nullish coalescing for nullable values

Task 3: ADD debug log statement with exact format
  - LOCATION: After PRP_PIPELINE_RUNNING is set (after Task 2 from P1.M3.T2.S4)
  - FORMAT: `[PRPPipeline] Guard Context: PLAN_DIR=${planDir}, SESSION_DIR=${sessionDir}, SKIP_BUG_FINDING=${skipBugFinding}, PRP_PIPELINE_RUNNING=${running}`
  - LOGGER: Use this.logger.debug() (not this.correlationLogger)
  - PATTERN: Follow template literal format from lines 1714-1720

Task 4: UPDATE tests/unit/workflows/prp-pipeline.test.ts
  - ADD: Test that guard context logging occurs when debug mode enabled
  - ADD: Test that all 4 fields appear in log message
  - ADD: Test that SESSION_DIR handles null currentSession gracefully
  - ADD: Test that log only appears in debug mode, not in normal mode
  - FOLLOW: Existing test patterns in prp-pipeline.test.ts
  - MOCK: Logger debug method to capture log messages

Task 5: RUN validation
  - EXECUTE: npm test -- tests/unit/workflows/prp-pipeline.test.ts
  - VERIFY: All tests pass
  - CHECK: No regressions in other test files
  - MANUAL: Run with --log-level debug and verify log output appears
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Extract all 4 fields with null safety
// Location: src/workflows/prp-pipeline.ts run() method, after PRP_PIPELINE_RUNNING is set

// Extract PLAN_DIR from SessionManager (always available)
const planDir = this.sessionManager.planDir;

// Extract SESSION_DIR with null safety (currentSession may be null)
const sessionDir =
  this.sessionManager.currentSession?.metadata.path ?? 'not set';

// Extract SKIP_BUG_FINDING with default value
const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';

// Extract PRP_PIPELINE_RUNNING with default value
const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';

// Pattern 2: Debug log statement with exact format
// Location: Immediately after field extraction, before workflow execution

this.logger.debug(
  `[PRPPipeline] Guard Context: PLAN_DIR=${planDir}, SESSION_DIR=${sessionDir}, SKIP_BUG_FINDING=${skipBugFinding}, PRP_PIPELINE_RUNNING=${running}`
);

// Pattern 3: Complete insertion context
// Location: src/workflows/prp-pipeline.ts run() method

try {
  // ... existing code ...

  // Line 1717: Validation occurs
  await validateNestedExecution(sessionPath);

  // Line ~1738: PRP_PIPELINE_RUNNING is set (from P1.M3.T2.S4)
  process.env.PRP_PIPELINE_RUNNING = currentPid;
  this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

  // INSERT HERE: Guard context logging (this task)
  const planDir = this.sessionManager.planDir;
  const sessionDir =
    this.sessionManager.currentSession?.metadata.path ?? 'not set';
  const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';
  const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';

  this.logger.debug(
    `[PRPPipeline] Guard Context: PLAN_DIR=${planDir}, SESSION_DIR=${sessionDir}, SKIP_BUG_FINDING=${skipBugFinding}, PRP_PIPELINE_RUNNING=${running}`
  );

  // Line ~1742: Workflow execution continues
  await this.initializeSession();
  // ... rest of workflow ...
} catch (error) {
  // ... error handling ...
} finally {
  // ... cleanup ...
}

// Pattern 4: Test structure for guard context logging
// Location: tests/unit/workflows/prp-pipeline.test.ts

describe('PRPPipeline Guard Context Logging', () => {
  it('should log guard context with all 4 fields when debug mode enabled', async () => {
    const debugLogs: string[] = [];
    const mockLogger = {
      debug: vi.fn((message: string) => debugLogs.push(message)),
    };

    // Mock logger to capture debug messages
    vi.spyOn(loggerModule, 'getLogger').mockReturnValue(mockLogger);

    const pipeline = new PRPPipeline('./test/PRD.md');
    await pipeline.run();

    // Find guard context log
    const guardContextLog = debugLogs.find(log =>
      log.includes('[PRPPipeline] Guard Context:')
    );

    expect(guardContextLog).toBeDefined();
    expect(guardContextLog).toMatch(/PLAN_DIR=/);
    expect(guardContextLog).toMatch(/SESSION_DIR=/);
    expect(guardContextLog).toMatch(/SKIP_BUG_FINDING=/);
    expect(guardContextLog).toMatch(/PRP_PIPELINE_RUNNING=/);
  });

  it('should handle null currentSession gracefully', async () => {
    // Test when currentSession is null
    // Verify SESSION_DIR shows 'not set'
  });

  it('should only log in debug mode', async () => {
    // Test that log doesn't appear in info mode
    // Test that log appears in debug mode
  });
});

// GOTCHA: Logger automatically handles log level filtering
// No need to check if debug mode is enabled in code
// Just call this.logger.debug() and logger handles it

// GOTCHA: Use exact format from task description
// Do not deviate from: 'Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}'

// GOTCHA: Field order matters for consistency
// Must be: PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING, PRP_PIPELINE_RUNNING
```

### Integration Points

```yaml
LOGGING:
  - logger: this.logger (base logger, not correlationLogger)
  - level: debug
  - format: `[PRPPipeline] Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}`
  - placement: After PRP_PIPELINE_RUNNING is set (P1.M3.T2.S4)
  - timing: After validation passes, before workflow execution

SESSION_MANAGER:
  - property: planDir (readonly string, always available)
  - property: currentSession?.metadata.path (nullable, use ?? 'not set')
  - gotcha: currentSession may be null during early initialization

ENVIRONMENT_VARIABLES:
  - SKIP_BUG_FINDING: process.env.SKIP_BUG_FINDING ?? 'false'
  - PRP_PIPELINE_RUNNING: process.env.PRP_PIPELINE_RUNNING ?? 'not set'
  - gotcha: Display raw string values, not parsed booleans

DEPENDENCIES:
  - depends_on: P1.M3.T2.S3 (validateNestedExecution function)
  - depends_on: P1.M3.T2.S4 (PRP_PIPELINE_RUNNING environment variable)
  - sequence: validateNestedExecution() -> set PRP_PIPELINE_RUNNING -> log guard context -> run workflow

TEST_INFRASTRUCTURE:
  - framework: Vitest
  - mock: vi.fn() for logger.debug() method
  - capture: Array to capture log messages
  - verify: Check log contains all 4 required fields
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run lint                 # Check for linting errors
npm run format               # Format with Prettier
npm run type-check           # TypeScript type checking

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test specific file
npm test -- tests/unit/workflows/prp-pipeline.test.ts

# Test all guard-related tests
npm test -- tests/unit/nested-execution-guard.test.ts

# Run all unit tests
npm test -- tests/unit/

# Expected: All tests pass. If failing, debug root cause and fix implementation.
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite
npm test

# Expected: All tests pass, no regressions

# Manual verification with debug logging
# Run pipeline with debug mode enabled
npm run pipeline -- --prd-path ./test/PRD.md --log-level debug

# Expected output should include:
# [timestamp] [DEBUG] [PRPPipeline] Set PRP_PIPELINE_RUNNING=<pid>
# [timestamp] [DEBUG] [PRPPipeline] Guard Context: PLAN_DIR=/home/user/project/plan, SESSION_DIR=/home/user/project/plan/001_abc123, SKIP_BUG_FINDING=false, PRP_PIPELINE_RUNNING=<pid>
```

### Level 4: Guard Context Logging Validation

```bash
# Verify log format matches specification exactly
node -e "
  const expected = 'Guard Context: PLAN_DIR=/path/to/plan, SESSION_DIR=/path/to/session, SKIP_BUG_FINDING=false, PRP_PIPELINE_RUNNING=12345';
  const pattern = /^Guard Context: PLAN_DIR=.+, SESSION_DIR=.+, SKIP_BUG_FINDING=.+, PRP_PIPELINE_RUNNING=.+$/;
  console.log('Format matches:', pattern.test(expected));
"

# Test null safety for SESSION_DIR
node -e "
  const sessionDir = null ?? 'not set';
  console.log('SESSION_DIR when null:', sessionDir);
  // Expected: 'not set'
"

# Test environment variable defaults
node -e "
  const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';
  const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';
  console.log('SKIP_BUG_FINDING:', skipBugFinding);
  console.log('PRP_PIPELINE_RUNNING:', running);
  // Expected: 'false' and 'not set' (if not set in environment)
"

# Expected output:
# Format matches: true
# SESSION_DIR when null: not set
# SKIP_BUG_FINDING: false
# PRP_PIPELINE_RUNNING: not set
```

## Final Validation Checklist

### Technical Validation

- [ ] Guard context logging appears after PRP_PIPELINE_RUNNING is set
- [ ] All 4 fields are extracted with proper null safety
- [ ] Debug log uses exact format specified in task description
- [ ] Debug log only appears when debug mode is enabled
- [ ] No errors occur when currentSession is null
- [ ] All existing tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`

### Feature Validation

- [ ] PLAN_DIR shows absolute path from sessionManager.planDir
- [ ] SESSION_DIR shows absolute path from currentSession.metadata.path or 'not set'
- [ ] SKIP_BUG_FINDING shows raw env var value or 'false'
- [ ] PRP_PIPELINE_RUNNING shows raw env var value or 'not set'
- [ ] Log message contains all 4 fields in specified order
- [ ] Log message format matches specification exactly
- [ ] Manual testing with --log-level debug shows log output
- [ ] Manual testing without --log-level debug shows no log output

### Code Quality Validation

- [ ] Follows existing PRP Pipeline logging patterns
- [ ] Uses this.logger (not this.correlationLogger)
- [ ] Uses template literal format (like lines 1714-1720)
- [ ] Proper null safety with optional chaining and nullish coalescing
- [ ] No new files created (only modification to existing file)
- [ ] Code is self-documenting with clear variable names

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable names (planDir, sessionDir, skipBugFinding, running)
- [ ] Debug log is informative but not verbose (single line)
- [ ] Log format is consistent with existing validation logs
- [ ] Research documents are saved in research/ subdirectory

## Anti-Patterns to Avoid

- ❌ Don't log before PRP_PIPELINE_RUNNING is set (will show 'not set')
- ❌ Don't use correlationLogger for guard operations (use base logger)
- ❌ Don't convert environment variables to booleans (keep as strings)
- ❌ Don't skip null safety on currentSession (may be null)
- ❌ Don't change the field order (must be PLAN_DIR, SESSION_DIR, SKIP_BUG_FINDING, PRP_PIPELINE_RUNNING)
- ❌ Don't deviate from the exact log format specified
- ❌ Don't add extra fields or remove required fields
- ❌ Don't use object-based logging (use template literal format)
- ❌ Don't check if debug mode is enabled (logger handles it)
- ❌ Don't forget to test null currentSession scenario

---

## Success Metrics

**Confidence Score**: 10/10 for one-pass implementation success likelihood

**Reasoning**:

- Exact file location and line numbers provided
- Complete code example with all 4 field extractions
- All dependencies documented (P1.M3.T2.S3, P1.M3.T2.S4)
- Logger patterns from existing codebase
- SessionManager API with null safety patterns
- Environment variable access patterns with defaults
- Test structure with specific assertions
- Clear anti-patterns to avoid
- Comprehensive validation steps
- Research documents for all aspects

**Validation**: The completed PRP enables an AI agent unfamiliar with the codebase to implement guard context logging successfully using only the PRP content and codebase access.
