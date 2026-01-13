# Vitest Testing Quick Reference Guide

**Work Item:** P4.M4.T1.S1 - Quick reference for common testing patterns

---

## Essential Imports

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

---

## Test Structure (AAA Pattern)

```typescript
describe('functionName', () => {
  it('should [expected behavior]', () => {
    // ARRANGE: Setup test data
    const input = createTestData();

    // ACT: Execute function
    const result = functionName(input);

    // ASSERT: Verify expectations
    expect(result).toBe(expected);
  });
});
```

---

## Common Assertions

```typescript
// Equality
expect(actual).toBe(expected); // Strict equality (===)
expect(actual).toEqual(expected); // Deep equality
expect(actual).toStrictEqual(expected); // Deep equality + strict types

// Negation
expect(actual).not.toBe(expected);
expect(actual).not.toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(value).toMatch(/regex/);
expect(value).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', 'value');
expect(object).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

---

## Testing Pure Functions

```typescript
describe('pureFunction', () => {
  it('should return correct result', () => {
    // ARRANGE
    const input = 'test';

    // ACT
    const result = pureFunction(input);

    // ASSERT
    expect(result).toBe('expected');
  });
});
```

---

## Testing Recursive Functions

```typescript
describe('recursiveFunction', () => {
  describe('base cases', () => {
    it('should handle empty input', () => {
      expect(recursiveFunction([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(recursiveFunction([1])).toEqual([1]);
    });
  });

  describe('recursive cases', () => {
    it('should process nested structure', () => {
      const input = createNestedStructure();
      const result = recursiveFunction(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum depth', () => {
      const deepInput = createDeepStructure(100);
      expect(recursiveFunction(deepInput)).toBeDefined();
    });
  });
});
```

---

## Testing Immutability

```typescript
describe('immutableFunction', () => {
  it('should not mutate original', () => {
    // ARRANGE
    const original = { data: [1, 2, 3] };
    const originalJSON = JSON.stringify(original);

    // ACT
    const result = immutableFunction(original);

    // ASSERT
    expect(JSON.stringify(original)).toEqual(originalJSON);
    expect(result).not.toBe(original);
  });

  it('should preserve structural sharing', () => {
    const original = createComplexObject();
    const unchangedItem = original.items[1];

    const updated = immutableFunction(original);

    expect(updated.items[1]).toBe(unchangedItem);
    expect(updated.items[0]).not.toBe(original.items[0]);
  });
});
```

---

## Mocking Patterns

```typescript
// Mock before imports
vi.mock('../../../src/dependency.js', () => ({
  dependencyFunction: vi.fn(),
}));

import { dependencyFunction } from '../../../src/dependency.js';
const mockDep = vi.mocked(dependencyFunction);

describe('with mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call dependency', () => {
    // ARRANGE
    mockDep.mockReturnValue(42);

    // ACT
    const result = functionWithDependency();

    // ASSERT
    expect(mockDep).toHaveBeenCalledWith(expectedArgs);
    expect(result).toBe(42);
  });
});
```

---

## Factory Functions

```typescript
// Create reusable test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status
): Subtask => ({
  id,
  type: 'Subtask',
  title,
  status,
  story_points: 2,
  dependencies: [],
  context_scope: 'Test scope',
});

// Use in tests
it('should process subtask', () => {
  const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned');
  const result = processSubtask(subtask);
  expect(result).toBeDefined();
});
```

---

## Async Testing

```typescript
describe('asyncFunction', () => {
  it('should resolve with value', async () => {
    // ACT
    const result = await asyncFunction();

    // ASSERT
    expect(result).toBe('expected');
  });

  it('should handle promise', () => {
    // ACT & ASSERT
    return expect(asyncFunction()).resolves.toBe('expected');
  });

  it('should reject on error', async () => {
    // ASSERT
    await expect(asyncFunction()).rejects.toThrow('error message');
  });
});
```

---

## Performance Testing

```typescript
it('should complete within time limit', () => {
  const largeInput = createLargeInput(10000);

  const start = performance.now();
  const result = functionToTest(largeInput);
  const end = performance.now();

  expect(result).toBeDefined();
  expect(end - start).toBeLessThan(10); // milliseconds
});

it('should use early exit optimization', () => {
  const input = createInput();

  const start = performance.now();
  const result = findItem(input, 'first-item');
  const end = performance.now();

  expect(result).not.toBeNull();
  expect(end - start).toBeLessThan(1); // Very fast
});
```

---

## Type Guards in Tests

```typescript
function isSubtask(item: HierarchyItem): item is Subtask {
  return item.type === 'Subtask';
}

it('should use type guard for type-specific assertions', () => {
  const item = findItem(backlog, 'P1.M1.T1.S1');

  expect(item).not.toBeNull();
  if (item && isSubtask(item)) {
    // TypeScript knows this is Subtask now
    expect(item.story_points).toBe(2);
    expect(item.dependencies).toEqual([]);
  }
});
```

---

## Coverage Requirements

```typescript
// Test all code paths
describe('functionWithBranches', () => {
  it('should handle true branch', () => {
    expect(functionWithBranches(true)).toBe('A');
  });

  it('should handle false branch', () => {
    expect(functionWithBranches(false)).toBe('B');
  });

  it('should handle default case', () => {
    expect(functionWithBranches(null)).toBe('C');
  });
});

// Test all conditions
describe('functionWithMultipleConditions', () => {
  it('should return true when both conditions true', () => {
    expect(check(18, true)).toBe(true);
  });

  it('should return false when age too low', () => {
    expect(check(17, true)).toBe(false);
  });

  it('should return false when permission false', () => {
    expect(check(18, false)).toBe(false);
  });
});
```

---

## Running Tests

```bash
# Watch mode
npm test

# Single run
npm run test:run

# With coverage
npm run test:coverage

# Specific file
npx vitest tests/unit/core/task-utils.test.ts

# Stop on first failure
npm run test:bail
```

---

## Common Patterns

### Pattern 1: Test Each Hierarchy Level

```typescript
it('should find items at each hierarchy level', () => {
  const backlog = createComplexBacklog();

  expect(findItem(backlog, 'P1')?.type).toBe('Phase');
  expect(findItem(backlog, 'P1.M1')?.type).toBe('Milestone');
  expect(findItem(backlog, 'P1.M1.T1')?.type).toBe('Task');
  expect(findItem(backlog, 'P1.M1.T1.S1')?.type).toBe('Subtask');
});
```

### Pattern 2: Test All Status Values

```typescript
it('should support all status values', () => {
  const backlog = createComplexBacklog();
  const statuses: Status[] = [
    'Planned',
    'Researching',
    'Implementing',
    'Complete',
    'Failed',
    'Obsolete',
  ];

  for (const status of statuses) {
    const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', status);
    const item = findItem(updated, 'P1.M1.T1.S1');
    expect(item?.status).toBe(status);
  }
});
```

### Pattern 3: Test Empty Collections

```typescript
it('should handle empty backlog', () => {
  const emptyBacklog: Backlog = { backlog: [] };

  expect(findItem(emptyBacklog, 'P1')).toBeNull();
  expect(filterByStatus(emptyBacklog, 'Planned')).toEqual([]);
  expect(getNextPendingItem(emptyBacklog)).toBeNull();
});
```

### Pattern 4: Test Non-Existent Items

```typescript
it('should handle non-existent ID gracefully', () => {
  const backlog = createComplexBacklog();

  expect(findItem(backlog, 'INVALID')).toBeNull();

  const updated = updateItemStatus(backlog, 'INVALID', 'Failed');
  expect(updated).toEqual(backlog); // Unchanged
});
```

---

## Test File Template

```typescript
/**
 * Unit tests for [module name]
 *
 * @remarks
 * Tests validate [functionality] with 100% coverage.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from '../../../src/module.js';
import type { TypeNeeded } from '../../../src/models.js';

// Factory functions
const createTestInput = () => ({
  /* ... */
});

describe('module name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('functionName', () => {
    it('should [expected behavior]', () => {
      // SETUP
      const input = createTestInput();

      // EXECUTE
      const result = functionToTest(input);

      // VERIFY
      expect(result).toBe(expected);
    });
  });
});
```

---

**Quick Reference Created:** 2026-01-13
**Framework:** Vitest 1.6.1
