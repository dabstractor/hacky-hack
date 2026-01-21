# TypeScript Testing Best Practices: Global Hooks and Environment Validation

**Research Date:** 2026-01-15
**Task:** P1.M2.T2.S1 - Research TypeScript testing best practices
**Author:** Claude Code Research Agent

---

## Executive Summary

This document compiles best practices for TypeScript testing with Vitest, specifically focusing on global hooks, environment validation, error handling patterns, and API endpoint validation. Research combines analysis of the existing codebase patterns at `/home/dustin/projects/hacky-hack` with established testing community standards.

**Key Findings:**

1. **Vitest global hooks** provide automatic cleanup and validation when configured in `setupFiles`
2. **Environment validation** should fail fast with clear, actionable error messages
3. **Error patterns** in global hooks should distinguish between critical failures and warnings
4. **Console output** in tests should be strategic and developer-friendly
5. **API endpoint validation** prevents catastrophic misconfiguration (e.g., using production APIs in tests)

---

## Table of Contents

1. [Vitest Global Hooks Best Practices](#1-vitest-global-hooks-best-practices)
2. [Environment Variable Validation in Test Setup](#2-environment-variable-validation-in-test-setup)
3. [Error Throwing Patterns in Global Hooks](#3-error-throwing-patterns-in-global-hooks)
4. [Console Output Best Practices](#4-console-output-best-practices)
5. [Clear Error Message Patterns](#5-clear-error-message-patterns)
6. [API Endpoint Validation Patterns](#6-api-endpoint-validation-patterns)
7. [References and Resources](#7-references-and-resources)

---

## 1. Vitest Global Hooks Best Practices

### 1.1 Configuration Pattern

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    setupFiles: ['./tests/setup.ts'], // Global setup file
    // ... rest of config
  },
});
```

**Best Practices:**

- Use `setupFiles` for global hooks that run before all tests
- Enable `globals: true` for cleaner test syntax (optional but recommended)
- Separate integration and unit test directories for different setup needs

### 1.2 Global Setup File Structure

**File:** `tests/setup.ts`

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// IMMEDIATE VALIDATION (runs once at setup file load)
// =============================================================================

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  if (baseUrl.includes('https://api.anthropic.com')) {
    throw new Error(/* detailed error message */);
  }
}

// Run validation immediately
validateApiEndpoint();

// =============================================================================
// BEFORE EACH HOOK
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  validateApiEndpoint(); // Re-validate to catch env changes
});

// =============================================================================
// AFTER EACH HOOK
// =============================================================================

afterEach(() => {
  vi.unstubAllEnvs();
  if (typeof global.gc === 'function') {
    global.gc();
  }
});
```

**Best Practices:**

- **Immediate validation:** Run critical checks at module load time
- **beforeEach:** Clear mocks, re-validate critical state
- **afterEach:** Restore environment variables, force GC
- **Comment sections clearly:** Use visual separators for readability

### 1.3 Hook Responsibilities

| Hook            | Responsibilities                    | Example Operations                       |
| --------------- | ----------------------------------- | ---------------------------------------- |
| **Module load** | One-time validation, dotenv loading | API endpoint checks, loading .env        |
| **beforeAll**   | Expensive one-time setup            | Database connections, service startups   |
| **beforeEach**  | Test isolation, state reset         | `vi.clearAllMocks()`, env validation     |
| **afterEach**   | Cleanup, state restoration          | `vi.unstubAllEnvs()`, GC, timer clearing |
| **afterAll**    | Expensive teardown                  | Database disconnection, service shutdown |

### 1.4 Hook Ordering and Timing

```
1. Load setup.ts module
   ├─ Immediate validation runs
   └─ Static initialization

2. For each test file:
   ├─ beforeAll (if defined)
   ├─ beforeEach (for each test)
   ├─ test execution
   ├─ afterEach (for each test)
   └─ afterAll (if defined)
```

**Key Insight:** Validation at module load time catches configuration issues **before any tests run**, saving time and providing clearer feedback.

### 1.5 Setup Verification Tests

**Pattern:** Canary tests to verify setup file execution

```typescript
describe('Setup File Execution Verification', () => {
  const canaryMock = vi.fn();

  it('canary test 1 - sets state', () => {
    canaryMock('chirp');
    expect(canaryMock).toHaveBeenCalledTimes(1);
  });

  it('canary test 2 - verifies cleanup', () => {
    // FAILS if beforeEach doesn't call vi.clearAllMocks()
    expect(canaryMock).toHaveBeenCalledTimes(0);
  });
});
```

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/setup-verification.test.ts`

---

## 2. Environment Variable Validation in Test Setup

### 2.1 Validation Pattern

**Three-tier approach:**

1. **Configuration:** Map and set defaults
2. **Validation:** Verify required variables exist
3. **Runtime Checks:** Re-validate during test execution

### 2.2 Configuration Module Pattern

**File:** `src/config/environment.ts`

```typescript
export function configureEnvironment(): void {
  // Map ANTHROPIC_AUTH_TOKEN to ANTHROPIC_API_KEY if not set
  if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
  }

  // Set default BASE_URL if not provided
  if (!process.env.ANTHROPIC_BASE_URL) {
    process.env.ANTHROPIC_BASE_URL = DEFAULT_BASE_URL;
  }
}
```

**Best Practices:**

- Use non-destructive defaults (don't overwrite existing values)
- Document why mapping is necessary
- Make configuration **idempotent** (safe to call multiple times)

### 2.3 Validation Function Pattern

```typescript
export class EnvironmentValidationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnvironment(): void {
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

**Best Practices:**

- Collect **all** missing variables before throwing
- Use custom error classes for programmatic handling
- Include variable names in error for easy debugging

### 2.4 Test Pattern for Environment Validation

```typescript
describe('validateEnvironment', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should pass when all required variables are set', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should throw with details when variables are missing', () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    try {
      validateEnvironment();
      expect(true).toBe(false); // Should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(EnvironmentValidationError);
      if (e instanceof EnvironmentValidationError) {
        expect(e.missing).toContain('ANTHROPIC_API_KEY');
      }
    }
  });

  it('should be idempotent - calling multiple times produces same result', () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-456');

    configureEnvironment();
    const firstResult = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
    };

    configureEnvironment();
    const secondResult = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
    };

    expect(firstResult).toEqual(secondResult);
  });
});
```

**Location:** `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts`

### 2.5 Environment Variable Cleanup Pattern

```typescript
afterEach(() => {
  // CRITICAL: Restore all environment variable stubs
  vi.unstubAllEnvs();
});
```

**Why this matters:**

- Prevents test pollution
- Ensures tests run in isolation
- Catches implicit environment dependencies

---

## 3. Error Throwing Patterns in Global Hooks

### 3.1 Critical vs. Non-Critical Errors

**Critical Errors (throw immediately):**

- Using production API endpoints in tests
- Missing required authentication credentials
- Invalid configuration that will cause all tests to fail

**Non-Critical Errors (log warnings):**

- Using non-standard but valid endpoints
- Optional features not configured
- Development-only features in production mode

### 3.2 Critical Error Pattern

```typescript
function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // CRITICAL: Block Anthropic's official API
  if (baseUrl.includes('https://api.anthropic.com')) {
    throw new Error(
      [
        '\n========================================',
        'CRITICAL: Tests are configured to use Anthropic API!',
        '========================================',
        `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
        '',
        'All tests MUST use z.ai API endpoint, never Anthropic official API.',
        `Expected: ${ZAI_ENDPOINT}`,
        '',
        'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
        `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
        '========================================\n',
      ].join('\n')
    );
  }
}
```

**Best Practices:**

- Use **visual separators** (borders of equals signs)
- Include **current value** for debugging
- Include **expected value** for guidance
- Provide **exact fix command** when possible
- Add **blank lines** for readability

### 3.3 Warning Pattern

```typescript
function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // NON-CRITICAL: Warn about non-z.ai endpoints
  if (
    baseUrl &&
    baseUrl !== ZAI_ENDPOINT &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1') &&
    !baseUrl.includes('mock') &&
    !baseUrl.includes('test')
  ) {
    console.warn(
      [
        '\n========================================',
        'WARNING: Non-z.ai API endpoint detected',
        '========================================',
        `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
        '',
        `Recommended: ${ZAI_ENDPOINT}`,
        '',
        'Ensure this endpoint is intended for testing.',
        '========================================\n',
      ].join('\n')
    );
  }
}
```

**Best Practices:**

- Use `console.warn()` not `throw`
- Whititelist known-safe patterns (localhost, mock, test)
- Still provide visual formatting for consistency
- Make it clear this is a **warning**, not an error

### 3.4 Error Class Hierarchy

```typescript
// Base error class
export class EnvironmentValidationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
  }
}

