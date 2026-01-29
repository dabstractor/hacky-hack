# PRP Pipeline Entry Point Research for validateNestedExecution

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - PRP Pipeline entry point for guard integration
**Goal:** Document exact location and context for validateNestedExecution call

---

## 1. Main PRP Pipeline File

**File:** `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

---

## 2. Entry Point Function

**Primary Entry Point:** `run()` method (Lines 1665-1824)
**Function Signature:** `async run(): Promise<PipelineResult>`

This is the main entry point that orchestrates the entire PRP Pipeline workflow and is called for both initial execution and resumption from existing sessions.

---

## 3. Where sessionPath is Available

### SessionManager Creation (Lines 1698-1703)

```typescript
this.sessionManager = new SessionManagerClass(
  this.#prdPath,
  this.#planDir,
  this.#flushRetries
);
```

### Session Path Access

Available via `this.sessionManager.currentSession.metadata.path` after successful initialization in the `initializeSession()` method (lines 516-596).

---

## 4. Existing Guard Implementation

### Setting the Guard (Lines 1705-1707)

```typescript
// Set guard after validation passes (validateNestedExecution called in S3)
process.env.PRP_PIPELINE_RUNNING = currentPid;
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);
```

### Cleaning Up the Guard (Lines 1815-1819)

```typescript
// Clear guard if we own it (before cleanup)
if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
  delete process.env.PRP_PIPELINE_RUNNING;
  this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');
}
```

---

## 5. Recommended validateNestedExecution Call Location

**Best Location:** Lines 1710-1711 (after `initializeSession()` call)

### Context

```typescript
// Around line 1710
await this.initializeSession();

// NEW: Add validateNestedExecution guard HERE
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  validateNestedExecution(sessionPath);
}

await this.decomposePRD();
```

### Why This Location?

- ✅ Session is successfully initialized
- ✅ Session path is available: `this.sessionManager.currentSession.metadata.path`
- ✅ Before proceeding to PRD decomposition and backlog execution
- ✅ Early detection of nested execution issues
- ✅ After any existing session validation

---

## 6. Session Path Usage Context

The session path is used throughout the pipeline:

### TaskOrchestrator Initialization (line 554)

Uses session for task tracking

### BugHuntWorkflow (line 1146)

```typescript
sessionPath = this.sessionManager.currentSession?.metadata.path;
```

### FixCycleWorkflow (line 1173)

```typescript
sessionPath; // parameter
```

### Delta Handling (line 675)

Session creation with delta path

---

## 7. Existing Validation Patterns

### Session-Level Validation

- `SessionManager.initialize()` validates PRD
- Creates/loads session
- Dependency validation for existing sessions

### Pipeline-Level Validation

- Resource monitoring during execution
- Task failure tracking
- Comprehensive error reporting

---

## 8. Integration Context

The pipeline already has comprehensive error handling patterns:

```typescript
try {
  await this.initializeSession();

  // Add validateNestedExecution here
  if (this.sessionManager.currentSession?.metadata.path) {
    const sessionPath = this.sessionManager.currentSession.metadata.path;
    validateNestedExecution(sessionPath);
  }

  await this.decomposePRD();
  // ... rest of pipeline
} catch (error) {
  // Error handling is already in place
  if (error instanceof NestedExecutionError) {
    // Will be caught and handled appropriately
  }
}
```

---

## 9. Logger Context

The PRPPipeline class has a logger instance available:

```typescript
this.logger.debug(`[PRPPipeline] Session path: ${sessionPath}`);
this.logger.debug(`[PRPPipeline] PRP_PIPELINE_RUNNING check: ${existingPid}`);
```

---

## Summary

**Exact Location:** Lines 1710-1711 in `/home/dustin/projects/hacky-hack/src/workflows/prp-pipeline.ts`

**Function Context:** `async run()` method of `PRPPipeline` class

**Available Data:** `this.sessionManager.currentSession.metadata.path`

**Integration Point:** After `initializeSession()` and before `decomposePRD()`

**Implementation:**

```typescript
await this.initializeSession();

// NEW: Add validateNestedExecution guard
if (this.sessionManager.currentSession?.metadata.path) {
  const sessionPath = this.sessionManager.currentSession.metadata.path;
  validateNestedExecution(sessionPath);
}

await this.decomposePRD();
```

This location provides the optimal balance between:

- Having session context available
- Early detection of nested execution issues
- Integration with existing error handling

The pipeline already has comprehensive error handling patterns that will naturally catch and process `NestedExecutionError`.
