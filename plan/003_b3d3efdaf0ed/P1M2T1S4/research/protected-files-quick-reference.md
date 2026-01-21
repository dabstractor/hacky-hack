# Protected Files Quick Reference

## Session-Specific Protected Files

```
$SESSION_DIR/
├── tasks.json              # NEVER delete or move
├── prd_snapshot.md         # NEVER delete or move
├── delta_prd.md            # NEVER delete or move
├── delta_from.txt          # NEVER delete or move
└── TEST_RESULTS.md         # NEVER delete or move
```

## Project-Level Protected Files

```
project-root/
└── PRD.md                  # NEVER modify (human-owned)
```

## Wildcard Pattern

```
*tasks*.json                # Matches any file with "tasks" and ".json"
```

## Forbidden Operations (All Agents)

1. Never modify `PRD.md`
2. Never add `plan/`, `PRD.md`, or task files to `.gitignore`
3. Never run `prd`, `run-prd.sh`, or `tsk` commands
4. Never create session-pattern directories (`[0-9]*_*`) outside designated locations

## Current Implementation Status

### Implemented

- ✅ Git commit filter for `tasks.json`, `PRD.md`, `prd_snapshot.md`
- ✅ Agent prompt constraints
- ✅ Nested execution guard

### Missing

- ❌ Git commit filter for `delta_prd.md`, `delta_from.txt`, `TEST_RESULTS.md`
- ❌ Wildcard pattern `*tasks*.json` support
- ❌ Filesystem-level deletion/movement guards
- ❌ Agent operation validation at runtime

## Test Requirements

### Existing Tests

- ✅ `tests/unit/utils/git-commit.test.ts` (filterProtectedFiles)
- ✅ `tests/integration/smart-commit.test.ts` (commit workflow)

### Needed Tests

- ❌ Protected file deletion prevention
- ❌ Protected file movement prevention
- ❌ Wildcard pattern matching (`*tasks*.json`)
- ❌ Delta session files protection
- ❌ TEST_RESULTS.md protection
- ❌ Agent forbidden operation enforcement

## Source References

- **system_context.md**: Lines 463-481
- **PRD.md**: Lines 104-122 (§5.1), Lines 133-151 (§5.2)
- **Implementation**: `src/utils/git-commit.ts` Lines 38-42
