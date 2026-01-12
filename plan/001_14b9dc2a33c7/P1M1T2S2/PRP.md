---
name: 'Environment Validation Tests PRP'
description: |
---

## Goal

**Feature Goal**: Create a comprehensive unit test suite for `src/config/environment.ts` that validates environment variable mapping, model selection, and configuration with 100% code coverage.

**Deliverable**: A passing Vitest test suite file at `tests/unit/config/environment.test.ts` with complete coverage of the environment configuration module.

**Success Definition**:

- All tests pass: `npm run test` exits with code 0
- 100% code coverage of `src/config/environment.ts`: `npm run test:coverage` shows 100% for statements, branches, functions, and lines
- Tests validate all three exported functions: `configureEnvironment()`, `getModel()`, `validateEnvironment()`
- Tests verify AUTH_TOKEN → API_KEY mapping, model tier selection, default value setting, and error handling

## User Persona

**Target User**: Developer working on the hacky-hack project who needs to ensure environment configuration is reliable and well-tested.

**Use Case**: When developing new features or refactoring, developers run tests to verify environment configuration still works correctly. Tests also serve as documentation for expected behavior.

**User Journey**:

1. Developer makes changes to environment-related code
2. Developer runs `npm run test` to verify changes don't break existing behavior
3. If tests fail, developer reviews test output to identify what broke
4. Developer fixes issues and re-runs tests until all pass
5. Optionally, developer runs `npm run test:coverage` to verify coverage remains at 100%

**Pain Points Addressed**:

- Currently no automated tests for environment configuration - only manual console-based scripts
- No confidence that environment variable mapping works correctly across different scenarios
- No validation that error handling is robust
- No safety net when refactoring environment code

## Why

- **Foundation for reliability**: Environment configuration is the foundation for all agent creation. If this breaks, the entire pipeline fails.
- **Safety for refactoring**: With comprehensive tests, developers can confidently refactor environment code knowing tests will catch regressions.
- **Documentation through tests**: Tests serve as living documentation of expected behavior, especially critical for environment variable mapping logic.
- **Alignment with PRD testing strategy**: This implements the "Level 2: Unit Tests" validation level from the PRD's 4-level validation framework.

## What

Create a Vitest-based unit test suite for `src/config/environment.ts` that validates:

1. **AUTH_TOKEN → API_KEY Mapping**: Tests that `configureEnvironment()` correctly maps `ANTHROPIC_AUTH_TOKEN` to `ANTHROPIC_API_KEY` when API_KEY is not already set, and preserves existing API_KEY when it is set.

2. **Default Value Setting**: Tests that `configureEnvironment()` sets the correct default for `ANTHROPIC_BASE_URL` when not provided.

3. **Model Selection**: Tests that `getModel()` returns the correct model name for each tier ('opus', 'sonnet', 'haiku') and respects environment variable overrides.

4. **Validation**: Tests that `validateEnvironment()` throws `EnvironmentValidationError` when required variables are missing and passes when all required variables are present.

5. **Test Isolation**: Each test properly mocks and restores `process.env` to prevent test pollution.

### Success Criteria

- [ ] All tests pass with `npm run test`
- [ ] Coverage report shows 100% for environment.ts: statements, branches, functions, lines
- [ ] Tests use Vitest's `vi.stubEnv()` for environment mocking
- [ ] Tests restore environment state with `vi.unstubAllEnvs()` in afterEach
- [ ] Tests cover all code paths including error cases
- [ ] Test file location follows convention: `tests/unit/config/environment.test.ts`

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Validation**: This PRP includes complete file paths, exact function signatures, mock patterns, Vitest configuration, package.json scripts, and validation commands. An implementer has everything needed.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/guide/
  why: Complete Vitest documentation for test framework setup and usage
  critical: Use `vi.stubEnv()` for environment mocking, not manual manipulation

- url: https://vitest.dev/guide/mocking.html#stub-env
  why: Specific documentation on environment variable mocking in Vitest
  critical: Always use `vi.unstubAllEnvs()` in afterEach to restore state

- url: https://vitest.dev/config/
  why: Vitest configuration options for coverage, reporters, and ESM support
  critical: Set `provider: 'v8'` for coverage, configure thresholds for 100%

- file: /home/dustin/projects/hacky-hack/src/config/environment.ts
  why: The module under test - understand exact function signatures and behavior
  pattern: Exported functions: configureEnvironment(), getModel(tier: ModelTier), validateEnvironment()
  gotcha: configureEnvironment() modifies process.env in place as a side effect

