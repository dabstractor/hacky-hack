# Zod Testing Best Practices Research for P1.M3.T1.S1

## Core Principles
1. Always test both success and failure paths
2. Use `safeParse()` over `parse()` in tests
3. Test edge cases (empty strings, boundary values, partially valid objects)
4. Validate error messages
5. Test type inference

## safeParse vs parse
- **`safeParse()`**: Returns `{ success: boolean, data?: T, error?: ZodError }`
  - Best for tests - never throws, enables assertions
  - Enables type narrowing with discriminated union
- **`parse()`**: Returns data directly or throws ZodError
  - Avoid in tests unless testing exception handling

## Test Pattern: Success Path
```typescript
it('should validate valid subtask', () => {
  const result = SubtaskSchema.safeParse(validSubtask);

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual(validSubtask);
  }
});
```

## Test Pattern: Failure Path
```typescript
it('should reject invalid story_points', () => {
  const result = SubtaskSchema.safeParse({
    ...validSubtask,
    story_points: 22
  });

  expect(result.success).toBe(false);
});
```

## Test Pattern: Nested Error Paths
```typescript
it('should report nested validation errors', () => {
  const result = TaskSchema.safeParse({
    id: 'P1.M1.T1',
    title: 'Task',
    subtasks: [{ id: 'INVALID', title: 'Test', status: 'Planned', story_points: 1, dependencies: [], context_scope: 'Test' }]
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    const subtaskError = result.error.issues.find(
      issue => issue.path.includes('subtasks')
    );
    expect(subtaskError?.path).toEqual(['subtasks', 0, 'id']);
  }
});
```

## Test Pattern: Table-Driven Testing
```typescript
describe.each([
  { id: 'P1', expected: true },
  { id: 'P1.M1', expected: true },
  { id: 'P1.M1.T1', expected: true },
  { id: 'P1.M1.T1.S1', expected: true },
  { id: 'p1', expected: false },
  { id: 'P1.M1.T1.S1.E1', expected: false }
])('Task ID validation: $id', ({ id, expected }) => {
  it(`should ${expected ? 'accept' : 'reject'} ${id}`, () => {
    const result = TaskIdSchema.safeParse(id);
    expect(result.success).toBe(expected);
  });
});
```

## Common Gotchas

### Type Narrowing with safeParse
```typescript
// WRONG
const result = schema.safeParse(data);
expect(result.data).toBeDefined(); // TypeScript error!

// CORRECT
const result = schema.safeParse(data);
expect(result.success).toBe(true);
if (result.success) {
  expect(result.data).toBeDefined();
}
```

### Nested Error Paths
```typescript
// WRONG
expect(result.error.issues[0].path).toBe('tasks.0.id');

// CORRECT
expect(result.error.issues[0].path).toEqual(['tasks', 0, 'id']);
```

### Optional vs Nullable
```typescript
const optionalField = z.string().optional();     // undefined | string
const nullableField = z.string().nullable();     // null | string
const optionalNullable = z.string().optional().nullable(); // undefined | null | string
```

## Sources
- https://github.com/colinhacks/zod
- https://github.com/colinhacks/zod#error-handling
- https://vitest.dev/guide/
