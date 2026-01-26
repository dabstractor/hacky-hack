# Environment Variable Patterns Analysis

**Research Date:** 2025-01-25
**Task:** P3M3T1S1 - Make PRP cache TTL configurable
**Goal:** Understand environment variable patterns used in the codebase

---

## 1. All Existing Environment Variable Reads

### 1.1 Core Configuration Variables

| Variable | Purpose | File | Line |
|----------|---------|------|------|
| `ANTHROPIC_API_KEY` | API authentication key | `src/config/environment.ts` | ~ |
| `ANTHROPIC_AUTH_TOKEN` | Shell authentication token | `src/config/environment.ts` | ~ |
| `ANTHROPIC_BASE_URL` | API endpoint URL | `src/config/environment.ts` | ~ |

### 1.2 Model Override Variables

| Variable | Purpose | File | Line |
|----------|---------|------|------|
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Override for opus tier model | `src/config/environment.ts` | ~ |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Override for sonnet tier model | `src/config/environment.ts` | ~ |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Override for haiku tier model | `src/config/environment.ts` | ~ |

### 1.3 CLI Integration Variables

| Variable | Purpose | File | Lines |
|----------|---------|------|-------|
| `RESEARCH_QUEUE_CONCURRENCY` | Used by `--research-concurrency` | `src/cli/index.ts` | 230-234 |
| `HACKY_TASK_RETRY_MAX_ATTEMPTS` | Used by `--task-retry` | `src/cli/index.ts` | 235-239 |
| `HACKY_FLUSH_RETRIES` | Used by `--flush-retries` | `src/cli/index.ts` | 245-249 |

### 1.4 File I/O Retry Variables

| Variable | Purpose | File | Line |
|----------|---------|------|------|
| `HACKY_FILE_IO_RETRY_MAX_ATTEMPTS` | File I/O retry configuration | `src/utils/file-io.ts` | ~ |
| `HACKY_FILE_IO_RETRY_BASE_DELAY` | File I/O retry base delay | `src/utils/file-io.ts` | ~ |
| `HACKY_FILE_IO_RETRY_MAX_DELAY` | File I/O retry max delay | `src/utils/file-io.ts` | ~ |
| `HACKY_FILE_IO_RETRY_ENABLED` | File I/O retry enable flag | `src/utils/file-io.ts` | ~ |
| `HACKY_FILE_IO_PRESERVE_ON_FAILURE` | File I/O preserve on failure | `src/utils/file-io.ts` | ~ |

### 1.5 Other Configuration Variables

| Variable | Purpose | File | Line |
|----------|---------|------|------|
| `API_TIMEOUT_MS` | Request timeout in milliseconds | `src/config/api.ts` | ~ |
| `NO_COLOR` | Disable colored terminal output | `src/utils/logger.ts` | ~ |

---

## 2. Naming Convention Patterns

### 2.1 Primary Naming Schema

```
<ORGANIZATION>_<CONTEXT>_<SPECIFIC_FEATURE>
```

### 2.2 ANTHROPIC Namespace

**Prefix:** `ANTHROPIC_` - For API and model configuration

**Pattern:** `ANTHROPIC_{CATEGORY}_{ITEM}`

Examples:
- `ANTHROPIC_AUTH_TOKEN` - Authentication
- `ANTHROPIC_BASE_URL` - API configuration
- `ANTHROPIC_DEFAULT_{MODEL}_MODEL` - Model overrides

### 2.3 HACKY Namespace

**Prefix:** `HACKY_` - For application-specific configuration

**Pattern:** `HACKY_{SUBSYSTEM}_{FEATURE}_{SETTING}`

Examples:
- `HACKY_TASK_RETRY_MAX_ATTEMPTS` - Task retry configuration
- `HACKY_FLUSH_RETRIES` - Flush retry configuration
- `HACKY_FILE_IO_RETRY_*` - File I/O retry configuration

### 2.4 Unprefixed Variables

Some variables use no prefix for generic settings:
- `RESEARCH_QUEUE_CONCURRENCY` - Research concurrency settings
- `NO_COLOR` - Standard Unix convention for color control

---

## 3. CLI-Environment Integration Pattern

### 3.1 Precedence Order

1. **Command Line Arguments** - Highest priority
2. **Environment Variables** - Secondary priority
3. **Default Values** - Lowest priority

### 3.2 Implementation Pattern (from `src/cli/index.ts`)

```typescript
// Lines 230-234: --research-concurrency option
.option(
  '--research-concurrency <n>',
  'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
  process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'  // CLI arg > env var > default
)
```

### 3.3 Full Integration Example

```typescript
// Option definition
.option(
  '--task-retry <n>',
  'Max retry attempts for transient errors (0-10, default: 3, env: HACKY_TASK_RETRY_MAX_ATTEMPTS)',
  process.env.HACKY_TASK_RETRY_MAX_ATTEMPTS ?? '3'
)

// Validation
const taskRetryStr = String(options.taskRetry);
const taskRetry = parseInt(taskRetryStr, 10);

if (isNaN(taskRetry) || taskRetry < 0 || taskRetry > 10) {
  logger.error('--task-retry must be an integer between 0 and 10');
  process.exit(1);
}

// Convert to number
options.taskRetry = taskRetry;
```

