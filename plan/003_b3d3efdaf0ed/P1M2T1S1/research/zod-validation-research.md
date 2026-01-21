# Zod Validation for tasks.json - Research Report

## Summary

Comprehensive research on Zod schema validation patterns for tasks.json, including schema definitions, validation usage, testing patterns, and error handling.

## 1. Zod Schemas

**File**: `src/core/models.ts`

### Primary Task Hierarchy Schemas

```typescript
// Root schema for the entire task hierarchy
export const BacklogSchema: z.ZodType<Backlog> = z.object({
  backlog: z.array(PhaseSchema),
});

// Phase level (P{N})
export const PhaseSchema: z.ZodType<Phase> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+$/, 'Invalid phase ID format (expected P{N})'),
    type: z.literal('Phase'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    status: StatusEnum,
    description: z.string().min(1, 'Description is required'),
    milestones: z.array(z.lazy(() => MilestoneSchema)),
  })
);

// Milestone level (P{N}.M{N})
export const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/, 'Invalid milestone ID format'),
    type: z.literal('Milestone'),
    title: z.string().min(1).max(200),
    status: StatusEnum,
    description: z.string().min(1),
    tasks: z.array(z.lazy(() => TaskSchema)),
  })
);

// Task level (P{N}.M{N}.T{N})
export const TaskSchema: z.ZodType<Task> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+$/, 'Invalid task ID format'),
  type: z.literal('Task'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  description: z.string().min(1),
  subtasks: z.array(SubtaskSchema),
});

// Subtask level (P{N}.M{N}.T{N}.S{N})
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format'),
  type: z.literal('Subtask'),
  title: z.string().min(1).max(200),
  status: StatusEnum,
  story_points: z
    .number()
    .int()
    .min(1, 'Story points must be at least 1')
    .max(21, 'Story points cannot exceed 21'),
  dependencies: z.array(z.string()).min(0),
  context_scope: ContextScopeSchema,
});
```

### Status Enum Validation

```typescript
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
```

### Type Validation

```typescript
export const ItemTypeEnum = z.enum(['Phase', 'Milestone', 'Task', 'Subtask']);
```

## 2. Validation Usage

### Write Validation

**File**: `src/core/session-utils.ts`

```typescript
export async function writeTasksJSON(
  sessionPath: string,
  backlog: Backlog
): Promise<void> {
  try {
    // Validate with Zod schema before writing
    const validated = BacklogSchema.parse(backlog);

    // Serialize to JSON with 2-space indentation
    const content = JSON.stringify(validated, null, 2);

    // Write atomically
    await atomicWrite(tasksPath, content);
  } catch (error) {
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'write tasks.json',
      error as Error
    );
  }
}
```

### Read Validation

```typescript
export async function readTasksJSON(sessionPath: string): Promise<Backlog> {
  try {
    const tasksPath = resolve(sessionPath, 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    const parsed = JSON.parse(content);
    const validated = BacklogSchema.parse(parsed);

    return validated;
  } catch (error) {
    throw new SessionFileError(
      resolve(sessionPath, 'tasks.json'),
      'read tasks.json',
      error as Error
    );
  }
}
```

## 3. Zod Configuration

### Strict Mode

- Uses `BacklogSchema.parse()` which throws on validation failures
- Not `safeParse()` - validation errors are fatal for file operations

### Error Handling

```typescript
// Zod validation errors are wrapped in SessionFileError
catch (error) {
  throw new SessionFileError(
    resolve(sessionPath, 'tasks.json'),
    'write tasks.json',
    error as Error  // This could be a ZodError
  );
}
```

### Schema Enforcement

- All schemas use `z.lazy()` for recursive structures
- Uses `z.literal()` for type discriminants
- Regex patterns enforce strict ID formats

## 4. Testing Zod Validation

### Primary Testing Method: Use `safeParse()`

```typescript
// ✅ Recommended: safeParse for tests
const result = MySchema.safeParse(data);
expect(result.success).toBe(true);
if (result.success) {
  expect(result.data.field).toBe(expected);
}

// ❌ Avoid: parse with try/catch
try {
  MySchema.parse(data);
  expect(true).toBe(true);
} catch (err) {
  expect(err).toBeInstanceOf(z.ZodError);
}
```

### Testing Patterns

#### Test Each Validation Rule Individually

```typescript
test.each([1, 2, 3, 5, 8, 13, 21])('should accept %d story points', points => {
  const result = SubtaskSchema.safeParse({
    ...validSubtask,
    story_points: points,
  });
  expect(result.success).toBe(true);
});
```

#### Test Error Messages and Paths

