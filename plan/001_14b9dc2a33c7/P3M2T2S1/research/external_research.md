# External Research: CLI Scope Parsing Best Practices

## Summary

This document compiles best practices for CLI scope/syntax parsing based on industry research and similar tools.

## 1. Hierarchical Scope Parsing in CLI Tools

### Common Patterns from Major CLI Tools

#### Nx (Monorepo Tools) - Scope Filtering Patterns

```bash
# All projects
nx run-many --target=build --all

# Specific projects (comma-separated)
nx run-many -t build -p project1,project2

# Wildcard patterns
nx run-many -t build -p "app-*"
nx run-many -t build -p "*-lib"

# Directory-based patterns
nx run-many -t build -p "apps/*"

# Exclude patterns
nx run-many -t build -p "app-*" --exclude="app-e2e-*"

# Tag-based filtering
nx run-many -t build --tags=frontend
```

**Key Patterns**:

- `--all` flag for everything
- Wildcards with `*` for pattern matching
- Comma-separated values for multiple items
- `--exclude` flag for filtering out

#### Lerna - Package Scope Patterns

```bash
# Single scope
lerna run build --scope package-a

# Multiple scopes
lerna run build --scope package-a --scope package-b

# Glob patterns
lerna run build --scope "packages/*"

# Include dependencies
lerna run build --scope package-a --include-filtered-dependencies

# Ignore patterns
lerna run build --ignore package-a
```

#### npm/yarn - Workspace Patterns

```bash
# Workspace filtering
yarn workspaces foreach --all run build
yarn workspaces foreach --from package-a run test
yarn workspaces foreach --exclude package-a run lint
```

### Recommended CLI Syntax for Our Implementation

Based on dot-notation hierarchy (`P1.M1.T1.S1`):

```bash
# Single item
mycli execute P1.M1.T1.S1

# All items in a scope
mycli execute P1.*                    # All milestone 1 tasks
mycli execute P1.M1.*                 # All tasks in milestone 1
mycli execute --all                   # Everything

# Wildcard patterns
mycli execute P*.M1.*                 # All M1 tasks across all phases
mycli execute P1.M*.*                 # All tasks across all milestones in P1

# Multiple specific items
mycli execute P1.M1.T1.S1,P1.M1.T2.S1

# Negative filtering
mycli execute P1.* --exclude P1.M2
```

## 2. TypeScript Enum and Type Guard Patterns

### Enhanced Type Guard Pattern

```typescript
// Basic type guard
function isStatus(value: unknown): value is Status {
  return (
    typeof value === 'string' &&
    [
      'Planned',
      'Researching',
      'Implementing',
      'Complete',
      'Failed',
      'Obsolete',
    ].includes(value as Status)
  );
}

// Generic enum type guard
function isValidEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return (
    typeof value === 'string' &&
    Object.values(enumObj).includes(value as T[keyof T])
  );
}

// Parser with error handling
function parseStatus(input: unknown): Status {
  if (typeof input !== 'string') {
    throw new ParseError(
      'Status',
      input,
      `Expected string, got ${typeof input}`
    );
  }

  if (!isStatus(input)) {
    throw new ParseError(
      'Status',
      input,
      `Must be one of: ${Object.values(StatusEnum).join(', ')}`
    );
  }

  return input;
}
```

### Result Type for Safe Parsing

```typescript
type Result<T, E = ParseError> =
  | { success: true; data: T }
  | { success: false; error: E };

function safeParseStatus(input: unknown): Result<Status> {
  try {
    const status = parseStatus(input);
    return { success: true, data: status };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof ParseError
          ? error
          : new ParseError('Status', input, 'Unknown error'),
    };
  }
}
```

### Parser Error Handling Pattern

```typescript
// Custom error class
class ParseError extends Error {
  constructor(
    public readonly fieldName: string,
    public readonly invalidValue: unknown,
    message: string
  ) {
    super(`Parse error for ${fieldName}: ${message}`);
    this.name = 'ParseError';
  }

  toString(): string {
    return `${this.name}: ${this.message} (received: ${JSON.stringify(this.invalidValue)})`;
  }
}
```

## 3. Tree Filtering/Traversal Patterns

### Filter by Scope Pattern

```typescript
interface ScopeFilter {
  phase?: number | '*';
  milestone?: number | '*';
  task?: number | '*';
  subtask?: number | '*';
}

function filterByScope(backlog: Backlog, scope: ScopeFilter): Subtask[] {
  const results: Subtask[] = [];

  for (const phase of backlog.backlog) {
    // Check phase filter
    if (scope.phase !== '*' && scope.phase !== undefined) {
      const phaseNum = parseInt(phase.id.slice(1), 10);
      if (phaseNum !== scope.phase) continue;
    }

    for (const milestone of phase.milestones) {
      // Check milestone filter
      if (scope.milestone !== '*' && scope.milestone !== undefined) {
        const milestoneNum = parseInt(milestone.id.split('.')[1].slice(1), 10);
        if (milestoneNum !== scope.milestone) continue;
      }

      for (const task of milestone.tasks) {
        // Check task filter
        if (scope.task !== '*' && scope.task !== undefined) {
          const taskNum = parseInt(task.id.split('.')[2].slice(1), 10);
          if (taskNum !== scope.task) continue;
        }

        for (const subtask of task.subtasks) {
          // Check subtask filter
          if (scope.subtask !== '*' && scope.subtask !== undefined) {
            const subtaskNum = parseInt(subtask.id.split('.')[3].slice(1), 10);
            if (subtaskNum !== scope.subtask) continue;
          }

          results.push(subtask);
        }
      }
    }

    return results;
  }
}
```

