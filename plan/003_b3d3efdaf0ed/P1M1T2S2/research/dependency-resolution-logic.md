# Dependency Resolution Logic Research

## Overview

This document provides a deep analysis of the dependency resolution logic in `src/core/task-orchestrator.ts`, focusing on how subtask dependencies are handled during execution.

## 1. canExecute() Method (Lines 251-265)

### Purpose
Determines whether a subtask can be executed based on its dependencies.

### Return Value
- `boolean`: `true` if the subtask can execute, `false` otherwise

### Logic Flow

```typescript
public canExecute(subtask: Subtask): boolean {
  // 1. Get actual Subtask objects from dependency IDs
  const dependencies = getDependencies(subtask, this.#backlog);

  // 2. GOTCHA: Empty array means no dependencies = can execute
  if (dependencies.length === 0) {
    return true;
  }

  // 3. Check ALL dependencies are Complete using Array.every()
  const allComplete = dependencies.every(dep => dep.status === 'Complete');

  return allComplete;
}
```

### Conditions for `true`
1. **No dependencies**: When `dependencies` array is empty (line 256-258)
2. **All dependencies Complete**: When ALL dependencies have `status === 'Complete'` (line 262)

### Conditions for `false`
- ANY dependency has `status !== 'Complete'`

### Edge Cases & Gotchas
- **Empty dependencies array**: Returns `true` immediately (line 256)
- **Strict equality**: Uses `===` for status comparison (line 262)
- **Array.every()**: Critical - returns `false` if ANY dependency fails the condition

## 2. getBlockingDependencies() Method (Lines 284-293)

### Purpose
Identifies which dependencies are preventing a subtask from executing.

### Return Value
- `Subtask[]`: Array of Subtask objects that are NOT complete

### Logic Flow

```typescript
public getBlockingDependencies(subtask: Subtask): Subtask[] {
  // 1. Get actual Subtask objects from dependency IDs
  const dependencies = getDependencies(subtask, this.#backlog);

  // 2. Filter to get only incomplete dependencies
  const blocking = dependencies.filter(dep => dep.status !== 'Complete');

  return blocking;
}
```

### Filtering Logic
- Uses `Array.filter()` to create a new array (immutable)
- Filters out dependencies where `status !== 'Complete'`
- Returns empty array if no blocking dependencies exist

### Edge Cases
- **Empty dependencies**: Returns empty array
- **All Complete**: Returns empty array
- **Some Complete**: Returns only incomplete ones

## 3. getDependencies Utility (task-utils.ts Lines 131-142)

### Purpose
Resolves dependency IDs to actual Subtask objects.

### Return Value
- `Subtask[]`: Array of valid Subtask objects matching the dependency IDs

### Logic Flow

```typescript
export function getDependencies(task: Subtask, backlog: Backlog): Subtask[] {
  const results: Subtask[] = [];

  for (const depId of task.dependencies) {
    const item = findItem(backlog, depId);
    if (item && isSubtask(item)) {
      results.push(item);
    }
  }

  return results;
}
```

### Resolution Process
1. Iterates through each `depId` in `task.dependencies` (line 134)
2. Calls `findItem()` to locate the item in the backlog (line 135)
3. Uses `isSubtask()` type guard to ensure it's a Subtask (line 136)
4. Only pushes valid Subtask objects to results (line 137)

### Error Handling
- **Non-existent IDs**: `findItem()` returns `null` → filtered out
- **Non-subtask items**: `isSubtask()` returns `false` → filtered out
- **Circular dependencies**: Handled gracefully by returning empty array
- **Malformed dependencies**: Only valid Subtask IDs are resolved

## 4. Usage in executeSubtask() (Lines 617-640)

### Flow Integration

```typescript
// Check if dependencies are satisfied
if (!this.canExecute(subtask)) {
  const blockers = this.getBlockingDependencies(subtask);

  // Log each blocking dependency for clarity
  for (const blocker of blockers) {
    this.#logger.info({
      subtaskId: subtask.id,
      blockerId: blocker.id,
      blockerTitle: blocker.title,
      blockerStatus: blocker.status,
    }, 'Blocked on dependency');
  }

  this.#logger.warn(
    { subtaskId: subtask.id },
    'Subtask blocked on dependencies, skipping'
  );

  // Return early without executing
  return;
}
```

