# External Research: Pino Logger Testing Best Practices

## Research Sources

Based on comprehensive research on testing Pino logger in TypeScript/Vitest projects:

### Official Documentation

- **Pino Documentation**: https://getpino.io/#/
- **Pino Ecosystem Testing**: https://github.com/pinojs/pino/blob/master/docs/ecosystem.md
- **Vitest Mocking Guide**: https://vitest.dev/guide/mocking.html

## Key Findings

### 1. Recommended Testing Approaches

**Approach A: Silent Log Level for Integration Tests**

```typescript
const testLogger = pino({
  level: 'silent',
  formatters: {
    level: label => {
      return { level: label };
    },
  },
});
```

**Approach B: Dependency Injection Pattern**

```typescript
export class UserService {
  constructor(private logger: pino.Logger) {}
}

// In tests
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};
const service = new UserService(mockLogger as any);
```

**Approach C: Stream Capture for Log Content Validation**

```typescript
const logs: any[] = [];
const stream = {
  write: (log: any) => {
    logs.push(JSON.parse(log));
  },
};
const logger = pino({ level: 'trace' }, stream as any);
```

### 2. Vitest Spies for Logger Methods

```typescript
describe('Logger assertions', () => {
  let logger: pino.Logger;

  beforeEach(() => {
    logger = pino({ level: 'silent' });
  });

  it('should assert info log was called', () => {
    const infoSpy = vi.spyOn(logger, 'info');

    logger.info({ userId: '123' }, 'User logged in');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith({ userId: '123' }, 'User logged in');
  });
});
```

### 3. Migration from console.log to Pino

**Before (console.log):**

```typescript
console.log('Processing data:', data);
```

**After (Pino with structured logging):**

```typescript
logger.info({ data }, 'Processing data');
```

**Test Migration:**

```typescript
// Before
const consoleSpy = vi.spyOn(console, 'log');
expect(consoleSpy).toHaveBeenCalledWith('Processing data:', { id: 1 });

// After
const mockLogger = { info: vi.fn() };
expect(mockLogger.info).toHaveBeenCalledWith(
  { data: { id: 1 } },
  'Processing data'
);
```

### 4. Key Takeaways

1. **Prefer dependency injection** over mocking for better testability
2. **Use silent log level** for integration tests where log assertions aren't needed
3. **Capture logs to a stream** when asserting log content is required
4. **Use Vitest spies** for simple assertions on logger method calls
5. **Test structured data** by matching log objects with `toMatchObject()`
6. **Avoid module-level logger instances** - make them injectable
7. **Clear mocks and captured logs** between tests

### 5. Common Patterns in This Codebase

From the codebase analysis:

**Pattern 1: Module Mocking with vi.hoisted()**

```typescript
const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));
```

**Pattern 2: Direct Mock Usage**

```typescript
// Tests use mockLogger directly
expect(mockLogger.info).toHaveBeenCalledWith(
  { taskId: 'P1.M1.T1' },
  'Task started'
);
```

**Pattern 3: Partial Object Matching**

```typescript
expect(mockLogger.info).toHaveBeenCalledWith(
  expect.objectContaining({
    taskId: 'P1.M1.T1',
  }),
  'Task started'
);
```

## Application to Task Orchestrator Tests

The Task Orchestrator tests should follow Pattern 1 (already in place) but need to:

1. **Remove console.log spies** - These are outdated
2. **Use mockLogger directly** - Already mocked, just need to reference it
3. **Match structured data** - Use object matching instead of string matching
4. **Verify log levels** - Check info/warn/error/debug are used correctly

## Conclusion

The codebase already has the correct mock setup. The issue is that test assertions reference `console.log` instead of `mockLogger`. The fix is straightforward: update test assertions to use the already-mocked logger.
