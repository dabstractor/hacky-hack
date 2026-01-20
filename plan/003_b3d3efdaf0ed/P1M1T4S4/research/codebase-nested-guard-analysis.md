# Codebase Nested Execution Guard Analysis

## Executive Summary

**CRITICAL FINDING**: The nested execution guard is **NOT YET IMPLEMENTED** in the codebase. This is a planned feature specified in the PRD that needs to be implemented and verified.

**Status**: ❌ **NOT IMPLEMENTED**

The PRP_PIPELINE_RUNNING environment variable guard is mentioned in multiple documentation files (PRD.md, delta_prd.md, system_context.md, external_deps.md) but does not exist in the actual source code.

---

## 1. PRP_PIPELINE_RUNNING Environment Variable

### Where It Should Be Defined

Based on PRD requirements, the guard should be implemented in:

1. **Entry Point**: `src/index.ts` (around line 102, before `configureEnvironment()`)
2. **CLI Entry**: `src/cli/index.ts` (for early validation)

### Expected Implementation Pattern

```typescript
// Should be in src/index.ts before any pipeline operations
if (process.env.PRP_PIPELINE_RUNNING) {
  const isBugFixMode = process.env.SKIP_BUG_FINDING === 'true';
  const isBugFixPath = process.cwd().includes('/bugfix/') ||
                       (process.env.PLAN_DIR?.includes('bugfix'));

  if (!isBugFixMode || !isBugFixPath) {
    logger.error('Nested pipeline execution detected', {
      existingPid: process.env.PRP_PIPELINE_RUNNING,
      currentPid: process.pid.toString(),
    });
    process.exit(1);
  }
}

// Set the guard
process.env.PRP_PIPELINE_RUNNING = process.pid.toString();
```

### Current State

**NOT FOUND** in codebase:
- No references to `PRP_PIPELINE_RUNNING` in `src/` directory
- No references to `SKIP_BUG_FINDING` in `src/` directory
- No guard logic in `src/index.ts` or `src/cli/index.ts`

---

## 2. Guard Logic Locations (Planned)

### 2.1 PRPPipeline Class Checks

**Expected Location**: `src/workflows/prp-pipeline.ts`

The guard should be implemented in the `run()` method before session initialization (around line 1607).

### 2.2 CLI Entry Point Checks

**Expected Location**: `src/cli/index.ts` or `src/index.ts`

The guard should be added early in the execution flow to fail fast before any expensive operations.

---

## 3. Bug Fix Recursion Exception Logic

### SKIP_BUG_FINDING Environment Variable

From PRD analysis:
- **Purpose**: Identifies bug fix mode and allows legitimate recursion
- **Value**: `true` when in bug fix cycle
- **Combined Condition**: Only allows nested execution if BOTH conditions are true:
  - `SKIP_BUG_FINDING === 'true'`
  - Path contains 'bugfix'

### Path Validation Requirement

```typescript
// Check if path contains 'bugfix'
const isBugFixPath = process.cwd().includes('/bugfix/') ||
                     (process.env.PLAN_DIR?.includes('bugfix'));

// Or more robust check
const isBugFixPath = /bugfix/i.test(process.cwd()) ||
                     /bugfix/i.test(process.env.PLAN_DIR || '');
```

---

## 4. Session and Plan Directory References

### PLAN_DIR and SESSION_DIR in Guard Logic

From system_context.md, the debug logging should show:
- `PLAN_DIR`: Resolved path (would be passed as CLI argument)
- `SESSION_DIR`: Dynamic path based on session hash
- `SKIP_BUG_FINDING`: Boolean flag value

### Expected Debug Logging Pattern

```typescript
logger.debug('[Nested Guard] Environment Check', {
  PRP_PIPELINE_RUNNING: process.env.PRP_PIPELINE_RUNNING,
  SKIP_BUG_FINDING: process.env.SKIP_BUG_FINDING,
  currentPath: process.cwd(),
  isBugFixPath: process.cwd().includes('/bugfix/'),
  planDir: planDir,
  sessionPath: sessionPath
});
```

---

## 5. Environment Configuration System

### Current Environment Configuration

**Location**: `src/config/environment.ts`

Currently handles:
- `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` mapping
- `ANTHROPIC_BASE_URL` configuration
- Model tier selection

### Missing Implementation

The nested execution guard needs to be added to this configuration system. This could be:

1. **New function**: `validateNestedExecutionGuard()` in `environment.ts`
2. **New module**: `src/utils/execution-guard.ts` with guard logic
3. **Entry point check**: Direct validation in `src/index.ts`

---

## 6. Related Documentation References

### PRD.md Lines 111-112, 284-285, 314-327

Specifies:
- Must implement nested execution guard via `PRP_PIPELINE_RUNNING`
- Must validate session paths in bug fix mode (must contain "bugfix")
- Guard logic steps
- Session creation guards
- Debug logging requirements

### delta_prd.md Lines 178-206, 345-347, 401-404

