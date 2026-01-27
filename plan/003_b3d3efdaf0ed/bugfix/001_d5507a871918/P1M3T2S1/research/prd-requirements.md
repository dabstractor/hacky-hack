# PRD §9.2.5 Requirements for PRP_PIPELINE_RUNNING Guard

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - PRD requirements for nested execution guard
**Source:** PRD.md Section §9.2.5

---

## 1. Exact Requirement from PRD §9.2.5

### Problem Statement
Agents could accidentally invoke `run-prd.sh` during implementation, causing recursive execution and corrupted pipeline state.

### Solution Specification
The pipeline sets `PRP_PIPELINE_RUNNING` environment variable at script entry and validates it before proceeding.

### Guard Logic (Exact Specification)

1. **On pipeline start**, check if `PRP_PIPELINE_RUNNING` is already set
2. **If set**, only allow execution if BOTH conditions are true:
   - `SKIP_BUG_FINDING=true` (legitimate bug fix recursion)
   - Session path contains "bugfix" (validates bugfix context)
3. **If validation fails**, exit with clear error message
4. **On valid entry**, set `PRP_PIPELINE_RUNNING` to current PID

### Error Message Format
```
Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {existing_pid}
```

---

## 2. Session Creation Guards

### In bug fix mode
- Prevent creating sessions in main `plan/` directory
- Bug fix session paths must contain "bugfix" in the path
- Provides debug logging showing `PLAN_DIR`, `SESSION_DIR`, and `SKIP_BUG_FINDING` values

### Debug Logging Format
```typescript
logger.debug(`[Guard] PLAN_DIR=${PLAN_DIR}`);
logger.debug(`[Guard] SESSION_DIR=${SESSION_DIR}`);
logger.debug(`[Guard] SKIP_BUG_FINDING=${SKIP_BUG_FINDING}`);
```

---

## 3. Related Requirements About Nested Execution Prevention

### Functional Requirements (Section 5.1)
- Must implement nested execution guard via `PRP_PIPELINE_RUNNING` environment variable

### Universal Forbidden Operations (Section 5.2)
- Never run `prd`, `run-prd.sh`, or `tsk` commands (prevents recursive execution)
- Never create session-pattern directories (`[0-9]*_*`) outside designated locations

### Agent Operational Boundaries
All agent types are forbidden from accessing pipeline control files and directories that could lead to recursive execution.

---

## 4. Context of Why This Guard is Needed

### Problem Scenarios

1. **Implementation agents** might accidentally call `run-prd.sh` during code generation
2. **Validation scripts** could trigger pipeline execution
3. **Bug fix sessions** might recursively invoke the main pipeline
4. **Background processes** (Parallel Research) might spawn new pipeline instances

### Consequences of Missing Guard

- Recursive execution leading to infinite loops
- Corrupted pipeline state with duplicate sessions
- API token exhaustion from multiple concurrent requests
- File system conflicts with overlapping session directories

### Legitimate vs Illegitimate Recursion

**Legitimate:**
- Bug fix sessions when `SKIP_BUG_FINDING=true` AND session path contains "bugfix"

**Illegitimate:**
- Any other scenario of accidental pipeline invocation

---

## 5. Other Environment Variable Requirements

### Pipeline Control Variables

```bash
PRP_PIPELINE_RUNNING:  # Guard to prevent nested execution (set to PID when pipeline starts)
SKIP_BUG_FINDING:      # Skip bug hunt stage; also identifies bug fix mode when true
SKIP_EXECUTION_LOOP:   # Internal flag to skip task execution while allowing validation/bug hunt
```

### Bug Hunt Configuration

```bash
BUG_FINDER_AGENT:   # Agent used for bug discovery (default: glp)
BUG_RESULTS_FILE:   # Bug report output file (default: TEST_RESULTS.md)
BUGFIX_SCOPE:       # Granularity for bug fix tasks (default: subtask)
```

### API Connection

```bash
ANTHROPIC_AUTH_TOKEN: # z.ai API authentication token
ANTHROPIC_BASE_URL:   # API endpoint
```

---

## 6. Session Path Validation Requirements

### Main Session
- Must be in `plan/{sequence}_{hash}/`

### Bug Fix Session
- Must be in `plan/{sequence}_{hash}/bugfix/{sequence}_{hash}/`
- **Validation**: Session paths must contain "bugfix" in the path for bug fix mode

---

## 7. Protected Files

The following files must NEVER be modified or moved:

- `$SESSION_DIR/tasks.json` - Pipeline state tracking
- `$SESSION_DIR/prd_snapshot.md` - PRD snapshot for session
- `$SESSION_DIR/delta_prd.md` - Delta PRD for incremental sessions
- `$SESSION_DIR/delta_from.txt` - Delta session linkage
- `$SESSION_DIR/TEST_RESULTS.md` - Bug report file
- `PRD.md` - Product requirements document (human-owned)
- Any file matching `*tasks*.json` pattern
- Any file directly in `$SESSION_DIR/` root

---

## 8. Implementation Specification

### Function Signature (from Work Item Contract)

```typescript
export function validateNestedExecution(sessionPath: string): void
```

### Logic Specification

1. Check if `process.env.PRP_PIPELINE_RUNNING` is set
2. If set:
   - Check if `process.env.SKIP_BUG_FINDING === 'true'` AND `sessionPath.includes('bugfix')`
   - If both conditions true (legitimate recursion): return without error
   - Else: throw `NestedExecutionError` with message `'Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: {process.env.PRP_PIPELINE_RUNNING}'`
3. If `PRP_PIPELINE_RUNNING` not set: return without error (first execution)

---

## Summary

The PRP_PIPELINE_RUNNING guard is a **critical safety mechanism** that:
- Prevents recursive pipeline execution
- Allows legitimate bug fix recursion with specific conditions
- Validates session paths
- Provides debug logging
- Protects pipeline state from corruption

This guard is fundamental to the pipeline's stability and must be implemented **exactly** as specified in PRD §9.2.5.
