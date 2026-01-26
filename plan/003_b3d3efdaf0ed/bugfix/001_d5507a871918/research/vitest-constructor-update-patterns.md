# Vitest Constructor Signature Update Best Practices

**Research Date:** 2025-01-26
**Focus:** TypeScript/Vitest projects, constructor parameter updates, factory functions, test isolation
**Purpose:** Ensure one-pass implementation success for constructor signature changes

## Executive Summary

This research document captures best practices for updating test files when constructor signatures change in TypeScript/Vitest projects. It is based on analysis of the hacky-hack codebase patterns, Vitest documentation, and TypeScript testing conventions.

### Key Findings

1. **Test Constants Pattern**: Your codebase already uses `DEFAULT_*` constants successfully - continue this pattern
2. **Factory Functions**: Widely used in your tests for creating test data - extends well to constructors
3. **Parameter Validation**: Vitest's `test.each` is ideal for testing constructor parameter variations
4. **Mock Preservation**: Your current `vi.mock()` + `beforeEach` pattern preserves mocks correctly during constructor updates

---

## 1. Vitest Testing Patterns for Constructor Parameter Updates

### 1.1 Current Codebase Patterns (Working Well)

Your codebase demonstrates excellent patterns for handling constructor signatures:

**Test Constants Pattern** (from `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts`):
```typescript
// Test constants for ResearchQueue constructor parameters
const DEFAULT_MAX_SIZE = 3;
const DEFAULT_NO_CACHE = false;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

describe('ResearchQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should store sessionManager as readonly property', () => {
      const queue = new ResearchQueue(
        mockManager,
        DEFAULT_MAX_SIZE,
        DEFAULT_NO_CACHE,
        DEFAULT_CACHE_TTL_MS
      );
      expect(queue.sessionManager).toBe(mockManager);
    });
  });
});
```

**Benefits:**
- Single source of truth for default values
- Easy to update when constructor signatures change
- Clear intent: these are TEST defaults, not production defaults
- Enables easy parameter variation tests

### 1.2 Best Practice: Constructor Test Grouping

Group all constructor-related tests in a dedicated `describe('constructor')` block:

```typescript
describe('MyClass', () => {
  describe('constructor', () => {
    it('should accept all required parameters', () => {
      const instance = new MyClass(param1, param2, param3);
      expect(instance).toBeDefined();
    });

    it('should set readonly properties from parameters', () => {
      const instance = new MyClass('value1', 'value2', 3);
      expect(instance.param1).toBe('value1');
      expect(instance.param2).toBe('value2');
      expect(instance.param3).toBe(3);
    });

    it('should validate required parameters', () => {
      expect(() => new MyClass('', 'value2', 3)).toThrow(ValidationError);
    });
  });
});
```

### 1.3 Best Practice: Parameter-Specific Test Blocks

When adding new parameters (like `flushRetries`), create dedicated describe blocks:

```typescript
describe('flushRetries parameter', () => {
  it('should accept custom flushRetries value', () => {
    const manager = new SessionManager(prdPath, planDir, 5);
    expect(manager.flushRetries).toBe(5);
  });

  it('should use default flushRetries when not specified', () => {
    const manager = new SessionManager(prdPath, planDir);
    expect(manager.flushRetries).toBe(3); // Default value
  });

  it('should validate flushRetries is positive integer', () => {
    expect(() => new SessionManager(prdPath, planDir, -1))
      .toThrow('flushRetries must be positive');
  });
});
```

---

## 2. Factory Functions for Constructor Updates

### 2.1 Current Codebase Factory Patterns

Your codebase already uses factory functions effectively:

**From `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`:**
```typescript
// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
  dependencies: string[] = []
) => ({
  id,
  type: 'Subtask' as const,
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});
```

### 2.2 Best Practice: Constructor Factory Functions

Extend this pattern to constructor instantiation:

