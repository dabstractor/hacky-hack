# Architecture Audit Summary - P1.M1.T2.S2

## Research Objective 1 Reference

From `architecture/001_codebase_audit.md` §Research Objective 1:

### SessionManager Constructor Issues

The audit document identifies that SessionManager requires 3 parameters:
```typescript
constructor(
  prdPath: string,
  planDir: string = resolve('plan'),
  flushRetries: number = 3
)
```

### Problem Identified

Most test files were using the 2-parameter pattern:
```typescript
new SessionManager(prdPath, flushRetries)
// This passes flushRetries to planDir parameter!
```

### Correct Pattern

```typescript
new SessionManager(prdPath, resolve('plan'), flushRetries)
```

## Files Requiring Updates

### Integration Tests (P1.M1.T2.S2 Scope)

| File | Constructor Calls | Priority |
|------|-------------------|----------|
| `tests/integration/session-structure.test.ts` | 5 | **HIGH** |
| `tests/integration/tasks-json-authority.test.ts` | 5 | **HIGH** |
| `tests/integration/delta-resume-regeneration.test.ts` | 5 | **HIGH** |
| `tests/integration/prp-generator-integration.test.ts` | 2 | **MEDIUM** |
| `tests/integration/prp-runtime-integration.test.ts` | 1 | **MEDIUM** |
| `tests/integration/scope-resolution.test.ts` | 1 | **MEDIUM** |
| `tests/integration/prd-task-command.test.ts` | 1 | **MEDIUM** |

### Summary for P1.M1.T2.S2
- **Total Test Files**: 7 integration test files
- **Total Constructor Calls**: ~20 instantiations
- **Pattern Issue**: All using 2-parameter constructor
- **Required Action**: Update to 3-parameter constructor

## Context from Related Subtasks

### P1.M1.T2.S1 (Completed)
Updated ~200 SessionManager instantiations in `tests/unit/core/session-manager.test.ts` to use the correct 3-parameter constructor.

### P1.M1.T2.S3 (Planned)
Will update `tests/unit/core/session-state-batching.test.ts` which has 1 constructor call.

### P1.M1.T2.S4 (Planned)
Will verify TaskOrchestrator SessionManager usage at `src/core/task-orchestrator.ts`.

## Alignment Requirements

Per the work item description:
> Must align with the updated unit test pattern. See architecture/001_codebase_audit.md §Research Objective 1.

This means integration tests must follow the same 3-parameter pattern established in S1.