---

## 4. Validation Patterns

### 4.1 Configuration Pattern (`src/config/environment.ts`)

```typescript
// Step 1: Configure environment variables
function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if API_KEY is not already set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not already provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}

// Step 2: Validate required variables
function validateEnvironment(): void {
  const missing: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!process.env.ANTHROPIC_BASE_URL) {
    missing.push('ANTHROPIC_BASE_URL');
  }

  if (missing.length > 0) {
    throw new EnvironmentValidationError(missing);
  }
}
```

### 4.2 CLI Validation Pattern

**Parse → Validate → Convert → Store**

```typescript
// Step 1: Parse string from CLI/env
const valueStr = String(options.optionName);

// Step 2: Parse to number
const value = parseInt(valueStr, 10);

// Step 3: Validate
if (isNaN(value) || value < min || value > max) {
  logger.error(`--option-name must be an integer between ${min} and ${max}`);
  process.exit(1);
}

// Step 4: Store validated number
options.optionName = value;
```

---

## 5. Type Safety Patterns

### 5.1 Configuration Interfaces

```typescript
// File: src/cli/index.ts (lines 39-117)
export interface CLIArgs {
  /** Max concurrent research tasks (1-10, default: 3) - may be string from commander */
  researchConcurrency: number | string;

  /** Max retry attempts (0-10, default: 3) - may be string from commander */
  taskRetry?: number | string;

  /** Max retries for batch write (0-10, default: 3) - may be string from commander */
  flushRetries?: number | string;
}

export interface ValidatedCLIArgs extends Omit<
  CLIArgs,
  'researchConcurrency' | 'taskRetry' | 'retryBackoff' | 'flushRetries'
> {
  /** Max concurrent research tasks (1-10, default: 3) - validated as number */
  researchConcurrency: number;

  /** Max retry attempts (0-10, default: 3) - validated as number or undefined */
  taskRetry?: number;

  /** Max retries for batch write failures (0-10, default: 3) - validated as number */
  flushRetries?: number;
}
```

### 5.2 Type Coercion

```typescript
// Commander returns strings for options, need to validate and convert
const flushRetriesStr = String(options.flushRetries);
const flushRetries = parseInt(flushRetriesStr, 10);

if (isNaN(flushRetries) || flushRetries < 0 || flushRetries > 10) {
  logger.error('--flush-retries must be an integer between 0 and 10');
  process.exit(1);
}

options.flushRetries = flushRetries;
```

---

## 6. Recommended Pattern for PRP Cache TTL

### 6.1 Environment Variable Name

Following the HACKY_ namespace pattern:

```
HACKY_PRP_CACHE_TTL
```

### 6.2 CLI Option Pattern

```typescript
// Option definition
.option(
  '--cache-ttl <duration>',
  'PRP cache time-to-live (e.g., 24h, 1d, 12h, env: HACKY_PRP_CACHE_TTL)',
  process.env.HACKY_PRP_CACHE_TTL ?? '24h'
)

// Parse using ms library
import ms from 'ms';

const cacheTtlStr = String(options.cacheTtl);
const cacheTtlMs = ms(cacheTtlStr);

if (cacheTtlMs === undefined) {
  logger.error(`Invalid duration format: "${cacheTtlStr}"`);
  logger.error('Expected formats: 30s, 5m, 1h, 1d, etc.');
  process.exit(1);
}

if (cacheTtlMs < 60000) {
  logger.error('--cache-ttl must be at least 1 minute');
  process.exit(1);
}

if (cacheTtlMs > ms('30d')) {
  logger.error('--cache-ttl cannot exceed 30 days');
  process.exit(1);
}

options.cacheTtl = cacheTtlMs;
```

### 6.3 Type Definition

```typescript
export interface CLIArgs {
  /** PRP cache TTL in milliseconds - may be string from commander */
  cacheTtl?: number | string;
}

export interface ValidatedCLIArgs extends CLIArgs {
  /** PRP cache TTL in milliseconds - validated as number */
  cacheTtl: number;
}
```

---

## 7. File Locations Reference

| Component | File Path | Lines |
|-----------|-----------|-------|
| CLI Options | `src/cli/index.ts` | 39-117 (types), 230-249 (options) |
| Environment Config | `src/config/environment.ts` | ~ |
| File I/O Config | `src/utils/file-io.ts` | ~ |
| API Config | `src/config/api.ts` | ~ |
| Logger Config | `src/utils/logger.ts` | ~ |

---

## 8. Key Takeaways

1. **Use `HACKY_` prefix** for application-specific configuration
2. **Follow precedence**: CLI args > env vars > defaults
3. **Always validate**: Parse → Validate → Convert → Store
4. **Use TypeScript interfaces**: Separate string input from validated number output
5. **Provide clear error messages**: Include expected formats and ranges
6. **Document env vars in help text**: Show "(env: VAR_NAME)" in option description
7. **Use ms library for durations**: Parse "24h", "1d" formats to milliseconds

---

**Generated for:** P3M3T1S1 - Make PRP cache TTL configurable
**Status:** ✅ Research complete