```typescript
// Factory for creating MyClass instances with test defaults
interface TestMyClassOptions {
  maxSize?: number;
  noCache?: boolean;
  cacheTtlMs?: number;
}

const createTestMyClass = (
  sessionManager: SessionManager,
  options: TestMyClassOptions = {}
): MyClass => {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    noCache = DEFAULT_NO_CACHE,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  } = options;

  return new MyClass(sessionManager, maxSize, noCache, cacheTtlMs);
};

// Usage in tests
describe('MyClass parameter variations', () => {
  it('should work with default parameters', () => {
    const instance = createTestMyClass(mockManager);
    expect(instance.maxSize).toBe(DEFAULT_MAX_SIZE);
  });

  it('should work with custom maxSize', () => {
    const instance = createTestMyClass(mockManager, { maxSize: 5 });
    expect(instance.maxSize).toBe(5);
  });

  it('should work with all custom parameters', () => {
    const instance = createTestMyClass(mockManager, {
      maxSize: 10,
      noCache: true,
      cacheTtlMs: 60000,
    });
    expect(instance.maxSize).toBe(10);
    expect(instance.noCache).toBe(true);
    expect(instance.cacheTtlMs).toBe(60000);
  });
});
```

**Benefits:**
- Centralizes constructor call pattern
- Easy to update when signature changes
- Supports both default and custom parameters
- Reduces test code duplication
- Makes parameter variation tests cleaner

### 2.3 Factory Function with Mock Management

```typescript
const createMockSessionManager = (currentSession: any): SessionManager => {
  const mockManager = {
    currentSession,
  } as unknown as SessionManager;
  return mockManager;
};

describe('ResearchQueue with factory', () => {
  let mockManager: SessionManager;

  beforeEach(() => {
    const currentSession = {
      metadata: {
        id: '001_14b9dc2a33c7',
        hash: '14b9dc2a33c7',
        path: '/plan/001_14b9dc2a33c7',
        createdAt: new Date(),
        parentSession: null,
      },
      prdSnapshot: '# Test PRD',
      taskRegistry: createTestBacklog([]),
      currentItemId: null,
    };
    mockManager = createMockSessionManager(currentSession);
  });

  it('should create instance with defaults', () => {
    const queue = createTestMyClass(mockManager);
    expect(queue).toBeDefined();
  });
});
```

---

## 3. Test Isolation When Updating Constructor Calls

### 3.1 Current Pattern: beforeEach + vi.clearAllMocks()

Your codebase correctly uses `beforeEach` for test isolation:

```typescript
describe('SessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should validate PRD file exists', () => {
      mockStatSync.mockReturnValue({ isFile: () => true });
      const manager = new SessionManager('/test/PRD.md', resolve('plan'));
      expect(manager.prdPath).toBe('/test/PRD.md');
    });
  });
});
```

### 3.2 Best Practice: Isolated Constructor Setup

When updating constructor signatures, maintain isolation by:

