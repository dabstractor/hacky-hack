# PRP Pipeline Entry Point Research

## Primary Entry Point

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`
**Class:** `PRPPipeline`
**Method:** `run()` (lines 1666-1831)

## Current Implementation Status

The PRP Pipeline already has some nested execution guard functionality:

1. **Line 1707:** Sets `process.env.PRP_PIPELINE_RUNNING = currentPid`
2. **Line 1723-1725:** Calls `validateNestedExecution(sessionPath)` after session initialization

## Current run() Method Structure

```typescript
async run(): Promise<PipelineResult> {
  this.#startTime = performance.now();
  this.setStatus('running');

  // Store current PID as string for guard operations
  const currentPid = process.pid.toString();

  this.correlationLogger.info('[PRPPipeline] Starting PRP Pipeline workflow', {...});
  this.logger.info('[PRPPipeline] Starting PRP Pipeline workflow');

  try {
    // Create SessionManager
    this.sessionManager = new SessionManagerClass(...);

    // Set guard after validation passes (validateNestedExecution called in S3)
    process.env.PRP_PIPELINE_RUNNING = currentPid;
    this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);

    // Execute workflow steps
    await this.initializeSession();

    // Debug logging after session initialization
    this.logger.debug('[PRPPipeline] Session initialized', {...});

    // Validate no nested execution (after session path is available)
    if (this.sessionManager.currentSession?.metadata.path) {
      const sessionPath = this.sessionManager.currentSession.metadata.path;
      validateNestedExecution(sessionPath);
    }

    await this.decomposePRD();
    await this.executeBacklog();
    await this.runQACycle();
    // ...
  }
}
```

## Session Path Retrieval

The session path is retrieved through:

```typescript
this.sessionManager.currentSession?.metadata.path
```

**Session path structure:** `plan/{sequence}_{hash}` (e.g., `plan/001_14b9dc2a33c7`)

## Import Statement

```typescript
import { validateNestedExecution } from '../utils/validation/execution-guard.js';
```

This is already imported at line 35 of prp-pipeline.ts

## Key Findings

1. **Validation is called AFTER session initialization** - This is correct because we need the session path
2. **Environment variable is set BEFORE validation** - This is a potential issue because the validation checks for the env var
3. **Debug logging exists** - The codebase uses Pino logger with debug level
4. **Try-catch block wraps the main logic** - Errors can be caught and re-thrown

## Issue with Current Implementation

The contract specifies:
- "At the very beginning of PRP Pipeline run() method (before any other logic), call validateNestedExecution(sessionPath)"

But the current implementation:
- Sets `PRP_PIPELINE_RUNNING` at line 1707 (before validation)
- Calls `validateNestedExecution` at line 1724 (after session initialization)

The validation cannot be called at the "very beginning" because it requires the session path, which is only available after session initialization.

## Correct Interpretation

The contract likely means:
- Call validation as early as possible AFTER session path is available
- The current location (after session initialization) is correct
- Need to ensure proper try-catch wrapping and debug logging

## References

- File: `src/workflows/prp-pipeline.ts` (lines 1666-1831 for run() method)
- Import: Line 35 for validateNestedExecution
- Session initialization: Lines 1700-1724
- Environment variable setting: Line 1707
- Validation call: Lines 1723-1725
