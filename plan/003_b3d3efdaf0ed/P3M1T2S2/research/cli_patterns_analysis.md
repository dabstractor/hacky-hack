# CLI Option Patterns Research Report

Based on analysis of the PRP Pipeline codebase, here are the key patterns for implementing `--research-concurrency`:

### 1. CLI Entry Point (src/cli/index.ts)

The codebase uses **Commander.js** with a well-structured approach. Existing numeric options include:

- `--max-tasks <number>` (positive integer validation)
- `--max-duration <ms>` (positive integer validation)
- `--monitor-interval <ms>` (1000-60000 range validation)
- `--parallelism <n>` (1-10 range validation, default: 2)

### 2. Validation Pattern

The existing validation pattern (lines 321-387) shows:
- Type checking with `Number.isInteger()`
- Range validation with min/max checks
- Error messages with specific requirements
- String-to-number conversion for Commander.js outputs

### 3. Type Definition Pattern

Two-tier approach:
- `CLIArgs` interface with `number | string` for Commander.js compatibility
- `ValidatedCLIArgs` interface with `number` after validation

### 4. Environment Variable Patterns

Found in `/src/config/environment.ts`:
- Environment variable constants using `as const`
- Default value fallback pattern
- Type-safe access through wrapper functions

### 5. Resource Warning System

The codebase includes intelligent warnings for:
- CPU core limits
- Memory usage estimation
- Cost considerations (for API-heavy operations)

### 6. Pipeline Integration

Pattern of private readonly properties with constructor injection.

### Recommended Pattern for --research-concurrency

1. **CLI Option Definition**:
```typescript
.option(
  '--research-concurrency <n>',
  'Max concurrent research tasks (1-10, default: 3)',
  '3'
)
```

2. **Validation**:
- Range: 1-10
- Default: 3
- Cost warnings for values > 4

3. **Type Definitions**:
- Follow the existing parallelism pattern with two-tier typing

4. **Integration**:
- Pass as parameter to pipeline constructor
- Store as private readonly property

The pattern is consistent with existing numeric options while providing appropriate defaults and validation specific to research operations.
