# Environment Variable Usage and Validation Research

**Research Date:** 2026-01-26
**Research Task:** P1M3T2S1 - Environment variable usage and validation patterns
**Goal:** Document all environment variable usage, validation patterns, and type definitions

---

## 1. All Environment Variable Uses Found

### 1.1 Core Configuration Variables

| Variable               | Purpose                    | File                        | Pattern  | Validation          |
| ---------------------- | -------------------------- | --------------------------- | -------- | ------------------- |
| `ANTHROPIC_API_KEY`    | API authentication key     | `src/config/environment.ts` | Required | ✅ Mandatory        |
| `ANTHROPIC_AUTH_TOKEN` | Shell authentication token | `src/config/environment.ts` | Optional | Mapped to API_KEY   |
| `ANTHROPIC_BASE_URL`   | API endpoint URL           | `src/config/environment.ts` | Required | ✅ Default provided |

### 1.2 Pipeline Guard Variables (CRITICAL FOR P1M3T2S1)

| Variable               | Purpose                     | File                            | Pattern | Validation            |
| ---------------------- | --------------------------- | ------------------------------- | ------- | --------------------- |
| `PRP_PIPELINE_RUNNING` | Pipeline execution guard    | `src/workflows/prp-pipeline.ts` | Runtime | ✅ PID string         |
| `SKIP_BUG_FINDING`     | Bug fix recursion exception | Multiple files                  | Runtime | ✅ Exact 'true' match |
| `PLAN_DIR`             | Plan directory path         | Multiple files                  | Runtime | Bugfix path check     |

---

## 2. How PRP_PIPELINE_RUNNING is Used

### 2.1 Setting the Guard

**File:** `src/workflows/prp-pipeline.ts`
**Lines:** 1706-1707

```typescript
// Set guard after validation passes (validateNestedExecution called in S3)
process.env.PRP_PIPELINE_RUNNING = currentPid;
this.logger.debug(`[PRPPipeline] Set PRP_PIPELINE_RUNNING=${currentPid}`);
```

**Purpose:** Marks that a pipeline is running to prevent nested execution.

### 2.2 Clearing the Guard

**File:** `src/workflows/prp-pipeline.ts`
**Lines:** 1816-1818

```typescript
// Clear guard if we own it (before cleanup)
if (process.env.PRP_PIPELINE_RUNNING === currentPid) {
  delete process.env.PRP_PIPELINE_RUNNING;
  this.logger.debug('[PRPPipeline] Cleared PRP_PIPELINE_RUNNING');
}
```

**Purpose:** Removes the guard when pipeline completes.

---

## 3. How SKIP_BUG_FINDING is Used

### 3.1 Purpose

Used to allow recursion during bug fixing scenarios when the pipeline is already running.

### 3.2 Validation Pattern (CRITICAL)

**File:** Tests and PRD specification

```typescript
// Case-sensitive exact string match
vi.stubEnv('SKIP_BUG_FINDING', 'true'); // ✅ Valid
vi.stubEnv('SKIP_BUG_FINDING', 'TRUE'); // ❌ Invalid
vi.stubEnv('SKIP_BUG_FINDING', '1'); // ❌ Invalid
vi.stubEnv('SKIP_BUG_FINDING', 'yes'); // ❌ Invalid
```

### 3.3 Path Validation

The variable must be used together with a path containing 'bugfix':

```typescript
// Valid examples:
'/path/to/bugfix/session';
'/path/to/BugFix/session';
'/path/to/BUGFIX/session';

// Invalid:
'/path/to/plan/003_b3d3efdaf0ed'; // No bugfix
```

---

## 4. Environment Variable Validation Patterns

### 4.1 Undefined Check Pattern

```typescript
if (!process.env.VARIABLE_NAME) {
  // Handle missing variable
}
```

### 4.2 String Comparison Pattern (EXACT MATCH)

