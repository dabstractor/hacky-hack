# PRD and Plan Context

## Work Item Definition

From `plan/002_1e734971e481/bugfix/001_8d809cc989b9/tasks.json` (lines 406-414):

```json
{
  "type": "Subtask",
  "id": "P3.M3.T1.S1",
  "title": "Implement positive jitter calculation",
  "status": "Researching",
  "story_points": 1,
  "dependencies": [],
  "context_scope": "CONTRACT DEFINITION:\n1. RESEARCH NOTE: From PRD Issue 6 - Test expects jitter to make delay strictly greater than base, but implementation may produce equal values. Current formula: jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2. Can produce negative, zero, or positive jitter.\n2. INPUT: Retry utility at /home/dustin/projects/hacky-hack/src/utils/retry.ts, current jitter calculation.\n3. LOGIC: Modify jitter calculation to ensure always positive. Change: const jitter = Math.max(1, exponentialDelay * jitterFactor * Math.random()). This ensures jitter >= 1ms, making total delay always greater than base delay. Alternative: update test to allow >= instead of >. Implement calculation fix preferred.\n4. OUTPUT: Jitter calculation updated to always be positive, test 'should add jitter to delay' now passing."
}
```

## Phase P3 Context

**Phase P3**: "Major Bug Fixes - Test Alignment"

- Focus: Aligning tests with implementation expectations
- Status: Researching
- Milestones:
  - P3.M1: Fix Task Orchestrator Logging Tests (Complete)
  - P3.M2: Fix Session Utils Validation Test (Implementing)
  - P3.M3: Fix Retry Utility Jitter Calculation (Researching) - **THIS ITEM**

## Milestone P3.M3 Context

**Milestone P3.M3**: "Fix Retry Utility Jitter Calculation"

- Description: "Fix the retry utility jitter calculation to ensure jitter is always positive."
- Status: Researching
- Task: P3.M3.T1 - "Update jitter calculation to be always positive"
- Subtask: P3.M3.T1.S1 - "Implement positive jitter calculation"

## Dependencies

- **No dependencies** listed for P3.M3.T1.S1
- Runs in parallel with P3.M2.T1.S1 (Fix Session Utils Test)
- Independent work item - does not affect or depend on other P3 tasks

## Issue 6 Details (from PRD)

**Problem**: Test expects jitter to make delay strictly greater than base, but implementation may produce equal values.

**Current Formula**:

```typescript
jitter = exponentialDelay * jitterFactor * (Math.random() - 0.5) * 2;
```

**Issue**: Can produce negative, zero, or positive jitter.

**Recommended Fix**:

```typescript
jitter = Math.max(1, exponentialDelay * jitterFactor * Math.random());
```

**Alternative (Not Preferred)**: Update test to allow >= instead of >

**Decision**: Implement calculation fix preferred.

## Success Criteria

From the context_scope:

1. Jitter calculation updated to always be positive
2. Test 'should add jitter to delay' now passing
3. Total delay always greater than base delay

## Related Documentation

- `plan/002_1e734971e481/architecture/system_context.md` - System architecture documentation
- `plan/002_1e734971e481/PRD.md` - Product requirements document
- `plan/002_1e734971e481/bugfix/001_8d809cc989b9/P3M3T1S1/` - This work item directory