// Specific error for API endpoint issues
export class ApiEndpointError extends Error {
  constructor(
    public readonly currentEndpoint: string,
    public readonly expectedEndpoint: string
  ) {
    super(
      `Invalid API endpoint: ${currentEndpoint} (expected: ${expectedEndpoint})`
    );
    this.name = 'ApiEndpointError';
  }
}
```

**Benefits:**

- Programmatic error handling
- Type-safe error checking with `instanceof`
- Structured error data for debugging/logging

### 3.5 Try-Catch Pattern in Tests

```typescript
it('should include missing variable name in error', () => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

  try {
    validateEnvironment();
    // If we get here, test should fail
    expect(true).toBe(false);
  } catch (e) {
    expect(e).toBeInstanceOf(EnvironmentValidationError);
    if (e instanceof EnvironmentValidationError) {
      expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
    }
  }
});
```

**Alternative (cleaner) pattern:**

```typescript
it('should include missing variable name in error', () => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

  expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

  try {
    validateEnvironment();
  } catch (e) {
    if (e instanceof EnvironmentValidationError) {
      expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
    }
  }
});
```

---

## 4. Console Output Best Practices

### 4.1 Console Method Selection Guide

| Method            | Use Case                                  | Example                                      |
| ----------------- | ----------------------------------------- | -------------------------------------------- |
| `console.debug()` | Development-only information              | ".env file loaded successfully"              |
| `console.log()`   | General informational output              | Test summaries, validation results           |
| `console.warn()`  | Non-critical issues                       | Non-standard endpoints, optional features    |
| `console.error()` | Critical errors (usually before throwing) | Validation failures that will halt execution |

### 4.2 Output Formatting Pattern

**Use visual hierarchy and consistent formatting:**

```typescript
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, 'green');
}