- file: /home/dustin/projects/hacky-hack/src/config/constants.ts
  why: Defines DEFAULT_BASE_URL and MODEL_NAMES used by environment.ts
  pattern: Constants with 'as const' for type safety
  gotcha: DEFAULT_BASE_URL is 'https://api.z.ai/api/anthropic', MODEL_NAMES has GLM-4.7 and GLM-4.5-Air

- file: /home/dustin/projects/hacky-hack/src/config/types.ts
  why: Defines ModelTier type and EnvironmentValidationError class
  pattern: ModelTier = 'opus' | 'sonnet' | 'haiku'
  gotcha: EnvironmentValidationError has a 'missing' property containing array of missing variable names

- file: /home/dustin/projects/hacky-hack/tests/manual/env-test.ts
  why: Existing manual test showing expected behaviors to test
  pattern: Manual console.log assertions - convert to proper Vitest assertions
  gotcha: Shows model tier values: 'opus', 'sonnet', 'haiku'

- file: /home/dustin/projects/hacky-hack/tests/integration/mapping-test.ts
  why: Shows existing test patterns for AUTH_TOKEN → API_KEY mapping
  pattern: Save/restore original env values before/after tests
  gotcha: Uses dynamic import - new tests should use standard ESM imports

- file: /home/dustin/projects/hacky-hack/package.json
  why: Current package.json to add test scripts and dependencies
  pattern: type: "module", engines: { node: ">=20.0.0" }
  gotcha: No test framework currently installed - Vitest must be added as devDependency

- file: /home/dustin/projects/hacky-hack/plan/001_14b9dc2a33c7/architecture/environment_config.md
  why: Internal documentation defining environment configuration requirements
  pattern: Environment variable mapping table and validation checklist
  gotcha: Defines 100% coverage requirement for environment.ts module

- docfile: /home/dustin/projects/hacky-hack/tsconfig.json
  why: Current TypeScript configuration - must ensure tests are included
  pattern: "include": ["src/**/*"], module: "NodeNext", moduleResolution: "NodeNext"
  gotcha: Tests directory is not currently in include - must add for test discovery
```

### Current Codebase Tree

```bash
hacky-hack/
├── docs/
├── plan/
│   └── 001_14b9dc2a33c7/
│       ├── architecture/
│       │   └── environment_config.md
│       ├── docs/
│       ├── P1M1T1S1/ through P1M1T2S2/
│       ├── prd_snapshot.md
│       └── tasks.json
├── src/
│   ├── agents/
│   ├── config/
│   │   ├── constants.ts
│   │   ├── environment.ts         # Module under test
│   │   └── types.ts
│   ├── core/
│   ├── utils/
│   └── workflows/
├── tests/
│   ├── integration/
│   │   ├── consumer-test.ts
│   │   ├── env-import-test.ts
│   │   └── mapping-test.ts
│   ├── manual/
│   │   └── env-test.ts
│   └── unit/                      # Empty - tests go here
├── package.json
├── package-lock.json
├── tsconfig.json
└── dist/
```

### Desired Codebase Tree with Files to be Added

```bash
hacky-hack/
├── tests/
│   └── unit/
│       └── config/                # NEW DIRECTORY
│           └── environment.test.ts # NEW FILE - Unit tests for environment.ts
├── vitest.config.ts               # NEW FILE - Vitest configuration
├── package.json                   # MODIFIED - Add test scripts and Vitest dependency
└── tsconfig.json                  # MODIFIED - Add tests to include paths
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: No testing framework currently exists
// This is the FIRST test file in the project - must set up entire testing infrastructure

// CRITICAL: Project uses ESM (type: "module" in package.json)
// Vitest configuration must support ESM imports and .js extension resolution

// CRITICAL: configureEnvironment() has intentional side effects
// It modifies process.env in place - tests must use vi.stubEnv() for proper isolation

// CRITICAL: process.env mocking must be cleaned up after each test
// Use afterEach(() => vi.unstubAllEnvs()) to prevent test pollution

// CRITICAL: ModelTier is a union type: 'opus' | 'sonnet' | 'haiku'
// Tests must use exact string values - no typos allowed

// CRITICAL: EnvironmentValidationError is a custom class with 'missing' property
// Error assertions must check: error instanceof EnvironmentValidationError && error.missing.includes('VAR')

