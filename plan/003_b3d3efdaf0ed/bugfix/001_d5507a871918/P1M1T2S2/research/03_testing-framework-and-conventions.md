# Testing Framework and Conventions Research - P1.M1.T2.S2

## Testing Framework: Vitest

The codebase uses **Vitest** as the testing framework.

### Essential Imports
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## Integration Test Patterns

### Mock Pattern for External Dependencies
```typescript
// Mock at top level (hoisting required)
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
    createPrompt: vi.fn(),
  };
});

// Import after mocking
import { createAgent, createPrompt } from 'groundswell';
```

### Mock Setup in beforeEach
```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Critical for test isolation

  // Setup default mocks
  mockCreateQAAgent.mockReturnValue({
    prompt: vi.fn(),
  });
});
```

## Temporary Directory Handling

### Pattern for Tests with Temp Directories
```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });
});
```

## Test Data Fixtures

The `tests/fixtures/` directory contains reusable test data.

### Example: Simple PRD Fixture
```typescript
// /tests/fixtures/simple-prd.ts
export const mockSimplePRD = `
# Test Project

## P1: Test Phase
### P1.M1: Test Milestone
#### P1.M1.T1: Create Hello World
##### P1.M1.T1.S1: Write Hello World Function
...
`;
```

## Factory Functions for Test Data

```typescript
const createTestTask = (
  id: string,
  title: string,
  description?: string
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Complete',
  description: description ?? `Description for ${title}`,
  subtasks: [],
});
```

## Common Gotchas to Avoid

1. **Mock Hoisting**: All `vi.mock()` calls must be at the top level
2. **Error Code Assignment**: Use proper type assertions for Node.js errors
3. **Test Isolation**: Clear mocks with `vi.clearAllMocks()` in `beforeEach`
4. **Async Testing**: Always `await` async functions in tests

## Test File Naming Conventions

- Unit tests: `*.test.ts` (e.g., `task-utils.test.ts`)
- Integration tests: `*-integration.test.ts` (e.g., `prp-pipeline-integration.test.ts`)
- E2E tests: `*.test.ts` in `tests/e2e/` directory

## Integration Test Setup

From `tests/setup.ts`:
- Environment validation (ensures z.ai API endpoint)
- Mock cleanup before each test
- Promise rejection tracking
- Memory management (garbage collection when available)

## AAA (Arrange-Act-Assert) Pattern

All tests should follow this pattern:

```typescript
it('should [expected behavior]', () => {
  // ARRANGE: Setup test data and mocks
  const input = createTestData();
  mockFunction.mockReturnValue(expectedValue);

  // ACT: Execute the function
  const result = functionToTest(input);

  // ASSERT: Verify expectations
  expect(result).toBe(expectedValue);
});
```

## SessionManager in Integration Tests

From integration test patterns documentation:

```typescript
// Integration test setup
const manager = new SessionManager(prdPath, planDir);
```

For tests that require plan directory functionality, use test-specific temp directories instead of hardcoded 'plan'.
