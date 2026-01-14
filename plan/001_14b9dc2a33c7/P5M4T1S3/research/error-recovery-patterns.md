# Error Recovery Patterns Research

## Contract from P5.M4.T1.S2 (Retry Logic)

The retry utility from P5.M4.T1.S2 provides:

- `src/utils/retry.ts` with `retry<T>()` function
- `isTransientError()` predicate for detecting retryable errors
- Exponential backoff with jitter
- Integration at agent prompt call sites and MCP tool executions

## Key Concepts for Error Recovery

### 1. Fatal vs Non-Fatal Errors

**Fatal Errors** (abort pipeline):

- Session corruption (cannot read/write session data)
- Critical system failures (disk full, memory exhausted)
- ValidationError with `PIPELINE_VALIDATION_INVALID_INPUT` for PRD parsing
- SessionError with `PIPELINE_SESSION_LOAD_FAILED` when session directory is missing

**Non-Fatal Errors** (continue execution):

- TaskError with `PIPELINE_TASK_EXECUTION_FAILED` (individual task failures)
- AgentError with `PIPELINE_AGENT_LLM_FAILED` (LLM API failures, already retried)
- Transient errors after retry attempts exhausted
- MCP tool failures after retry

### 2. Error Reporting Structure

Error report should include:

- Summary: Total tasks, completed, failed, success rate
- Failed Tasks List: Task ID, title, error message, timestamp
- Error Categories: Grouped by error type
- Recommendations: Next steps for fixing failures

### 3. CLI Flag Pattern

`--continue-on-error` flag should:

- Treat all errors as non-fatal (override fatal detection)
- Log warnings when continuing past potential fatal errors
- Generate error report at end regardless of failures
- Exit with non-zero code if any tasks failed

### 4. Try-Catch Wrapping Strategy

Wrap each `@Step()` decorated method in PRPPipeline:

1. `initializeSession()` - Fatal (session required for all operations)
2. `decomposePRD()` - Fatal (backlog required for execution)
3. `executeBacklog()` - Non-fatal (continue on individual task failures)
4. `runQACycle()` - Non-fatal (QA is optional)
5. `cleanup()` - Never fail (best-effort state preservation)

### 5. Error Context Tracking

For each failed task, record:

- Task ID and title
- Error type (using error hierarchy from P5.M4.T1.S1)
- Error message and stack trace
- Timestamp
- Phase/Milestone context
- Dependencies that were blocked

### 6. Error Report Format

Save as `ERROR_REPORT.md` in session directory:

```markdown
# Error Report

**Generated**: [timestamp]
**Pipeline Mode**: [normal|bug-hunt|validate]
**Continue on Error**: [true|false]

## Summary

| Metric       | Count |
| ------------ | ----- |
| Total Tasks  | X     |
| Completed    | Y     |
| Failed       | Z     |
| Success Rate | N%    |

## Failed Tasks

### [Task ID]: [Task Title]

**Phase**: [Phase]
**Milestone**: [Milestone]
**Error Type**: [ErrorCode]
**Timestamp**: [ISO timestamp]

**Error Message**:
```

[error message]

```

---

## Error Categories

- **TaskError**: N tasks
- **AgentError**: N tasks
- **ValidationError**: N tasks

## Recommendations

1. Review failed tasks above
2. Fix underlying issues
3. Re-run pipeline with `--scope` to target specific tasks
```
