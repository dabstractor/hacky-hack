# Test Runner Configuration Research

## Package.json Test Scripts

```json
"test": "vitest",
"test:run": "vitest run",
"test:watch": "vitest watch",
"test:coverage": "vitest run --coverage",
"test:bail": "vitest run --bail=1"
```

## Primary Execution Command

For running specific integration tests:

```bash
npm run test:run -- tests/integration/utils/error-handling.test.ts
```

**Explanation**:
- `npm run test:run` - Runs Vitest in non-interactive mode
- `--` - Separator between npm script and arguments
- `tests/integration/utils/error-handling.test.ts` - Specific test file path

## Alternative Commands

```bash
# Run all integration tests
npm run test:run -- tests/integration/

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch -- tests/integration/utils/error-handling.test.ts

# Stop after first failure
npm run test:bail -- tests/integration/utils/error-handling.test.ts

# Run all tests
npm run test:run
```

## Vitest Configuration

**File**: `/home/dustin/projects/hacky-hack/vitest.config.ts`

### Key Settings

```typescript
{
  test: {
    environment: 'node',           // Node.js environment
    globals: true,                 // Global test functions (describe, it, etc.)
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    setupFiles: ['./tests/setup.ts'],
    deps: { interopDefault: true },
    fs: { allow: ['.', '..'] },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
}
```

### Path Aliases

```typescript
resolve: {
  alias: {
    '@': new URL('./src', import.meta.url).pathname,
    '#': new URL('./src/agents', import.meta.url).pathname,
    groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname,
  },
  extensions: ['.ts', '.js', '.tsx'],
}
```

## Global Test Setup

**File**: `/home/dustin/projects/hacky-hack/tests/setup.ts`

### Key Features

1. **Environment Variable Loading**
   ```typescript
   import { config } from 'dotenv';
   config({ path: '.env' });
   ```

2. **API Endpoint Safeguard**
   - Validates that tests use z.ai API endpoint
   - Blocks Anthropic's official API endpoints
   - Critical for preventing accidental API usage

3. **Global Mock Cleanup**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

4. **Environment Variable Cleanup**
   - Unstubs environment variables after each test
   - Prevents test pollution

5. **Garbage Collection**
   - Forces GC if available (useful for memory testing)

## Expected Test Output Format

### Successful Test Run

```
RUN  v1.6.1 /home/dustin/projects/hacky-hack

stdout | _log (/home/dustin/projects/hacky-hack/node_modules/dotenv/lib/main.js:142:11)
[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }

stdout | tests/setup.ts:28:15
.env file loaded successfully

✓ tests/integration/utils/error-handling.test.ts  (23 tests) 6ms

Test Files  1 passed (1)
     Tests  23 passed (23)
Start at  01:09:53
Duration  393ms (transform 37ms, setup 20ms, collect 20ms, tests 6ms, environment 0ms, prepare 60ms)
```

### Failed Test Run

```
✗ tests/integration/utils/error-handling.test.ts (23 tests)
  ✓ Error Type Hierarchy (5)
  ✓ Fatal Error Detection (6)
  ✗ should identify SessionError as fatal (45ms)
  ↻ REPEATABLE TEST 3: failed to identify SessionError as fatal
  Error: Expected true, got false

Test Files  1 failed (1)
     Tests  1 failed | 22 passed (23)
```

## Coverage Report

```bash
npm run test:coverage
```

**Output includes**:
- Text summary in terminal
- JSON report for CI/CD
- HTML report in `coverage/` directory

## TypeScript Configuration

**File**: `/home/dustin/projects/hacky-hack/tsconfig.json`

### Test-Specific Settings

```json
{
  "include": ["src/**/*", "tests/**/*"],
  "compilerOptions": {
    "types": ["vitest/globals"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
  }
}
```

## ESLint Configuration for Tests

```json
{
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
}
```

## Requirements

- **Node.js**: >=20.0.0
- **npm**: >=10.0.0
- **Vitest**: 1.6.1
- **Environment**: `.env` file (optional but recommended)

## Test File Discovery Pattern

Vitest discovers test files matching:
- `**/*.test.ts`
- `**/*.spec.ts`

In the `tests/` directory and subdirectories.

## Gotchas and Warnings

1. **ESM Imports** - Must use `.js` extension even for TypeScript files
   ```typescript
   import { isFatalError } from '../../../src/utils/errors.js';
   ```

2. **mkdtemp Warning** - Templates ending with X are not portable
   - Current usage: `mkdtempSync(join(tmpdir(), 'error-handling-test-XXXXXX'))`
   - Can be ignored or fixed by using different template

3. **API Endpoint Validation** - Tests fail if using Anthropic's official API
   - Must use z.ai endpoint: `https://api.z.ai/api/anthropic`

4. **100% Coverage Requirement** - All source files must have 100% coverage
   - Excludes test files and node_modules
   - Build fails if thresholds not met
