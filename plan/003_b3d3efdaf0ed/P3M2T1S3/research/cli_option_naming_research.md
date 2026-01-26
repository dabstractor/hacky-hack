# CLI Option Naming Best Practices Research

## Summary

Research into industry best practices for CLI retry configuration option naming, based on popular tools and existing codebase patterns.

## Industry Examples

### AWS CLI

- `--max-attempts <int>` - Maximum number of retry attempts
- `--retry-mode <string>` - Retry strategy (legacy, standard, adaptive)
- Environment: `AWS_MAX_ATTEMPTS`, `AWS_RETRY_MODE`

### curl

- `--retry <num>` - Number of retries
- `--retry-delay <seconds>` - Delay between retries
- `--retry-max-time <seconds>` - Maximum total time for retries
- `--retry-all-errors` - Retry on all errors

### wget

- `-t, --tries=NUMBER` - Set number of retries
- `--waitretry=SECONDS` - Wait between retries
- `--retry-connrefused` - Retry on connection refused

### npm

- `--fetch-retries` - Number of retry attempts
- `--fetch-retry-maxtimeout` - Maximum timeout in ms
- `--fetch-retry-mintimeout` - Minimum timeout in ms

## Common Naming Patterns

| Purpose       | Most Common                             | Alternative                 |
| ------------- | --------------------------------------- | --------------------------- |
| Max retries   | `--retry`, `--retries`, `--max-retries` | `--tries`, `--max-attempts` |
| Retry delay   | `--retry-delay`, `--retry-interval`     | `--wait`, `--retry-backoff` |
| Max delay     | `--retry-max-delay`, `--max-delay`      | `--retry-max-time`          |
| Disable retry | `--no-retry`                            | `--disable-retry`           |

## Existing Codebase Patterns

From `src/cli/index.ts`:

```typescript
.option(
  '--parallelism <n>',
  'Max concurrent subtasks (1-10, default: 2)',
  '2'
)
.option(
  '--research-concurrency <n>',
  'Max concurrent research tasks (1-10, default: 3, env: RESEARCH_QUEUE_CONCURRENCY)',
  process.env.RESEARCH_QUEUE_CONCURRENCY ?? '3'
)
```

Pattern:

- `--<concept> <n>` for numeric options
- Show range in description: `(1-10, default: 2)`
- Show environment variable: `env: VAR_NAME`
- Use kebab-case for flag names

## Recommended Flag Names for Retry

Based on industry standards and existing codebase patterns:

### Primary Options

```typescript
--task - retry<n>; // Max retry attempts (0-10, default: 3)
--retry - delay<ms>; // Base delay before first retry (100-60000, default: 1000)
--retry - max - delay<ms>; // Maximum delay cap (1000-300000, default: 30000)
```

### Boolean Flags

```typescript
--no - retry; // Disable automatic retry
```

### Alternative Considered (rejected)

- `--max-retries` - Good but less consistent with existing `--task-*` pattern
- `--retry-backoff` - "backoff" is technical term, "delay" is clearer
- `--tries` - Not descriptive enough

### Why `--task-retry`?

1. **Consistent with existing**: `--parallelism` is about task execution, `--task-retry` is also about task execution
2. **Specific**: Indicates it's for task retry, not HTTP retry or other retry mechanisms
3. **Follows pattern**: Other task-related options use `--task-*` prefix conceptually
4. **Clear**: Users understand it's for retrying tasks

## Help Text Patterns

### Standard Pattern (from existing codebase)

```typescript
'Max concurrent subtasks (1-10, default: 2)';
```

### Recommended for Retry

```typescript
'Max retry attempts for transient errors (0-10, default: 3, env: HACKY_TASK_RETRY_MAX_ATTEMPTS)';
'Base delay before first retry in ms (100-60000, default: 1000)';
'Disable automatic retry for all tasks';
```

### Verbose Help (future enhancement)

```bash
--task-retry <number>
  Maximum number of retry attempts for transient task errors.

  Transient errors (retried):
    - Network failures (ECONNRESET, ECONNREFUSED, ETIMEDOUT)
    - Rate limits (HTTP 429)
    - Server errors (HTTP 500-504)
    - LLM timeouts and failures

  Permanent errors (not retried):
    - Validation errors
    - Client errors (HTTP 400-404)
    - Parse errors
    - Authentication failures

  Default: 3
  Range: 0-10 (0 = disable retry)
  Environment: HACKY_TASK_RETRY_MAX_ATTEMPTS
```

## Default Values Based on Research

| Config      | Value   | Rationale                         |
| ----------- | ------- | --------------------------------- |
| maxAttempts | 3       | Standard (AWS CLI: 4, npm: 2)     |
| baseDelay   | 1000ms  | Standard (curl: 1s, wget: 1s)     |
| maxDelay    | 30000ms | Standard (npm: 120s max, 10s min) |
| enabled     | true    | Default on for reliability        |

## Ranges

Based on industry analysis:

| Config      | Min  | Max    | Rationale                                    |
| ----------- | ---- | ------ | -------------------------------------------- |
| maxAttempts | 0    | 10     | 0 = disable, 10 prevents abuse               |
| baseDelay   | 100  | 60000  | 100ms minimum useful, 60s maximum reasonable |
| maxDelay    | 1000 | 300000 | 1s minimum, 5 minutes maximum                |

## Environment Variable Naming

Pattern: `HACKY_<CONCEPT>_<PARAM>`

```bash
HACKY_TASK_RETRY_MAX_ATTEMPTS=5
HACKY_TASK_RETRY_BASE_DELAY=2000
HACKY_TASK_RETRY_MAX_DELAY=60000
HACKY_TASK_RETRY_ENABLED=true
```

Alternative considered: `RETRY_*` prefix (rejected as too generic)

## URLs and References

### AWS CLI

- Retry configuration: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-retries.html

### curl

- Retry options: https://curl.se/docs/manpage.html (search for --retry)

### wget

- Manual page: https://www.gnu.org/software/wget/manual/wget.html (search for retry)

### npm

- Config documentation: https://docs.npmjs.com/cli/v10/using-npm/config (search for fetch-retry)

### Best Practices

- AWS Exponential Backoff: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
