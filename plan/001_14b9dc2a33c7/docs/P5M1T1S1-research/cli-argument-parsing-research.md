# CLI Argument Parsing Research

## Summary

The codebase uses **Commander.js** (version 14.0.2) for CLI argument parsing.

## Key Findings

### 1. Main Entry Points

- **Primary entry point**: `/home/dustin/projects/hacky-hack/src/index.ts`
- **CLI parser location**: `/home/dustin/projects/hacky-hack/src/cli/index.ts`
- **Entry script**: `package.json` shows `"dev": "tsx src/index.ts"` and `"pipeline": "tsx src/index.ts"`

### 2. --verbose Flag Implementation

**Location**: `/home/dustin/projects/hacky-hack/src/cli/index.ts` (line 114)

```typescript
.option('--verbose', 'Enable debug logging', false)
```

**Type Definition** (lines 48-66):

```typescript
export interface CLIArgs {
  // ... other properties
  /** Enable debug logging */
  verbose: boolean;
}
```

**Usage Pattern** (from src/index.ts):

```typescript
if (args.verbose) {
  console.error('[Entry] Verbose mode enabled');
  console.error('[Entry] Parsed CLI arguments:', JSON.stringify(args, null, 2));
}
```

### 3. --machine-readable Flag

**Status**: **NOT IMPLEMENTED**

The `--machine-readable` flag does **not exist** in this codebase. This needs to be added as part of this PRP.

### 4. Boolean Flag Pattern

All boolean flags follow this pattern:

```typescript
.option('--flag-name', 'Description', false)
//                                          ^^^^
//                           MUST have explicit default (false)
```

### 5. Complete CLI Options

From `/home/dustin/projects/hacky-hack/src/cli/index.ts`:

```typescript
export interface CLIArgs {
  /** Path to PRD markdown file */
  prd: string;

  /** Optional scope to limit execution (e.g., "P3.M4") */
  scope?: string;

  /** Execution mode */
  mode: 'normal' | 'bug-hunt' | 'validate';

  /** Resume from previous session */
  continue: boolean;

  /** Show plan without executing */
  dryRun: boolean;

  /** Enable debug logging */
  verbose: boolean;
}
```

## References

- Commander.js Documentation: https://www.npmjs.com/package/commander
- src/cli/index.ts: Complete CLI implementation
- src/index.ts: Main entry point with verbose flag usage
- tests/unit/cli/index.test.ts: CLI tests