1. **Reset mocks before each test:**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     // Reset mock implementations if needed
     mockStatSync.mockReset();
   });
   ```

2. **Use descriptive test names:**
   ```typescript
   it('should accept planDir as second parameter', () => {
     // Clear intent about what's being tested
   });
   ```

3. **Avoid shared state:**
   ```typescript
   // BAD: Shared state
   let manager: SessionManager;
   beforeEach(() => {
     manager = new SessionManager(prdPath, planDir, flushRetries);
   });

   // GOOD: Fresh instance per test
   it('should do something', () => {
     const manager = new SessionManager(prdPath, planDir, flushRetries);
     // Test logic
   });
   ```

### 3.3 Best Practice: Mock Setup Isolation

When constructors call mocked dependencies, ensure mocks don't leak:

```typescript
describe('constructor with mocked dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call PRPGenerator with correct parameters', () => {
    const mockGenerate = vi.fn().mockResolvedValue(createTestPRPDocument('P1.M1.T1.S1'));
    MockPRPGenerator.mockImplementation(() => ({
      generate: mockGenerate,
    }));

    new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);

    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );
  });

  it('should not call PRPGenerator when maxSize is 0', () => {
    // This test needs different mock setup
    const mockGenerate = vi.fn();
    MockPRPGenerator.mockImplementation(() => ({
      generate: mockGenerate,
    }));

    new ResearchQueue(mockManager, 0, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);

    expect(MockPRPGenerator).not.toHaveBeenCalled();
  });
});
```

---

## 4. Parameterized Testing for Constructor Values

### 4.1 Using `test.each` for Constructor Parameters

Vitest's `test.each` is ideal for testing different constructor parameter values:

```typescript
describe('flushRetries parameter validation', () => {
  test.each([
    { flushRetries: 0, shouldPass: false, description: 'zero' },
    { flushRetries: -1, shouldPass: false, description: 'negative' },
    { flushRetries: 1, shouldPass: true, description: 'minimum valid' },
    { flushRetries: 3, shouldPass: true, description: 'default' },
    { flushRetries: 10, shouldPass: true, description: 'large value' },
  ])('should $flushRetries ($description)', ({ flushRetries, shouldPass }) => {
    mockStatSync.mockReturnValue({ isFile: () => true });

    if (shouldPass) {
      const manager = new SessionManager(prdPath, planDir, flushRetries);
      expect(manager.flushRetries).toBe(flushRetries);
    } else {
      expect(() => new SessionManager(prdPath, planDir, flushRetries))
        .toThrow();
    }
  });
});
```

### 4.2 Parameter Testing with Edge Cases

```typescript
describe('constructor parameter edge cases', () => {
  test.each([
    { maxSize: 1, description: 'minimum concurrency' },
    { maxSize: 3, description: 'default concurrency' },
    { maxSize: 10, description: 'maximum concurrency' },
  ])('should handle $description (maxSize=$maxSize)', ({ maxSize }) => {
    const queue = new ResearchQueue(
      mockManager,
      maxSize,
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );
    expect(queue.maxSize).toBe(maxSize);
  });

  test.each([
    { noCache: true, cacheTtlMs: 0, description: 'no cache, zero TTL' },
    { noCache: false, cacheTtlMs: 60000, description: 'cache enabled, 1min TTL' },
    { noCache: false, cacheTtlMs: 86400000, description: 'cache enabled, 24hr TTL' },
  ])('should configure caching: $description', ({ noCache, cacheTtlMs }) => {
    const queue = new ResearchQueue(
      mockManager,
      DEFAULT_MAX_SIZE,
      noCache,
      cacheTtlMs
    );
    // Verify caching configuration
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      noCache,
      cacheTtlMs
    );
  });
});
```

### 4.3 Testing Parameter Forwarding

When constructors forward parameters to dependencies:

```typescript
describe('PRPGenerator parameter forwarding', () => {
  it('should forward noCache=true to PRPGenerator', () => {
    new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, true, DEFAULT_CACHE_TTL_MS);
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      true,
      DEFAULT_CACHE_TTL_MS
    );
  });

  it('should forward custom cacheTtlMs to PRPGenerator', () => {
    const customTtl = 12 * 60 * 60 * 1000; // 12 hours
    new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, customTtl);
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      DEFAULT_NO_CACHE,
      customTtl
    );
  });
});
```

---

## 5. Test Constants and Default Values Pattern

### 5.1 Constants File Pattern

For larger projects, consider a dedicated test constants file:

```typescript
// tests/constants/constructor-defaults.ts
export const RESEARCH_QUEUE_DEFAULTS = {
  MAX_SIZE: 3,
  NO_CACHE: false,
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const SESSION_MANAGER_DEFAULTS = {
  PRD_PATH: '/test/PRD.md',
  PLAN_DIR: 'plan',
  FLUSH_RETRIES: 3,
} as const;

export const CACHE_TTL_PRESETS = {
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;
```

Usage:
```typescript
import { RESEARCH_QUEUE_DEFAULTS, CACHE_TTL_PRESETS } from '../constants/constructor-defaults.js';

describe('ResearchQueue', () => {
  it('should use default cache TTL', () => {
    const queue = new ResearchQueue(
      mockManager,
      RESEARCH_QUEUE_DEFAULTS.MAX_SIZE,
      RESEARCH_QUEUE_DEFAULTS.NO_CACHE,
      RESEARCH_QUEUE_DEFAULTS.CACHE_TTL_MS
    );
    expect(queue.cacheTtlMs).toBe(RESEARCH_QUEUE_DEFAULTS.CACHE_TTL_MS);
  });

  it('should accept one hour cache TTL', () => {
    const queue = new ResearchQueue(
      mockManager,
      RESEARCH_QUEUE_DEFAULTS.MAX_SIZE,
      RESEARCH_QUEUE_DEFAULTS.NO_CACHE,
      CACHE_TTL_PRESETS.ONE_HOUR
    );
    expect(queue.cacheTtlMs).toBe(CACHE_TTL_PRESETS.ONE_HOUR);
  });
});
```

### 5.2 Documenting Default Values

Add JSDoc comments to test constants for clarity:

```typescript
/**
 * Default test values for ResearchQueue constructor
 *
 * @remarks
 * These values match the production defaults in src/core/research-queue.ts
 * Update both files together when changing defaults.
 */
export const DEFAULT_MAX_SIZE = 3;
export const DEFAULT_NO_CACHE = false;
export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
```

---

## 6. Mock Preservation When Updating Constructors

### 6.1 Current Pattern: Module-Level Mocks

Your codebase correctly uses module-level mocks:

```typescript
// Mock the prp-generator module
vi.mock('../../../src/agents/prp-generator.js', () => ({
  PRPGenerator: vi.fn(),
}));

// Import PRPGenerator after mocking to access the mock
import { PRPGenerator } from '../../../src/agents/prp-generator.js';

// Cast mocked constructor
const MockPRPGenerator = PRPGenerator as any;
```

### 6.2 Best Practice: Mock Reset in beforeEach

When updating constructors, ensure mocks are properly reset:

```typescript
describe('MyClass', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations to default
    MockPRPGenerator.mockImplementation(() => ({
      generate: vi.fn().mockResolvedValue(defaultPRP),
    }));
  });

  it('should use default mock behavior', () => {
    // Test with default mock
    const instance = new MyClass(param1, param2);
  });

  it('should use custom mock behavior', () => {
    // Override mock for this test only
    const customMock = vi.fn().mockResolvedValue(customPRP);
    MockPRPGenerator.mockImplementation(() => ({
      generate: customMock,
    }));

    const instance = new MyClass(param1, param2);
    expect(customMock).toHaveBeenCalled();
  });

  // Mock reset to default in beforeEach ensures
  // subsequent tests don't see customMock
});
```

### 6.3 Best Practice: Mock Implementation Patterns

```typescript
describe('constructor with dependency injection', () => {
  const defaultMockImplementation = () => ({
    generate: vi.fn().mockResolvedValue(createTestPRPDocument('test-id')),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockPRPGenerator.mockImplementation(defaultMockImplementation);
  });

  it('should create PRPGenerator with sessionManager', () => {
    new ResearchQueue(mockManager, DEFAULT_MAX_SIZE, DEFAULT_NO_CACHE, DEFAULT_CACHE_TTL_MS);

    expect(MockPRPGenerator).toHaveBeenCalledTimes(1);
    expect(MockPRPGenerator).toHaveBeenCalledWith(
      mockManager,
      DEFAULT_NO_CACHE,
      DEFAULT_CACHE_TTL_MS
    );
  });

  it('should preserve mock across multiple instantiations', () => {
    const queue1 = new ResearchQueue(mockManager, 3, false, 86400000);
    const queue2 = new ResearchQueue(mockManager, 5, true, 3600000);

    expect(MockPRPGenerator).toHaveBeenCalledTimes(2);
    expect(MockPRPGenerator).toHaveBeenNthCalledWith(1, mockManager, false, 86400000);
    expect(MockPRPGenerator).toHaveBeenNthCalledWith(2, mockManager, true, 3600000);
  });
});
```

---

## 7. Migration Patterns: Updating Existing Tests

### 7.1 Step-by-Step Migration Process

When updating constructor signatures across many test files:

**Step 1: Add Test Constants**
```typescript
// Add at top of test file
const DEFAULT_PRD_PATH = '/test/PRD.md';
const DEFAULT_PLAN_DIR = 'plan';
const DEFAULT_FLUSH_RETRIES = 3;
```

**Step 2: Update Constructor Calls Incrementally**
```typescript
// Before
new SessionManager(prdPath, flushRetries);