Provides:
- Requirement specification
- Implementation logic with code examples
- Environment variable definitions
- Task breakdown for implementation

### system_context.md Lines 383-396

Details:
- Nested execution guard logic
- Session creation guards
- Debug logging specifications

### external_deps.md Lines 812-814

Lists:
- `PRP_PIPELINE_RUNNING=<PID>` - Nested execution guard
- `SKIP_BUG_FINDING=true` - Skip bug hunt / bug fix mode

---

## 7. Integration Points

### Required Integration Points

1. **Entry Point** (`src/index.ts`):
   - Before `configureEnvironment()`
   - Early validation and fail-fast

2. **CLI Parser** (`src/cli/index.ts`):
   - After CLI argument parsing
   - Before pipeline creation

3. **Session Manager** (`src/core/session-manager.ts`):
   - Validate session creation in bug fix mode
   - Prevent sessions in main `plan/` directory during bug fix

4. **PRPPipeline** (`src/workflows/prp-pipeline.ts`):
   - Guard check in `run()` method
   - Debug logging with context

---

## 8. Key Implementation Requirements

### Guard Function Structure

```typescript
interface NestedExecutionGuardOptions {
  planDir?: string;
  sessionDir?: string;
  logger: Logger;
}

function validateNestedExecutionGuard(
  options: NestedExecutionGuardOptions
): void {
  const currentPid = process.pid.toString();
  const isBugFixMode = process.env.SKIP_BUG_FINDING === 'true';
  const currentPath = process.cwd();
  const isBugFixPath = currentPath.includes('/bugfix/') ||
                       (options.planDir?.includes('bugfix'));

  // Debug logging
  options.logger.debug('[Nested Guard] Environment Check', {
    PRP_PIPELINE_RUNNING: process.env.PRP_PIPELINE_RUNNING,
    SKIP_BUG_FINDING: process.env.SKIP_BUG_FINDING,
    currentPath,
    isBugFixPath,
    planDir: options.planDir,
    sessionDir: options.sessionDir
  });

  // Check for existing pipeline
  if (process.env.PRP_PIPELINE_RUNNING) {
    if (!isBugFixMode || !isBugFixPath) {
      throw new Error(
        `Pipeline already running (PID: ${process.env.PRP_PIPELINE_RUNNING}). ` +
        `Nested execution is only allowed in bug fix mode ` +
        `(SKIP_BUG_FINDING=true) with a bugfix path.`
      );
    }
  }

  // Set the guard
  process.env.PRP_PIPELINE_RUNNING = currentPid;
}
```

### Error Handling

```typescript
class NestedExecutionError extends Error {
  readonly existingPid: string;
  readonly currentPid: string;

  constructor(message: string, existingPid: string, currentPid: string) {
    super(message);
    this.name = 'NestedExecutionError';
    this.existingPid = existingPid;
    this.currentPid = currentPid;
  }
}
```

---

## 9. Test Requirements

### Test Scenarios Needed

1. **Blocked Nested Execution**:
   - Set `PRP_PIPELINE_RUNNING` to existing PID
   - Ensure pipeline throws error
   - Verify log shows guard activation

2. **Allowed Bug Fix Recursion**:
   - Set `PRP_PIPELINE_RUNNING` and `SKIP_BUG_FINDING=true`
   - Verify in bugfix directory path
   - Ensure pipeline runs successfully

3. **Bug Fix Mode but Wrong Path**:
   - Set `PRP_PIPELINE_RUNNING` and `SKIP_BUG_FINDING=true`
   - Verify NOT in bugfix directory
   - Ensure pipeline throws error

4. **Debug Logging Verification**:
   - Check that all environment variables are logged
   - Verify path inspection is correct
   - Verify PID values are logged

### Test File Location

- Unit tests: `tests/unit/nested-execution-guard.test.ts`
- Integration tests: `tests/integration/nested-execution-guard-integration.test.ts`

---

## 10. Dependencies on Other Components

### Required Imports

- `Logger` from `../utils/logger.js`
- `NestedExecutionError` custom error class
- Path utilities for path validation (`node:path`)

### Integration Points

1. **CLI Parser** - Early validation
2. **Pipeline Run Method** - Primary guard location
3. **Environment Configuration** - Centralized guard logic
4. **Bug Hunt Workflow** - Should set `SKIP_BUG_FINDING` for fix cycles
5. **Session Manager** - Should validate bugfix session paths

---

## Conclusion

The nested execution guard is a critical safety feature specified in the PRD but not yet implemented. The implementation should:

1. Check `PRP_PIPELINE_RUNNING` at startup
2. Allow recursion only in bug fix mode (`SKIP_BUG_FINDING=true` + bugfix path)
3. Provide comprehensive debug logging
4. Fail fast with clear error messages
5. Be testable with mocked environment variables

This task (P1.M1.T4.S4) is to **write unit tests** that verify this guard logic once it is implemented.