```typescript
if (!result.success) {
  expect(result.error.issues[0].path).toEqual(['fieldName']);
  expect(result.error.issues[0].message).toContain('expected message');
}
```

#### Test Type Coercion

```typescript
it('should reject string numbers', () => {
  const result = schema.safeParse({ numberField: '123' as any });
  expect(result.success).toBe(false);
});
```

#### Test Nested Validation

```typescript
it('should validate nested structure', () => {
  const result = NestedSchema.safeParse({
    id: 'P1',
    subtasks: [{ id: 'S1', title: '' }], // Invalid: empty title
  });
  expect(result.success).toBe(false);
});
```

## 5. External Documentation

### Official Zod Documentation

- **API Documentation**: https://zod.dev/api
- **GitHub Repository**: https://github.com/colinhacks/zod
- **Test Suite**: `/node_modules/zod/src/v3/tests/` (59+ test files)

### Key Test Files in Zod

- `/node_modules/zod/src/v3/tests/object.test.ts`
- `/node_modules/zod/src/v3/tests/number.test.ts`
- `/node_modules/zod/src/v3/tests/string.test.ts`
- `/node_modules/zod/src/v3/tests/refinements.test.ts`
- `/node_modules/zod/src/v3/tests/error.test.ts`

## 6. Best Practices for Integration Tests

### 1. Test Valid Data

```typescript
it('should validate well-formed tasks.json', () => {
  const validBacklog = createMinimalBacklog();
  const result = BacklogSchema.safeParse(validBacklog);
  expect(result.success).toBe(true);
});
```

### 2. Test Invalid Data

```typescript
it('should reject invalid status', () => {
  const invalidBacklog = {
    backlog: [
      {
        ...validPhase,
        status: 'InvalidStatus' as any,
      },
    ],
  };
  const result = BacklogSchema.safeParse(invalidBacklog);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain('Invalid enum value');
  }
});
```

### 3. Test ID Format Validation

```typescript
it('should reject invalid subtask ID format', () => {
  const invalidSubtask = {
    ...validSubtask,
    id: 'INVALID_ID',
  };
  const result = SubtaskSchema.safeParse(invalidSubtask);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain(
      'Invalid subtask ID format'
    );
  }
});
```

### 4. Test Nested Validation

```typescript
it('should validate entire hierarchy', () => {
  const result = BacklogSchema.safeParse(complexBacklog);
  expect(result.success).toBe(true);
});
```

## 7. Malformed tasks.json Prevention

### Double Validation

1. **On Write**: Validate before writing to temp file
2. **On Read**: Validate after reading from file
3. **Before Rename**: Ensure data is valid before making it permanent

### Atomic Write Pattern

```typescript
async function atomicWrite(targetPath: string, data: string): Promise<void> {
  // 1. Validate data BEFORE writing
  const validated = BacklogSchema.parse(JSON.parse(data));

  // 2. Write to temp file
  await writeFile(tempPath, data, { mode: 0o644 });

  // 3. Atomic rename
  await rename(tempPath, targetPath);
}
```

## 8. Test Coverage Goals

For `tasks-json-authority.test.ts`, test:

1. **Schema validation prevents malformed tasks.json**
   - Invalid status values
   - Invalid ID formats
   - Missing required fields
   - Invalid nested structures

2. **Valid data passes validation**
   - Complete hierarchy
   - All valid status values
   - All valid ID formats
   - Valid story points

3. **Error messages are descriptive**
   - Path to invalid field
   - Clear error message
   - Expected vs actual values

## 9. Key Validation Patterns

### Hierarchical Validation

```typescript
// Recursive structure with z.lazy()
const MilestoneSchema: z.ZodType<Milestone> = z.lazy(() =>
  z.object({
    // ...
    tasks: z.array(z.lazy(() => TaskSchema)),
  })
);
```

### ID Format Validation

```typescript
// Strict regex patterns for each hierarchy level
id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format');
```

### Story Points Validation

```typescript
story_points: z.number().int().min(1).max(21);
// Note: Custom Fibonacci validation would need refine()
```

## 10. External Research References

### Existing Codebase Documentation

- `/plan/001_14b9dc2a33c7/docs/zod-testing-research.md`
  - Comprehensive testing patterns for Zod schemas
  - Examples of testing story points validation
  - Guidelines for testing nested structures

### Test Coverage

- `/tests/unit/core/models.test.ts`
  - Unit tests for all Zod schemas
  - 100% coverage of schema definitions

- `/tests/unit/core/session-utils.test.ts`
  - Tests for tasks.json read/write validation
  - Tests error handling for validation failures
  - Tests atomic write pattern with validation
