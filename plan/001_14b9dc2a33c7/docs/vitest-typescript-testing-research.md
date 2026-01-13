# Vitest and TypeScript Testing Patterns Research Report
**Work Item:** P4.M4.T1.S1 - Test task hierarchy models and utilities
**Date:** 2026-01-13
**Researcher:** Claude Code

---

## Executive Summary

This research document provides a comprehensive guide for testing TypeScript utility functions using Vitest. The project uses **Vitest** as its testing framework with **100% code coverage requirements**. This report includes framework analysis, testing patterns, code examples, and specific guidance for testing the functions in `task-utils.ts`.

---

## 1. Framework Selection and Configuration

### 1.1 Why Vitest?

The project uses Vitest for the following reasons:

1. **Native ESM Support**: Vitest works seamlessly with TypeScript and ESM modules out of the box
2. **Vite Integration**: Built on Vite for fast module resolution and transformation
3. **Jest Compatibility**: Uses familiar Jest-like API (`describe`, `it`, `expect`)
4. **Performance**: Significantly faster test execution compared to Jest
5. **Built-in Coverage**: Native support for code coverage via `@vitest/coverage-v8`

### 1.2 Current Configuration

**File:** `/home/dustin/projects/hacky-hack/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',           // Node.js environment for backend utilities
    globals: true,                  // Global test APIs (no imports needed)
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',               // V8 coverage provider (faster than Istanbul)
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      thresholds: {
        global: {
          statements: 100,          // 100% coverage required
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
```

### 1.3 NPM Scripts

```json
{
  "test": "vitest",                           // Watch mode
  "test:run": "vitest run",                   // Single run
  "test:watch": "vitest watch",               // Explicit watch mode
  "test:coverage": "vitest run --coverage",   // With coverage report
  "test:bail": "vitest run --bail=1"          // Stop on first failure
}
```

---

## 2. Testing Patterns for TypeScript Utilities

### 2.1 Pure Utility Functions

Pure functions are the easiest to test - they have no side effects and always return the same output for the same input.

#### Pattern: Setup/Execute/Verify

```typescript
import { describe, it, expect } from 'vitest';

describe('pure utility function', () => {
  it('should return expected output', () => {
    // SETUP: Arrange test data
    const input = 'test input';

    // EXECUTE: Call the function
    const result = myUtilityFunction(input);

    // VERIFY: Assert expected behavior
    expect(result).toBe('expected output');
  });
});
```

#### Real Example from Project

**File:** `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts`

```typescript
describe('filterProtectedFiles', () => {
  it('should remove protected files from array', () => {
    // SETUP
    const files = [
      'src/index.ts',
      'tasks.json',
      'src/utils.ts',
      'PRD.md',
      'README.md',
      'prd_snapshot.md',
    ];

    // EXECUTE
    const result = filterProtectedFiles(files);

    // VERIFY
    expect(result).toEqual(['src/index.ts', 'src/utils.ts', 'README.md']);
    expect(result).not.toContain('tasks.json');
    expect(result).not.toContain('PRD.md');
    expect(result).not.toContain('prd_snapshot.md');
  });
});
```

### 2.2 Recursive Functions

Recursive functions require testing of:
1. Base cases (termination conditions)
2. Recursive cases (typical scenarios)
3. Edge cases (empty inputs, single elements)
4. Performance (early termination)

#### Pattern: Base Case + Recursive Case + Edge Cases

```typescript
describe('recursive function', () => {
  describe('base cases', () => {
    it('should handle empty input', () => {
      expect(myRecursiveFunction([])).toEqual([]);
    });

    it('should handle single element', () => {
      expect(myRecursiveFunction([1])).toEqual([1]);
    });
  });

  describe('recursive cases', () => {
    it('should process nested structures correctly', () => {
      const input = createNestedStructure();
      const result = myRecursiveFunction(input);
      expect(result).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum depth', () => {
      const deepInput = createDeeplyNestedStructure(100);
      expect(myRecursiveFunction(deepInput)).toBeDefined();
    });
  });
});
```

