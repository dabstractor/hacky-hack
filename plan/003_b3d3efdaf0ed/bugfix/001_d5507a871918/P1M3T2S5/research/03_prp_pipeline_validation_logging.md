# PRP Pipeline Validation Logging Research

## Summary

Analysis of existing validation-related logging in PRP Pipeline's run() method to understand patterns and placement.

## Validation Location

**File**: `src/workflows/prp-pipeline.ts`
**Lines**: 1665-1811 (the run() method)

### Validation Sequence (Lines 1709-1735)

1. **Line 1717**: `validateNestedExecution(sessionPath)` - Validation occurs before guard is set

2. **Lines 1714-1716**: Debug logging **before** validation
```typescript
this.logger.debug(
  `[PRPPipeline] Checking for nested execution at ${sessionPath}`
);
```

3. **Lines 1718-1720**: Debug logging **after** successful validation
```typescript
this.logger.debug(
  '[PRPPipeline] No nested execution detected, proceeding'
);
```

4. **Lines 1722-1730**: Error logging with context
```typescript
this.logger.error(
  {
    sessionPath,
    existingPid: error.context?.existingPid,
    currentPid: error.context?.currentPid,
  },
  '[PRPPipeline] Nested execution detected - cannot proceed'
);
```

## Multi-field Debug Logging Patterns

### Object-based logging pattern (Lines 1723-1730)
```typescript
this.logger.error(
  {
    sessionPath,
    existingPid: error.context?.existingPid,
    currentPid: error.context?.currentPid,
  },
  '[PRPPipeline] Nested execution detected - cannot proceed'
);
```

### Template literal pattern (Lines 1714-1716)
```typescript
this.logger.debug(
  `[PRPPipeline] Checking for nested execution at ${sessionPath}`
);
```

### Correlation Logger Pattern (Lines 1691-1699)
```typescript
this.correlationLogger.debug(
  {
    prdPath: this.#prdPath,
    scope: this.#scope ?? 'all',
    mode: this.mode,
  },
  '[PRPPipeline] Starting PRP Pipeline workflow'
);
```

## Key Placement for New Guard Context Logging

The new guard context logging should be placed **after line 1738** (where `PRP_PIPELINE_RUNNING` is set) and **before line 1742** (where workflow steps begin).

This placement:
1. Occurs AFTER validation passes (line 1717)
2. Occurs AFTER guard is set (line ~1738, from P1.M3.T2.S4)
3. Occurs BEFORE workflow execution begins (line ~1742)
4. Follows the pattern of logging after critical state changes

## Logging Patterns Summary

1. **Object-based logging**: `{ contextObject }, 'message'` format for debug/error logs with context
2. **Simple string logging**: `'message'` format for basic debug logs
3. **Template literals**: `` `message with ${variable}` `` for simple dynamic messages
4. **Correlation vs Standard Logger**: correlationLogger for structured context, logger for general messages

## Implementation Guidance for Guard Context Logging

Based on the existing patterns, the guard context logging should:

1. **Use `this.logger`** (not correlationLogger) - matches pattern of guard operations (lines 1714-1720)
2. **Use template literal format** for simple multi-field message (like lines 1714-1716)
3. **Include all 4 required fields** in one log message
4. **Place after line 1738** (after PRP_PIPELINE_RUNNING is set)

### Recommended implementation
```typescript
// After line 1738 (PRP_PIPELINE_RUNNING is set)
const planDir = this.sessionManager.planDir;
const sessionDir = this.sessionManager.currentSession?.metadata.path ?? 'not set';
const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';
const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';

this.logger.debug(
  `[PRPPipeline] Guard Context: PLAN_DIR=${planDir}, SESSION_DIR=${sessionDir}, SKIP_BUG_FINDING=${skipBugFinding}, PRP_PIPELINE_RUNNING=${running}`
);
```

This follows the exact pattern from lines 1714-1716 for validation-related logging.