// CRITICAL: Existing manual tests use dynamic imports
// New tests should use standard ESM imports: import { configureEnvironment } from '../../src/config/environment.js'

// CRITICAL: tsconfig.json currently excludes tests/
// Must add "tests/**/*" to include array for TypeScript to process test files

// GOTCHA: z.ai API endpoint is https://api.z.ai/api/anthropic
// This is the DEFAULT_BASE_URL constant that configureEnvironment() sets

// GOTCHA: GLM-4.7 is default for opus AND sonnet tiers, GLM-4.5-Air for haiku
// Tests expecting different models for opus vs sonnet will fail

// GOTCHA: Environment variable override uses MODEL_ENV_VARS[tier]
// ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL, ANTHROPIC_DEFAULT_HAIKU_MODEL

// PATTERN: Existing code uses .js extensions in ESM imports
// New test imports must also use .js: import { ... } from '../../src/config/environment.js'
```

## Implementation Blueprint

### Data Models and Structure

No new data models are required for this task. The test file will use existing types from `src/config/types.ts`:

```typescript
// Existing types to use in tests
import type { ModelTier } from '../../src/config/types.js';
import { EnvironmentValidationError } from '../../src/config/types.js';

// ModelTier values for test parameters
type ModelTierTestValue = 'opus' | 'sonnet' | 'haiku';
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY package.json
  - ADD devDependency: "vitest": "^1.0.0"
  - ADD devDependency: "@vitest/coverage-v8": "^1.0.0"
  - ADD script: "test": "vitest"
  - ADD script: "test:run": "vitest run"
  - ADD script: "test:coverage": "vitest run --coverage"
  - PRESERVE: All existing scripts and dependencies
  - PLACEMENT: package.json in project root

Task 2: CREATE vitest.config.ts
  - IMPLEMENT: Vitest configuration for ESM + TypeScript
  - SET: environment: 'node' (not jsdom - this is backend code)
  - SET: globals: true (auto-import describe, it, expect)
  - SET: include: ['tests/**/*.{test,spec}.{ts,js}']
  - CONFIGURE coverage.provider: 'v8'
  - CONFIGURE coverage.include: ['src/config/environment.ts']
  - CONFIGURE coverage.reporter: ['text', 'json', 'html']
  - CONFIGURE coverage.thresholds.global: { statements: 100, branches: 100, functions: 100, lines: 100 }
  - SET: resolve.alias for clean imports
  - PLACEMENT: vitest.config.ts in project root

Task 3: MODIFY tsconfig.json
  - ADD: "tests/**/*" to include array
  - ADD: "vitest/globals" to types array
  - PRESERVE: All existing compiler options
  - PLACEMENT: tsconfig.json in project root

Task 4: CREATE tests/unit/config/ directory
  - CREATE: Directory structure for config tests
  - NAMING: Follows src/ hierarchy under tests/unit/
  - PLACEMENT: tests/unit/config/

Task 5: CREATE tests/unit/config/environment.test.ts
  - IMPLEMENT: Test suite for environment.ts module
  - IMPORT: describe, it, expect, beforeEach, afterEach, vi from 'vitest'
  - IMPORT: configureEnvironment, getModel, validateEnvironment, EnvironmentValidationError
  - FOLLOW pattern: Use vi.stubEnv() for mocking, vi.unstubAllEnvs() for cleanup
  - NAMING: Describe blocks: 'configureEnvironment', 'getModel', 'validateEnvironment'
  - TEST: configureEnvironment() - AUTH_TOKEN → API_KEY mapping (2 scenarios)
  - TEST: configureEnvironment() - BASE_URL default setting (2 scenarios)
  - TEST: getModel() - default model names for each tier (3 tests)
  - TEST: getModel() - environment variable overrides (3 tests)
  - TEST: validateEnvironment() - passes with all required vars (1 test)
  - TEST: validateEnvironment() - throws when API_KEY missing (1 test)
  - TEST: validateEnvironment() - throws when BASE_URL missing (1 test)
  - TEST: validateEnvironment() - throws when both missing (1 test)
  - SETUP: beforeEach to clean environment state
  - CLEANUP: afterEach to restore all environment variables
  - PLACEMENT: tests/unit/config/environment.test.ts

Task 6: INSTALL dependencies
  - RUN: npm install --save-dev vitest @vitest/coverage-v8
  - VERIFY: package.json and package-lock.json updated
  - NO: Modify any other dependencies