function fail(message: string) {
  log(`✗ ${message}`, 'red');
}

function warn(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message: string) {
  log(`  ${message}`, 'blue');
}
```

**Benefits:**

- Consistent visual language
- Color-coded severity
- Easy to scan output
- Professional appearance

### 4.3 Conditional Console Output

```typescript
function validateGcAvailability() {
  if (typeof global.gc === 'function') {
    console.debug('Garbage collection available (--expose-gc flag is set)');
  } else {
    console.warn(
      '--expose-gc flag not enabled. Memory cleanup will be limited.'
    );
  }
}
```

**Best Practices:**

- Provide context for why output might be missing
- Use appropriate log level (debug vs warn)
- Include actionable information when possible

### 4.4 Suppressing Console Output in Tests

When testing code that produces console output:

```typescript
it('should log warning for missing optional config', () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  // ... test code that triggers warning ...

  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining('optional config')
  );

  spy.mockRestore();
});
```

**Or using beforeEach/afterEach:**

```typescript
describe('with console warnings', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(console.warn).mockRestore();
  });

  it('should warn about deprecated usage', () => {
    // ... test ...
    expect(console.warn).toHaveBeenCalled();
  });
});
```

### 4.5 Structured Output for Validation Scripts

**File:** `tests/validation/zai-api-test.ts`

```typescript
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

