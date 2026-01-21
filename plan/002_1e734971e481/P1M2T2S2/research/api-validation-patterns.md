# API Validation Script Patterns - Research Findings

**Research Date**: 2026-01-15
**Purpose**: Support PRP creation for P1.M2.T2.S2 "Add validation script API checks"

---

## Table of Contents

1. [Node.js CLI Script Best Practices](#nodejs-cli-script-best-practices)
2. [Exit Code Conventions](#exit-code-conventions)
3. [Colored Console Output Standards](#colored-console-output-standards)
4. [API Safety Check Patterns](#api-safety-check-patterns)
5. [TypeScript/TSX Script Patterns](#typescripttsx-script-patterns)
6. [Fetch with Timeout Implementations](#fetch-with-timeout-implementations)
7. [Type Guards for API Response Validation](#type-guards-for-api-response-validation)

---

## Node.js CLI Script Best Practices

### Script Entry Points

````typescript
#!/usr/bin/env tsx
/**
 * Script description
 *
 * @example
 * ```bash
 * npx tsx path/to/script.ts
 * ```
 */
````

**Key Points**:

- Use shebang `#!/usr/bin/env tsx` for direct execution
- Add JSDoc comments with usage examples
- Define clear exit codes for different scenarios

### Error Handling

```typescript
// Process event handlers for clean shutdown
process.on('unhandledRejection', reason => {
  console.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, exiting...');
  process.exit(130); // 128 + 2 (SIGINT)
});
```

**References**:

- [Node.js Process Documentation](https://nodejs.org/api/process.html)
- [Exit Codes in Node.js](https://nodejs.dev/en/learn/#exit-codes-in-nodejs)

---

## Exit Code Conventions

### Standard Exit Codes

| Exit Code | Meaning                  | Usage                           |
| --------- | ------------------------ | ------------------------------- |
| 0         | Success                  | All validations passed          |
| 1         | General Error            | Validation failures, API errors |
| 2         | Misuse of Shell Commands | Invalid arguments               |
| 127       | Command Not Found        | Missing dependencies            |
| 130       | SIGINT (Ctrl+C)          | User interrupted                |
| >128      | Signal Exit              | 128 + signal number             |

### Implementation Pattern

```typescript
// Success
process.exit(0);

// Failure
process.exit(1);

// SIGINT
process.exit(130);
```

**References**:

- [Node.js Exit Codes](https://nodejs.dev/en/learn/#exit-codes-in-nodejs)
- [Standard Exit Codes](https://www.shellhacks.com/linux-exit-codes/)

---

## Colored Console Output Standards

### ANSI Color Codes

```typescript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

// Usage
console.log(`${colors.red}Error message${colors.reset}`);
```

### Status Indicators

```typescript
// Success indicator
console.log(`${colors.green}✓${colors.reset} Success message`);

// Error indicator
console.log(`${colors.red}✗${colors.reset} Error message`);

// Warning indicator
console.log(`${colors.yellow}⚠${colors.reset} Warning message`);

// Info indicator
console.log(`${colors.blue}ℹ${colors.reset} Info message`);
```

**References**:

- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [Node.js Console Colors](https://nodejs.dev/en/learn/#how-to-read-environment-variables-from-nodejs)

---

## API Safety Check Patterns

### Endpoint Validation

```typescript
const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

const configuredBaseUrl = process.env.ANTHROPIC_BASE_URL || '';

// Block production API
if (configuredBaseUrl.includes(ANTHROPIC_ENDPOINT)) {
  console.error('CRITICAL: Anthropic API detected!');
  console.error(`Expected: ${ZAI_ENDPOINT}`);
  process.exit(1);
}

// Warn for non-standard endpoints
if (
  configuredBaseUrl &&
  configuredBaseUrl !== ZAI_ENDPOINT &&
  !configuredBaseUrl.includes('localhost') &&
  !configuredBaseUrl.includes('127.0.0.1') &&
  !configuredBaseUrl.includes('mock') &&
  !configuredBaseUrl.includes('test')
) {
  console.warn('WARNING: Non-z.ai endpoint detected');
}
```

### Key Principles

1. **Fail Fast**: Check configuration before any API calls
2. **Clear Messages**: Explain what's wrong and how to fix it
3. **Exceptions**: Allow localhost, mock, and test endpoints
4. **Exit Codes**: Use proper exit codes for automation

---

## TypeScript/TSX Script Patterns

### Top-Level Await

```typescript
#!/usr/bin/env tsx

async function main(): Promise<void> {
  // Script logic here
}

// Use top-level await (Node.js 18+)
await main();
```

### Environment Configuration

```typescript
import {
  configureEnvironment,
  validateEnvironment,
} from './config/environment.js';

// Configure before using environment variables
configureEnvironment();

// Validate required variables
try {
  validateEnvironment();
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    console.error(`Missing: ${error.missing.join(', ')}`);
    process.exit(1);
  }
}
```

**Requirements**:

- Node.js 18+ for top-level await
- Use `.js` extension in imports for ESM
- Handle environment errors gracefully

---

## Fetch with Timeout Implementations

### AbortController Pattern

```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Usage
const response = await fetchWithTimeout(
  'https://api.example.com',
  { method: 'GET' },
  10000 // 10 second timeout
);
```

**Key Points**:

- Always clear timeout in success and error cases
- Check for `AbortError` to detect timeouts
- Set appropriate timeouts for different operations

**References**:

- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [AbortController Documentation](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

## Type Guards for API Response Validation

### Basic Type Guard

```typescript
interface MessageResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

function isValidMessageResponse(data: unknown): data is MessageResponse {
  if (typeof data !== 'object' || data === null) return false;
  const response = data as Record<string, unknown>;
  return (
    typeof response.id === 'string' &&
    typeof response.type === 'string' &&
    response.role === 'assistant' &&
    Array.isArray(response.content) &&
    typeof response.model === 'string' &&
    typeof response.stop_reason === 'string' &&
    typeof response.usage === 'object' &&
    response.usage !== null
  );
}
```

### Usage Pattern

```typescript
const response = await fetch(url);
const data: unknown = await response.json();

if (!isValidMessageResponse(data)) {
  throw new Error('Invalid response structure');
}

// TypeScript now knows `data` is MessageResponse
console.log(data.id); // Type-safe access
```

**Benefits**:

- Runtime type checking
- Compile-time type narrowing
- Clear error messages for invalid data

---

## Summary

This research confirms that the existing implementation in `/src/scripts/validate-api.ts` follows Node.js CLI script best practices:

1. ✅ Proper shebang and JSDoc comments
2. ✅ Comprehensive process event handlers
3. ✅ Correct exit codes (0, 1, 130)
4. ✅ Colored console output with ANSI codes
5. ✅ API endpoint safeguard with clear error messages
6. ✅ Type guards for response validation
7. ✅ Fetch with timeout using AbortController

**Missing Feature**:

- ❌ Warning for non-z.ai endpoints (needs implementation)

The pattern for the missing warning is well-established in `tests/setup.ts` (lines 82-104) and should be added to maintain consistency across the codebase.