Task 7: VALIDATE installation
  - RUN: npm run test (should run with 0 tests passing)
  - RUN: npm run test:coverage (should generate coverage report)
  - CHECK: No TypeScript errors in test file
  - CHECK: Vitest can locate and parse test file
```

### Implementation Patterns & Key Details

```typescript
// ===== VITEST CONFIGURATION PATTERN =====
// File: vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Backend code, not DOM
    globals: true, // Auto-import describe, it, expect, etc.
    include: ['tests/**/*.{test,spec}.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
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
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});

// ===== TEST FILE STRUCTURE PATTERN =====
// File: tests/unit/config/environment.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  configureEnvironment,
  getModel,
  validateEnvironment,
  EnvironmentValidationError,
} from '../../src/config/environment.js';

describe('config/environment', () => {
  // CLEANUP: Always restore environment after each test
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('configureEnvironment', () => {
    it('should map AUTH_TOKEN to API_KEY when API_KEY is not set', () => {
      // SETUP: Clear API_KEY, set AUTH_TOKEN
      delete process.env.ANTHROPIC_API_KEY;
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');

      // EXECUTE
      configureEnvironment();

      // VERIFY: API_KEY should be set from AUTH_TOKEN
      expect(process.env.ANTHROPIC_API_KEY).toBe('test-token-123');
    });

    it('should preserve existing API_KEY when AUTH_TOKEN is also set', () => {
      // SETUP: Both API_KEY and AUTH_TOKEN set
      vi.stubEnv('ANTHROPIC_API_KEY', 'original-api-key');
      vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'different-auth-token');

      // EXECUTE
      configureEnvironment();

      // VERIFY: API_KEY should NOT be overwritten
      expect(process.env.ANTHROPIC_API_KEY).toBe('original-api-key');
    });

    it('should set default BASE_URL when not provided', () => {
      // SETUP: No BASE_URL set
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE
      configureEnvironment();

      // VERIFY: Default z.ai endpoint
      expect(process.env.ANTHROPIC_BASE_URL).toBe(
        'https://api.z.ai/api/anthropic'
      );
    });

    it('should preserve custom BASE_URL when already set', () => {
      // SETUP: Custom BASE_URL
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://custom.endpoint.com/api');

      // EXECUTE
      configureEnvironment();

      // VERIFY: Custom URL preserved
      expect(process.env.ANTHROPIC_BASE_URL).toBe(
        'https://custom.endpoint.com/api'
      );
    });
  });

  describe('getModel', () => {
    it('should return default model for opus tier', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('opus')).toBe('GLM-4.7');
    });

    it('should return default model for sonnet tier', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_SONNET_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('sonnet')).toBe('GLM-4.7');
    });

    it('should return default model for haiku tier', () => {
      // SETUP: No override
      delete process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;

      // EXECUTE & VERIFY
      expect(getModel('haiku')).toBe('GLM-4.5-Air');
    });

    it('should use environment override for opus tier', () => {
      // SETUP: Override via env var
      vi.stubEnv('ANTHROPIC_DEFAULT_OPUS_MODEL', 'custom-opus-model');

      // EXECUTE & VERIFY
      expect(getModel('opus')).toBe('custom-opus-model');
    });

    it('should use environment override for sonnet tier', () => {
      // SETUP: Override via env var
      vi.stubEnv('ANTHROPIC_DEFAULT_SONNET_MODEL', 'custom-sonnet-model');

      // EXECUTE & VERIFY
      expect(getModel('sonnet')).toBe('custom-sonnet-model');
    });

    it('should use environment override for haiku tier', () => {
      // SETUP: Override via env var
      vi.stubEnv('ANTHROPIC_DEFAULT_HAIKU_MODEL', 'custom-haiku-model');

      // EXECUTE & VERIFY
      expect(getModel('haiku')).toBe('custom-haiku-model');
    });
  });

  describe('validateEnvironment', () => {
    beforeEach(() => {
      // Ensure clean state before validation tests
      vi.unstubAllEnvs();
    });

    it('should pass when all required variables are set', () => {
      // SETUP: All required vars present
      vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

      // EXECUTE & VERIFY: Should not throw
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw when API_KEY is missing', () => {
      // SETUP: Missing API_KEY
      delete process.env.ANTHROPIC_API_KEY;
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

      // EXECUTE & VERIFY
      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
    });

    it('should throw when BASE_URL is missing', () => {
      // SETUP: Missing BASE_URL
      vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE & VERIFY
      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
    });

    it('should throw when both required variables are missing', () => {
      // SETUP: Both missing
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_BASE_URL;

      // EXECUTE
      const error = expect(() => validateEnvironment()).toThrow(
        EnvironmentValidationError
      );

      // VERIFY: Error contains both missing variables
      try {
        validateEnvironment();
      } catch (e) {
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        if (e instanceof EnvironmentValidationError) {
          expect(e.missing).toContain('ANTHROPIC_API_KEY');
          expect(e.missing).toContain('ANTHROPIC_BASE_URL');
          expect(e.missing).toHaveLength(2);
        }
      }
    });

    it('should include missing variable name in error', () => {
      // SETUP: Missing API_KEY only
      delete process.env.ANTHROPIC_API_KEY;
      vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

      // EXECUTE
      try {
        validateEnvironment();
        fail('Should have thrown EnvironmentValidationError');
      } catch (e) {
        // VERIFY: Error has missing property with correct variable name
        expect(e).toBeInstanceOf(EnvironmentValidationError);
        if (e instanceof EnvironmentValidationError) {
          expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
        }
      }
    });
  });
});

