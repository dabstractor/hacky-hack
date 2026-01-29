---
name: 'P1.M3.T1.S3: Add Bugfix Session Validation to FixCycleWorkflow Constructor'
description: |
---

## Goal

**Feature Goal**: Integrate bugfix session validation into FixCycleWorkflow constructor to prevent bug fix tasks from running in non-bugfix sessions (e.g., feature implementation sessions), which would corrupt state and break workflow invariants.

**Deliverable**: Modified FixCycleWorkflow constructor that calls `validateBugfixSession(this.sessionPath)` after storing sessionPath, with proper error handling and debug logging.

**Success Definition**:

- FixCycleWorkflow constructor validates session path on initialization before any bug fix work begins
- BugfixSessionValidationError is thrown with additional context when validation fails
- Debug logging captures validation attempts and results
- All existing tests continue to pass with updated test fixtures

## Why

- **State Corruption Prevention**: Bug fix tasks create fix subtasks that are only valid within bugfix sessions. Running them in feature sessions creates orphaned state that breaks session management.
- **Architectural Requirement**: PRD §5.1 requires session validation guards at workflow entry points (see architecture/003_system_context.md §Bug 4).
- **Fail-Fast Principle**: Validating at constructor time prevents wasted work and confusing errors later in the workflow.
- **Integration with S1**: Leverages the `validateBugfixSession` function and `BugfixSessionValidationError` class already implemented in P1.M3.T1.S1.

## What

### User-Visible Behavior

- No user-visible behavior change for valid bugfix sessions (normal operation)
- For invalid sessions: Clear error message explaining bug fix tasks can only run in bugfix sessions
- Error includes session path for debugging

### Technical Requirements

**Constructor Modifications**:

1. Call `validateBugfixSession(this.sessionPath)` after `this.sessionPath = sessionPath` assignment
2. Wrap in try-catch to add context about FixCycleWorkflow initialization
3. Add debug logging before and after validation

**Error Handling**:

- If validation throws, re-throw with additional context
- Preserve original error type (BugfixSessionValidationError)
- Log validation failure with correlation ID

**Logging**:

- Before validation: `this.logger.debug('[FixCycleWorkflow] Validating bugfix session path: {sessionPath}')`
- After success: `this.logger.debug('[FixCycleWorkflow] Bugfix session path validated')`
- On error: `this.logger.error()` with validation failure context

### Success Criteria

- [ ] FixCycleWorkflow constructor calls validateBugfixSession
- [ ] Validation happens after sessionPath is assigned
- [ ] Try-catch wraps the validation call
- [ ] Debug logging added before and after validation
- [ ] Errors are re-thrown with FixCycleWorkflow context
- [ ] All existing tests pass

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

✅ This PRP provides:

- Exact file path and line numbers to modify
- Complete function signatures for all dependencies
- Existing code patterns to follow (logging, error handling, validation)
- Specific error types to use
- Test file locations and patterns

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/workflows/fix-cycle-workflow.ts
  why: Target file for modification - contains constructor that needs validation call
  pattern: Constructor validation pattern (lines 115-118), logging pattern (lines 126-139)
  gotcha: Constructor uses Groundswell Workflow base class - must call super() first

- file: src/utils/validation/session-validation.ts
  why: Contains validateBugfixSession function to call
  pattern: Simple validation function that throws BugfixSessionValidationError
  section: Lines 18-35 contain the complete function implementation
  gotcha: Function returns void on success, throws error on failure

- file: src/utils/errors.ts
  why: Contains BugfixSessionValidationError class and error hierarchy
  pattern: PipelineError base class with context, timestamp, toJSON()
  section: Lines 494-502 for BugfixSessionValidationError class
  gotcha: Must import both validateBugfixSession and BugfixSessionValidationError

- file: src/core/session-manager.ts
  why: Example of constructor validation with try-catch pattern
  pattern: Lines 41-60 show synchronous validation with error wrapping
  gotcha: Uses custom error types (SessionFileError) similar to BugfixSessionValidationError

- file: src/utils/logger.ts
  why: Provides getLogger() function and Logger interface
  pattern: Structured logging with pino (debug, info, warn, error levels)
  gotcha: Use child logger with correlation ID (already present in constructor)

