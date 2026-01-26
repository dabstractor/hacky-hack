# Test Patterns Summary from Codebase Analysis

## Import Statements Pattern

```typescript
// Common imports across all test files
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

## Test Structure Pattern (AAA - Arrange-Act-Assert)

```typescript
describe('test suite description', () => {
  beforeEach(() => {
    // SETUP: Configure mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // CLEANUP: Restore environment
    vi.unstubAllEnvs();
  });

  it('should do something correctly', () => {
    // ARRANGE: Set up test data and mocks
    mockFunction.mockReturnValue('test-value');

    // ACT: Execute the function under test
    const result = myFunction();

    // ASSERT: Verify results
    expect(result).toBe('expected-value');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});
```

## Mock Cleanup Patterns

```typescript
// Always clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up environment variables
afterEach(() => {
  vi.unstubAllEnvs();
});

// Clear timeouts for async mocks
afterEach(() => {
  mockTimeouts.forEach(clearTimeout);
  mockTimeouts = [];
});
```

## Naming Conventions

- Unit tests: `tests/unit/<module>/<feature>.test.ts`
- Integration tests: `tests/integration/<module>/<feature>.test.ts`
- E2E tests: `tests/e2e/<workflow>.test.ts`
- Fixtures: `tests/fixtures/<name>.ts`

## Test Description Patterns

```typescript
describe('ClassName or FeatureName', () => {
  describe('methodName', () => {
    it('should [action] [result] when [condition]', () => {
      // Clear, descriptive test name
    });

    it('should handle [error type] gracefully', () => {
      // Error handling tests
    });
  });
});
```

## Critical: API Endpoint Enforcement

All tests MUST use z.ai API endpoint, never Anthropic's official API:

```typescript
// From tests/setup.ts
const ZAI_ENDPOINT = 'https://api.z.ai/api/anthropic';
const BLOCKED_PATTERNS = [
  'https://api.anthropic.com',
  'http://api.anthropic.com',
  'api.anthropic.com',
] as const;

function validateApiEndpoint(): void {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || '';
  if (BLOCKED_PATTERNS.some(pattern => baseUrl.includes(pattern))) {
    throw new Error('Tests MUST use z.ai endpoint, never Anthropic API');
  }
}
```

## Global Setup in tests/setup.ts

```typescript
// Mock cleanup with vi.clearAllMocks()
// Environment variable restoration with vi.unstubAllEnvs()
// API endpoint validation
// Promise rejection tracking
```

## Test Execution Commands

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Stop on first failure
npm run test:bail
```

## Key Testing Patterns

1. **Deterministic Testing**
   - No real LLM API calls (all mocked)
   - No real file system operations
   - No real git operations
   - No network requests

2. **Test Isolation**
   - Each test completely isolated from others
   - Global beforeEach/afterEach hooks
   - Mock cleanup after each test

3. **Comprehensive Coverage**
   - 100% coverage required for all metrics
   - Coverage reports in text, JSON, and HTML formats
   - Coverage thresholds enforced