### Generator Pattern for Memory Efficiency

```typescript
function* filterByScopeLazy(
  backlog: Backlog,
  scope: ScopeFilter
): Generator<Subtask> {
  for (const phase of backlog.backlog) {
    // ... filtering logic ...
    yield subtask;
  }
}
```

### Find Leaf Nodes Pattern

```typescript
// Get all leaf nodes (subtasks in our hierarchy)
function getLeafNodes(backlog: Backlog): Subtask[] {
  const leaves: Subtask[] = [];

  for (const phase of backlog.backlog) {
    for (const milestone of phase.milestones) {
      for (const task of milestone.tasks) {
        // Subtasks are our leaf nodes
        leaves.push(...task.subtasks);
      }
    }
  }

  return leaves;
}

// Get all descendants of a node
function getAllDescendants(itemId: string, backlog: Backlog): HierarchyItem[] {
  const item = findItem(backlog, itemId);
  if (!item) return [];

  const descendants: HierarchyItem[] = [];

  function traverse(node: Phase | Milestone | Task): void {
    if ('milestones' in node) {
      descendants.push(...node.milestones);
      node.milestones.forEach(traverse);
    } else if ('tasks' in node) {
      descendants.push(...node.tasks);
      node.tasks.forEach(traverse);
    } else if ('subtasks' in node) {
      descendants.push(...node.subtasks);
    }
  }

  if (item.type === 'Phase') traverse(item);
  else if (item.type === 'Milestone') traverse(item);
  else if (item.type === 'Task') traverse(item);

  return descendants;
}
```

## 4. Implementation Example: Complete Scope Parser

```typescript
// Scope parser utility
interface ScopePattern {
  phase?: number | '*';
  milestone?: number | '*';
  task?: number | '*';
  subtask?: number | '*';
}

function parseScopePattern(pattern: string): ScopePattern {
  // Handle "all"
  if (pattern === 'all' || pattern === '*') {
    return { phase: '*', milestone: '*', task: '*', subtask: '*' };
  }

  // Parse dot notation: P1.M1.T1.S1 or P1.*.T1.*
  const parts = pattern.split('.');

  const result: ScopePattern = {};

  for (const part of parts) {
    const match = part.match(/^([PMTS])(\d+|\*)$/);
    if (!match) {
      throw new Error(`Invalid scope pattern: ${part}`);
    }

    const [, type, value] = match;
    const numValue = value === '*' ? '*' : parseInt(value, 10);

    switch (type) {
      case 'P':
        result.phase = numValue;
        break;
      case 'M':
        result.milestone = numValue;
        break;
      case 'T':
        result.task = numValue;
        break;
      case 'S':
        result.subtask = numValue;
        break;
    }
  }

  return result;
}

function matchesScope(itemId: string, pattern: ScopePattern): boolean {
  const itemParts = itemId.match(/^P(\d+)\.M(\d+)\.T(\d+)\.S(\d+)$/);
  if (!itemParts) return false;

  const [, phase, milestone, task, subtask] = itemParts.map(Number);

  if (
    pattern.phase !== '*' &&
    pattern.phase !== undefined &&
    pattern.phase !== phase
  )
    return false;
  if (
    pattern.milestone !== '*' &&
    pattern.milestone !== undefined &&
    pattern.milestone !== milestone
  )
    return false;
  if (
    pattern.task !== '*' &&
    pattern.task !== undefined &&
    pattern.task !== task
  )
    return false;
  if (
    pattern.subtask !== '*' &&
    pattern.subtask !== undefined &&
    pattern.subtask !== subtask
  )
    return false;

  return true;
}
```

## 5. Key Best Practices Summary

### Scope Syntax

- Use dot notation for hierarchy: `P1.M1.T1.S1`
- Support wildcards: `P1.*.T1.*`
- Support "all" keyword: `--all` or `all`
- Support multiple patterns: comma-separated or space-separated
- Support exclude flags: `--exclude`

### TypeScript Patterns

- Use string literal unions for enums
- Use Zod for runtime validation
- Create custom error classes for parsing errors
- Use Result types for safe parsing
- Implement type guards for runtime checks

### Tree Filtering

- Use generators for memory efficiency
- Implement early exits in search
- Support lazy evaluation
- Use Immer for immutable updates

## 6. URLs and References

**CLI Libraries:**

- Commander.js: https://www.npmjs.com/package/commander
- Yargs: https://www.npmjs.com/package/yargs
- Oclif: https://oclif.io/

**Monorepo/Scope Tools:**

- Nx: https://nx.dev
- Lerna: https://lerna.js.org/
- Turborepo: https://turbo.build/repo

**Open Source Examples:**

- Plane (Project Management): https://github.com/makeplane/plane
- Focalboard: https://github.com/mattermost/focalboard
- Vikunja: https://github.com/go-vikunja/vikunja

**TypeScript Resources:**

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Zod Validation: https://zod.dev/
- Immer: https://immerjs.github.io/immer/
