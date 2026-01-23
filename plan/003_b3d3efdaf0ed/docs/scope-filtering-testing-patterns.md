# Testing Patterns for Scope Filtering and Hierarchical Task Selection Systems

**Research Date:** 2025-01-21
**Task ID:** P1.M2.T3.S2
**Focus:** Integration testing patterns for hierarchical scope resolution, regex-based parsing validation, mock backlog creation, and edge case handling

---

## Table of Contents

1. [Overview](#overview)
2. [Integration Testing Patterns for Hierarchical Scope Resolution](#integration-testing-patterns-for-hierarchical-scope-resolution)
3. [Testing Regex-Based Parsing and Validation](#testing-regex-based-parsing-and-validation)
4. [Mock Backlog Creation for Multi-Level Hierarchies](#mock-backlog-creation-for-multi-level-hierarchies)
5. [Testing Edge Cases](#testing-edge-cases)
6. [Common Pitfalls and How to Avoid Them](#common-pitfalls-and-how-to-avoid-them)
7. [Best Practices Summary](#best-practices-summary)
8. [References and Resources](#references-and-resources)

---

## Overview

This document compiles best practices for testing scope filtering systems with hierarchical task selection, based on real-world patterns from the hacky-hack codebase. The patterns demonstrate how to effectively test:

- **Hierarchical scope resolution** - parsing and resolving IDs like `P1`, `P1.M1`, `P1.M1.T1`, `P1.M1.T1.S1`
- **Regex-based validation** - ensuring scope strings match expected formats
- **Multi-level hierarchies** - Phases → Milestones → Tasks → Subtasks
- **Edge cases** - invalid formats, non-existent IDs, boundary conditions

**Key Files Referenced:**

- `/home/dustin/projects/hacky-hack/tests/unit/core/scope-resolver.test.ts` - Comprehensive unit tests
- `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts` - Integration patterns
- `/home/dustin/projects/hacky-hack/src/core/scope-resolver.ts` - Implementation under test

---

## Integration Testing Patterns for Hierarchical Scope Resolution

### Pattern 1: Setup/Execute/Verify Structure

The most effective pattern for hierarchical testing follows a clear three-phase structure:

```typescript
describe('Scope Resolution', () => {
  it('SHOULD return phase and all descendants', () => {
    // SETUP: Create test data and environment
    const scope: Scope = { type: 'phase', id: 'P1' };
    const testBacklog = createComplexBacklog();

    // EXECUTE: Run the function under test
    const result = resolveScope(testBacklog, scope);

    // VERIFY: Assert expected outcomes
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('P1');
    expect(result[0].type).toBe('Phase');
  });
});
```

**Benefits:**

- Clear separation of concerns
- Easy to scan and understand
- Consistent across all test files
- Facilitates debugging (setup issues vs assertion issues)

### Pattern 2: Factory Functions for Test Data

Create reusable factory functions to build complex hierarchies:

```typescript
// Factory for creating test subtasks
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

// Factory for creating test tasks
const createTestTask = (
  id: string,
  title: string,
  subtasks: Subtask[] = []
): Task => ({
  id,
  type: 'Task',
  title,
  status: 'Planned',
  description: 'Test task description',
  subtasks,
});

// Factory for complete backlog
const createTestBacklog = (phases: Phase[]): Backlog => ({
  backlog: phases,
});
```

**Benefits:**

- DRY principle - avoid repeating object structures
- Easy to modify test data globally
- Default values reduce boilerplate
- Type-safe with TypeScript

### Pattern 3: Comprehensive Hierarchy Builder

For complex test scenarios, create a helper that builds full hierarchies:

```typescript
const createComplexBacklog = (): Backlog => {
  // Create leaf nodes first
  const subtask1: Subtask = createTestSubtask(
    'P1.M1.T1.S1',
    'Subtask 1',
    'Complete'
  );
  const subtask2: Subtask = createTestSubtask(
    'P1.M1.T1.S2',
    'Subtask 2',
    'Planned'
  );
  const subtask3: Subtask = createTestSubtask(
    'P1.M1.T2.S1',
    'Subtask 3',
    'Planned'
  );

  // Build up the tree
  const task1: Task = createTestTask('P1.M1.T1', 'Task 1', [
    subtask1,
    subtask2,
  ]);
  const task2: Task = createTestTask('P1.M1.T2', 'Task 2', [subtask3]);

  const milestone1: Milestone = createTestMilestone('P1.M1', 'Milestone 1', [
    task1,
    task2,
  ]);
  const phase1: Phase = createTestPhase('P1', 'Phase 1', [milestone1]);

  return createTestBacklog([phase1]);
};
```

**Benefits:**

- Single source of truth for complex test data
- Easy to understand the hierarchy structure
- Modifications propagate to all tests using it
- Reduces cognitive load when reading tests

### Pattern 4: DFS Traversal Validation

When testing hierarchical traversal, validate the order explicitly:

```typescript
it('SHOULD preserve DFS pre-order traversal', () => {
  const scope: Scope = { type: 'phase', id: 'P1' };
  const result = resolveScope(testBacklog, scope);

  // Phase should be first (parent before children)
  expect(result[0].id).toBe('P1');

  // Milestone M1 should come before M2 (left-to-right sibling order)
  const m1Index = result.findIndex(item => item.id === 'P1.M1');
  const m2Index = result.findIndex(item => item.id === 'P1.M2');
  expect(m1Index).toBeLessThan(m2Index);
});
```

**Benefits:**

- Ensures traversal algorithm correctness
- Catches ordering bugs early
- Documents expected behavior
- Prevents regression in traversal logic

---

## Testing Regex-Based Parsing and Validation

### Pattern 1: Valid Format Coverage

Test all valid format variations explicitly:

```typescript
describe('parseScope()', () => {
  describe('GIVEN a valid scope string', () => {
    it('SHOULD parse "all" correctly', () => {
      const result = parseScope('all');
      expect(result).toEqual({ type: 'all' });
    });

    it('SHOULD parse phase scope "P1"', () => {
      const result = parseScope('P1');
      expect(result).toEqual({ type: 'phase', id: 'P1' });
    });

    it('SHOULD parse phase scope "P10"', () => {
      const result = parseScope('P10');
      expect(result).toEqual({ type: 'phase', id: 'P10' });
    });

    it('SHOULD parse milestone scope "P1.M1"', () => {
      const result = parseScope('P1.M1');
      expect(result).toEqual({ type: 'milestone', id: 'P1.M1' });
    });

    it('SHOULD parse milestone scope "P10.M5"', () => {
      const result = parseScope('P10.M5');
      expect(result).toEqual({ type: 'milestone', id: 'P10.M5' });
    });

    it('SHOULD parse task scope "P1.M1.T1"', () => {
      const result = parseScope('P1.M1.T1');
      expect(result).toEqual({ type: 'task', id: 'P1.M1.T1' });
    });

    it('SHOULD parse subtask scope "P1.M1.T1.S1"', () => {
      const result = parseScope('P1.M1.T1.S1');
      expect(result).toEqual({ type: 'subtask', id: 'P1.M1.T1.S1' });
    });

    it('SHOULD parse subtask scope "P5.M10.T20.S99"', () => {
      const result = parseScope('P5.M10.T20.S99');
      expect(result).toEqual({ type: 'subtask', id: 'P5.M10.T20.S99' });
    });

    it('SHOULD trim whitespace', () => {
      const result = parseScope('  P1  ');
      expect(result).toEqual({ type: 'phase', id: 'P1' });
    });
  });
});
```

**Benefits:**

- Documents all supported formats
- Ensures regex handles edge cases (multi-digit numbers)
- Tests whitespace handling
- Easy to add new formats

### Pattern 2: Invalid Format Rejection

Test that invalid formats throw appropriate errors:

```typescript
describe('GIVEN an invalid scope string', () => {
  it('SHOULD throw ScopeParseError for empty string', () => {
    expect(() => parseScope('')).toThrow(ScopeParseError);
    expect(() => parseScope('')).toThrow('non-empty scope string');
  });

  it('SHOULD throw ScopeParseError for lowercase "p1"', () => {
    expect(() => parseScope('p1')).toThrow(ScopeParseError);
  });

  it('SHOULD throw ScopeParseError for malformed milestone "P1.X1"', () => {
    expect(() => parseScope('P1.X1')).toThrow(ScopeParseError);
    expect(() => parseScope('P1.X1')).toThrow('milestone format');
  });

  it('SHOULD throw ScopeParseError for malformed task "P1.M1.X1"', () => {
    expect(() => parseScope('P1.M1.X1')).toThrow(ScopeParseError);
    expect(() => parseScope('P1.M1.X1')).toThrow('task format');
  });

  it('SHOULD throw ScopeParseError for too many components', () => {
    expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow(ScopeParseError);
    expect(() => parseScope('P1.M1.T1.S1.X1')).toThrow('valid scope format');
  });

  it('SHOULD throw ScopeParseError for missing numbers', () => {
    expect(() => parseScope('P')).toThrow(ScopeParseError);
    expect(() => parseScope('P.M')).toThrow(ScopeParseError);
    expect(() => parseScope('P.M.T')).toThrow(ScopeParseError);
  });
});
```

**Benefits:**

- Ensures robust error handling
- Tests error message quality
- Prevents invalid data from propagating
- Documents expected error formats

### Pattern 3: Error Context Validation

Validate that errors contain useful debugging information:

```typescript
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
```

**Benefits:**

- Ensures errors are actionable
- Helps with debugging
- Validates error object structure
- Tests error context preservation

### Pattern 4: Type Guard Testing

Test type guards for runtime validation:

```typescript
describe('ScopeType', () => {
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

**Benefits:**

- Validates runtime type checking
- Ensures type safety at runtime
- Tests edge cases (null, undefined)
- Documents type guard behavior

---

## Mock Backlog Creation for Multi-Level Hierarchies

### Pattern 1: Leaf-First Construction

Build hierarchies from leaves up to root:

```typescript
const createMultiLevelHierarchy = (): Backlog => {
  // Level 4: Subtasks (leaves)
  const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Complete');
  const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned');
  const subtask3 = createTestSubtask('P1.M1.T2.S1', 'Subtask 3', 'Planned');
  const subtask4 = createTestSubtask('P1.M2.T1.S1', 'Subtask 4', 'Planned');
  const subtask5 = createTestSubtask('P2.M1.T1.S1', 'Subtask 5', 'Planned');

  // Level 3: Tasks
  const task1 = createTestTask('P1.M1.T1', 'Task 1', [subtask1, subtask2]);
  const task2 = createTestTask('P1.M1.T2', 'Task 2', [subtask3]);
  const task3 = createTestTask('P1.M2.T1', 'Task 3', [subtask4]);
  const task4 = createTestTask('P2.M1.T1', 'Task 4', [subtask5]);

  // Level 2: Milestones
  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', [
    task1,
    task2,
  ]);
  const milestone2 = createTestMilestone('P1.M2', 'Milestone 2', [task3]);
  const milestone3 = createTestMilestone('P2.M1', 'Milestone 3', [task4]);

  // Level 1: Phases (root)
  const phase1 = createTestPhase('P1', 'Phase 1', [milestone1, milestone2]);
  const phase2 = createTestPhase('P2', 'Phase 2', [milestone3]);

  return createTestBacklog([phase1, phase2]);
};
```

**Benefits:**

- Natural construction order
- Easy to verify parent-child relationships
- Clear hierarchy visualization
- Simple to add/remove levels

### Pattern 2: Dependency Chain Builder

For testing dependency resolution, create chains of dependent tasks:

```typescript
const createDependencyChain = (): Backlog => {
  // S1 has no dependencies
  const subtask1 = createTestSubtask(
    'P1.M1.T1.S1',
    'Subtask 1 - No Dependencies',
    'Planned',
    [] // No dependencies
  );

  // S2 depends on S1
  const subtask2 = createTestSubtask(
    'P1.M1.T1.S2',
    'Subtask 2 - Depends on S1',
    'Planned',
    ['P1.M1.T1.S1'] // Depends on S1
  );

  // S3 depends on S2
  const subtask3 = createTestSubtask(
    'P1.M1.T1.S3',
    'Subtask 3 - Depends on S2',
    'Planned',
    ['P1.M1.T1.S2'] // Depends on S2
  );

  const task1 = createTestTask('P1.M1.T1', 'Task 1', [
    subtask1,
    subtask2,
    subtask3,
  ]);
  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', [task1]);
  const phase1 = createTestPhase('P1', 'Phase 1', [milestone1]);

  return createTestBacklog([phase1]);
};
```

**Benefits:**

- Tests linear dependency chains
- Validates blocking behavior
- Ensures correct execution order
- Easy to extend for complex graphs

### Pattern 3: Status Variation Builder

Create hierarchies with different statuses to test filtering:

```typescript
const createMixedStatusHierarchy = (): Backlog => {
  const completeSubtask = createTestSubtask('P1.M1.T1.S1', 'Done', 'Complete');
  const plannedSubtask = createTestSubtask('P1.M1.T1.S2', 'Todo', 'Planned');
  const implementingSubtask = createTestSubtask(
    'P1.M1.T2.S1',
    'In Progress',
    'Implementing'
  );
  const failedSubtask = createTestSubtask('P1.M2.T1.S1', 'Failed', 'Failed');

  const task1 = createTestTask('P1.M1.T1', 'Task 1', [
    completeSubtask,
    plannedSubtask,
  ]);
  const task2 = createTestTask('P1.M1.T2', 'Task 2', [implementingSubtask]);
  const task3 = createTestTask('P1.M2.T1', 'Task 3', [failedSubtask]);

  const milestone1 = createTestMilestone('P1.M1', 'Milestone 1', [
    task1,
    task2,
  ]);
  const milestone2 = createTestMilestone('P1.M2', 'Milestone 2', [task3]);
  const phase1 = createTestPhase('P1', 'Phase 1', [milestone1, milestone2]);

  return createTestBacklog([phase1]);
};
```

**Benefits:**

- Tests status-based filtering
- Validates state transitions
- Ensures correct status propagation
- Covers all status values

### Pattern 4: Empty and Minimal Hierarchies

Test boundary conditions with minimal data:

```typescript
describe('GIVEN empty backlog', () => {
  it('SHOULD return empty array for any scope type', () => {
    const emptyBacklog: Backlog = createTestBacklog([]);
    const allScope: Scope = { type: 'all' };
    const phaseScope: Scope = { type: 'phase', id: 'P1' };
    const taskScope: Scope = { type: 'task', id: 'P1.M1.T1' };

    expect(resolveScope(emptyBacklog, allScope)).toEqual([]);
    expect(resolveScope(emptyBacklog, phaseScope)).toEqual([]);
    expect(resolveScope(emptyBacklog, taskScope)).toEqual([]);
  });
});

describe('GIVEN single item hierarchies', () => {
  it('SHOULD handle backlog with only one phase', () => {
    const phase = createTestPhase('P1', 'Single Phase');
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'phase', id: 'P1' };
    const result = resolveScope(backlog, scope);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1');
  });

  it('SHOULD handle backlog with only one subtask', () => {
    const subtask = createTestSubtask('P1.M1.T1.S1', 'S1');
    const task = createTestTask('P1.M1.T1', 'T1', [subtask]);
    const milestone = createTestMilestone('P1.M1', 'M1', [task]);
    const phase = createTestPhase('P1', 'P1', [milestone]);
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S1' };
    const result = resolveScope(backlog, scope);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1.M1.T1.S1');
  });
});
```

**Benefits:**

- Tests edge cases
- Validates empty input handling
- Ensures robustness
- Catches null/undefined issues

---

## Testing Edge Cases

### Pattern 1: Non-Existent ID Handling

Test that non-existent IDs return empty arrays gracefully:

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

  it('SHOULD return empty array for non-existent subtask', () => {
    const scope: Scope = { type: 'subtask', id: 'P1.M1.T1.S999' };
    const result = resolveScope(testBacklog, scope);
    expect(result).toEqual([]);
  });

  it('SHOULD return empty array for completely invalid ID', () => {
    const scope: Scope = { type: 'phase', id: 'INVALID' };
    const result = resolveScope(testBacklog, scope);
    expect(result).toEqual([]);
  });
});
```

**Benefits:**

- Tests graceful degradation
- Ensures no crashes on invalid input
- Validates error handling strategy
- Documents expected behavior for bad input

### Pattern 2: Circular Dependency Detection

Test handling of circular dependencies:

```typescript
describe('Edge Cases', () => {
  it('should handle circular dependencies gracefully', () => {
    // SETUP: Create two subtasks that depend on each other
    const subtask1 = createTestSubtask('P1.M1.T1.S1', 'Subtask 1', 'Planned', [
      'P1.M1.T1.S2',
    ]);
    const subtask2 = createTestSubtask('P1.M1.T1.S2', 'Subtask 2', 'Planned', [
      'P1.M1.T1.S1',
    ]);

    // EXECUTE: Check if subtask1 can execute
    mockGetDependencies.mockReturnValue([subtask2]);
    const canExecResult1 = orchestrator.canExecute(subtask1);
    const blockers1 = orchestrator.getBlockingDependencies(subtask1);

    // VERIFY: S1 should be blocked since S2 is not Complete
    expect(canExecResult1).toBe(false);
    expect(blockers1).toHaveLength(1);
    expect(blockers1[0].id).toBe('P1.M1.T1.S2');

    // EXECUTE: Now check S2 (depends on S1)
    mockGetDependencies.mockReturnValue([subtask1]);
    const canExecResult2 = orchestrator.canExecute(subtask2);
    const blockers2 = orchestrator.getBlockingDependencies(subtask2);

    // VERIFY: S2 should also be blocked since S1 is not Complete
    expect(canExecResult2).toBe(false);
    expect(blockers2).toHaveLength(1);
    expect(blockers2[0].id).toBe('P1.M1.T1.S1');

    // VERIFY: No infinite loop occurs - both calls return immediately
  });
});
```

**Benefits:**

- Prevents infinite loops
- Tests deadlock detection
- Ensures system stability
- Validates graph algorithms

### Pattern 3: Self-Dependency Handling

Test that items depending on themselves are handled:

```typescript
it('should handle self-dependency gracefully', () => {
  // SETUP: Create subtask that depends on itself
  const subtask = createTestSubtask(
    'P1.M1.T1.S1',
    'Test Subtask',
    'Planned',
    ['P1.M1.T1.S1'] // Self-dependency
  );

  // EXECUTE: Check if subtask can execute
  mockGetDependencies.mockReturnValue([subtask]);
  const canExecResult = orchestrator.canExecute(subtask);
  const blockers = orchestrator.getBlockingDependencies(subtask);

  // VERIFY: Self is not Complete, so should be blocked
  expect(canExecResult).toBe(false);
  expect(blockers).toHaveLength(1);
  expect(blockers[0].id).toBe('P1.M1.T1.S1');
});
```

**Benefits:**

- Tests edge case of self-referential data
- Ensures no infinite recursion
- Validates data integrity checks
- Prevents execution deadlocks

### Pattern 4: Boundary Condition Testing

Test limits and boundaries:

```typescript
describe('GIVEN edge cases and boundary conditions', () => {
  it('SHOULD handle phase with no milestones', () => {
    const phase = createTestPhase('P1', 'Empty', []);
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'phase', id: 'P1' };
    const result = resolveScope(backlog, scope);

    expect(result).toHaveLength(1); // Just the phase
    expect(result[0].id).toBe('P1');
  });

  it('SHOULD handle milestone with no tasks', () => {
    const milestone = createTestMilestone('P1.M1', 'Empty', []);
    const phase = createTestPhase('P1', 'P1', [milestone]);
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'milestone', id: 'P1.M1' };
    const result = resolveScope(backlog, scope);

    expect(result).toHaveLength(1); // Just the milestone
    expect(result[0].id).toBe('P1.M1');
  });

  it('SHOULD handle task with no subtasks', () => {
    const task = createTestTask('P1.M1.T1', 'Empty', []);
    const milestone = createTestMilestone('P1.M1', 'M1', [task]);
    const phase = createTestPhase('P1', 'P1', [milestone]);
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'task', id: 'P1.M1.T1' };
    const result = resolveScope(backlog, scope);

    expect(result).toHaveLength(1); // Just the task
    expect(result[0].id).toBe('P1.M1.T1');
  });

  it('SHOULD handle "all" with no subtasks in backlog', () => {
    const task = createTestTask('P1.M1.T1', 'T1', []);
    const milestone = createTestMilestone('P1.M1', 'M1', [task]);
    const phase = createTestPhase('P1', 'P1', [milestone]);
    const backlog = createTestBacklog([phase]);
    const scope: Scope = { type: 'all' };
    const result = resolveScope(backlog, scope);

    expect(result).toEqual([]); // No leaf subtasks exist
  });

  it('SHOULD handle large numbers', () => {
    const result = parseScope('P999.M999.T999.S999');
    expect(result.type).toBe('subtask');
    expect(result.id).toBe('P999.M999.T999.S999');
  });
});
```

**Benefits:**

- Tests limits of the system
- Ensures robustness at boundaries
- Validates data structure constraints
- Catches off-by-one errors

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Not Testing All Regex Patterns

**Problem:** Only testing basic patterns like `P1.M1` but missing edge cases like `P10.M5`.

**Solution:** Create a comprehensive test matrix:

```typescript
const validPatterns = [
  ['P1', 'phase'],
  ['P10', 'phase'],
  ['P999', 'phase'],
  ['P1.M1', 'milestone'],
  ['P10.M5', 'milestone'],
  ['P1.M1.T1', 'task'],
  ['P10.M5.T99', 'task'],
  ['P1.M1.T1.S1', 'subtask'],
  ['P999.M999.T999.S999', 'subtask'],
];

validPatterns.forEach(([pattern, expectedType]) => {
  it(`should parse ${pattern} as ${expectedType}`, () => {
    const result = parseScope(pattern);
    expect(result.type).toBe(expectedType);
    expect(result.id).toBe(pattern);
  });
});
```

### Pitfall 2: Hardcoding Test Data

**Problem:** Duplicating test data across multiple tests makes maintenance difficult.

**Solution:** Use factory functions and shared fixtures:

```typescript
// In a separate fixtures file
export const testFixtures = {
  simpleBacklog: () => createTestBacklog([createTestPhase('P1', 'Phase 1')]),
  complexBacklog: () => createComplexBacklog(),
  dependencyChain: () => createDependencyChain(),
  mixedStatus: () => createMixedStatusHierarchy(),
};

// In tests
import { testFixtures } from './fixtures.js';

it('should handle complex backlog', () => {
  const backlog = testFixtures.complexBacklog();
  // ... test logic
});
```

### Pitfall 3: Not Testing Traversal Order

**Problem:** Assuming the correct items are returned but not verifying their order.

**Solution:** Explicitly test ordering:

```typescript
it('SHOULD preserve DFS pre-order traversal', () => {
  const result = resolveScope(testBacklog, scope);

  // Extract IDs in order
  const ids = result.map(item => item.id);

  // Verify parent comes before children
  const parentIndex = ids.indexOf('P1');
  const childIndex = ids.indexOf('P1.M1');
  expect(parentIndex).toBeLessThan(childIndex);

  // Verify left-to-right sibling order
  const sibling1Index = ids.indexOf('P1.M1');
  const sibling2Index = ids.indexOf('P1.M2');
  expect(sibling1Index).toBeLessThan(sibling2Index);
});
```

### Pitfall 4: Missing Integration Tests

**Problem:** Only unit testing individual functions without testing how they work together.

**Solution:** Create integration tests that test the full flow:

```typescript
describe('integration', () => {
  describe('GIVEN parse and resolve flow', () => {
    it('SHOULD parse and resolve "all" scope', () => {
      // Parse user input
      const scope = parseScope('all');

      // Resolve against real backlog
      const result = resolveScope(createComplexBacklog(), scope);

      // Verify end-to-end behavior
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
  });
});
```

### Pitfall 5: Not Testing Immutability

**Problem:** Functions that mutate input data cause subtle bugs.

**Solution:** Test that inputs remain unchanged:

```typescript
it('SHOULD preserve immutability of backlog', () => {
  const backlog = createComplexBacklog();
  const originalJSON = JSON.stringify(backlog);

  const scope = parseScope('all');
  resolveScope(backlog, scope);

  // Verify backlog was not mutated
  expect(JSON.stringify(backlog)).toEqual(originalJSON);
});
```

### Pitfall 6: Incomplete Mock Coverage

**Problem:** Mocks not covering all code paths, leading to false positives.

**Solution:** Use comprehensive mocking strategy:

```typescript
// Mock all dependencies
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => mockLogger),
}));

vi.mock('../../../src/utils/task-utils.js', () => ({
  findItem: vi.fn(),
  getDependencies: vi.fn(() => []),
}));

vi.mock('../../../src/core/scope-resolver.js', () => ({
  resolveScope: vi.fn(),
  parseScope: vi.fn(),
}));

// Control mock behavior in tests
beforeEach(() => {
  vi.clearAllMocks();
  mockResolveScope.mockReturnValue([]);
});
```

---

## Best Practices Summary

### 1. Test Structure

- **Use Setup/Execute/Verify pattern** for clarity
- **Group related tests** in nested describe blocks
- **Use descriptive test names** that document behavior (GIVEN/SHOULD pattern)
- **Keep tests focused** - one assertion per test when possible

### 2. Test Data Management

- **Create factory functions** for test data to avoid duplication
- **Build hierarchies leaf-first** for natural construction
- **Use default parameters** to reduce boilerplate
- **Share fixtures** across multiple test files

### 3. Coverage

- **Test all regex patterns** including edge cases (multi-digit, zero-padded)
- **Test invalid inputs** to ensure proper error handling
- **Test boundary conditions** (empty arrays, single items, large numbers)
- **Test traversal order** explicitly, not just content

### 4. Integration Testing

- **Test full workflows** from parsing to resolution
- **Use real SessionManager** in integration tests (not mocks)
- **Test with filesystem I/O** for realistic scenarios
- **Verify immutability** of input data

### 5. Error Handling

- **Test custom error types** (ScopeParseError)
- **Validate error messages** for usefulness
- **Test error context** preservation
- **Ensure graceful degradation** for invalid input

### 6. Edge Cases

- **Non-existent IDs** should return empty arrays
- **Circular dependencies** should not cause infinite loops
- **Self-dependencies** should be handled correctly
- **Empty hierarchies** should work at every level

### 7. Type Safety

- **Test type guards** (isScopeType, isScope)
- **Use TypeScript discriminated unions** for scope types
- **Validate type narrowing** works correctly
- **Test runtime type validation**

---

## References and Resources

### Internal Codebase References

1. **Unit Tests:**
   - `/home/dustin/projects/hacky-hack/tests/unit/core/scope-resolver.test.ts`
   - `/home/dustin/projects/hacky-hack/tests/unit/core/task-traversal.test.ts`
   - `/home/dustin/projects/hacky-hack/tests/unit/core/task-dependencies.test.ts`

2. **Integration Tests:**
   - `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator.test.ts`
   - `/home/dustin/projects/hacky-hack/tests/integration/core/task-orchestrator-e2e.test.ts`

3. **Implementation:**
   - `/home/dustin/projects/hacky-hack/src/core/scope-resolver.ts`
   - `/home/dustin/projects/hacky-hack/src/core/task-orchestrator.ts`
   - `/home/dustin/projects/hacky-hack/src/utils/task-utils.ts`

4. **Configuration:**
   - `/home/dustin/projects/hacky-hack/vitest.config.ts` - Vitest configuration with 100% coverage thresholds

### External Documentation

#### Vitest Testing Framework

- **Official Documentation:** https://vitest.dev/guide/
- **API Reference:** https://vitest.dev/api/
- **Best Practices:** https://vitest.dev/guide/features.html#snapshot

#### TypeScript Testing Patterns

- **Testing Patterns Guide:** https://basarat.gitbook.io/typescript/type-system/tdd
- **Mock Patterns:** https://jestjs.io/docs/mock-functions (patterns apply to Vitest)

#### Regex Testing

- **Regex101:** https://regex101.com/ - Interactive regex tester
- **Debuggex:** https://www.debuggex.com/ - Visual regex debugger

#### Hierarchical Data Structures

- **Tree Traversal Algorithms:** https://en.wikipedia.org/wiki/Tree_traversal
- **DFS vs BFS:** https://www.geeksforgeeks.org/dfs-vs-bfs/

### GitHub Repositories and Examples

1. **Vitest Examples:** https://github.com/vitest-dev/vitest/tree/main/examples
2. **Testing Library:** https://github.com/testing-library/dom-testing-library
3. **TypeScript Testing:** https://github.com/microsoft/TypeScript/tree/main/tests

### StackOverflow References

Search tags:

- `#vitest`
- `#typescript-testing`
- `#regex-validation`
- `#hierarchical-data`
- `#scope-resolution`

### Key Patterns from Research

1. **Setup/Execute/Verify** - Universal testing pattern
2. **Factory Functions** - DRY test data creation
3. **DFS Traversal** - Consistent hierarchical processing
4. **Type Guards** - Runtime type validation
5. **Error Context** - Actionable error messages
6. **Immutability** - Preserve input data
7. **Edge Cases** - Boundary condition testing

---

## Conclusion

This research document provides comprehensive patterns for testing scope filtering and hierarchical task selection systems. The patterns are derived from real-world implementations in the hacky-hack codebase and follow industry best practices for TypeScript and Vitest.

**Key Takeaways:**

1. **Structure tests clearly** with Setup/Execute/Verify pattern
2. **Use factory functions** to manage complex test data
3. **Test thoroughly** including all regex patterns, edge cases, and integration flows
4. **Validate behavior** not just output - test ordering, immutability, and error handling
5. **Document patterns** in test names and descriptions for maintainability

These patterns ensure robust, maintainable tests that catch bugs early and provide confidence in hierarchical scope resolution logic.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-21
**Author:** Research Task P1.M2.T3.S2
**Status:** Complete
