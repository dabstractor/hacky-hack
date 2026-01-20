# Smart Commit Calling Context Analysis

## Overview

This document analyzes the integration context of the `smartCommit` function in the PRP (Project Resumption Protocol) pipeline. The function is automatically called after successful subtask execution to create automated Git commits.

## Function Location

**Primary Implementation**: `/home/dustin/projects/hacky-hack/src/utils/git-commit.ts`
- Export: `smartCommit(sessionPath: string, message: string): Promise<string | null>`
- Uses GitMCP tools: `gitStatus`, `gitAdd`, `gitCommit`

## Call Sites

### 1. Task Orchestrator - Primary Integration Point

**File**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
**Line**: 707

```typescript
// Smart commit after successful subtask completion
try {
  const sessionPath = this.sessionManager.currentSession?.metadata.path;
  if (!sessionPath) {
    this.#logger.warn('Session path not available for smart commit');
  } else {
    const commitMessage = `${subtask.id}: ${subtask.title}`;
    const commitHash = await smartCommit(sessionPath, commitMessage);

    if (commitHash) {
      this.#logger.info({ commitHash }, 'Commit created');
    } else {
      this.#logger.info('No files to commit');
    }
  }
} catch (error) {
  // Don't fail the subtask if commit fails
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.#logger.error({ error: errorMessage }, 'Smart commit failed');
}
```

**Context**:
- Called after subtask execution completes successfully
- Located in `executeSubtask()` method after status is set to 'Complete'
- Wrapped in try/catch to prevent commit failures from affecting subtask completion

### 2. Import Declaration

**File**: `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
**Line**: 41

```typescript
import { smartCommit } from '../utils/git-commit.js';
```

## Function Parameters and Usage

### Parameters

1. **sessionPath**: string
   - Path to the Git repository (usually project root)
   - Retrieved from `this.sessionManager.currentSession?.metadata.path`
   - Checked for null/undefined before calling

2. **message**: string
   - Format: `${subtask.id}: ${subtask.title}`
   - Example: `P3.M4.T1.S3: Implement smart commit workflow`

### Return Value Handling

- **Commit Hash (string)**: Logged with info level "Commit created"
- **Null**: Logged with info level "No files to commit"
- **Error**: Caught and logged as error, but subtask execution continues

## Integration Workflow

1. **Subtask Execution Complete**
   - PRPRuntime completes subtask execution
   - TaskOrchestrator receives result
   - Status is updated to 'Complete'

2. **Smart Commit Trigger**
   - Session path is retrieved from current session
   - Commit message is formatted with subtask ID and title
   - `smartCommit()` is called with session path and message

3. **Commit Processing**
   - Git status check for modified/untracked files
   - Protected files filtered out (tasks.json, PRD.md, prd_snapshot.md)
   - Remaining files staged and committed
   - Commit hash returned or null if no files to commit

## Test Coverage

### Unit Tests
**File**: `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`
- Tests various scenarios including:
  - Successful commit creation
  - Protected file filtering
  - Empty file scenarios
  - Error handling
  - Message formatting

### Integration Tests
**File**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-runtime.test.ts`
- Test: "should trigger smart commit after successful execution"
- Verifies smartCommit is called during subtask execution

**File**: `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts`
- Test: "should create smart commits after successful execution"
- End-to-end verification of smart commit workflow

## Protected Files

The smart commit function filters out these files to preserve pipeline state:

1. `tasks.json` - Pipeline task registry
2. `PRD.md` - Original PRD document
3. `prd_snapshot.md` - PRD snapshot for delta detection

## Error Handling

- **Session Path Unavailable**: Warning logged, smart commit skipped
- **Git Operation Failures**: Error logged, but subtask remains successful
- **No Files to Commit**: Info message logged, commit skipped
- **Unexpected Errors**: Caught and logged, returns null

## Commit Message Format

```typescript
formatCommitMessage(message: string): string {
  return `[PRP Auto] ${message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
}
```

Example output:
```
[PRP Auto] P3.M4.T1.S3: Implement smart commit workflow

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Related Files

- `/home/dustin/projects/hacky-hack/src/tools/git-mcp.ts` - Git MCP tools
- `/home/dustin/projects/hacky-hack/src/core/session-manager.ts` - Session management
- `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts` - Main integration point
- Various test files in `/tests/` directory

## Summary

The `smartCommit` function is integrated into the PRP pipeline as an automated checkpointing mechanism. It's called after every successful subtask completion to:
1. Create automated commits of subtask work
2. Filter out protected pipeline files
3. Provide commit hash observability
4. Continue execution even if commit fails

This integration ensures that each subtask's work is automatically saved to Git while preserving the pipeline's ability to resume from interruptions.