// After
new SessionManager(prdPath, resolve(DEFAULT_PLAN_DIR), flushRetries);
```

**Step 3: Add Parameter-Specific Tests**
```typescript
describe('planDir parameter', () => {
  it('should accept custom planDir', () => {
    const customPlanDir = '/custom/plan';
    const manager = new SessionManager(DEFAULT_PRD_PATH, customPlanDir, DEFAULT_FLUSH_RETRIES);
    expect(manager.planDir).toContain(customPlanDir);
  });
});
```

**Step 4: Verify Parameter Forwarding**
```typescript
describe('constructor parameter forwarding', () => {
  it('should pass all parameters to dependencies', () => {
    const manager = new SessionManager(prdPath, planDir, 5);
    // Verify flushRetries is used correctly in flush operations
  });
});
```

### 7.2 Batch Update Pattern

For updating many similar constructor calls:

```typescript
// Use a helper function for the transition
const createSessionManager = (
  prdPath: string,
  planDir?: string,
  flushRetries?: number
): SessionManager => {
  // During transition: provide defaults for old signature
  const actualPlanDir = planDir ?? resolve('plan');
  const actualFlushRetries = flushRetries ?? 3;

  return new SessionManager(prdPath, actualPlanDir, actualFlushRetries);
};

// Then update tests incrementally
it('should work with old pattern', () => {
  const manager = createSessionManager(prdPath, undefined, 3);
});

