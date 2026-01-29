# Environment Variable Access Patterns Research

## Summary

Comprehensive analysis of how environment variables are accessed and used throughout the codebase.

## Access Patterns

### Direct Access Pattern

```typescript
// From execution-guard.ts (line 57-58)
const existingPid = process.env.PRP_PIPELINE_RUNNING;
const isBugfixRecursion =
  process.env.SKIP_BUG_FINDING === 'true' &&
  sessionPath.toLowerCase().includes('bugfix');
```

### Configuration Pattern with Defaults

```typescript
// From CLI (line 281)
.choices(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
.default(process.env.HACKY_LOG_LEVEL ?? 'info')

// From CLI (line 300)
process.env.MONITOR_TASK_INTERVAL ?? '1'
```

## SKIP_BUG_FINDING Usage

### Current Implementation

```typescript
// From src/utils/validation/execution-guard.ts (lines 67-69)
const isBugfixRecursion =
  process.env.SKIP_BUG_FINDING === 'true' &&
  sessionPath.toLowerCase().includes('bugfix');
```

### Key Points

- Uses **exact string match** (`=== 'true'`), case-sensitive
- Allows legitimate bug fix session recursion when combined with 'bugfix' in path
- Prevents illegitimate nested execution

## Default Values: Handling Undefined Environment Variables

### Nullish Coalescing Operator (??)

```typescript
// From CLI (line 281)
.default(process.env.HACKY_LOG_LEVEL ?? 'info')

// From CLI (line 300)
process.env.MONITOR_TASK_INTERVAL ?? '1'
```

## Boolean Parsing

The codebase consistently uses **exact string matching** for boolean environment variables:

### Standard Boolean Pattern

```typescript
// Throughout the codebase
process.env.SKIP_BUG_FINDING === 'true'; // Returns boolean
process.env.ENABLE_METRICS === 'true'; // Returns boolean
process.env.DEBUG === 'true'; // Returns boolean
```

### Why This Pattern

1. **Explicit and Clear**: No ambiguity about truthy/falsy values
2. **Type Safe**: Ensures actual boolean result, not truthy string
3. **Consistent**: Used everywhere in the codebase

## Best Practices Observed

### 1. Consistent Naming Convention

- All env vars use `UPPER_SNAKE_CASE`
- Prefixed with project name when needed (e.g., `HACKY_LOG_LEVEL`)

### 2. Type-Safe Access

```typescript
// Always check with exact string for booleans
if (process.env.SKIP_BUG_FINDING === 'true') {
  // Boolean logic
}
```

### 3. Validation Before Use

```typescript
// From config/environment.ts - validate required vars
if (!process.env.ANTHROPIC_API_KEY) {
  missing.push('ANTHROPIC_API_KEY');
}
```

### 4. Default Value Strategies

```typescript
// Option 1: Nullish coalescing (most common)
value =
  process.env.VAR_NAME ??
  'default'

    // Option 2: Explicit default in CLI definition
    .option('--opt <value>', 'Description', 'default');
```

## Implementation Guidance for Guard Context Logging

For the guard context logging, use the following patterns:

```typescript
// PRP_PIPELINE_RUNNING (set by P1.M3.T2.S4, may not be set yet)
const running = process.env.PRP_PIPELINE_RUNNING ?? 'not set';

// SKIP_BUG_FINDING (may not be set)
const skipBugFinding = process.env.SKIP_BUG_FINDING ?? 'false';

// Display raw string values in log, not parsed booleans
this.logger.debug(
  `[PRPPipeline] Guard Context: PLAN_DIR=${planDir}, SESSION_DIR=${sessionDir}, SKIP_BUG_FINDING=${skipBugFinding}, PRP_PIPELINE_RUNNING=${running}`
);
```

**Critical gotcha**: Display the raw string value, not a parsed boolean, for troubleshooting purposes. This allows operators to see exactly what value is set.