### Execution Flow
1. **Line 617**: Calls `canExecute()` to check if dependencies are satisfied
2. **Line 618**: If blocked, calls `getBlockingDependencies()` to get specific blockers
3. **Lines 621-631**: Logs each blocking dependency with detailed information
4. **Lines 633-636**: Logs warning about blocked subtask
5. **Line 639**: Returns early without executing the subtask

### Key Behaviors
- **Early return**: If blocked, subtask is skipped entirely
- **Detailed logging**: Each blocker is logged with ID, title, and status
- **Status progression**: Subtask stays in current status (doesn't change to Failed)

## 5. Subtask Dependencies Field Structure

### Definition (Models.ts Lines 266-276)

```typescript
/**
 * IDs of subtasks that must complete before this one can start
 *
 * @remarks
 * The Task Orchestrator uses this array to enforce dependency ordering.
 * Empty array means no dependencies.
 *
 * @example ['P1.M1.T1.S1', 'P1.M1.T1.S2']
 */
readonly dependencies: string[];
```

### Structure
- **Type**: `string[]` - readonly array of dependency IDs
- **Values**: Array of subtask IDs (e.g., `'P1.M1.T1.S1'`)
- **Empty array**: Indicates no dependencies
- **Reference semantics**: Contains IDs, not Subtask objects

### Valid Values
- `[]`: No dependencies
- `['P1.M1.T1.S1']`: Single dependency
- `['P1.M1.T1.S1', 'P1.M1.T1.S2']`: Multiple dependencies
- Non-existent IDs are handled gracefully by `getDependencies()`

## 6. Complete Interaction Flow

### Typical Execution Sequence

```
1. executeSubtask() called
2. setStatus('Researching') - prepares for execution
3. canExecute() called:
   → getDependencies() resolves IDs to Subtasks
   → checks if deps.length === 0 → true
   → checks deps.every(dep => dep.status === 'Complete') → true/false
4. If !canExecute():
   → getBlockingDependencies() finds incomplete deps
   → logs each blocker
   → returns early (no execution)
5. If canExecute():
   → setStatus('Implementing')
   → proceeds with PRPRuntime execution
```

### Error Resilience
- **Missing dependencies**: Filtered out by `getDependencies()`
- **Circular dependencies**: Not detected but handled gracefully
- **Status changes**: Reflected on next call due to backlog refresh
- **Race conditions**: Handled by polling in `waitForDependencies()`

### Performance Considerations
- **Efficient resolution**: `getDependencies()` caches nothing, resolves fresh each time
- **Immutable operations**: `filter()` and `every()` create new arrays
- **Early returns**: `canExecute()` returns early for empty dependencies
- **Type safety**: `isSubtask()` ensures only valid Subtasks are processed

## 7. Testing Considerations

### Test Scenarios
1. **No dependencies**: Should always return `true`
2. **Single complete dependency**: Should return `true`
3. **Single incomplete dependency**: Should return `false`
4. **Mixed complete/incomplete**: Should return `false`
5. **Non-existent dependency IDs**: Should work gracefully
6. **Circular dependencies**: Should not cause infinite loops

### Mock Data Examples
```typescript
// No dependencies
const subtask1 = { id: 'S1', dependencies: [], status: 'Planned' };

// Complete dependencies
const subtask2 = { id: 'S2', dependencies: ['S1'], status: 'Planned' };
const subtask1 = { id: 'S1', dependencies: [], status: 'Complete' };

// Incomplete dependency
const subtask3 = { id: 'S3', dependencies: ['S1'], status: 'Planned' };
const subtask1 = { id: 'S1', dependencies: [], status: 'Implementing' };
```

## 8. Critical Patterns & Best Practices

### Patterns Observed
1. **Immutable operations**: All filtering creates new arrays
2. **Type safety**: Extensive use of type guards and discriminated unions
3. **Early returns**: Fast path for empty dependencies
4. **Graceful degradation**: Handles malformed/missing dependencies
5. **Detailed logging**: Comprehensive blocker information for debugging

### Best Practices
- **Always check dependencies before execution**
- **Use specific error messages for debugging**
- **Consider adding cycle detection for complex dependency graphs**
- **Consider adding timeout for long dependency chains**
- **Document circular dependency behavior clearly**
