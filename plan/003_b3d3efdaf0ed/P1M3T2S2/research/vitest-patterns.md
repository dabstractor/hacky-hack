# Vitest Testing Patterns Research

## Overview

This document contains Vitest testing patterns used in the hacky-hack codebase for creating unit tests that validate PRP template structure.

## Test Framework and Version

- **Framework**: Vitest v1.6.1
- **Coverage Provider**: v8 coverage
- **Environment**: Node.js environment
- **Test Runner**: Vitest with ESM support

## Test Configuration

**File**: `/home/dustin/projects/hacky-hack/vitest.config.ts`

Key configuration settings:
- **File Pattern**: `tests/**/*.{test,spec}.ts}`
- **Exclude Patterns**: `**/dist/**`, `**/node_modules/**`
- **Coverage Thresholds**: 100% for statements, branches, functions, and lines
- **Setup File**: `./tests/setup.ts`
- **Path Aliases**: Configured for `@`, `#`, and `groundswell`

## Test File Organization

**Directory Structure**:
- `tests/unit/` - Unit tests (67 files)
- `tests/integration/` - Integration tests (23 files)
- `tests/fixtures/` - Test fixtures

**Naming Convention**: `tests/{type}/{feature-name}.test.ts`

## Common Test Patterns

### 1. Basic Test Structure

```typescript
import { describe, expect, it } from 'vitest';

describe('feature-name', () => {
  it('should do something correctly', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 2. Mock Setup Pattern

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

### 3. Environment Variable Testing

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.stubEnv('ENV_VAR', 'test-value');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

### 4. Dynamic Import Pattern (for mocked modules)

```typescript
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});

async function loadGroundswell() {
  return await import('groundswell');
}
```

## Assertion Patterns

### String Contains Assertions

```typescript
expect(text).toContain('substring');
expect(text).toMatch(/regex/);
```

### Array/Object Assertions

```typescript
expect(array).toHaveLength(5);
expect(object).toHaveProperty('key');
expect(object).toEqual({ key: 'value' });
```

### Type Checking Assertions

```typescript
expect(value).toBeTypeOf('string');
expect(value).toBeInstanceOf(Class);
```

## Test File Naming Conventions

- **Unit tests**: `tests/unit/{feature}.test.ts`
- **Integration tests**: `tests/integration/{feature}.test.ts`
- **E2E tests**: `tests/e2e/{feature}.test.ts`

## Test Execution Commands

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/prp-template-validation.test.ts
```

## Test Coverage Requirements

- **100% coverage** required for all source files
- Use `--coverage` flag to generate coverage reports
- Coverage reports show term-missing for uncovered lines

## Best Practices Observed

1. **Complete Coverage**: 100% test coverage required
2. **Environment Isolation**: Comprehensive environment variable management
3. **Mock Hygiene**: Consistent mock clearing between tests
4. **Documentation**: Extensive JSDoc comments in test files
5. **Grouping**: Use nested describe blocks for logical organization

## Related Files

- `vitest.config.ts` - Main configuration
- `tests/setup.ts` - Global test setup
- `package.json` - Test scripts definition