#### Real Example from Project

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts`

The `findItem` function uses depth-first search (DFS) to traverse the 4-level task hierarchy:

```typescript
describe('findItem', () => {
  describe('finding items at each hierarchy level', () => {
    it('should find a Subtask by ID', () => {
      // SETUP: Backlog with subtasks
      const backlog = createComplexBacklog();

      // EXECUTE
      const result = findItem(backlog, 'P1.M1.T1.S1');

      // VERIFY
      expect(result).not.toBeNull();
      expect(result?.id).toBe('P1.M1.T1.S1');
      expect(result?.type).toBe('Subtask');
      if (result && isSubtask(result)) {
        expect(result.story_points).toBe(2);
      }
    });

    it('should use early return and not continue searching after finding item', () => {
      // SETUP: Backlog with multiple items
      const backlog = createComplexBacklog();

      // EXECUTE: Find first item
      const startTime = performance.now();
      const result = findItem(backlog, 'P1');
      const endTime = performance.now();

      // VERIFY: Should return immediately
      expect(result?.id).toBe('P1');
      expect(endTime - startTime).toBeLessThan(1);
    });
  });
});
```

### 2.3 Immutability Testing

Testing immutability ensures that functions don't mutate their inputs. This is critical for pure functions and Redux-like state updates.

#### Pattern: Before/After Snapshot Comparison

```typescript
describe('immutable function', () => {
  it('should not mutate original input', () => {
    // SETUP: Capture original state
    const original = { data: [1, 2, 3] };
    const originalJSON = JSON.stringify(original);

    // EXECUTE: Call function
    const result = updateFunction(original, 'newValue');

    // VERIFY: Original unchanged
    expect(JSON.stringify(original)).toEqual(originalJSON);
    expect(result).not.toBe(original);  // Different reference
    expect(result.data).not.toBe(original.data);  // Deep copy
  });

  it('should preserve unchanged items with structural sharing', () => {
    // SETUP: Complex nested structure
    const original = createComplexStructure();
    const unchangedItem = original.items[1];  // Item that won't change

    // EXECUTE: Update only item[0]
    const updated = updateFunction(original, 'items[0]', 'newValue');

    // VERIFY: Unchanged items share references (structural sharing)
    expect(updated.items[1]).toBe(unchangedItem);
    expect(updated.items[0]).not.toBe(original.items[0]);
  });
});
```

#### Real Example from Project

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts`

The `updateItemStatus` function creates deep copies with structural sharing:

```typescript
describe('updateItemStatus', () => {
  it('should not mutate original backlog (immutability)', () => {
    // SETUP: Backlog
    const backlog = createComplexBacklog();
    const originalJSON = JSON.stringify(backlog);

    // EXECUTE
    const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

    // VERIFY: Original unchanged
    expect(JSON.stringify(backlog)).toEqual(originalJSON);
    expect(updated).not.toEqual(backlog);
  });

  it('should preserve unchanged items with structural sharing', () => {
    // SETUP: Backlog
    const backlog = createComplexBacklog();
    const _originalPhase = backlog.backlog[0];

    // EXECUTE: Update a subtask in P1
    const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

    // VERIFY: Phase should be a new object (because we're updating deep within it)
    // But the other phase (P2) should be the same reference
    expect(updated.backlog[1]).toBe(backlog.backlog[1]); // P2 unchanged
  });

  it('should only update the target item, not siblings', () => {
    // SETUP: Backlog with multiple subtasks
    const backlog = createComplexBacklog();

    // EXECUTE: Update one subtask
    const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

    // VERIFY: Sibling should keep original status
    const sibling = findItem(updated, 'P1.M1.T1.S2');
    expect(sibling?.status).toBe('Planned'); // Original status
  });
});
```

### 2.4 Mocking Strategies

Vitest provides built-in mocking capabilities similar to Jest.

#### Pattern: Module Mocking

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the module before imports
vi.mock('../../../src/tools/git-mcp.js', () => ({
  gitStatus: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
}));

import { gitStatus, gitAdd, gitCommit } from '../../../src/tools/git-mcp.js';

// Type the mocks
const mockGitStatus = vi.mocked(gitStatus);
const mockGitAdd = vi.mocked(gitAdd);
const mockGitCommit = vi.mocked(gitCommit);

describe('function with dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();  // Reset mocks before each test
  });

  it('should call gitStatus before committing', async () => {
    // SETUP: Configure mock return values
    mockGitStatus.mockResolvedValue([
      { path: 'src/test.ts', status: 'modified' }
    ]);

    // EXECUTE
    await smartCommit('Test message');

    // VERIFY: Check calls
    expect(mockGitStatus).toHaveBeenCalledTimes(1);
    expect(mockGitAdd).toHaveBeenCalledWith(['src/test.ts']);
    expect(mockGitCommit).toHaveBeenCalled();
  });
});
```

#### Real Example from Project

**File:** `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts`

```typescript
// Mock the node:crypto module
vi.mock('node:crypto', () => ({
  createHash: vi.fn(),
  randomBytes: vi.fn(),
}));

