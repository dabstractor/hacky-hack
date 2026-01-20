# Testing Patterns Analysis for Hacky-Hack Codebase

## Executive Summary

This document provides a comprehensive analysis of the testing patterns in this codebase, specifically for unit tests that mock environment variables and test guard/check logic.

---

## 1. Testing Framework Identification

**Framework: Vitest** (v1.6.1)
- Modern, fast testing framework designed for Vite projects
- Excellent TypeScript support and built-in mocking capabilities
- 100% coverage requirements for all metrics

**Key Vitest Features Used:**
- `vi.stubEnv()` for environment variable mocking
- `vi.unstubAllEnvs()` for cleanup
- `vi.fn()` for function mocking
- `vi.spyOn()` for method spying
- `vi.clearAllMocks()` for clearing mock histories
- Global setup/teardown hooks in `tests/setup.ts`

---

## 2. Environment Variable Mocking Patterns

### Primary Pattern: `vi.stubEnv()` with Global Cleanup

**Basic Usage:**
```typescript
vi.stubEnv('VARIABLE_NAME', 'value');
```

**Complete Pattern with Cleanup:**
```typescript
describe('Environment-dependent feature', () => {
  afterEach(() => {
    vi.unstubAllEnvs(); // Always restore environment
  });

  it('should work with mocked environment', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    // Test code
  });
});
```

### Environment Variable Setup Examples

From `tests/unit/config/environment.test.ts`:

```typescript
// Setup: Clear API_KEY, set AUTH_TOKEN
delete process.env.ANTHROPIC_API_KEY;
vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'test-token-123');

// Verify: API_KEY should be set from AUTH_TOKEN
expect(process.env.ANTHROPIC_API_KEY).toBe('test-token-123');
```

### Cleanup Pattern

**Global Setup (tests/setup.ts):**
```typescript
afterEach(() => {
  // CLEANUP: Restore all environment variable stubs
  vi.unstubAllEnvs();
});
```

**Test-level Cleanup:**
```typescript
afterEach(() => {
  vi.unstubAllEnvs();
});
```

---

## 3. Test Structure Conventions

### File Naming
- Test files follow the pattern: `[filename].test.ts`
- Located in `tests/unit/` for unit tests
- Integration tests in `tests/integration/`

### Test Organization
```typescript
describe('Module/Component Name', () => {
  describe('Specific feature', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Clear Sections Pattern

Tests are well-structured with clear sections:
- **SETUP**: Preparation step
- **EXECUTE**: Action being tested
- **VERIFY**: Assertions

Example from `tests/unit/is-fatal-error.test.ts`:
```typescript
it('should return true for SessionError with LOAD_FAILED code', () => {
  // SETUP: Create SessionError instance
  const error = new SessionError('Session load failed', {
    sessionPath: '/path/to/session',
  });

  // EXECUTE: Call isFatalError
  const result = isFatalError(error);

  // VERIFY: Assert expected behavior
  expect(result).toBe(true);
});
```

---

## 4. Assertion Patterns

### Standard Expectations
```typescript
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(array).toContain(expected);
expect(object).toHaveProperty('key', 'value');
```

### Error Testing Patterns
```typescript
// Should throw
expect(() => function()).toThrow(ExpectedError);

// Should not throw
expect(() => function()).not.toThrow();

// Type checking
expect(error).toBeInstanceOf(ErrorType);
```

### Async Testing
```typescript
// Promise resolution
await expect(promise).resolves.toBe(expected);