- docfile: architecture/003_system_context.md
  why: Architecture context for Bug 4 and session validation requirements
  section: §Bug 4 explains why session validation is needed at workflow entry points
```

### Current Codebase tree

```bash
src/
├── workflows/
│   ├── fix-cycle-workflow.ts          # TARGET FILE - Modify constructor
│   ├── bug-hunt-workflow.ts
│   └── prp-pipeline.ts
├── utils/
│   ├── validation/
│   │   └── session-validation.ts      # CONTAINS validateBugfixSession()
│   ├── errors.ts                      # CONTAINS BugfixSessionValidationError
│   └── logger.ts                      # CONTAINS getLogger()
├── core/
│   ├── session-manager.ts             # EXAMPLE of constructor validation
│   └── models.ts
└── ...
```

### Desired Codebase tree with files to be added

```bash
# No new files - this is a modification of existing constructor
# Changed files:
src/workflows/fix-cycle-workflow.ts    # MODIFY: Add validation call in constructor
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Groundswell Workflow base class must be called first
// Constructor MUST call super('FixCycleWorkflow') before any validation

// CRITICAL: validateBugfixSession throws BugfixSessionValidationError
// Do NOT catch and suppress - must re-throw to prevent object creation

// CRITICAL: Logger uses structured logging pattern (object first, then message)
// this.logger.debug({ sessionPath }, '[FixCycleWorkflow] Validating bugfix session path')

// CRITICAL: Error type checking - use instanceof for BugfixSessionValidationError
// Do NOT use error.code === 'PIPELINE_SESSION_INVALID_BUGFIX_PATH'

// CRITICAL: Context object is attached directly to error instance
// error.sessionPath works because Object.assign(context) is called in PipelineError constructor

// CRITICAL: Import path must use .js extension for ES modules
// import { validateBugfixSession } from '../utils/validation/session-validation.js'

// GOTCHA: Constructor has correlationLogger for request tracing
// Use this.correlationLogger for validation failure logging with correlation ID

// GOTCHA: Existing sessionPath validation (lines 115-118) must remain
// New validation is IN ADDITION TO existing non-empty string check
```

## Implementation Blueprint

### Data models and structure

No new data models - uses existing:

```typescript
// Existing - from src/utils/errors.ts
class BugfixSessionValidationError extends PipelineError {
  readonly code = ErrorCodes.PIPELINE_SESSION_INVALID_BUGFIX_PATH;
  constructor(message: string, context?: PipelineErrorContext, cause?: Error);
}

// Existing - from src/utils/validation/session-validation.ts
function validateBugfixSession(sessionPath: string): void;

// Existing - FixCycleWorkflow constructor signature
constructor(
  sessionPath: string,
  prdContent: string,
  taskOrchestrator: TaskOrchestrator,
  sessionManager: SessionManager
)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/workflows/fix-cycle-workflow.ts - Add import statement
  - ADD import: { validateBugfixSession, BugfixSessionValidationError } from '../utils/validation/session-validation.js'
  - PLACEMENT: After line 40 (after BugHuntWorkflow import), before logger import
  - PATTERN: Follow existing import style (named imports, .js extension)

Task 2: MODIFY src/workflows/fix-cycle-workflow.ts constructor - Add validation after sessionPath assignment
  - LOCATION: After line 120 (this.sessionPath = sessionPath;), before other assignments
  - ADD: Debug logging before validation
    this.logger.debug({ sessionPath }, '[FixCycleWorkflow] Validating bugfix session path: {sessionPath}');
  - ADD: Try-catch wrapped validation call
    try {
      validateBugfixSession(this.sessionPath);
    } catch (error) {
      // Add FixCycleWorkflow initialization context and re-throw
    }
  - ADD: Debug logging after validation (inside try, before catch)
    this.logger.debug('[FixCycleWorkflow] Bugfix session path validated');
  - PRESERVE: Existing validation (lines 115-118) - new validation is additional
  - PRESERVE: All existing constructor logic

