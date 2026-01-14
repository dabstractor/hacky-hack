# Testing Setup Research

## Testing Framework

- **Framework**: Vitest v1.6.1
- **Coverage Provider**: V8
- **Coverage Requirements**: 100% for statements, branches, functions, lines
- **Test Environment**: Node.js (not browser)

## Test Directory Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── agents/              # Agent-related tests
│   ├── config/              # Configuration tests
│   ├── core/                # Core business logic tests
│   ├── tools/               # MCP tool tests
│   ├── utils/               # Utility function tests
│   └── cli/                 # CLI command tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── manual/                  # Manual validation tests
└── fixtures/                # Test data fixtures
```

## Test Naming Conventions

- Pattern: `feature.test.ts` or `feature-name.test.ts`
- Descriptive names that explain what's being tested
- File organization mirrors source code structure

## Test Scripts

```bash
npm test              # Run vitest (watch mode)
npm run test:run      # Run once
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
npm run test:bail     # Bail on first failure
```

## Common Testing Patterns

### Mocking with Vitest

```typescript
// Module-level mocking with hoisting
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
}));

// Environment variable stubbing
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token');
});

// Cleanup
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

### Test Structure (AAA Pattern)

```typescript
describe('feature', () => {
  it('should do something', () => {
    // Arrange: Setup mocks and data
    const mock = vi.fn();

    // Act: Call the function
    const result = functionUnderTest();

    // Assert: Verify results
    expect(result).toBe(expected);
  });
});
```

## Coverage Requirements

- 100% coverage enforced for all source files
- Excludes test files, dist directories, node_modules
- Multiple reporters: text, JSON, HTML

## Test Types

1. **Unit Tests**: Test individual functions/classes in isolation
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete workflows end-to-end
4. **Manual Tests**: Validation requiring human intervention