// Promise rejection
await expect(promise).rejects.toThrow(expected);
```

---

## 5. Mock Helper Functions and Patterns

### Function Mocking
```typescript
// Create mock function
const mockFunction = vi.fn();
mockFunction.mockReturnValue('value');
mockFunction.mockImplementation((arg) => `processed-${arg}`);
```

### Mock Module Imports
```typescript
vi.mock('../../src/agents/agent-factory.js', () => ({
  createArchitectAgent: vi.fn(),
  createQAAgent: vi.fn(),
  // ... other mocks
}));
```

### Complex Mock Objects
```typescript
const mockSessionManager = {
  currentSession: null,
  initialize: vi.fn().mockResolvedValue({
    metadata: { id: 'test', hash: 'abc' },
    prdSnapshot: '# Test',
    taskRegistry: backlog,
    currentItemId: null,
  }),
  saveBacklog: vi.fn().mockResolvedValue(undefined),
};
```

---

## 6. Logger Mock Patterns

### Logger Testing Approach

From `tests/unit/logger.test.ts`:

```typescript
// Logger tests focus on interface validation
describe('Logger utility', () => {
  it('should return a Logger interface', () => {
    const logger = getLogger('TestContext');
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
  });
});
```

### Sensitive Data Redaction
```typescript
// Test redaction configuration
it('should redact apiKey field', () => {
  const logger = getLogger('RedactTest');
  expect(() =>
    logger.info({ apiKey: 'sk-secret123' }, 'API call')
  ).not.toThrow();
});
```

---

## 7. Guard/Check Validation Testing Patterns

### Fatal Error Detection Testing

From `tests/unit/is-fatal-error.test.ts`:

```typescript
describe('isFatalError', () => {
  describe('Fatal errors (return true)', () => {
    it('should return true for SessionError with LOAD_FAILED code', () => {
      const error = new SessionError('Session load failed', {
        sessionPath: '/path/to/session',
      });
      expect(isFatalError(error)).toBe(true);
    });

    it('should return true for any EnvironmentError', () => {
      const error = new EnvironmentError('Missing API key', {
        variable: 'API_KEY',
      });
      expect(isFatalError(error)).toBe(true);
    });
  });

  describe('Non-fatal errors (return false)', () => {
    it('should return false for TaskError instances', () => {
      const error = new TaskError('Task execution failed', {
        taskId: 'P1.M1.T1',
      });
      expect(isFatalError(error)).toBe(false);
    });
  });
});
```

### Environment Validation Testing
```typescript
describe('validateEnvironment', () => {
  it('should throw when API_KEY is missing', () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
  });

  it('should include missing variable name in error', () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://api.example.com');

    try {
      validateEnvironment();
      expect(true).toBe(false); // Should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(EnvironmentValidationError);
      if (e instanceof EnvironmentValidationError) {
        expect(e.missing).toEqual(['ANTHROPIC_API_KEY']);
      }
    }
  });
});
```

---

## 8. Test Setup and Global Patterns

### Global Setup (tests/setup.ts)
```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Clear mock call histories
  vi.unstubAllEnvs(); // Clear environment stubs
  // ... other setup
});