// Mock the node:fs/promises module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
}));

// Import mocked modules
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';

// Cast mocked functions
const mockCreateHash = createHash as any;
const mockRandomBytes = randomBytes as any;
const mockReadFile = readFile as any;
const mockWriteFile = writeFile as any;
```

---

## 3. Vitest Assertion API

### 3.1 Common Assertions

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).toStrictEqual(expected);  // Deep equality with strict type checking

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);  // Precision

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
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### 3.2 Type Guards in Tests

For discriminated unions (like `HierarchyItem`), use type guards:

```typescript
import type { HierarchyItem } from './models.js';

function isSubtask(item: HierarchyItem): item is Subtask {
  return item.type === 'Subtask';
}

// In tests
it('should find Subtask and access type-specific properties', () => {
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

## 4. Test Fixtures and Factory Functions

### 4.1 Factory Pattern

Create reusable factory functions to generate test data:

```typescript
// Factory functions for test data
const createTestSubtask = (
  id: string,
  title: string,
  status: Status,
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

const createTestTask = (
  id: string,
  title: string,
  status: Status,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
  title,
  status,
  description: 'Test task description',
  subtasks,
});

const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});

// Complex fixture
const createComplexBacklog = (): Backlog => {
  const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete');
  const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', ['P1.M1.T1.S1']);
  const task1 = createTestTask('P1.M1.T1', 'Task 1', 'Planned', [subtask1, subtask2]);
  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', 'Complete', [task1]);
  const phase1 = createTestPhase('P1', 'Phase 1', 'Planned', [milestone1]);

  return createTestBacklog([phase1]);
};
```

### 4.2 Using Fixtures in Tests

```typescript
describe('with test fixtures', () => {
  it('should work with complex data', () => {
    const backlog = createComplexBacklog();
    const result = findItem(backlog, 'P1.M1.T1.S1');
    expect(result).not.toBeNull();
  });
});
```

---

## 5. Coverage Requirements and Reporting

### 5.1 Coverage Thresholds

The project requires **100% coverage** for:
- Statements
- Branches
- Functions
- Lines

### 5.2 Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# Output formats:
# - text: Console output
# - json: Machine-readable (for CI/CD)
# - html: Browser-readable report
```

### 5.3 Coverage Reports

Coverage reports are generated in:
- **Console**: Terminal output with percentage breakdown
- **HTML**: Detailed report in `coverage/index.html`
- **JSON**: Machine-readable data for CI/CD integration

### 5.4 What Counts Toward Coverage

**Statements:** Each executable line of code
```typescript
const x = 1;  // Covered if executed in test
if (x) {      // Covered if both branches executed
  return true;
}
```

**Branches:** Each possible path through conditional logic
```typescript
if (condition) {  // 2 branches: true and false
  return A;
} else {
  return B;
}
```

**Functions:** Each function declaration
```typescript
function myFunction() {  // Covered if called in test
  return 1;
}
```

**Lines:** Each line of executable code
```typescript
// Each line with code counts
const x = 1;      // Line 1
return x;         // Line 2
```

### 5.5 Achieving 100% Coverage

#### Strategy 1: Test Each Code Path

```typescript
// Function to test
function getStatus(status: string): string {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  return 'Unknown';
}

// Tests for 100% coverage
describe('getStatus', () => {
  it('should return Active', () => {
    expect(getStatus('active')).toBe('Active');
  });

  it('should return Inactive', () => {
    expect(getStatus('inactive')).toBe('Inactive');
  });

  it('should return Unknown for default', () => {
    expect(getStatus('other')).toBe('Unknown');
  });
});
```

#### Strategy 2: Test All Branch Conditions

```typescript
// Function with multiple conditions
function isEligible(age: number, hasPermission: boolean): boolean {
  if (age >= 18 && hasPermission) {
    return true;
  }
  return false;
}

// Tests for all branches
describe('isEligible', () => {
  it('should return true when age >= 18 and has permission', () => {
    expect(isEligible(18, true)).toBe(true);
  });

  it('should return false when age < 18', () => {
    expect(isEligible(17, true)).toBe(false);
  });

  it('should return false when no permission', () => {
    expect(isEligible(18, false)).toBe(false);
  });

  it('should return false when both conditions fail', () => {
    expect(isEligible(17, false)).toBe(false);
  });
});
```

#### Strategy 3: Test Error Paths

```typescript
// Function that throws
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Tests for error paths
describe('divide', () => {
  it('should return quotient', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should throw when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
});
```

---

## 6. Specific Patterns for task-utils.ts Functions

### 6.1 Testing `findItem` (Recursive DFS)

```typescript
describe('findItem', () => {
  describe('happy path', () => {
    it('should find item at each hierarchy level', () => {
      const backlog = createComplexBacklog();

      expect(findItem(backlog, 'P1')?.type).toBe('Phase');
      expect(findItem(backlog, 'P1.M1')?.type).toBe('Milestone');
      expect(findItem(backlog, 'P1.M1.T1')?.type).toBe('Task');
      expect(findItem(backlog, 'P1.M1.T1.S1')?.type).toBe('Subtask');
    });

    it('should use early exit optimization', () => {
      const backlog = createComplexBacklog();
      const start = performance.now();
      const result = findItem(backlog, 'P1');
      const end = performance.now();

      expect(result?.id).toBe('P1');
      expect(end - start).toBeLessThan(1);
    });
  });

  describe('edge cases', () => {
    it('should return null for non-existent ID', () => {
      expect(findItem(backlog, 'INVALID')).toBeNull();
    });

    it('should handle empty backlog', () => {
      expect(findItem(createTestBacklog([]), 'P1')).toBeNull();
    });

    it('should handle empty collections', () => {
      const phase = createTestPhase('P1', 'Empty', 'Planned', []);
      const backlog = createTestBacklog([phase]);
      expect(findItem(backlog, 'P1')?.id).toBe('P1');
    });
  });
});
```

### 6.2 Testing `getDependencies` (With Type Guards)

```typescript
describe('getDependencies', () => {
  it('should return empty array for no dependencies', () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', []);
    const backlog = createComplexBacklog();

    expect(getDependencies(subtask, backlog)).toEqual([]);
  });

  it('should filter out non-existent dependencies', () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', [
      'P1.M1.T1.S2',
      'NON-EXISTENT',
    ]);
    const backlog = createComplexBacklog();

    const deps = getDependencies(subtask, backlog);
    expect(deps).toHaveLength(1);
    expect(deps[0].id).toBe('P1.M1.T1.S2');
  });

  it('should filter out non-Subtask dependencies', () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned', [
      'P1.M1.T1.S2',
      'P1.M1',  // Milestone, not Subtask
    ]);
    const backlog = createComplexBacklog();

    const deps = getDependencies(subtask, backlog);
    expect(deps).toHaveLength(1);
    expect(deps.every(d => d.type === 'Subtask')).toBe(true);
  });
});
```

### 6.3 Testing `filterByStatus` (Recursive Collection)

```typescript
describe('filterByStatus', () => {
  it('should return all items with matching status', () => {
    const backlog = createComplexBacklog();
    const planned = filterByStatus(backlog, 'Planned');

    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every(item => item.status === 'Planned')).toBe(true);

    // Verify all types are included
    const types = new Set(planned.map(item => item.type));
    expect(types.has('Phase')).toBe(true);
    expect(types.has('Milestone')).toBe(true);
    expect(types.has('Task')).toBe(true);
    expect(types.has('Subtask')).toBe(true);
  });

  it('should preserve DFS pre-order traversal', () => {
    const backlog = createComplexBacklog();
    const planned = filterByStatus(backlog, 'Planned');

    // First Planned item should be P1 (parent before children)
    expect(planned[0].status).toBe('Planned');
  });

  it('should return empty array when no matches', () => {
    const backlog = createComplexBacklog();
    const failed = filterByStatus(backlog, 'Failed');

    expect(failed).toEqual([]);
  });
});
```

### 6.4 Testing `getNextPendingItem` (Early Exit)

```typescript
describe('getNextPendingItem', () => {
  it('should return first Planned item in DFS pre-order', () => {
    const backlog = createComplexBacklog();
    const next = getNextPendingItem(backlog);

    expect(next).not.toBeNull();
    expect(next?.status).toBe('Planned');
  });

  it('should return null when no Planned items', () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Complete');
    const task = createTestTask('P1.M1.T1', 'Task', 'Complete', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Complete', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    expect(getNextPendingItem(backlog)).toBeNull();
  });

  it('should find deep Planned item when parents are Complete', () => {
    // Hierarchy: Phase(Complete) > Milestone(Complete) > Task(Complete) > Subtask(Planned)
    const subtask = createTestSubtask('P1.M1.T1.S1', 'Test', 'Planned');
    const task = createTestTask('P1.M1.T1', 'Task', 'Complete', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'Milestone', 'Complete', [task]);
    const phase = createTestPhase('P1', 'Phase', 'Complete', [milestone]);
    const backlog = createTestBacklog([phase]);

    const next = getNextPendingItem(backlog);
    expect(next?.id).toBe('P1.M1.T1.S1');
  });
});
```

### 6.5 Testing `updateItemStatus` (Immutability + Deep Copy)

```typescript
describe('updateItemStatus', () => {
  describe('immutability', () => {
    it('should not mutate original backlog', () => {
      const backlog = createComplexBacklog();
      const originalJSON = JSON.stringify(backlog);

      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      expect(JSON.stringify(backlog)).toEqual(originalJSON);
      expect(updated).not.toEqual(backlog);
    });

    it('should preserve structural sharing for unchanged branches', () => {
      const backlog = createComplexBacklog();
      const originalP2 = backlog.backlog[1];

      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      // P2 should be the same reference (unchanged)
      expect(updated.backlog[1]).toBe(originalP2);
      // P1 should be a new reference (contains the change)
      expect(updated.backlog[0]).not.toBe(backlog.backlog[0]);
    });

    it('should only update target item, not siblings', () => {
      const backlog = createComplexBacklog();

      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Failed');

      const sibling = findItem(updated, 'P1.M1.T1.S2');
      expect(sibling?.status).toBe('Planned'); // Unchanged
    });
  });

  describe('deep copy verification', () => {
    it('should create new objects along entire path', () => {
      const subtask = createTestSubtask('P1.M1.T1.S1', 'Deep', 'Planned');
      const task = createTestTask('P1.M1.T1', 'Task', 'Planned', [subtask]);
      const milestone = createTestMilestone('P1.M1', 'Milestone', 'Planned', [task]);
      const phase = createTestPhase('P1', 'Phase', 'Planned', [milestone]);
      const backlog = createTestBacklog([phase]);

      const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', 'Complete');

      // All parent levels should be new objects
      expect(updated.backlog[0]).not.toBe(backlog.backlog[0]);
      expect(updated.backlog[0].milestones[0]).not.toBe(backlog.backlog[0].milestones[0]);
      expect(updated.backlog[0].milestones[0].tasks[0]).not.toBe(
        backlog.backlog[0].milestones[0].tasks[0]
      );
      expect(updated.backlog[0].milestones[0].tasks[0].subtasks[0]).not.toBe(
        backlog.backlog[0].milestones[0].tasks[0].subtasks[0]
      );
    });
  });

  describe('status transitions', () => {
    it('should support all valid status values', () => {
      const backlog = createComplexBacklog();
      const statuses: Status[] = [
        'Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'
      ];

      for (const status of statuses) {
        const updated = updateItemStatus(backlog, 'P1.M1.T1.S1', status);
        const item = findItem(updated, 'P1.M1.T1.S1');
        expect(item?.status).toBe(status);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent ID gracefully', () => {
      const backlog = createComplexBacklog();
      const originalJSON = JSON.stringify(backlog);

      const updated = updateItemStatus(backlog, 'NON-EXISTENT', 'Failed');

      expect(JSON.stringify(updated)).toEqual(originalJSON);
    });

    it('should handle empty backlog', () => {
      const emptyBacklog = createTestBacklog([]);
      const updated = updateItemStatus(emptyBacklog, 'P1', 'Complete');

      expect(updated).toEqual(emptyBacklog);
    });
  });
});
```

---

## 7. Test Organization Best Practices

### 7.1 File Structure

```
tests/
├── unit/                      # Unit tests (isolated, fast)
│   ├── core/
│   │   ├── models.test.ts
│   │   ├── task-utils.test.ts
│   │   └── session-utils.test.ts
│   ├── utils/
│   │   └── git-commit.test.ts
│   └── agents/
│       └── prp-generator.test.ts
├── integration/               # Integration tests (slower, real deps)
│   ├── prp-pipeline-integration.test.ts
│   └── bug-hunt-workflow-integration.test.ts
└── manual/                    # Manual verification scripts
    └── env-test.ts
```

### 7.2 Test File Structure

```typescript
/**
 * Unit tests for [module name]
 *
 * @remarks
 * Description of what's tested and coverage goals.
 *
 * @see {@link https://vitest.dev/guide/ | Vitest Documentation}
 */

// 1. Imports
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from '../../../src/module.js';

// 2. Mocks (if needed)
vi.mock('../../../src/dependency.js', () => ({
  dependencyFunction: vi.fn(),
}));

// 3. Factory functions
const createTestInput = () => ({ /* ... */ });

// 4. Test suites
describe('module name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('function name', () => {
    it('should do something', () => {
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

### 7.3 Test Naming Conventions

```typescript
// Good: Descriptive and clear
describe('updateItemStatus', () => {
  it('should not mutate original backlog', () => { });
  it('should preserve structural sharing for unchanged branches', () => { });
  it('should handle non-existent ID gracefully', () => { });
});

// Avoid: Vague or implementation-focused
describe('updateItemStatus', () => {
  it('should work', () => { });  // Too vague
  it('should set status property', () => { });  // Implementation detail
  it('should call map function', () => { });  // Implementation detail
});
```

---

## 8. Common Pitfalls and Solutions

### 8.1 Async Tests

**Problem:** Not awaiting async operations

```typescript
// Bad: Test passes even if promise rejects
it('should load data', () => {
  const result = loadData();
  expect(result).toBeDefined();
});

// Good: Async/await
it('should load data', async () => {
  const result = await loadData();
  expect(result).toBeDefined();
});

// Good: Promise assertion
it('should load data', () => {
  return expect(loadData()).resolves.toBeDefined();
});
```

### 8.2 Mock Reset

**Problem:** Mock state leaks between tests

```typescript
// Bad: Mocks not reset
describe('with mocks', () => {
  it('test 1', () => {
    mockFn.mockReturnValue(1);
    expect(mockFn()).toBe(1);
  });

  it('test 2', () => {
    // mockFn still returns 1!
    expect(mockFn()).toBe(undefined);
  });
});

// Good: Reset in beforeEach
describe('with mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test 1', () => {
    mockFn.mockReturnValue(1);
    expect(mockFn()).toBe(1);
  });

  it('test 2', () => {
    // mockFn is cleared
    expect(mockFn()).toBe(undefined);
  });
});
```

### 8.3 Deep Equality vs Reference Equality

**Problem:** Using wrong assertion

```typescript
// Bad: Using toBe for objects
expect({ a: 1 }).toBe({ a: 1 });  // Fails (different references)

// Good: Using toEqual for objects
expect({ a: 1 }).toEqual({ a: 1 });  // Passes (deep equality)

// Good: Using toBe for primitives
expect(1).toBe(1);  // Passes
```

### 8.4 Testing Private Functions

**Problem:** Trying to test private implementation details

```typescript
// Bad: Testing private functions
class MyClass {
  private helper() { return 1; }
  public api() { return this.helper(); }
}

// Solution: Test public API only
describe('MyClass', () => {
  it('should return expected value', () => {
    const instance = new MyClass();
    expect(instance.api()).toBe(1);
  });
  // Don't test helper() directly - it's implementation detail
});
```

---

## 9. Performance Testing Patterns

### 9.1 Measuring Execution Time

```typescript
it('should complete within time limit', () => {
  const backlog = createLargeBacklog(10000); // Large dataset

  const start = performance.now();
  const result = findItem(backlog, 'P5000.M1.T1.S1');
  const end = performance.now();

  expect(result).not.toBeNull();
  expect(end - start).toBeLessThan(10); // < 10ms
});
```

### 9.2 Testing Early Exit Optimization

```typescript
it('should use early exit and not traverse entire structure', () => {
  const backlog = createLargeBacklog(10000);

  // Find first item - should return immediately
  const start = performance.now();
  const result = findItem(backlog, 'P1');
  const end = performance.now();

  expect(end - start).toBeLessThan(1); // Should be very fast
  expect(result?.id).toBe('P1');
});
```

---

## 10. Resources and Documentation

### 10.1 Official Documentation

**Vitest Documentation:**
- Main Guide: https://vitest.dev/guide/
- API Reference: https://vitest.dev/api/
- Coverage: https://vitest.dev/guide/coverage.html
- Mocking: https://vitest.dev/guide/mocking.html
- Configuring Vitest: https://vitest.dev/config/

**TypeScript Testing:**
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Type Testing: https://github.com/Microsoft/TypeScript/wiki/Testing

### 10.2 Project-Specific Resources

**Existing Test Examples:**
- `/home/dustin/projects/hacky-hack/tests/unit/core/task-utils.test.ts` - Comprehensive utility function tests
- `/home/dustin/projects/hacky-hack/tests/unit/utils/git-commit.test.ts` - Mocking and async patterns
- `/home/dustin/projects/hacky-hack/tests/unit/core/session-utils.test.ts` - File system mocking
- `/home/dustin/projects/hacky-hack/tests/unit/core/models.test.ts` - Schema validation tests

**Configuration:**
- `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration
- `/home/dustin/projects/hacky-hack/package.json` - Test scripts

**Source Under Test:**
- `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts` - Task hierarchy utilities

### 10.3 Testing Best Practices

**General Principles:**
1. **AAA Pattern:** Arrange (setup), Act (execute), Assert (verify)
2. **One Assertion Per Test:** Focus on single behavior
3. **Descriptive Names:** Test names should read like requirements
4. **Test Isolation:** Each test should be independent
5. **Fast Feedback:** Unit tests should run in milliseconds
6. **100% Coverage:** Required by project standards

**Code Coverage Tools:**
```bash
# View HTML report
open coverage/index.html

# Check specific file coverage
npx vitest run --coverage src/utils/task-utils.ts

# Enforce thresholds in CI
npx vitest run --coverage --reporter=json
```

---

## 11. Quick Reference

### 11.1 Common Test Patterns

```typescript
// Pure function test
it('should return expected result', () => {
  expect(add(1, 2)).toBe(3);
});

// Recursive function test
it('should handle base case', () => {
  expect(factorial(0)).toBe(1);
});

it('should handle recursive case', () => {
  expect(factorial(5)).toBe(120);
});

// Immutability test
it('should not mutate input', () => {
  const original = { data: [1] };
  const originalJSON = JSON.stringify(original);
  update(original);
  expect(JSON.stringify(original)).toEqual(originalJSON);
});

// Async test
it('should handle promise', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// Error test
it('should throw for invalid input', () => {
  expect(() => validate(null)).toThrow();
});

// Mock test
it('should call dependency', () => {
  const mockFn = vi.fn();
  executeWithDependency(mockFn);
  expect(mockFn).toHaveBeenCalledWith(expectedArgs);
});
```

### 11.2 Vitest Matchers

```typescript
// Equality
toBe(), toEqual(), toStrictEqual()

// Truthiness
toBeTruthy(), toBeFalsy(), toBeNull(), toBeUndefined()

// Numbers
toBeGreaterThan(), toBeLessThan(), toBeCloseTo()

// Strings
toMatch(), toContain()

// Arrays
toHaveLength(), toContain(), toContainEqual()

// Objects
toHaveProperty(), toMatchObject()

// Async
resolves.to, rejects.toThrow()

// Exceptions
toThrow(), toThrow(Error), toThrow('message')
```

### 11.3 Mock Functions

```typescript
// Create mock
const mockFn = vi.fn();

// Configure return value
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(Promise.resolve(42));
mockFn.mockRejectedValue(new Error('fail'));

// Inspect calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenLastCalledWith(lastArg);

// Clear mock
mockFn.mockClear();
mockFn.mockReset();
mockFn.mockRestore();
```

---

## 12. Conclusion

This research report provides comprehensive guidance for testing TypeScript utility functions with Vitest. The project's existing tests demonstrate excellent patterns for:

1. **Pure function testing** using factory functions and fixtures
2. **Recursive function testing** with base cases and edge cases
3. **Immutability testing** using snapshot comparisons and reference checks
4. **Mocking strategies** for external dependencies
5. **100% code coverage** through comprehensive path testing

The `task-utils.test.ts` file serves as an excellent reference for testing complex recursive utilities with immutability requirements. All patterns from this report can be directly applied to achieve the coverage requirements for P4.M4.T1.S1.

---

**Report Generated:** 2026-01-13
**Framework:** Vitest 1.6.1
**Coverage Provider:** V8
**Required Coverage:** 100%
**Work Item:** P4.M4.T1.S1
