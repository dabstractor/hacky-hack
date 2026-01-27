# Test Patterns for PRP Pipeline Research

## Test Framework

**Framework:** Vitest (not Jest, Mocha, or others)

## Test Configuration

**Configuration File:** `/home/dustin/projects/hacky-hack/vitest.config.ts`

**Key Settings:**
- 100% code coverage enforced globally
- Node.js environment with ESM support
- Setup file: `/home/dustin/projects/hacky-hack/tests/setup.ts`

**Test Script in package.json:**
```json
"test": "vitest"
```

## Test Directory Structure

```
tests/
├── unit/
│   └── workflows/
│       ├── prp-pipeline.test.ts          # Main PRP Pipeline tests
│       ├── delta-analysis-workflow.test.ts
│       ├── bug-hunt-workflow.test.ts
│       └── fix-cycle-workflow.test.ts
└── integration/
    └── (integration tests)
```

## Test Structure Pattern

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('WorkflowName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
  });

  describe('method-name', () => {
    it('should do something', async () => {
      // SETUP
      // EXECUTE
      // VERIFY
    });
  });
});
```

## Mocking Strategy

### Comprehensive Mocking

```typescript
// Mock modules
vi.mock('../../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
}));

// Mock instance methods
mockCreateArchitectAgent.mockReturnValue({
  prompt: vi.fn().mockResolvedValue({}),
});

// Track calls
expect(mockCreateArchitectAgent).toHaveBeenCalled();
```

### Factory Functions for Test Data

Each test file has factory functions:

```typescript
function createTestTask(overrides?: Partial<Task>): Task {
  return {
    id: 'test-task-id',
    title: 'Test Task',
    status: 'pending',
    ...overrides,
  };
}

function createTestSession(overrides?: Partial<Session>): Session {
  return {
    metadata: {
      id: '001_14b9dc2a33c7',
      hash: '14b9dc2a33c7',
      path: 'plan/001_14b9dc2a33c7',
    },
    taskRegistry: {
      backlog: [],
      inProgress: [],
      completed: [],
    },
    ...overrides,
  };
}
```

## Testing the run() Method

### Happy Path Testing

```typescript
it('should execute pipeline successfully', async () => {
  // SETUP
  const mockSessionManager = createMockSessionManager();
  const pipeline = new PRPPipeline(prdPath, planDir, options);

  // EXECUTE
  const result = await pipeline.run();

  // VERIFY
  expect(result.status).toBe('completed');
  expect(mockSessionManager.initialize).toHaveBeenCalled();
});
```

### Error Propagation Testing

```typescript
it('should propagate fatal errors', async () => {
  // SETUP
  const mockError = new Error('Session initialization failed');
  mockSessionManager.initialize.mockRejectedValue(mockError);

  // EXECUTE & VERIFY
  await expect(pipeline.run()).rejects.toThrow('Session initialization failed');
});
```

### Phase Progression Testing

```typescript
it('should progress through phases correctly', async () => {
  // SETUP
  const pipeline = new PRPPipeline(prdPath, planDir, options);

  // EXECUTE
  await pipeline.run();

  // VERIFY
  expect(pipeline.currentPhase).toHaveBeenNext('initialization');
  expect(pipeline.currentPhase).toHaveBeenNext('decomposition');
  expect(pipeline.currentPhase).toHaveBeenNext('execution');
  expect(pipeline.currentPhase).toHaveBeenNext('qa');
});
```

## Error Condition Testing

### Nested Execution Guard Testing

```typescript
describe('nested execution validation', () => {
  it('should allow first execution', async () => {
    // SETUP
    delete process.env.PRP_PIPELINE_RUNNING;

    // EXECUTE
    await pipeline.run();

    // VERIFY
    expect(pipeline.run()).resolves.toBeDefined();
  });

  it('should throw NestedExecutionError on nested execution', async () => {
    // SETUP
    process.env.PRP_PIPELINE_RUNNING = '12345';
    process.env.SKIP_BUG_FINDING = 'false';

    // EXECUTE & VERIFY
    await expect(pipeline.run()).rejects.toThrow(NestedExecutionError);
  });

  it('should allow legitimate bugfix recursion', async () => {
    // SETUP
    process.env.PRP_PIPELINE_RUNNING = '12345';
    process.env.SKIP_BUG_FINDING = 'true';
    mockSession.metadata.path = 'plan/003_b3d3efdaf0ed/bugfix/001';

    // EXECUTE
    await pipeline.run();

    // VERIFY
    expect(pipeline.run()).resolves.toBeDefined();
  });
});
```

## Debug Logging Testing

```typescript
it('should log debug messages', async () => {
  // SETUP
  const debugSpy = vi.spyOn(logger, 'debug');

  // EXECUTE
  await pipeline.run();

  // VERIFY
  expect(debugSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionPath: expect.any(String),
    }),
    expect.stringContaining('Session initialized')
  );
});
```

## Session Validation Testing

Based on recent commits, the codebase has:

- Nested execution validation tests
- Bugfix session validation tests
- Guard context logging tests

## Key Test Files

1. **PRP Pipeline Tests:** `/home/dustin/projects/hacky-hack/tests/unit/workflows/prp-pipeline.test.ts`
2. **Execution Guard Tests:** `/home/dustin/projects/hacky-hack/tests/unit/utils/validation/execution-guard.test.ts`
3. **Error Tests:** `/home/dustin/projects/hacky-hack/tests/unit/utils/errors.test.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx vitest tests/unit/workflows/prp-pipeline.test.ts --run

# Run with coverage
npx vitest --coverage

# Run in watch mode
npx vitest --watch
```

## Test Best Practices

1. **Setup/Execute/Verify pattern** - Clear test structure
2. **Descriptive test names** - "should do X when Y"
3. **Isolation** - Each test is independent
4. **Comprehensive mocking** - No real I/O operations
5. **Factory functions** - Consistent test data
6. **Edge case coverage** - Test error conditions
7. **Type safety** - Use TypeScript for type checking in tests

## References

- Test Framework: Vitest
- Test Config: `vitest.config.ts`
- Setup File: `tests/setup.ts`
- PRP Pipeline Tests: `tests/unit/workflows/prp-pipeline.test.ts`
- Validation Tests: `tests/unit/utils/validation/execution-guard.test.ts`