afterEach(() => {
  vi.unstubAllEnvs(); // Restore environment variables
  // ... cleanup
});
```

### Setup Verification

The codebase includes `tests/unit/setup-verification.test.ts` to verify global setup works:

```typescript
describe('vi.unstubAllEnvs() verification', () => {
  it('should restore environment variables between tests - test 2', () => {
    // FAILS if vi.unstubAllEnvs() is NOT called in global afterEach
    expect(process.env[ENV_LEAK_KEY]).toBeUndefined();
  });
});
```

---

## 9. Best Practices and Gotchas

### Gotchas to Avoid:

1. **Always Clean Up Environment Variables:**
   ```typescript
   afterEach(() => {
     vi.unstubAllEnvs();
   });
   ```

2. **Use Clear Sections in Tests:**
   ```typescript
   // SETUP
   vi.stubEnv('VARIABLE', 'value');

   // EXECUTE
   const result = functionUnderTest();

   // VERIFY
   expect(result).toBe(expected);
   ```

3. **Mock Dependencies Properly:**
   ```typescript
   vi.mock('module-name', () => ({
     exportedFunction: vi.fn().mockResolvedValue('mock-result')
   }));
   ```

4. **Test Error Conditions:**
   ```typescript
   it('should handle missing environment', () => {
     delete process.env.REQUIRED_VAR;
     expect(() => function()).toThrow(MissingEnvError);
   });
   ```

### Best Practices:

1. **Arrange-Act-Assert Pattern:** Clear separation of test phases
2. **One Assertion per Test (when possible):** Makes debugging easier
3. **Comprehensive Error Testing:** Test both success and failure cases
4. **Type Safety:** Use TypeScript guards in error testing
5. **Edge Case Testing:** Long strings, special characters, unicode, etc.

---

## 10. Pattern for Nested Execution Guard Testing

Based on the analysis, here's the recommended pattern for testing the nested execution guard:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateNestedExecutionGuard } from '../../src/utils/execution-guard.js';
import { getLogger } from '../../src/utils/logger.js';

describe('Nested Execution Guard', () => {
  let logger: ReturnType<typeof getLogger>;

  beforeEach(() => {
    logger = getLogger('NestedExecutionGuardTest');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Basic Guard Functionality', () => {
    it('should allow execution when PRP_PIPELINE_RUNNING is not set', () => {
      // SETUP: Ensure PRP_PIPELINE_RUNNING is not set
      delete process.env.PRP_PIPELINE_RUNNING;

      // EXECUTE: Validate guard
      expect(() =>
        validateNestedExecutionGuard({ logger })
      ).not.toThrow();

      // VERIFY: PRP_PIPELINE_RUNNING is set to current PID
      expect(process.env.PRP_PIPELINE_RUNNING).toBe(process.pid.toString());
    });

    it('should block execution when PRP_PIPELINE_RUNNING is already set', () => {
      // SETUP: Set PRP_PIPELINE_RUNNING to a different PID
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');

      // EXECUTE & VERIFY: Should throw
      expect(() =>
        validateNestedExecutionGuard({ logger })
      ).toThrow('Pipeline already running');
    });
  });

  describe('Bug Fix Recursion Exception', () => {
    it('should allow recursion when SKIP_BUG_FINDING=true and path contains bugfix', () => {
      // SETUP: Set both conditions for allowed recursion
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE: Should not throw
      expect(() =>
        validateNestedExecutionGuard({ logger, planDir: process.env.PLAN_DIR })
      ).not.toThrow();
    });

    it('should block recursion when SKIP_BUG_FINDING=true but path does not contain bugfix', () => {
      // SETUP: Set SKIP_BUG_FINDING but not bugfix path
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('SKIP_BUG_FINDING', 'true');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed');

      // EXECUTE & VERIFY: Should throw
      expect(() =>
        validateNestedExecutionGuard({ logger, planDir: process.env.PLAN_DIR })
      ).toThrow('Pipeline already running');
    });

    it('should block recursion when path contains bugfix but SKIP_BUG_FINDING is not true', () => {
      // SETUP: Set bugfix path but not SKIP_BUG_FINDING
      vi.stubEnv('PRP_PIPELINE_RUNNING', '99999');
      vi.stubEnv('PLAN_DIR', '/path/to/plan/003_b3d3efdaf0ed/bugfix/P1M1T1S1');

      // EXECUTE & VERIFY: Should throw
      expect(() =>
        validateNestedExecutionGuard({ logger, planDir: process.env.PLAN_DIR })
      ).toThrow('Pipeline already running');
    });
  });

  describe('Debug Logging', () => {
    it('should log environment check details', () => {
      // SETUP: Mock logger
      const debugSpy = vi.spyOn(logger, 'debug');

      // EXECUTE
      validateNestedExecutionGuard({ logger });

      // VERIFY: Debug log was called with correct structure
      expect(debugSpy).toHaveBeenCalledWith(
        '[Nested Guard] Environment Check',
        expect.objectContaining({
          PRP_PIPELINE_RUNNING: expect.any(String),
          SKIP_BUG_FINDING: expect.any(String),
          currentPath: expect.any(String),
        })
      );
    });
  });
});
```

---

## Conclusion

This codebase demonstrates mature testing practices with excellent attention to test isolation, proper mocking, and comprehensive coverage of edge cases. The patterns documented here can be directly applied to testing the nested execution guard and other complex validation logic.
