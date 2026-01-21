# Existing Test Patterns Analysis for P1.M3.T1.S1

## Test Framework: Vitest 1.6.1

## Test File Structure

**Naming Convention**: `*.test.ts` (e.g., `models.test.ts`, `task-utils.test.ts`)

**Organization**:

- **describe blocks**: Group related tests by feature/schema/component
  - Top-level: `describe('core/models Zod Schemas', () => ...)`
  - Nested: `describe('StatusEnum', () => ...)`, `describe('SubtaskSchema', () => ...)`
- **it blocks**: Individual test cases with clear, descriptive names
- **Section comments**: Tests organized with SETUP, EXECUTE, VERIFY comments

## Test Patterns

### Happy Path Tests

```typescript
it('should parse valid subtask', () => {
  // SETUP: Valid subtask data
  const data = { ...validSubtask };

  // EXECUTE
  const result = SubtaskSchema.safeParse(data);

  // VERIFY
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual(validSubtask);
  }
});
```

### Error Case Tests

```typescript
it('should reject subtask with invalid id format', () => {
  const invalid = { ...validSubtask, id: 'invalid-id' };
  const result = SubtaskSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});
```

### Edge Case Tests

```typescript
it('should reject subtask with story_points exceeding maximum', () => {
  const invalid = { ...validSubtask, story_points: 22 };
  const result = SubtaskSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});
```

### Complex Nesting Tests

```typescript
it('should validate 4-level deep hierarchy', () => {
  const deepBacklog: Backlog = {
    backlog: [
      {
        id: 'P1',
        type: 'Phase',
        milestones: [
          {
            id: 'P1.M1',
            type: 'Milestone',
            tasks: [
              {
                id: 'P1.M1.T1',
                type: 'Task',
                subtasks: [
                  {
                    id: 'P1.M1.T1.S1',
                    type: 'Subtask',
                    // ...
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const result = BacklogSchema.safeParse(deepBacklog);
  expect(result.success).toBe(true);
});
```

## Assertion Patterns

### Zod Schema Validation

- **Success**: `expect(result.success).toBe(true)`
- **Failure**: `expect(result.success).toBe(false)`
- **Data equality**: `expect(result.data).toEqual(expectedData)`
- **Enum checking**: `expect(StatusEnum.options).toEqual(['Planned', 'Researching', ...])`

### Type Discriminator Tests

```typescript
it('should reject subtask with wrong type literal', () => {
  const invalid = { ...validSubtask, type: 'Task' };
  const result = SubtaskSchema.safeParse(invalid);
  expect(result.success).toBe(false);
});
```

### Error Testing

```typescript
await expect(queue.waitForPRP('P1.M1.T1.S999')).rejects.toThrow(
  'No PRP available for task P1.M1.T1.S999'
);
```

## Key Test Files

| File                                         | Lines | Purpose                               |
| -------------------------------------------- | ----- | ------------------------------------- |
| tests/unit/core/models.test.ts               | 2020  | Zod schema tests for task hierarchy   |
| tests/unit/core/task-utils.test.ts           | 32058 | Utility function testing              |
| tests/unit/core/dependency-validator.test.ts | 18335 | Dependency graph validation           |
| tests/unit/core/session-utils.test.ts        | 24526 | File system operation testing         |
| tests/setup.ts                               | -     | Global test setup with API validation |

## Test Setup

### Global Setup File: tests/setup.ts

- API endpoint validation (only z.ai allowed)
- Mock cleanup with `vi.clearAllMocks()`
- Environment variable cleanup with `vi.unstubAllEnvs()`

### Vitest Configuration: vitest.config.ts

- 100% coverage threshold enforced
- ESM modules support
- Node.js environment

## Mocking Patterns

### Module Mocking

```typescript
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
```

### Function Mocking

```typescript
vi.mock('../../../src/utils/logger.js', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));
```

## Factory Patterns

```typescript
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
```

## Coverage Areas

1. Type validation (correct type discriminators)
2. ID pattern validation (P1.M1.T1.S1 format)
3. Status field validation (all valid/invalid values)
4. Required fields (mandatory field presence)
5. Nested structure validation (parent-child relationships)
6. Boundary conditions (min/max length, numeric limits)
7. Error handling (error messages and exception propagation)