class ZAiValidator {
  private results: TestResult[] = [];

  async testEnvironmentConfig(): Promise<TestResult> {
    const startTime = Date.now();
    log('1. Testing Environment Configuration', 'blue');
    log('----------------------------------------', 'gray');

    try {
      // ... validation logic ...

      return {
        name: 'Environment Configuration',
        passed: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'Environment Configuration',
        passed: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  private printSummary(overallStart: number): void {
    log('\n========================================', 'blue');
    log('Validation Summary', 'blue');
    log('========================================', 'blue');
    log('', 'reset');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    this.results.forEach(result => {
      if (result.passed) {
        success(`${result.name} (${result.duration}ms)`);
      } else {
        fail(`${result.name} (${result.duration}ms)`);
        if (result.error) {
          info(`  Error: ${result.error}`);
        }
      }
    });

    log('', 'reset');
    log(`Total Tests: ${totalTests}`, 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'gray');
    log(`Duration: ${Date.now() - overallStart}ms`, 'blue');
  }
}
```

---

## 5. Clear Error Message Patterns

### 5.1 Anatomy of a Perfect Error Message

A great error message contains:

1. **What went wrong** - Clear problem statement
2. **Current value** - What was actually found
3. **Expected value** - What should have been there
4. **Why it matters** - Context/impact
5. **How to fix it** - Exact command or configuration change
6. **Visual formatting** - Easy to scan in terminal output

### 5.2 Error Message Template

```typescript
function formatErrorMessage(config: {
  title: string;
  currentValue: string;
  expectedValue: string;
  fixCommand: string;
  context: string[];
}): string {
  return [
    '\n========================================',
    config.title,
    '========================================',
    `Current: ${config.currentValue}`,
    '',
    `Expected: ${config.expectedValue}`,
    '',
    ...config.context,
    '',
    'Fix:',
    `  ${config.fixCommand}`,
    '========================================\n',
  ].join('\n');
}
```

### 5.3 Examples from the Codebase

**Critical API Endpoint Error:**

```
========================================
CRITICAL: Tests are configured to use Anthropic API!
========================================
Current ANTHROPIC_BASE_URL: https://api.anthropic.com

All tests MUST use z.ai API endpoint, never Anthropic official API.
Expected: https://api.z.ai/api/anthropic

Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:
  export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
========================================
```

**Environment Validation Error:**

```typescript
class EnvironmentValidationError extends Error {
  constructor(public readonly missing: string[]) {
    const message = [
      '\n========================================',
      'Environment Validation Failed',
      '========================================',
      'Missing required environment variables:',
      ...missing.map(v => `  - ${v}`),
      '',
      'Please set these variables before running tests.',
      'See: .env.example or project documentation',
      '========================================\n',
    ].join('\n');

    super(message);
    this.name = 'EnvironmentValidationError';
  }
}
```

### 5.4 Error Message Anti-Patterns

**BAD - Too generic:**

```typescript
// ❌ Don't do this
throw new Error('Configuration error');
```

**BAD - Missing actionability:**

```typescript
// ❌ Don't do this
throw new Error(`ANTHROPIC_BASE_URL is wrong: ${baseUrl}`);
```

**BAD - Ugly formatting:**

```typescript
// ❌ Don't do this
throw new Error(
  'CRITICAL: WRONG API ENDPOINT: ' + baseUrl + ' SHOULD BE: ' + expected
);
```

**GOOD - Clear and actionable:**

```typescript
// ✅ Do this
throw new Error(
  [
    '\n========================================',
    'CRITICAL: Tests are configured to use Anthropic API!',
    '========================================',
    `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
    '',
    'All tests MUST use z.ai API endpoint, never Anthropic official API.',
    `Expected: ${ZAI_ENDPOINT}`,
    '',
    'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
    `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
    '========================================\n',
  ].join('\n')
);
```

### 5.5 Multi-Language Error Messages

For international projects:

```typescript
interface ErrorConfig {
  title: string;
  currentValue: string;
  expectedValue: string;
  fixCommand: string;
  locale?: 'en' | 'es' | 'zh';
}

const errorTemplates = {
  en: {
    current: 'Current',
    expected: 'Expected',
    fix: 'Fix',
  },
  es: {
    current: 'Actual',
    expected: 'Esperado',
    fix: 'Solución',
  },
  // ... other languages
};
```

---

## 6. API Endpoint Validation Patterns

### 6.1 Why API Endpoint Validation Matters

**Catastrophic scenarios prevented:**

- Accidental calls to production APIs during testing
- Unexpected API charges from test runs
- Rate limiting on production endpoints
- Data pollution in production systems
- Security exposures (test credentials to production)

### 6.2 Validation Strategy

**Multi-layered approach:**

1. **Immediate validation** at test setup load time
2. **Re-validation** in `beforeEach` hook
3. **Whitelist validation** for safe endpoints
4. **Blacklist validation** for dangerous endpoints

### 6.3 Complete Implementation Pattern

**File:** `tests/setup.ts`

```typescript
import { beforeEach, vi } from 'vitest';

// =============================================================================
// API ENDPOINT SAFEGUARDS
// =============================================================================

const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

/**
 * Validate that tests are configured to use z.ai, NOT Anthropic's API
 *
 * Blocked endpoints (Anthropic):
 * - https://api.anthropic.com
 * - https://api.anthropic.com/v1
 *
 * Allowed endpoints (z.ai):
 * - https://api.z.ai/api/anthropic
 *
 * Local/test endpoints (allowed):
 * - localhost
 * - 127.0.0.1
 * - mock
 * - test
 */
function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';

  // BLOCK: Anthropic's official API
  if (
    baseUrl.includes(ANTHROPIC_ENDPOINT) ||
    baseUrl === 'https://api.anthropic.com'
  ) {
    throw new Error(
      [
        '\n========================================',
        'CRITICAL: Tests are configured to use Anthropic API!',
        '========================================',
        `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
        '',
        'All tests MUST use z.ai API endpoint, never Anthropic official API.',
        `Expected: ${ZAI_ENDPOINT}`,
        '',
        'Fix: Set ANTHROPIC_BASE_URL to z.ai endpoint:',
        `  export ANTHROPIC_BASE_URL="${ZAI_ENDPOINT}"`,
        '========================================\n',
      ].join('\n')
    );
  }

  // WARN: Non-z.ai endpoint (unless it's a mock/test endpoint)
  if (
    baseUrl &&
    baseUrl !== ZAI_ENDPOINT &&
    !baseUrl.includes('localhost') &&
    !baseUrl.includes('127.0.0.1') &&
    !baseUrl.includes('mock') &&
    !baseUrl.includes('test')
  ) {
    console.warn(
      [
        '\n========================================',
        'WARNING: Non-z.ai API endpoint detected',
        '========================================',
        `Current ANTHROPIC_BASE_URL: ${baseUrl}`,
        '',
        `Recommended: ${ZAI_ENDPOINT}`,
        '',
        'Ensure this endpoint is intended for testing.',
        '========================================\n',
      ].join('\n')
    );
  }
}

// Run validation immediately when test setup loads
validateApiEndpoint();

// =============================================================================
// GLOBAL TEST HOOKS
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();

  // Re-validate before each test to catch environment changes
  validateApiEndpoint();
});
```

### 6.4 Testing the Validation

```typescript
describe('API endpoint validation', () => {
  it('should throw for Anthropic API endpoint', () => {
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com');

    expect(() => validateApiEndpoint()).toThrow();
    expect(() => validateApiEndpoint()).toThrow(/Anthropic API/);
  });

  it('should warn for unexpected non-local endpoints', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://some-other-api.com');

    validateApiEndpoint();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Non-z.ai API endpoint')
    );

    spy.mockRestore();
  });

  it('should allow z.ai endpoint', () => {
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic');

    expect(() => validateApiEndpoint()).not.toThrow();
  });

  it('should allow localhost endpoints', () => {
    vi.stubEnv('ANTHROPIC_BASE_URL', 'http://localhost:3000');

    expect(() => validateApiEndpoint()).not.toThrow();
  });
});
```

### 6.5 Integration with CI/CD

**GitHub Actions example:**

```yaml
- name: Run tests
  env:
    ANTHROPIC_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
    ANTHROPIC_BASE_URL: https://api.z.ai/api/anthropic
  run: npm test
```

**Defensive programming in CI:**

```typescript
// In test setup or CI scripts
if (process.env.CI) {
  // In CI, be extra strict about endpoint validation
  const allowedEndpoints = [
    'https://api.z.ai/api/anthropic',
    'http://localhost:*/**', // For local testing in CI
  ];

  if (!allowedEndpoints.some(pattern => matchPattern(baseUrl, pattern))) {
    throw new Error(`CI cannot use endpoint: ${baseUrl}`);
  }
}
```

### 6.6 Documentation Pattern

**Always document API endpoint requirements:**

```typescript
/**
 * CRITICAL: All tests MUST use z.ai API endpoint, never Anthropic's official API.
 * This is enforced at the global test setup level.
 *
 * Allowed endpoints (z.ai):
 * - https://api.z.ai/api/anthropic
 *
 * Blocked endpoints (Anthropic):
 * - https://api.anthropic.com
 * - https://api.anthropic.com/v1
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */
```

---

## 7. References and Resources

### 7.1 Official Documentation

- **Vitest Documentation:** https://vitest.dev/guide/
  - [Configuring Vitest](https://vitest.dev/config/)
  - [Test Context API](https://vitest.dev/api/)

- **Vitest Setup Files:** https://vitest.dev/config/#setupfiles
  - Global setup file configuration
  - SetupFiles vs SetupFilesAfterEnv

- **TypeScript Testing:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#support-for-dasserts-in-typescript

### 7.2 Codebase References

**Files analyzed for this research:**

1. `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration
2. `/home/dustin/projects/hacky-hack/tests/setup.ts` - Global test setup
3. `/home/dustin/projects/hacky-hack/tests/unit/setup-verification.test.ts` - Setup verification tests
4. `/home/dustin/projects/hacky-hack/tests/unit/config/environment.test.ts` - Environment configuration tests
5. `/home/dustin/projects/hacky-hack/tests/validation/zai-api-test.ts` - API validation script
6. `/home/dustin/projects/hacky-hack/src/config/environment.ts` - Environment module

### 7.3 Related Patterns in Codebase

**Similar validation patterns:**

- Environment variable validation in `/src/config/environment.ts`
- API endpoint validation in `/tests/setup.ts`
- Validation testing in `/tests/validation/`

### 7.4 Community Best Practices

**General testing principles:**

- **Fail fast:** Validate configuration before running tests
- **Clear errors:** Provide actionable error messages
- **Test isolation:** Clean up state between tests
- **Defensive programming:** Validate assumptions explicitly
- **Developer experience:** Make errors easy to understand and fix

**Resources for further reading:**

- [Testing Best Practices](https://testingjavascript.com/)
- [Vitest Recipes](https://vitest.dev/guide/why.html)
- [TypeScript Error Handling](https://basarat.gitbook.io/typescript/type-system/exceptions)

### 7.5 Key Takeaways Summary

1. **Use `setupFiles` for global hooks** - Configure in `vitest.config.ts`
2. **Validate at module load time** - Catch errors before tests run
3. **Re-validate in `beforeEach`** - Catch environment changes during test runs
4. **Clean up in `afterEach`** - Use `vi.unstubAllEnvs()` and `vi.clearAllMocks()`
5. **Throw for critical errors** - Use detailed, actionable error messages
6. **Warn for non-critical issues** - Use `console.warn()` with formatting
7. **Test your setup** - Create verification tests for global hooks
8. **Document clearly** - Explain why validations exist and how to fix issues

---

**Document Status:** Complete
**Last Updated:** 2026-01-15
**Next Review:** When Vitest releases major updates or testing patterns evolve