Task 3: UPDATE error handling in catch block to add FixCycleWorkflow context
  - CHECK: if (error instanceof BugfixSessionValidationError)
  - LOG: Validation failure with correlation ID
    this.correlationLogger.error(
      { sessionPath: this.sessionPath, validationError: error.message },
      '[FixCycleWorkflow] Bugfix session validation failed'
    );
  - THROW: Re-throw original error (preserves error type and stack trace)
    throw error;
  - HANDLE: Non-BugfixSessionValidationError errors (shouldn't happen, but defensive)
    this.logger.error({ error }, '[FixCycleWorkflow] Unexpected validation error');
    throw new Error('FixCycleWorkflow initialization failed: validation error');

Task 4: VERIFY existing tests still pass
  - Tests use valid bugfix paths like 'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918'
  - No test changes needed if paths are valid
  - If tests fail, check test fixture session paths contain 'bugfix' substring
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// PATTERN 1: Import Statement (Task 1)
// ============================================================================
// PLACE after line 40 (BugHuntWorkflow import)
import {
  validateBugfixSession,
  BugfixSessionValidationError,
} from '../utils/validation/session-validation.js';

// ============================================================================
// PATTERN 2: Constructor Validation (Task 2) - Lines 120-130 area
// ============================================================================
// After: this.sessionPath = sessionPath;
// Before: this.prdContent = prdContent;

// DEBUG: Log validation attempt
this.logger.debug(
  { sessionPath },
  '[FixCycleWorkflow] Validating bugfix session path'
);

// TRY-CATCH: Wrap validation with context re-throw
try {
  validateBugfixSession(this.sessionPath);

  // DEBUG: Log validation success
  this.logger.debug('[FixCycleWorkflow] Bugfix session path validated');
} catch (error) {
  // ERROR HANDLING: Check error type and add FixCycleWorkflow context
  if (error instanceof BugfixSessionValidationError) {
    this.correlationLogger.error(
      { sessionPath: this.sessionPath, validationError: error.message },
      '[FixCycleWorkflow] Bugfix session validation failed during initialization'
    );
    // RE-THROW: Preserve original error for proper error handling upstream
    throw error;
  }

  // DEFENSIVE: Handle unexpected error types
  this.logger.error(
    { error },
    '[FixCycleWorkflow] Unexpected error during bugfix session validation'
  );
  throw new Error('FixCycleWorkflow initialization failed: validation error');
}

// ============================================================================
// PATTERN 3: Logging Context (Task 2 & 3)
// ============================================================================
// Structure: object first, then message (pino structured logging)
this.logger.debug({ key: value }, 'Message with {placeholder}');

// Use correlationLogger for validation errors (has correlation ID)
this.correlationLogger.error({ context }, 'Error message');

// Use this.logger for general debug logs
this.logger.debug({ sessionPath }, 'Validating bugfix session path');

// ============================================================================
// PATTERN 4: Error Type Checking (Task 3)
// ============================================================================
// Use instanceof for type narrowing (NOT error.code checking)
if (error instanceof BugfixSessionValidationError) {
  // error is narrowed to BugfixSessionValidationError
  // Can access error.context, error.code, error.message safely
}

// Type guard alternative (from errors.ts)
import { isBugfixSessionValidationError } from '../utils/errors.js';
if (isBugfixSessionValidationError(error)) {
  // Same as instanceof check
}

// ============================================================================
// GOTCHA: Existing Validation Must Remain
// ============================================================================
// DO NOT REMOVE lines 115-118:
if (typeof sessionPath !== 'string' || sessionPath.trim() === '') {
  throw new Error('FixCycleWorkflow requires valid sessionPath');
}

// New validation is ADDITIONAL, not replacement
// Order: string validation FIRST, then bugfix session validation

// ============================================================================
// GOTCHA: super() Call Must Remain First
// ============================================================================
// DO NOT modify line 113: super('FixCycleWorkflow');
// Groundswell Workflow base class requires super() call before any this. usage
```

### Integration Points

```yaml
NO CHANGES NEEDED:
  - FixCycleWorkflow constructor signature (no parameter changes)
  - FixCycleWorkflow public API (no method signature changes)
  - PRP Pipeline (already passes sessionPath from P1.M2.T2.S4)
  - Test files (if using valid bugfix session paths)

VALIDATION FLOW:
  - PRP Pipeline calls FixCycleWorkflow constructor with sessionPath
  - Constructor validates non-empty string (existing, line 116-118)
  - Constructor assigns sessionPath (line 120)
  - Constructor validates bugfix session (NEW, after line 120)
  - If validation passes: Constructor completes successfully
  - If validation fails: BugfixSessionValidationError thrown, object not created

UPSTREAM IMPACT:
  - PRP Pipeline (src/workflows/prp-pipeline.ts) must handle BugfixSessionValidationError
  - Error propagates through PRPExecutor to TaskOrchestrator
  - Task marked as failed with error details

DOWNSTREAM IMPACT:
  - FixCycleWorkflow.run() never executes if constructor throws
  - No fix tasks created for invalid sessions
  - No state corruption possible
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run lint  # or pnpm lint / bun lint depending on package manager
# Expected: Zero linting errors

# Type checking
npm run typecheck  # or npx tsc --noEmit
# Expected: Zero type errors

# Format check
npm run format:check  # or npx prettier --check src/workflows/fix-cycle-workflow.ts
# Expected: Zero formatting issues

# Project-wide validation (if available)
npm run validate  # or equivalent project command
# Expected: All validations pass
```

### Level 2: Unit Tests (Component Validation)

```bash
# Note: No test files exist for FixCycleWorkflow (src/**/*.test.ts: no matches)
# This is expected based on codebase analysis

# Run any existing test suite
npm test  # or npm run test
# Expected: All tests pass (no test failures)

# Manual verification: Test constructor with valid path
node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
const workflow = new FixCycleWorkflow(
  'plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918',
  'PRD content',
  null,
  null
);
console.log('Constructor succeeded with valid bugfix path');
"

# Manual verification: Test constructor with invalid path
node -e "
import { FixCycleWorkflow } from './src/workflows/fix-cycle-workflow.js';
try {
  new FixCycleWorkflow(
    'plan/003_b3d3efdaf0ed/feature/001_abc123',
    'PRD content',
    null,
    null
  );
  console.error('ERROR: Constructor should have thrown BugfixSessionValidationError');
} catch (error) {
  if (error.code === 'PIPELINE_SESSION_INVALID_BUGFIX_PATH') {
    console.log('PASS: BugfixSessionValidationError thrown correctly');
  } else {
    console.error('ERROR: Wrong error type thrown:', error);
  }
}
"
```

### Level 3: Integration Testing (System Validation)

```bash
# Test FixCycleWorkflow instantiation in PRP Pipeline context
# This requires a running pipeline session - manual verification steps:

# 1. Verify FixCycleWorkflow can be instantiated with valid bugfix session
cd plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918
# Run PRP Pipeline task that uses FixCycleWorkflow
# Expected: Task completes successfully, FixCycleWorkflow initializes

# 2. Verify FixCycleWorkflow rejects invalid session
# Create a test session in a non-bugfix path
mkdir -p /tmp/test/feature/001_test
# Attempt to run FixCycleWorkflow with invalid path
# Expected: BugfixSessionValidationError with clear error message

# 3. Check logs for validation messages
# Expected debug logs:
# [FixCycleWorkflow] Validating bugfix session path: plan/.../bugfix/...
# [FixCycleWorkflow] Bugfix session path validated

# 4. Check correlation logs for error context (if validation fails)
# Expected error logs:
# [FixCycleWorkflow] Bugfix session validation failed during initialization
# With correlationId, sessionPath, validationError in context
```

### Level 4: Manual Verification & Domain-Specific Validation

```bash
# Verification 1: Check import statement is correct
grep "validateBugfixSession" src/workflows/fix-cycle-workflow.ts
# Expected: import { validateBugfixSession, BugfixSessionValidationError } from '../utils/validation/session-validation.js';

# Verification 2: Check validation call is present
grep -A 5 "validateBugfixSession" src/workflows/fix-cycle-workflow.ts
# Expected: try-catch block with validateBugfixSession(this.sessionPath)

# Verification 3: Check debug logging is present
grep "Validating bugfix session path" src/workflows/fix-cycle-workflow.ts
# Expected: Debug log before validation call

# Verification 4: Check error re-throw preserves error type
grep -B 2 -A 5 "instanceof BugfixSessionValidationError" src/workflows/fix-cycle-workflow.ts
# Expected: instanceof check with correlationLogger.error and throw error

# Verification 5: Verify existing validation still present
grep "requires valid sessionPath" src/workflows/fix-cycle-workflow.ts
# Expected: Original string validation still present (lines 115-118)

# Verification 6: Verify super() call is still first
head -n 120 src/workflows/fix-cycle-workflow.ts | tail -n 10
# Expected: super('FixCycleWorkflow') on line 113, before any this. usage

# Domain-specific: Test with actual bugfix session
cd plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918
# Run a task that instantiates FixCycleWorkflow
# Expected: Success, no validation errors

# Domain-specific: Test with feature session (should fail)
cd plan/003_b3d3efdaf0ed/feature/001_test  # or any non-bugfix path
# Attempt to run FixCycleWorkflow
# Expected: BugfixSessionValidationError with message about bugfix sessions only
```

## Final Validation Checklist

### Technical Validation

- [ ] Import statement added: `validateBugfixSession, BugfixSessionValidationError`
- [ ] Validation call added after `this.sessionPath = sessionPath`
- [ ] Try-catch wraps the validation call
- [ ] Debug logging added before validation: "Validating bugfix session path"
- [ ] Debug logging added after validation: "Bugfix session path validated"
- [ ] Error handling uses `instanceof BugfixSessionValidationError`
- [ ] Validation failure logged with correlationLogger
- [ ] Original error re-thrown (error type preserved)
- [ ] Existing string validation preserved (lines 115-118 unchanged)
- [ ] super('FixCycleWorkflow') remains first call in constructor
- [ ] All linting checks pass: `npm run lint`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Formatting passes: `npm run format:check`

### Feature Validation

- [ ] Valid bugfix session paths pass validation (e.g., 'plan/.../bugfix/...')
- [ ] Invalid session paths throw BugfixSessionValidationError
- [ ] Error message includes session path for debugging
- [ ] Error code is 'PIPELINE_SESSION_INVALID_BUGFIX_PATH'
- [ ] Debug logs appear in console/log file during initialization
- [ ] Correlation ID appears in error logs for request tracing
- [ ] FixCycleWorkflow object NOT created when validation fails
- [ ] FixCycleWorkflow object created successfully when validation passes

### Code Quality Validation

- [ ] Follows existing constructor validation pattern (see SessionManager)
- [ ] Uses existing error type (BugfixSessionValidationError from S1)
- [ ] Follows existing logging pattern (structured logging with context object)
- [ ] Preserves all existing constructor functionality
- [ ] No breaking changes to public API
- [ ] Import path uses .js extension (ES module convention)
- [ ] Error handling is defensive (catches unexpected error types)
- [ ] Comments explain why validation is needed (optional but helpful)

### Documentation & Deployment

- [ ] JSDoc comment updated to mention validation (optional)
- [ ] Constructor @throws tag includes BugfixSessionValidationError (optional)
- [ ] Changes communicated to team if this is shared code
- [ ] Git commit message clear: "Add bugfix session validation to FixCycleWorkflow constructor"

---

## Anti-Patterns to Avoid

- ❌ Don't remove existing sessionPath validation (lines 115-118) - new validation is additional
- ❌ Don't call validateBugfixSession before super('FixCycleWorkflow') - super must be first
- ❌ Don't call validateBugfixSession before assigning this.sessionPath - needs the value
- ❌ Don't suppress the error and continue - must throw to prevent object creation
- ❌ Don't use error.code string comparison - use instanceof for type checking
- ❌ Don't wrap the entire constructor body in try-catch - only wrap validation call
- ❌ Don't log before super() call - logger not available until after super
- ❌ Don't add validation to other workflows unless specified - this is FixCycleWorkflow only
- ❌ Don't modify validateBugfixSession function - it's in S1, this PRP is S3 (constructor call)
- ❌ Don't create new error types - use existing BugfixSessionValidationError
- ❌ Don't hardcode session paths - use this.sessionPath variable
- ❌ Don't skip debug logging - needed for troubleshooting validation issues
- ❌ Don't throw generic Error - preserve BugfixSessionValidationError type
