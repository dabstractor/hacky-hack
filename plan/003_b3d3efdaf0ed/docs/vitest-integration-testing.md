# Vitest Integration Testing Patterns Research

**Project:** hacky-hack scope resolution testing
**Date:** 2026-01-21
**Focus:** Integration testing patterns for scope resolution features

## Table of Contents

1. [Vitest Best Practices](#vitest-best-practices)
2. [Testing TypeScript Error Classes](#testing-typescript-error-classes)
3. [Testing Regex Validation Functions](#testing-regex-validation-functions)
4. [BeforeEach/AfterEach Patterns](#beforeeachaftereach-patterns)
5. [Mock Factory Function Patterns](#mock-factory-function-patterns)
6. [Testing Nested Hierarchical Structures](#testing-nested-hierarchical-structures)
7. [Project-Specific Patterns](#project-specific-patterns)

---

## Vitest Best Practices

### Official Documentation

- **Main Guide:** https://vitest.dev/guide/
- **API Reference:** https://vitest.dev/api/
- **Configuration:** https://vitest.dev/config/
- **Coverage:** https://vitest.dev/guide/coverage.html

### Core Testing Patterns

#### 1. Test Structure: Setup/Execute/Verify

The project follows the classic AAA (Arrange-Act-Assert) pattern, documented as Setup/Execute/Verify:

```typescript
describe('feature being tested', () => {
  it('should do something specific', () => {
    // SETUP: Arrange test data and mocks
    const inputData = createTestData();
    const mockFn = vi.fn();

    // EXECUTE: Call the function being tested
    const result = functionUnderTest(inputData);

    // VERIFY: Assert expected outcomes
    expect(result).toBe(expectedValue);
    expect(mockFn).toHaveBeenCalledWith(expectedArgs);
  });
});
```

#### 2. Test Organization with Nested Describes

Use nested `describe` blocks to organize tests by feature and scenario:

```typescript
describe('ScopeResolver', () => {
  describe('parseScope()', () => {
    describe('GIVEN a valid scope string', () => {
      it('SHOULD parse phase scope "P1"', () => {
        // Test implementation
      });
    });

    describe('GIVEN an invalid scope string', () => {
      it('SHOULD throw ScopeParseError', () => {
        // Test implementation
      });
    });
  });
});
```

#### 3. Global Configuration

The project uses Vitest with the following configuration (from `vitest.config.ts`):

```typescript
{
  environment: 'node',
  globals: true,  // Global describe, it, expect available
  include: ['tests/**/*.{test,spec}.ts'],
  coverage: {
    provider: 'v8',
    thresholds: {
      global: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
}
```

---

## Testing TypeScript Error Classes

### Custom Error Class Pattern

The project implements `ScopeParseError` as a custom error class:

```typescript
// src/core/scope-resolver.ts
export class ScopeParseError extends Error {
  constructor(
    public invalidInput: string,
    public expectedFormat: string
  ) {
    super(`Invalid scope "${invalidInput}". Expected ${expectedFormat}.`);
    this.name = 'ScopeParseError';
  }
}
```

### Testing Custom Errors

#### Pattern 1: Instance and Property Checking

```typescript
describe('ScopeParseError', () => {
  describe('GIVEN a ScopeParseError instance', () => {
    it('SHOULD have correct name and message', () => {
      const error = new ScopeParseError('invalid', 'valid format');

      expect(error.name).toBe('ScopeParseError');
      expect(error.message).toContain('invalid');
      expect(error.message).toContain('valid format');
    });

    it('SHOULD have context properties', () => {
      const error = new ScopeParseError('XYZ', 'P1');

      expect(error.invalidInput).toBe('XYZ');
      expect(error.expectedFormat).toBe('P1');
    });

    it('SHOULD convert to string correctly', () => {
      const error = new ScopeParseError('test', 'expected');
      const str = error.toString();

      expect(str).toContain('ScopeParseError');
      expect(str).toContain('test');
    });
  });
});
```

#### Pattern 2: Testing Error Throwing

```typescript
describe('parseScope()', () => {
  describe('GIVEN an invalid scope string', () => {
    it('SHOULD throw ScopeParseError for empty string', () => {
      expect(() => parseScope('')).toThrow(ScopeParseError);
      expect(() => parseScope('')).toThrow('non-empty scope string');
    });

    it('SHOULD include expected format in error message', () => {
      try {
        parseScope('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(ScopeParseError);
        if (error instanceof ScopeParseError) {
          expect(error.expectedFormat).toBeDefined();
          expect(error.invalidInput).toBe('invalid');
        }
      }
    });

    it('SHOULD preserve input in error context', () => {
      try {
        parseScope('P1.INVALID');
      } catch (error) {
        if (error instanceof ScopeParseError) {
          expect(error.invalidInput).toBe('P1.INVALID');
        }
      }
    });
  });
});
```

#### Pattern 3: Multiple Error Scenarios

```typescript
const invalidInputs = [
  { input: '', expectedError: 'non-empty' },
  { input: '   ', expectedError: 'non-empty' },
  { input: 'XYZ', expectedError: 'phase format' },
  { input: 'p1', expectedError: 'phase format' },
  { input: 'P1.X1', expectedError: 'milestone format' },
  { input: 'P1.M1.X1', expectedError: 'task format' },
];

invalidInputs.forEach(({ input, expectedError }) => {
  it(`SHOULD throw ScopeParseError for "${input}"`, () => {
    expect(() => parseScope(input)).toThrow(ScopeParseError);
    expect(() => parseScope(input)).toThrow(expectedError);
  });
});
```

---

## Testing Regex Validation Functions

### Pattern 1: Testing Valid Inputs

```typescript
describe('parseScope() with regex validation', () => {
  describe('GIVEN valid scope strings matching regex patterns', () => {
    it('SHOULD parse "all" correctly', () => {
      const result = parseScope('all');
      expect(result).toEqual({ type: 'all' });
    });

    it('SHOULD parse phase scope "P1"', () => {
      const result = parseScope('P1');
      expect(result).toEqual({ type: 'phase', id: 'P1' });
    });

    it('SHOULD parse phase scope "P10" (multi-digit)', () => {
      const result = parseScope('P10');
      expect(result).toEqual({ type: 'phase', id: 'P10' });
    });

    it('SHOULD parse milestone scope "P1.M1"', () => {
      const result = parseScope('P1.M1');
      expect(result).toEqual({ type: 'milestone', id: 'P1.M1' });
    });

    it('SHOULD parse task scope "P1.M1.T1"', () => {
      const result = parseScope('P1.M1.T1');
      expect(result).toEqual({ type: 'task', id: 'P1.M1.T1' });
    });

    it('SHOULD parse subtask scope "P1.M1.T1.S1"', () => {
      const result = parseScope('P1.M1.T1.S1');
      expect(result).toEqual({ type: 'subtask', id: 'P1.M1.T1.S1' });
    });

    it('SHOULD handle large numbers', () => {
      const result = parseScope('P999.M999.T999.S999');
      expect(result.type).toBe('subtask');
      expect(result.id).toBe('P999.M999.T999.S999');
    });
  });
});
```

### Pattern 2: Testing Invalid Inputs

```typescript
describe('GIVEN invalid scope strings not matching regex', () => {
  it('SHOULD reject lowercase "p1"', () => {
    expect(() => parseScope('p1')).toThrow(ScopeParseError);
  });

  it('SHOULD reject malformed milestone "P1.X1"', () => {
    expect(() => parseScope('P1.X1')).toThrow(ScopeParseError);
    expect(() => parseScope('P1.X1')).toThrow('milestone format');
  });

  it('SHOULD reject missing numbers', () => {
    expect(() => parseScope('P')).toThrow(ScopeParseError);
    expect(() => parseScope('P.M')).toThrow(ScopeParseError);
    expect(() => parseScope('P.M.T')).toThrow(ScopeParseError);
  });

  it('SHOULD reject too many components', () => {
    expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(ScopeParseError);
    expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow('valid scope format');
  });
});
```

### Pattern 3: Testing Whitespace Handling

```typescript
describe('GIVEN inputs with whitespace', () => {
  it('SHOULD trim whitespace', () => {
    const result = parseScope('  P1  ');
    expect(result).toEqual({ type: 'phase', id: 'P1' });
  });

  it('SHOULD handle "all" with whitespace', () => {
    const result = parseScope('  all  ');
    expect(result).toEqual({ type: 'all' });
  });

  it('SHOULD reject whitespace-only input', () => {
    expect(() => parseScope('   ')).toThrow(ScopeParseError);
  });
});
```

### Pattern 4: Testing Type Guards with Regex

```typescript
describe('isScopeType() type guard', () => {
  describe('GIVEN a valid scope type value', () => {
    it('SHOULD pass isScopeType type guard', () => {
      expect(isScopeType('phase')).toBe(true);
      expect(isScopeType('milestone')).toBe(true);
      expect(isScopeType('task')).toBe(true);
      expect(isScopeType('subtask')).toBe(true);
      expect(isScopeType('all')).toBe(true);
    });
  });

  describe('GIVEN an invalid scope type value', () => {
    it('SHOULD fail isScopeType type guard', () => {
      expect(isScopeType('invalid')).toBe(false);
      expect(isScopeType('Phase')).toBe(false); // Case sensitive
      expect(isScopeType('')).toBe(false);
      expect(isScopeType(null)).toBe(false);
      expect(isScopeType(undefined)).toBe(false);
    });
  });
});
```

---

## BeforeEach/AfterEach Patterns

### Pattern 1: Mock Management

```typescript
describe('TaskOrchestrator - DFS Traversal', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('specific feature', () => {
    it('should test something', () => {
      // Mock state is clean
      expect(mockFn).not.toHaveBeenCalled();
    });
  });
});
```

### Pattern 2: Test Data Reset

```typescript
describe('TaskOrchestrator - Dependency Resolution', () => {
  let orchestrator: TaskOrchestrator;
  let mockSessionManager: SessionManager;
  let testBacklog: Backlog;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh test data for each test
    testBacklog = createTestBacklog([]);
    mockSessionManager = createMockSessionManager(testBacklog);
    orchestrator = new TaskOrchestrator(mockSessionManager);

    // Reset mock functions to default behavior
    mockGetDependencies.mockReturnValue([]);
  });

  it('should test with clean state', () => {
    // Test implementation
  });
});
```

### Pattern 3: Context Management

```typescript
describe('Integration Tests', () => {
  const testContext = {
    userId: null as string | null,
    authToken: null as string | null,
  };

  beforeEach(() => {
    // Setup test user and get auth token
    const user = createTestUser();
    testContext.userId = user.id;
    testContext.authToken = generateToken(user.id);
  });

  afterEach(() => {
    // Cleanup user after each test
    if (testContext.userId) {
      deleteUser(testContext.userId);
    }
    // Reset context
    testContext.userId = null;
    testContext.authToken = null;
  });

  it('should access protected endpoint', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${testContext.authToken}`);

    expect(response.status).toBe(200);
  });
});
```

### Pattern 4: One-Time Setup with beforeAll/afterAll

```typescript
describe('Integration Tests', () => {
  let db: Database;

  beforeAll(async () => {
    // Setup database connection once
    db = await connectToTestDatabase();
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.query('TRUNCATE TABLE users CASCADE');

    // Seed fresh test data
    await db.query(`
      INSERT INTO users (name, email) VALUES
      ('Test User', 'test@example.com')
    `);
  });

  afterAll(async () => {
    // Close connection after all tests
    await db.close();
  });

  it('should fetch user', async () => {
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    expect(user.rows[0].name).toBe('Test User');
  });
});
```

---

## Mock Factory Function Patterns

### Pattern 1: Simple Factory Functions

```typescript
// Factory function for test subtasks
const createTestSubtask = (
  id: string,
  title: string,
  status: Status = 'Planned',
  dependencies: string[] = []
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies,
  context_scope: 'Test scope',
});

// Usage
it('should create subtask', () => {
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Test Subtask', 'Complete');
  expect(subtask.status).toBe('Complete');
});
```

### Pattern 2: Nested Hierarchical Factories

```typescript
// Factory for creating complete test hierarchies
const createComplexBacklog = (): Backlog => {
  const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete');
  const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned');
  const subtask3 = createTestSubtask('P1.M1.T2.S1', 'Subtask 3', 'Planned');

  const task1 = createTestTask('P1.M1.T1', 'Task 1', [subtask1, subtask2]);
  const task2 = createTestTask('P1.M1.T2', 'Task 2', [subtask3]);

  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', [task1, task2]);
  const phase1 = createTestPhase('P1', 'Phase 1', [milestone1]);

  return createTestBacklog([phase1]);
};

// Usage
it('should return phase and all descendants', () => {
  const testBacklog = createComplexBacklog();
  const scope: Scope = { type: 'phase', id: 'P1' };
  const result = resolveScope(testBacklog, scope);

  expect(result.length).toBeGreaterThan(0);
  expect(result[0].id).toBe('P1');
});
```

### Pattern 3: Parameterized Factories

```typescript
// Factory with depth parameter for recursive structures
const createMockHierarchy = (depth: number = 1) => {
  if (depth === 0) {
    return { id: 'leaf', children: [] };
  }

  return {
    id: `node-${depth}`,
    children: [
      createMockHierarchy(depth - 1),
      createMockHierarchy(depth - 1),
    ],
  };
};

// Usage
it('should handle nested structures', () => {
  const hierarchy = createMockHierarchy(3);
  expect(hierarchy.children).toHaveLength(2);
  expect(hierarchy.children[0].children).toHaveLength(2);
});
```

### Pattern 4: Mock Session Manager Factory

```typescript
const createMockSessionManager = (taskRegistry: Backlog): SessionManager => {
  const mockManager = {
    currentSession: {
      metadata: { id: '001_14b9dc2a33c7', hash: '14b9dc2a33c7' },
      prdSnapshot: '# Test PRD',
      taskRegistry,
      currentItemId: null,
    },
    updateItemStatus: vi.fn().mockResolvedValue(taskRegistry),
    loadBacklog: vi.fn().mockResolvedValue(taskRegistry),
    flushUpdates: vi.fn().mockResolvedValue(undefined),
  } as unknown as SessionManager;

  return mockManager;
};

// Usage
beforeEach(() => {
  const testBacklog = createTestBacklog([]);
  mockSessionManager = createMockSessionManager(testBacklog);
  orchestrator = new TaskOrchestrator(mockSessionManager);
});
```

---

## Testing Nested Hierarchical Structures

### Pattern 1: DFS Pre-order Traversal Testing

```typescript
describe('CONTRACT a: DFS pre-order traversal', () => {
  it('should traverse items in DFS pre-order: parent before children', async () => {
    // SETUP: Create full hierarchy with multiple levels
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Subtask 1');
    const task = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone 1', 'Planned', [task]);
    const phase = createTestPhase('P1', 'Phase 1', 'Planned', [milestone]);
    const backlog = createTestBacklog([phase]);

    // EXECUTE: Process all items
    const processedIds: string[] = [];
    let hasMore = true;
    while (hasMore) {
      hasMore = await orchestrator.processNextItem();
      if (orchestrator.currentItemId) {
        processedIds.push(orchestrator.currentItemId);
      }
    }

    // VERIFY: Parent indices are less than child indices (DFS pre-order property)
    const p1Index = processedIds.indexOf('P1');
    const m1Index = processedIds.indexOf('P1.M1');
    const t1Index = processedIds.indexOf('P1.M1.T1');
    const s1Index = processedIds.indexOf('P1.M1.T1.S1');

    expect(p1Index).toBeGreaterThanOrEqual(0);
    expect(p1Index).toBeLessThan(m1Index); // Parent before child
    expect(m1Index).toBeLessThan(t1Index); // Child before grandchild
    expect(t1Index).toBeLessThan(s1Index); // Grandchild before great-grandchild
  });
});
```

### Pattern 2: Testing Scope Resolution

```typescript
describe('resolveScope()', () => {
  const testBacklog = createComplexBacklog();

  describe('GIVEN "all" scope', () => {
    it('SHOULD return all leaf subtasks', () => {
      const scope: Scope = { type: 'all' };
      const result = resolveScope(testBacklog, scope);

      expect(result).toHaveLength(5); // S1, S2, S3, S4, S5
      expect(result.every(item => item.type === 'Subtask')).toBe(true);
    });
  });

  describe('GIVEN phase scope', () => {
    it('SHOULD return phase and all descendants', () => {
      const scope: Scope = { type: 'phase', id: 'P1' };
      const result = resolveScope(testBacklog, scope);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('P1');
      expect(result[0].type).toBe('Phase');

      const types = new Set(result.map(item => item.type));
      expect(types.has('Phase')).toBe(true);
      expect(types.has('Milestone')).toBe(true);
      expect(types.has('Task')).toBe(true);
      expect(types.has('Subtask')).toBe(true);
    });
  });

  describe('GIVEN subtask scope', () => {
    it('SHOULD return single subtask', () => {
      const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
      const result = resolveScope(testBacklog, scope);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('P1.M1.T1.S1');
      expect(result[0].type).toBe('Subtask');
    });
  });
});
```

### Pattern 3: Testing Empty Hierarchies

```typescript
describe('GIVEN empty backlog', () => {
  it('SHOULD return empty array for phase scope', () => {
    const emptyBacklog: Backlog = createTestBacklog([]);
    const scope: Scope = { type: 'phase', id: 'P1' };
    const result = resolveScope(emptyBacklog, scope);

    expect(result).toEqual([]);
  });

  it('SHOULD return empty array for "all" scope', () => {
    const emptyBacklog: Backlog = createTestBacklog([]);
    const scope: Scope = { type: 'all' };
    const result = resolveScope(emptyBacklog, scope);

    expect(result).toEqual([]);
  });
});
```

### Pattern 4: Testing Non-existent IDs

```typescript
describe('GIVEN non-existent ID', () => {
  it('SHOULD return empty array for non-existent phase', () => {
    const scope: Scope = { type: 'phase', id: 'P999' };
    const result = resolveScope(testBacklog, scope);

    expect(result).toEqual([]);
  });

  it('SHOULD return empty array for non-existent milestone', () => {
    const scope: Scope = { type: 'milestone', id: 'P1.M999' };
    const result = resolveScope(testBacklog, scope);

    expect(result).toEqual([]);
  });

  it('SHOULD return empty array for non-existent task', () => {
    const scope: Scope = { type: 'task', id: 'P1.M1.T999' };
    const result = resolveScope(testBacklog, scope);

    expect(result).toEqual([]);
  });
});
```

---

## Project-Specific Patterns

### Mock Module Pattern with Hoisting

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

// Mock the logger module before importing
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

// Mock the task-utils module
vi.mock('../../../src/utils/task-utils.js', () => ({
  findItem: vi.fn(),
  isSubtask: vi.fn(),
  getDependencies: vi.fn(() => []),
}));

// Import mocked functions
import { getDependencies } from '../../../src/utils/task-utils.js';

// Cast mocked functions
const mockGetDependencies = getDependencies as any;
```

### Mock Class Constructor Pattern

```typescript
// Mock the ResearchQueue class
vi.mock('../../../src/core/research-queue.js', () => ({
  ResearchQueue: vi.fn().mockImplementation(() => ({
    enqueue: vi.fn().mockResolvedValue(undefined),
    getPRP: vi.fn().mockReturnValue(null),
    processNext: vi.fn().mockResolvedValue(undefined),
    getStats: vi.fn().mockReturnValue({ queued: 0, researching: 0, cached: 0 }),
  })),
}));

// Mock the PRPRuntime class
vi.mock('../../../src/agents/prp-runtime.js', () => ({
  PRPRuntime: vi.fn().mockImplementation(() => ({
    executeSubtask: vi.fn().mockResolvedValue({
      success: true,
      validationResults: [],
      artifacts: [],
      error: undefined,
      fixAttempts: 0,
    }),
  })),
}));
```

### Integration Test Pattern with Mocks

```typescript
describe('integration', () => {
  describe('GIVEN parse and resolve flow', () => {
    it('SHOULD parse and resolve "all" scope', () => {
      const scope = parseScope('all');
      const result = resolveScope(createComplexBacklog(), scope);

      expect(result.every(item => item.type === 'Subtask')).toBe(true);
      expect(result.length).toBe(5);
    });

    it('SHOULD parse and resolve phase scope', () => {
      const scope = parseScope('P1');
      const result = resolveScope(createComplexBacklog(), scope);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('P1');
      expect(result[0].type).toBe('Phase');
    });

    it('SHOULD handle invalid parse then resolve', () => {
      let scope: Scope;
      try {
        scope = parseScope('invalid');
      } catch (error) {
        expect(error).toBeInstanceOf(ScopeParseError);
        return;
      }
      // Should not reach here
      expect(true).toBe(false);
    });
  });
});
```

---

## Summary of Key Patterns

### 1. **Test Organization**
- Use nested `describe` blocks for hierarchical test organization
- Follow GIVEN/SHOULD pattern for descriptive test names
- Group tests by feature and scenario

### 2. **Setup/Execute/Verify Structure**
- Clear separation of test data setup, execution, and verification
- Use factory functions for creating test data
- Reset state in `beforeEach` for isolation

### 3. **Mock Management**
- Use `vi.hoisted()` for variables referenced in mocks
- Mock modules before importing
- Clear all mocks in `beforeEach`
- Use typed mock functions with `as any` casting

### 4. **Error Testing**
- Test error instances with `toBeInstanceOf()`
- Verify error messages and context properties
- Use try/catch for detailed error validation
- Test multiple error scenarios with parameterized tests

### 5. **Regex Validation Testing**
- Test valid inputs comprehensively
- Test invalid inputs with specific error messages
- Test edge cases (whitespace, case sensitivity, boundaries)
- Use data-driven tests for multiple similar cases

### 6. **Hierarchical Data Testing**
- Use factory functions for creating nested structures
- Test traversal order (DFS pre-order)
- Test empty and non-existent cases
- Verify type discrimination and filtering

### 7. **Integration Testing**
- Test complete workflows (parse then resolve)
- Verify end-to-end behavior
- Test error handling in integration contexts
- Use realistic mock data

---

## Additional Resources

### Vitest Documentation URLs
- Main Guide: https://vitest.dev/guide/
- API Reference: https://vitest.dev/api/
- Configuration: https://vitest.dev/config/
- Coverage: https://vitest.dev/guide/coverage.html
- Mocking: https://vitest.dev/guide/mocking.html

### Related Testing Patterns
- Testing Library: https://testing-library.com/
- TypeScript Testing: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases
- Custom Error Classes: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Custom

### Project Examples
- Scope Resolver Tests: `/home/dustin/projects/hacky-hack/tests/unit/core/scope-resolver.test.ts`
- Task Traversal Tests: `/home/dustin/projects/hacky-hack/tests/unit/core/task-traversal.test.ts`
- Task Dependencies Tests: `/home/dustin/projects/hacky-hack/tests/unit/core/task-dependencies.test.ts`
