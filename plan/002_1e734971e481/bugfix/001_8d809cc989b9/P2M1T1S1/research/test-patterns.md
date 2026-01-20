# Test Patterns for PRPPipeline Logging Validation

## Test Files Structure and Locations

**Primary PRPPipeline test files:**
- `tests/unit/workflows/prp-pipeline.test.ts` - Main PRPPipeline unit tests
- `tests/unit/workflows/prp-pipeline-progress.test.ts` - Progress tracking integration tests

**Test file naming convention:**
- Unit tests: `*.test.ts` (e.g., `prp-pipeline.test.ts`)
- Located in: `tests/unit/[module]/` directory structure
- Follows the pattern: `{component-name}.test.ts`

## Logger Mocking Patterns

### Standard logger mock setup
```typescript
// Mock the logger with hoisted variables
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the logger module
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

### Usage in tests
```typescript
const infoSpy = vi.spyOn((pipeline as any).logger, 'info');
const errorSpy = vi.spyOn((pipeline as any).logger, 'error');

// After execution
expect(infoSpy).toHaveBeenCalledWith(
  expect.stringContaining('Expected message')
);
infoSpy.mockRestore();
```

## Validation Patterns for Debug Logging

### Enable verbose mode in test logger
```typescript
const logger = getLogger('TestContext', { verbose: true, level: LogLevel.DEBUG });
```

### Spy on debug method
```typescript
const debugSpy = vi.spyOn((pipeline as any).logger, 'debug');

// Execute code that should trigger debug logs
await pipeline.initializeSession();

// Verify debug calls
expect(debugSpy).toHaveBeenCalledWith(
  expect.stringContaining('Debug message content')
);
```

### Test log level filtering
```typescript
it('should not log debug messages when verbose is disabled', () => {
  const pipeline = new PRPPipeline('./test.md');
  const debugSpy = vi.spyOn((pipeline as any).logger, 'debug');

  // Default logger (INFO level)
  pipeline.someOperation();

  // Debug should not be called
  expect(debugSpy).not.toHaveBeenCalled();
});
```

## Specific PRPPipeline Logging Test Examples

### Shutdown logging validation
```typescript
it('should log warning on duplicate SIGINT', () => {
  const pipeline = new PRPPipeline('./test.md');
  const warnSpy = vi.spyOn((pipeline as any).logger, 'warn');

  process.emit('SIGINT');
  process.emit('SIGINT');

  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Duplicate SIGINT received')
  );
});
```

### Error logging validation
```typescript
it('should log fatal errors appropriately', async () => {
  const pipeline = new PRPPipeline('./test.md');
  const errorSpy = vi.spyOn((pipeline as any).logger, 'error');

  // Mock an error
  const mockError = new Error('Test error');
  // Setup to trigger error

  await expect(pipeline.run()).rejects.toThrow();

  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining('Fatal error message')
  );
});
```

## Key Insights for Logging Testing

1. **Mock the logger, not pino directly** - The codebase wraps pino in a custom interface, so tests mock the custom interface.

2. **Use `vi.spyOn()` for method verification** - This allows tracking individual method calls while preserving the mock implementation.

3. **Test log level filtering** - Verify that debug logs are only emitted when verbose mode is enabled.

4. **Clean up spies** - Always call `spy.mockRestore()` or use `afterEach` to clean up.

5. **Test both message formats** - The logger supports both string and object+string message formats.

6. **Verify context prefixes** - PRPPipeline logs use `[PRPPipeline]` prefix for easy identification.

7. **Test error context** - Error logs include structured data with error codes and stack traces.