```typescript
// CRITICAL: Use exact string match for SKIP_BUG_FINDING
if (process.env.SKIP_BUG_FINDING === 'true') {
  // Handle bug fix mode
}
```

### 4.3 Path Contains Pattern (CASE-INSENSITIVE)

```typescript
// Check if path contains 'bugfix' (case-insensitive check)
if (sessionPath.toLowerCase().includes('bugfix')) {
  // Handle bug fix session
}
```

### 4.4 Fallback with Default Pattern

```typescript
const value = process.env.VARIABLE_NAME ?? 'default_value';
```

---

## 5. Environment Variable Type Definitions

### 5.1 Core Configuration Types

**File:** `src/config/types.ts`

```typescript
export interface EnvironmentConfig {
  /** API authentication key (mapped from ANTHROPIC_AUTH_TOKEN) */
  readonly apiKey: string;
  /** Base URL for z.ai API endpoint */
  readonly baseURL: string;
  /** Model name for opus tier */
  readonly opusModel: string;
  /** Model name for sonnet tier */
  readonly sonnetModel: string;
  /** Model name for haiku tier */
  readonly haikuModel: string;
}

export type ModelTier = 'opus' | 'sonnet' | 'haiku';
```

### 5.2 Error Types

**File:** `src/config/types.ts`

```typescript
export class EnvironmentValidationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
  }
}
```

---

## 6. Best Practices Observed

### 6.1 Validation Approach

1. **Precedence order**: CLI args > env vars > defaults
2. **Validation steps**: Parse → Validate → Convert → Store
3. **Clear error messages**: Include expected formats and ranges
4. **Type safety**: Separate string input from validated output

### 6.2 Error Handling

1. **Throw specific errors** with detailed messages
2. **Collect all missing variables** before failing
3. **Use custom error classes** for better debugging

### 6.3 Naming Conventions

1. **Use prefixes** for organization:
   - `ANTHROPIC_` for API-related variables
   - `HACKY_` for application-specific variables
   - No prefix for generic settings

2. **Follow hierarchy**: `{ORGANIZATION}_{CONTEXT}_{SPECIFIC_FEATURE}`

---

## 7. Key Findings for P1M3T2S1

1. **PRP_PIPELINE_RUNNING** is set to current PID and cleared on completion
2. **SKIP_BUG_FINDING** allows bug fix recursion when:
   - Environment variable equals exactly `'true'` (case-sensitive)
   - Path contains `'bugfix'` (case-insensitive check)
3. **Multiple validation patterns** exist across the codebase
4. **Type safety** is maintained through interface definitions
5. **Environment variables** are used consistently with clear naming conventions
6. **Error handling** is comprehensive with custom error classes

---

## 8. Implementation Pattern for validateNestedExecution

```typescript
export function validateNestedExecution(sessionPath: string): void {
  const existingPid = process.env.PRP_PIPELINE_RUNNING;

  // If no pipeline is running, allow execution
  if (!existingPid) {
    return;
  }

  // Check if this is legitimate bug fix recursion
  const isBugfixRecursion =
    process.env.SKIP_BUG_FINDING === 'true' && // EXACT string match
    sessionPath.toLowerCase().includes('bugfix'); // Case-insensitive check

  if (isBugfixRecursion) {
    // Legitimate recursion - allow it
    return;
  }

  // Illegitimate nested execution - throw error
  throw new NestedExecutionError(
    `Nested PRP Pipeline execution detected. Only bug fix sessions can recurse. PID: ${existingPid}`,
    {
      existingPid,
      currentPid: process.pid.toString(),
      sessionPath,
    }
  );
}
```

---

## Summary

The environment variable patterns in this codebase follow these principles:

- **Exact string matching** for boolean-like variables (`SKIP_BUG_FINDING === 'true'`)
- **Case-insensitive path checks** for substring matching
- **Clear error messages** with context information
- **Custom error classes** extending base error types
- **Type-safe interfaces** for configuration

The `validateNestedExecution` function should follow these exact patterns.
