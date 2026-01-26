# Artifact Viewer Tool - Quick Reference

## Work Item

**Title**: Create artifact viewer tool
**ID**: P2.M3.T2.S3

## Commands to Implement

### `prd artifacts list`

List all artifacts with metadata

- Output formats: table, json
- Shows: Task ID, artifact type, file path, status

### `prd artifacts view <task-id>`

Display specific artifact content

- Shows: validation-results.json, execution-summary.md, artifacts-list.json
- Features: syntax highlighting for JSON/MD

### `prd artifacts diff <task1> <task2>`

Compare artifacts between tasks

- Shows: unified diff with colored output
- Supports: JSON and text comparison

## File Structure

```
src/cli/commands/
└── artifacts.ts              # NEW: Artifacts command handler

src/utils/
├── display/
│   └── syntax-highlighter.ts  # NEW: Syntax highlighting wrapper
└── artifact-differ.ts         # NEW: Artifact comparison utilities

tests/unit/cli/commands/
└── artifacts.test.ts          # NEW: Artifacts command tests

tests/integration/
└── artifacts-command.test.ts  # NEW: Integration tests
```

## Key Dependencies

### Existing (use these)

- `chalk@^5.6.2` - Terminal colors
- `cli-table3@^0.6.5` - Table formatting
- `commander` - CLI argument parsing

### New to install

- `cli-highlight` - Syntax highlighting (180+ languages)
- `diff` - Unified diff generation
- `jsondiffpatch` - JSON-specific diffing

## Color Scheme (match existing)

- Green: ✓ success, additions
- Red: ✗ errors, deletions
- Cyan: headers, emphasis
- Yellow: warnings
- Gray: context, unchanged

## Session/Artifact Paths

- Session: `plan/{sequence}_{hash}/`
- Artifacts: `session/artifacts/{taskId}/`
- Files: `validation-results.json`, `execution-summary.md`, `artifacts-list.json`

## Display Patterns

- Use `cli-table3` with Unicode box-drawing
- Respect `NO_COLOR` environment variable
- Support `--output` format option (table, json)
- TTY-aware color detection

## Test Patterns

- Mock SessionManager with `vi.mock()`
- Use temporary directories for file operations
- Test all output formats
- Validate syntax highlighting
- Test diff generation

## Integration Points

- Extend `src/cli/index.ts` to register new command
- Use `SessionManager` from `src/core/session-manager.ts`
- Follow `InspectCommand` pattern from `src/cli/commands/inspect.ts`
- Use display utilities from `src/utils/display/`