it('should work with new pattern', () => {
  const manager = createSessionManager(prdPath, planDir, 3);
});

// Eventually replace with direct constructor calls
it('should use direct constructor', () => {
  const manager = new SessionManager(prdPath, planDir, 3);
});
```

---

## 8. Vitest-Specific Features for Constructor Testing

### 8.1 Using `vi.fn()` for Constructor Spying

```typescript
describe('constructor call tracking', () => {
  it('should track constructor calls', () => {
    const MockConstructor = vi.fn();
    MockConstructor.mockImplementation((...args) => ({
      args,
      value: 'instance',
    }));

    const instance1 = new (MockConstructor as any)('a', 'b', 'c');
    const instance2 = new (MockConstructor as any)('x', 'y', 'z');

    expect(MockConstructor).toHaveBeenCalledTimes(2);
    expect(MockConstructor).toHaveBeenNthCalledWith(1, 'a', 'b', 'c');
    expect(MockConstructor).toHaveBeenNthCalledWith(2, 'x', 'y', 'z');
  });
});
```

### 8.2 Using `vi.mocked()` for Type Safety

```typescript
import { writeFile } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

const mockWriteFile = vi.mocked(writeFile);

describe('constructor with file operations', () => {
  it('should use type-safe mocks', () => {
    mockWriteFile.mockResolvedValue(undefined);

    const instance = new MyClass(config);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });
});
```

### 8.3 Using `describe.each()` for Constructor Variants

```typescript
describe.each([
  { variant: 'default', maxSize: 3, noCache: false, cacheTtlMs: 86400000 },
  { variant: 'high-concurrency', maxSize: 10, noCache: false, cacheTtlMs: 86400000 },
  { variant: 'no-cache', maxSize: 3, noCache: true, cacheTtlMs: 0 },
])('ResearchQueue variant: $variant', ({ maxSize, noCache, cacheTtlMs }) => {
  it(`should create instance with ${maxSize} max size`, () => {
    const queue = new ResearchQueue(mockManager, maxSize, noCache, cacheTtlMs);
    expect(queue.maxSize).toBe(maxSize);
  });

  it(`should configure caching: noCache=${noCache}`, () => {
    const queue = new ResearchQueue(mockManager, maxSize, noCache, cacheTtlMs);
    expect(queue.noCache).toBe(noCache);
  });
});
```

---

## 9. Common Pitfalls and Solutions

### 9.1 Pitfall: Not Updating All Test Files

**Problem:** Constructor signature updated but some tests still use old signature.

**Solution:**
```bash
# Find all constructor calls
grep -r "new SessionManager(" tests/

# Use test constants consistently
# Use IDE refactor tools to update all occurrences
```

### 9.2 Pitfall: Mock Leaking Between Tests

**Problem:** Mock implementations from previous tests affect current test.

**Solution:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset to default implementation
  MockConstructor.mockImplementation(defaultImpl);
});

it('should use custom mock', () => {
  MockConstructor.mockImplementation(customImpl);
  // Test
});

// Next test gets default implementation due to beforeEach
```