// ===== CRITICAL GOTCHAS =====

// GOTCHA 1: Always use vi.stubEnv() instead of direct assignment
// WRONG: process.env.API_KEY = 'test'
// RIGHT: vi.stubEnv('API_KEY', 'test')

// GOTCHA 2: Always cleanup in afterEach, not beforeEach
// WRONG: beforeEach(() => { cleanup() })
// RIGHT: afterEach(() => { vi.unstubAllEnvs() })

// GOTCHA 3: Use .js extension in ESM imports
// WRONG: import { ... } from '../../src/config/environment'
// RIGHT: import { ... } from '../../src/config/environment.js'

// GOTCHA 4: Delete env vars before setting in tests
// WRONG: vi.stubEnv('VAR', 'value') // may not overwrite if set
// RIGHT: delete process.env.VAR; vi.stubEnv('VAR', 'value')

// GOTCHA 5: Model names are exact strings - case sensitive
// GLM-4.7 (not glm-4.7 or GLM-4.7-anything)
// GLM-4.5-Air (not GLM-4.5-Air-anything)
```

### Integration Points

```yaml
PACKAGE.JSON:
  - modify: package.json
  - add: "vitest": "^1.0.0" to devDependencies
  - add: "@vitest/coverage-v8": "^1.0.0" to devDependencies
  - add: "test": "vitest" to scripts
  - add: "test:run": "vitest run" to scripts
  - add: "test:coverage": "vitest run --coverage" to scripts

TSCONFIG:
  - modify: tsconfig.json
  - add: "tests/**/*" to include array
  - add: "vitest/globals" to types array

VITEST_CONFIG:
  - create: vitest.config.ts in project root
  - configure: ESM support with Node environment
  - configure: Coverage provider v8 with 100% thresholds

DIRECTORY_STRUCTURE:
  - create: tests/unit/config/
  - create: tests/unit/config/environment.test.ts
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking on test file
npx tsc --noEmit tests/unit/config/environment.test.ts

# Expected: No TypeScript errors. If errors exist:
# - Check .js extension in imports
# - Check types match imported functions
# - Verify vitest/globals is in tsconfig types

# Build project to ensure no compilation errors
npm run build

# Expected: Clean build with no errors. Exit code 0.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run tests in watch mode during development
npm run test

# Expected: Vitest starts, discovers test file, runs all tests to completion.

# Run tests once (CI mode)
npm run test:run

# Expected: All tests pass with green checkmarks. Exit code 0.
# Output shows: X tests passed (X total)

# Run with coverage
npm run test:coverage

# Expected:
# - Coverage report in terminal
# - src/config/environment.ts shows 100% for all metrics
# - HTML report generated at coverage/index.html
# - Exit code 0

# If coverage is not 100%:
# - Review terminal output to see uncovered lines
# - Check /coverage/index.html for visual coverage report
# - Add tests for missing code paths

# Verify test isolation (run tests multiple times)
npm run test:run && npm run test:run && npm run test:run

# Expected: All runs pass consistently. No intermittent failures.
# If tests fail intermittently, env state is leaking between tests.
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify environment config module still works in manual tests
npx tsx tests/manual/env-test.ts

# Expected: Manual test runs successfully showing environment configuration working.
# This confirms unit tests don't break real-world usage.

