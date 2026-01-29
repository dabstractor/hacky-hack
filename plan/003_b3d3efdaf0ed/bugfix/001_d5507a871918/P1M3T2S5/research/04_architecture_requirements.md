# Architecture and PRD Requirements Research

## Summary

Complete requirements from PRD §9.2.5 and architecture documents for guard context logging.

## PRD §9.2.5 - Debug Logging Requirements

### Guard Logic

1. On pipeline start, check if `PRP_PIPELINE_RUNNING` is already set
2. If set, only allow execution if BOTH conditions are true:
   - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
   - `PLAN_DIR` contains "bugfix" (validates bugfix context)
3. If validation fails, exit with clear error message
4. On valid entry, set `PRP_PIPELINE_RUNNING` to current PID

### Session Creation Guards

- In bug fix mode, prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- **Provides debug logging showing `PLAN_DIR`, `SESSION_DIR`, and `SKIP_BUG_FINDING` values**

## Research Objective 4 - Guard Context

From the task context (P1.M3.T2.S5):

> "1. RESEARCH NOTE: PRD §9.2.5 requires debug logging showing PLAN_DIR, SESSION_DIR, and SKIP_BUG_FINDING. Essential for troubleshooting guard issues. See architecture/001_codebase_audit.md §Research Objective 4."

### Specific Requirement from Task

> "In PRP Pipeline run() method, after validation passes, add debug log with: PLAN_DIR (from sessionManager.planDir or config), SESSION_DIR (from sessionManager.currentSession.metadata.path), SKIP_BUG_FINDING (process.env.SKIP_BUG_FINDING or 'false'), PRP_PIPELINE_RUNNING (process.env.PRP_PIPELINE_RUNNING or 'not set'). Use existing logger or console.debug with format: 'Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}'. Only log if debug mode enabled."

## Architecture §4.4 - Debug Logging for Guards

From `architecture/002_external_dependencies.md` §4.4:

```typescript
export function logGuardContext(logger: Logger): void {
  logger.debug('=== Nested Execution Guard Context ===');
  logger.debug(
    `PRP_PIPELINE_RUNNING: ${process.env.PRP_PIPELINE_RUNNING ?? 'not set'}`
  );
  logger.debug(
    `SKIP_BUG_FINDING: ${process.env.SKIP_BUG_FINDING ?? 'not set'}`
  );
  logger.debug(`Current PID: ${process.pid}`);
  logger.debug(`CWD: ${process.cwd()}`);
  logger.debug(`PLAN_DIR: ${process.env.PLAN_DIR ?? 'not set'}`);
  logger.debug(`SESSION_DIR: ${process.env.SESSION_DIR ?? 'not set'}`);
  logger.debug('=====================================');
}
```

## Required Debug Logging Format

### Single-line format (from task specification)

```
Guard Context: PLAN_DIR={planDir}, SESSION_DIR={sessionDir}, SKIP_BUG_FINDING={skipBugFinding}, PRP_PIPELINE_RUNNING={running}
```

### Required fields

1. **PLAN_DIR**: From `sessionManager.planDir` (absolute path to plan directory)
2. **SESSION_DIR**: From `sessionManager.currentSession.metadata.path` (session directory path)
3. **SKIP_BUG_FINDING**: From `process.env.SKIP_BUG_FINDING` or 'false' if not set
4. **PRP_PIPELINE_RUNNING**: From `process.env.PRP_PIPELINE_RUNNING` or 'not set' if not set

## Implementation Constraints

1. **Timing**: After validation passes, after PRP_PIPELINE_RUNNING is set (P1.M3.T2.S4)
2. **Logger**: Use existing logger (`this.logger`)
3. **Debug mode only**: Only log when debug mode is enabled
4. **Format**: Single line with all 4 fields in specified order
5. **Default values**: Use 'false' for SKIP_BUG_FINDING, 'not set' for PRP_PIPELINE_RUNNING
6. **Null safety**: Handle case where currentSession is null

## Placement in PRP Pipeline

Based on the execution sequence:

1. Line 1665: `async run(): Promise<PipelineResult>` - method entry
2. Line 1717: `validateNestedExecution(sessionPath)` - validation check
3. Line ~1738: Set `PRP_PIPELINE_RUNNING` (from P1.M3.T2.S4)
4. **INSERT HERE**: Guard context logging (this task, P1.M3.T2.S5)
5. Line ~1742: Begin workflow execution

The guard context logging must be placed **after** the PRP_PIPELINE_RUNNING environment variable is set (P1.M3.T2.S4) so that the value appears in the log output.