### 9.3 Pitfall: Test Constants Mismatch with Production

**Problem:** Test default values don't match production defaults.

**Solution:**
```typescript
/**
 * Test defaults must match production defaults in src/core/research-queue.ts
 * @see src/core/research-queue.ts line 50
 */
export const DEFAULT_MAX_SIZE = 3; // Matches production default
```

### 9.4 Pitfall: Forgetting Parameter Validation Tests

**Problem:** New parameter added but validation tests missing.

**Solution:**
```typescript
describe('new parameter validation', () => {
  test.each([
    { value: -1, shouldPass: false },
    { value: 0, shouldPass: false },
    { value: 1, shouldPass: true },
    { value: 100, shouldPass: true },
  ])('should validate $value', ({ value, shouldPass }) => {
    if (shouldPass) {
      expect(() => new MyClass(param1, param2, value)).not.toThrow();
    } else {
      expect(() => new MyClass(param1, param2, value)).toThrow();
    }
  });
});
```

---

## 10. Checklist for Constructor Signature Updates

### Pre-Update Checklist
- [ ] Document current constructor signature
- [ ] List all test files that instantiate the class
- [ ] Identify production code that instantiates the class
- [ ] Define new parameter defaults
- [ ] Plan parameter validation rules

### During Update Checklist
- [ ] Add test constants at top of test files
- [ ] Update constructor calls in tests
- [ ] Add parameter-specific describe blocks
- [ ] Add parameter validation tests
- [ ] Verify parameter forwarding to dependencies
- [ ] Update production code instantiations
- [ ] Run tests after each file update

### Post-Update Checklist
- [ ] All tests pass with new signature
- [ ] No compiler errors
- [ ] Coverage maintained at 100%
- [ ] Integration tests pass
- [ ] Document breaking changes
- [ ] Update JSDoc/comments

---

## 11. References and Resources

### Vitest Documentation
- **Vitest Guide:** https://vitest.dev/guide/
- **Vitest API:** https://vitest.dev/api/
- **Test Context:** https://vitest.dev/guide/test-context.html
- **Mock Functions:** https://vitest.dev/api/mock.html

### TypeScript Testing Patterns
- **Vitest TypeScript Config:** `/home/dustin/projects/hacky-hack/vitest.config.ts`
- **Your Test Constants:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts` (lines 102-104)
- **Your Factory Functions:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts` (lines 110-169)

### Codebase Examples
- **ResearchQueue Tests:** `/home/dustin/projects/hacky-hack/tests/unit/core/research-queue.test.ts`
- **SessionManager Tests:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-manager.test.ts`
- **Flush Retry Tests:** `/home/dustin/projects/hacky-hack/tests/unit/core/flush-retry.test.ts`
- **Current Task Tracking:** `/home/dustin/projects/hacky-hack/plan/003_b3d3efdaf0ed/bugfix/001_d5507a871918/tasks.json`

---

## Appendix: Quick Reference Patterns

### Pattern 1: Basic Constructor Test
```typescript
const DEFAULT_PARAM = 'value';

describe('constructor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept all parameters', () => {
    const instance = new MyClass(param1, param2, param3);
    expect(instance).toBeDefined();
  });
});
```

### Pattern 2: Parameterized Constructor Tests
```typescript
test.each([
  { param: 1, expected: true },
  { param: 2, expected: false },
])('should handle $param', ({ param, expected }) => {
  const instance = new MyClass(param);
  expect(instance.isValid).toBe(expected);
});
```

### Pattern 3: Factory Function
```typescript
const createTestInstance = (overrides = {}) => {
  return new MyClass({
    param1: 'default1',
    param2: 'default2',
    ...overrides,
  });
};
```

### Pattern 4: Mock Preservation
```typescript
describe('with mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockDependency.mockImplementation(defaultImpl);
  });

  it('should preserve mocks', () => {
    const instance = new MyClass(param);
    expect(MockDependency).toHaveBeenCalledWith(param);
  });
});
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-26
**Status:** Ready for PRP Implementation