# Verify existing integration tests still work
npx tsx tests/integration/mapping-test.ts

# Expected: Integration test passes, confirming AUTH_TOKEN mapping still works.

# Verify TypeScript compilation
npm run build

# Expected: Clean build with dist/ directory containing compiled JS.
# No module resolution errors.

# Verify ESM imports work correctly
node --input-type=module -e "import { configureEnvironment } from './dist/config/environment.js'; configureEnvironment();"

# Expected: No import errors. Environment configured successfully.
```

### Level 4: Coverage and Quality Validation

```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML coverage report
# Command varies by OS: open coverage/index.html or xdg-open coverage/index.html

# Expected:
# - HTML report opens in browser
# - Navigate to src/config/environment.ts
# - All lines should be green (covered)
# - All branches should be green (covered)
# - No red (uncovered) lines

# Verify 100% coverage thresholds are met
npm run test:coverage

# Expected:
# - Terminal output shows "% Statements: 100%"
# - Terminal output shows "% Branches: 100%"
# - Terminal output shows "% Functions: 100%"
# - Terminal output shows "% Lines: 100%"
# - If thresholds not met, tests FAIL with coverage error

# Check for test pollution (run tests in random order)
npx vitest run --sequence.shuffle

# Expected: All tests pass regardless of order.
# If tests fail when shuffled, there's state pollution between tests.

# Verify no console errors in test output
npm run test 2>&1 | grep -i "error\|warning"

# Expected: No error or warning messages in test output.
# Clean run with only test pass/fail indicators.
```

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm run test:run` exits with code 0
- [ ] 100% coverage achieved: `npm run test:coverage` shows 100% for all metrics
- [ ] No TypeScript errors: `npx tsc --noEmit` compiles without errors
- [ ] Test file discovered: Vitest output shows "X tests found in tests/unit/config/environment.test.ts"
- [ ] Test isolation verified: `npm run test:run` run 3x consecutively, all pass

### Feature Validation

- [ ] AUTH_TOKEN → API_KEY mapping tested (2 scenarios: with/without existing API_KEY)
- [ ] BASE_URL default setting tested (2 scenarios: with/without existing URL)
- [ ] getModel() default models tested (3 tests: opus, sonnet, haiku)
- [ ] getModel() env override tested (3 tests: one per tier)
- [ ] validateEnvironment() passing case tested (1 test: all vars present)
- [ ] validateEnvironment() throwing cases tested (4 tests: each missing var + both missing)
- [ ] EnvironmentValidationError properties tested (missing array, instance check)
- [ ] Test count: At least 13 tests covering all scenarios

### Code Quality Validation

- [ ] Test file location: tests/unit/config/environment.test.ts
- [ ] Test imports use .js extension (ESM compliance)
- [ ] vi.stubEnv() used for all environment mocking
- [ ] vi.unstubAllEnvs() in afterEach for cleanup
- [ ] describe/it blocks properly nested by function
- [ ] Test names clearly describe what is being tested
- [ ] Assertions use expect().toBe() for exact value matching
- [ ] Error tests use toThrow() and instanceof checks
- [ ] No hardcoded values that should be constants
- [ ] No console.log in tests (use proper assertions)

### Documentation & Deployment

- [ ] vitest.config.ts created with proper ESM configuration
- [ ] package.json updated with test scripts and Vitest dependencies
- [ ] tsconfig.json updated to include tests/ directory
- [ ] Coverage threshold set to 100% in vitest.config.ts
- [ ] All success criteria from "What" section met

---

## Anti-Patterns to Avoid

- ❌ Don't use Jest syntax - this project uses Vitest
- ❌ Don't mock process.env directly - use vi.stubEnv()
- ❌ Don't skip afterEach cleanup - always call vi.unstubAllEnvs()
- ❌ Don't forget .js extension in ESM imports
- ❌ Don't use console.log for assertions - use expect().toBe()
- ❌ Don't hardcode model names - use actual expected values (GLM-4.7, GLM-4.5-Air)
- ❌ Don't test private implementation details - test public API only
- ❌ Don't skip error cases - test all throw scenarios
- ❌ Don't assume environment state - always stub before testing
- ❌ Don't use toThrow() without Error type - specify EnvironmentValidationError
- ❌ Don't create tests in tests/integration or tests/manual - use tests/unit/config/
- ❌ Don't skip coverage validation - 100% is required for this module
