# Zod Schema Testing Best Practices - Comprehensive Research Report

**Work Item:** P4.M4.T1.S1
**Research Date:** 2026-01-13
**Objective:** Research Zod schema testing best practices for implementing comprehensive validation tests

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Official Zod Testing Documentation](#official-zod-testing-documentation)
3. [Core Testing Patterns](#core-testing-patterns)
4. [Testing Specific Validation Types](#testing-specific-validation-types)
5. [Patterns for Your Specific Schemas](#patterns-for-your-specific-schemas)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Code Examples](#code-examples)
9. [Recommended Testing Utilities](#recommended-testing-utilities)

---

## Executive Summary

Zod provides a robust validation library with 59+ official test files demonstrating comprehensive testing patterns. This research synthesizes patterns from Zod's own test suite, community best practices, and specific patterns for your validation requirements including:

- Story points validation (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
- Nested object validation
- Array validation
- Enum/union type validation
- Custom refinements
- Error message extraction

**Key Finding:** Zod uses `safeParse()` as the primary testing method, providing type-safe discriminated unions for success/failure handling. This is superior to `parse()` with try/catch blocks in test scenarios.

---

## Official Zod Testing Documentation

### Primary Resources

1. **Zod Official Documentation**
   - URL: https://zod.dev/api
   - Contains comprehensive API reference for all schema types
   - Includes examples of parsing, error handling, and type inference

2. **Zod Source Code - Test Suite**
   - Location: `/node_modules/zod/src/v3/tests/`
   - 59+ test files covering every Zod feature
   - Uses Vitest as the testing framework
   - Key test files to reference:
     - `object.test.ts` - Object validation patterns
     - `number.test.ts` - Number constraints and refinements
     - `string.test.ts` - String validation
     - `refinements.test.ts` - Custom refinement testing
     - `async-refinements.test.ts` - Async validation
     - `error.test.ts` - Error handling patterns
     - `enum.test.ts` - Enum validation
     - `unions.test.ts` - Union and discriminated union testing
     - `array.test.ts` - Array validation

### Zod README Documentation

The official README at `/node_modules/zod/README.md` provides:
- Basic parsing patterns with `.parse()` and `.safeParse()`
- Error handling with `ZodError` instances
- Type inference patterns
- Async parsing for refinements

---

## Core Testing Patterns

### Pattern 1: Using `safeParse()` for Test Safety

**Recommended approach for all tests:**

```typescript
import { z } from 'zod';
import { describe, it, expect } from 'vitest';

const MySchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

describe('MySchema', () => {
  it('should validate correct data', () => {
    const result = MySchema.safeParse({
      name: 'John',
      age: 25
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.age).toBe(25);
    }
  });

  it('should reject invalid data', () => {
    const result = MySchema.safeParse({
      name: '', // Invalid: empty string
      age: -5   // Invalid: negative
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });
});
```

**Why this pattern:**
- No try/catch blocks needed
- Type-safe discriminated union
- Clear success/failure assertions
- Access to both data and error

### Pattern 2: Testing Error Messages

```typescript
it('should provide correct error message for invalid name', () => {
  const result = MySchema.safeParse({
    name: '',
    age: 25
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    const nameError = result.error.issues.find(
      issue => issue.path[0] === 'name'
    );
    expect(nameError?.message).toContain('required');
  }
});
```

### Pattern 3: Testing Refinements

```typescript
const FibonacciSchema = z.number().refine(
  (val) => [1, 2, 3, 5, 8, 13, 21].includes(val),
  { message: 'Must be a Fibonacci number' }
);

describe('Fibonacci validation', () => {
  const validValues = [1, 2, 3, 5, 8, 13, 21];
  const invalidValues = [0, 4, 6, 7, 9, 10, 22, 100];

  test.each(validValues)('should accept %d', (value) => {
    const result = FibonacciSchema.safeParse(value);
    expect(result.success).toBe(true);
  });

  test.each(invalidValues)('should reject %d', (value) => {
    const result = FibonacciSchema.safeParse(value);
    expect(result.success).toBe(false);
  });
});
```

---

## Testing Specific Validation Types

### 1. Testing Number Constraints

**From Zod's `number.test.ts`:**

```typescript
const positiveSchema = z.number().positive();
const intSchema = z.number().int();
const minMaxSchema = z.number().min(1).max(21);

describe('Number constraints', () => {
  describe('positive()', () => {
    it('should accept positive numbers', () => {
      expect(positiveSchema.parse(1)).toBe(1);
      expect(positiveSchema.parse(100)).toBe(100);
    });

    it('should reject zero and negative numbers', () => {
      expect(() => positiveSchema.parse(0)).toThrow();
      expect(() => positiveSchema.parse(-1)).toThrow();
    });
  });

  describe('int()', () => {
    it('should accept integers', () => {
      expect(intSchema.parse(4)).toBe(4);
    });

    it('should reject decimals', () => {
      expect(() => intSchema.parse(3.14)).toThrow();
    });
  });

  describe('min() and max()', () => {
    it('should enforce boundaries', () => {
      minMaxSchema.parse(1);   // min inclusive
      minMaxSchema.parse(21);  // max inclusive
      expect(() => minMaxSchema.parse(0)).toThrow();
      expect(() => minMaxSchema.parse(22)).toThrow();
    });
  });
});
```

### 2. Testing String Validation

```typescript
const StringSchema = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title too long');

describe('String validation', () => {
  it('should accept valid strings', () => {
    const result = StringSchema.safeParse('Valid title');
    expect(result.success).toBe(true);
  });

  it('should reject empty strings', () => {
    const result = StringSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required');
    }
  });

  it('should reject strings that are too long', () => {
    const result = StringSchema.safeParse('a'.repeat(201));
    expect(result.success).toBe(false);
  });
});
```

### 3. Testing Regex Patterns

```typescript
const IdSchema = z.string().regex(
  /^P\d+\.M\d+\.T\d+\.S\d+$/,
  'Invalid subtask ID format'
);

describe('ID format validation', () => {
  const validIds = [
    'P1.M1.T1.S1',
    'P123.M456.T789.S999',
    'P1.M1.T1.S1'
  ];

  const invalidIds = [
    'P1.M1.T1',      // Missing S
    'P.M.T.S',        // Missing numbers
    'P1.M1.T1.S1.X',  // Extra segment
    'p1.m1.t1.s1',    // Lowercase
    'P1-M1-T1-S1',    // Wrong separator
  ];

  test.each(validIds)('should accept %s', (id) => {
    const result = IdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  test.each(invalidIds)('should reject %s', (id) => {
    const result = IdSchema.safeParse(id);
    expect(result.success).toBe(false);
  });
});
```

### 4. Testing Enum Values

```typescript
const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);

describe('Status enum validation', () => {
  it('should accept valid status values', () => {
    const validStatuses = ['Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'];

    validStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(status);
      }
    });
  });

  it('should reject invalid status values', () => {
    const invalidStatuses = ['Pending', 'In Progress', 'Done', 'planned', 'PLANNED'];

    invalidStatuses.forEach(status => {
      const result = StatusEnum.safeParse(status);
      expect(result.success).toBe(false);
    });
  });

  it('should provide correct type inference', () => {
    type Status = z.infer<typeof StatusEnum>;
    // Type should be: "Planned" | "Researching" | "Implementing" | "Complete" | "Failed" | "Obsolete"
    const status: Status = 'Planned';
    expect(status).toBe('Planned');
  });
});
```

### 5. Testing Union Types

```typescript
const ValidationGateLevel = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

describe('Union type validation', () => {
  it('should accept valid literal values', () => {
    [1, 2, 3, 4].forEach(level => {
      const result = ValidationGateLevel.safeParse(level);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid values', () => {
    [0, 5, 10, -1, 1.5].forEach(level => {
      const result = ValidationGateLevel.safeParse(level);
      expect(result.success).toBe(false);
    });
  });
});
```

### 6. Testing Array Validation

```typescript
const ArraySchema = z.array(z.string()).min(0);

describe('Array validation', () => {
  it('should accept empty arrays', () => {
    const result = ArraySchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should accept arrays with valid items', () => {
    const result = ArraySchema.safeParse(['item1', 'item2']);
    expect(result.success).toBe(true);
  });

  it('should reject arrays with invalid items', () => {
    const schema = z.array(z.number());
    const result = schema.safeParse([1, 2, 'three'] as any);
    expect(result.success).toBe(false);
  });
});
```

### 7. Testing Nested Objects

```typescript
const NestedSchema = z.object({
  id: z.string().regex(/^P\d+$/),
  title: z.string().min(1),
  subtasks: z.array(
    z.object({
      id: z.string(),
      title: z.string()
    })
  )
});

describe('Nested object validation', () => {
  it('should validate nested structure', () => {
    const result = NestedSchema.safeParse({
      id: 'P1',
      title: 'Phase 1',
      subtasks: [
        { id: 'S1', title: 'Subtask 1' },
        { id: 'S2', title: 'Subtask 2' }
      ]
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid nested data', () => {
    const result = NestedSchema.safeParse({
      id: 'P1',
      title: 'Phase 1',
      subtasks: [
        { id: 'S1', title: '' } // Invalid: empty title
      ]
    });
    expect(result.success).toBe(false);
  });
});
```

### 8. Testing Recursive/Lazy Schemas

```typescript
const MilestoneSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().regex(/^P\d+\.M\d+$/),
    tasks: z.array(z.lazy(() => TaskSchema))
  })
);

const TaskSchema = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+$/),
  title: z.string()
});

describe('Recursive schema validation', () => {
  it('should handle deeply nested structures', () => {
    const result = MilestoneSchema.safeParse({
      id: 'P1.M1',
      tasks: [
        {
          id: 'P1.M1.T1',
          title: 'Task 1'
        }
      ]
    });
    expect(result.success).toBe(true);
  });
});
```

---

## Patterns for Your Specific Schemas

### Pattern 1: Testing Story Points Validation

**For your SubtaskSchema with Fibonacci story points:**

```typescript
import { SubtaskSchema } from './models';

describe('SubtaskSchema - story_points validation', () => {
  describe('Fibonacci sequence validation', () => {
    const validStoryPoints = [1, 2, 3, 5, 8, 13, 21];

    test.each(validStoryPoints)('should accept %d as valid story points', (points) => {
      const result = SubtaskSchema.safeParse({
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test Subtask',
        status: 'Planned',
        story_points: points,
        dependencies: [],
        context_scope: 'Test context'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.story_points).toBe(points);
      }
    });
  });

  describe('Invalid story points rejection', () => {
    const invalidCases = [
      { value: 0, description: 'zero' },
      { value: 0.5, description: 'decimal 0.5' },
      { value: 4, description: 'non-Fibonacci 4' },
      { value: 6, description: 'non-Fibonacci 6' },
      { value: 22, description: 'exceeds max 21' },
      { value: 100, description: 'way too large' },
      { value: -1, description: 'negative' },
      { value: 1.5, description: 'decimal 1.5' },
    ];

    test.each(invalidCases)('should reject $description', ({ value }) => {
      const result = SubtaskSchema.safeParse({
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test Subtask',
        status: 'Planned',
        story_points: value,
        dependencies: [],
        context_scope: 'Test context'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Verify error is about story_points
        const hasStoryPointsError = result.error.issues.some(
          issue => issue.path.includes('story_points')
        );
        expect(hasStoryPointsError).toBe(true);
      }
    });
  });

  describe('Type coercion rejection', () => {
    it('should reject string numbers', () => {
      const result = SubtaskSchema.safeParse({
        id: 'P1.M1.T1.S1',
        type: 'Subtask',
        title: 'Test Subtask',
        status: 'Planned',
        story_points: '5' as any,
        dependencies: [],
        context_scope: 'Test context'
      });

      expect(result.success).toBe(false);
    });
  });
});
```

### Pattern 2: Testing ID Format Validation

**For all ID fields with regex patterns:**

```typescript
describe('ID format validation', () => {
  describe('Subtask ID format (P{N}.M{N}.T{N}.S{N})', () => {
    const validIds = [
      'P1.M1.T1.S1',
      'P123.M456.T789.S999',
      'P1.M1.T1.S1'
    ];

    const invalidIds = [
      { id: 'P1.M1.T1', reason: 'missing S segment' },
      { id: 'P1.M1.T1.S1.S2', reason: 'extra segment' },
      { id: 'p1.m1.t1.s1', reason: 'lowercase letters' },
      { id: 'P1-M1-T1-S1', reason: 'wrong separator' },
      { id: 'P1.M1.T1.S', reason: 'missing number after S' },
      { id: 'P1.M1.T1.S1.5', reason: 'decimal in segment' },
    ];

    test.each(validIds)('should accept %s', (id) => {
      const result = SubtaskSchema.safeParse({
        id,
        type: 'Subtask',
        title: 'Test',
        status: 'Planned',
        story_points: 2,
        dependencies: [],
        context_scope: 'Test'
      });
      expect(result.success).toBe(true);
    });

    test.each(invalidIds)('should reject $id because $reason', ({ id }) => {
      const result = SubtaskSchema.safeParse({
        id,
        type: 'Subtask',
        title: 'Test',
        status: 'Planned',
        story_points: 2,
        dependencies: [],
        context_scope: 'Test'
      });
      expect(result.success).toBe(false);
    });
  });
});
```

### Pattern 3: Testing ValidationGate Schema

```typescript
import { ValidationGateSchema } from './models';

describe('ValidationGateSchema', () => {
  const validGate = {
    level: 1,
    description: 'Syntax & Style validation',
    command: 'npm run lint',
    manual: false
  };

  describe('Valid validation gates', () => {
    it('should accept automated gates with command', () => {
      const result = ValidationGateSchema.safeParse(validGate);
      expect(result.success).toBe(true);
    });

    it('should accept manual gates with null command', () => {
      const result = ValidationGateSchema.safeParse({
        level: 4,
        description: 'Manual end-to-end testing',
        command: null,
        manual: true
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Level validation', () => {
    it.each([1, 2, 3, 4])('should accept level %d', (level) => {
      const result = ValidationGateSchema.safeParse({
        ...validGate,
        level
      });
      expect(result.success).toBe(true);
    });

    it.each([0, 5, -1, 1.5])('should reject level %d', (level) => {
      const result = ValidationGateSchema.safeParse({
        ...validGate,
        level: level as any
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Command validation', () => {
    it('should accept string commands', () => {
      const result = ValidationGateSchema.safeParse({
        ...validGate,
        command: 'npm test && npm run lint'
      });
      expect(result.success).toBe(true);
    });

    it('should accept null for manual gates', () => {
      const result = ValidationGateSchema.safeParse({
        ...validGate,
        command: null,
        manual: true
      });
      expect(result.success).toBe(true);
    });

    it('should reject undefined (must be null or string)', () => {
      const result = ValidationGateSchema.safeParse({
        ...validGate,
        command: undefined as any
      });
      expect(result.success).toBe(false);
    });
  });
});
```

### Pattern 4: Testing PRPDocument Schema

```typescript
import { PRPDocumentSchema } from './models';

describe('PRPDocumentSchema', () => {
  const validDocument = {
    taskId: 'P1.M2.T2.S2',
    objective: 'Test objective',
    context: '## Context\n\nDetails here...',
    implementationSteps: ['Step 1', 'Step 2'],
    validationGates: [
      {
        level: 1,
        description: 'Level 1',
        command: 'npm test',
        manual: false
      }
    ],
    successCriteria: [
      { description: 'Criterion 1', satisfied: false }
    ],
    references: ['https://example.com', 'src/file.ts']
  };

  describe('Valid documents', () => {
    it('should accept complete valid document', () => {
      const result = PRPDocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should accept document with empty arrays', () => {
      const result = PRPDocumentSchema.safeParse({
        ...validDocument,
        validationGates: [],
        successCriteria: [],
        references: []
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Nested validation', () => {
    it('should validate nested ValidationGate array', () => {
      const result = PRPDocumentSchema.safeParse({
        ...validDocument,
        validationGates: [
          { level: 1, description: 'Test', command: 'npm test', manual: false },
          { level: 5, description: 'Invalid', command: 'x', manual: true } // Invalid level
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should validate nested SuccessCriterion array', () => {
      const result = PRPDocumentSchema.safeParse({
        ...validDocument,
        successCriteria: [
          { description: '', satisfied: false } // Invalid: empty description
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Required fields', () => {
    const requiredFields = ['taskId', 'objective', 'context', 'implementationSteps', 'validationGates', 'successCriteria', 'references'] as const;

    test.each(requiredFields)('should require %s', (field) => {
      const invalidDoc = { ...validDoc, [field]: undefined };
      const result = PRPDocumentSchema.safeParse(invalidDoc);
      expect(result.success).toBe(false);
    });
  });
});
```

---

## Best Practices

### 1. Test Structure

**Organize tests by feature and scenario:**

```typescript
describe('SchemaName', () => {
  describe('Valid inputs', () => {
    // All success cases
  });

  describe('Invalid inputs', () => {
    describe('Field-specific validation', () => {
      // Grouped by field
    });

    describe('Cross-field validation', () => {
      // Refinements that check multiple fields
    });
  });

  describe('Type coercion', () => {
    // Tests for type safety
  });

  describe('Edge cases', () => {
    // Boundary conditions
  });
});
```

### 2. Use Test-Each for Multiple Cases

**Instead of repetitive tests:**

```typescript
// ❌ Bad: Repetitive
it('should accept 1', () => testValue(1));
it('should accept 2', () => testValue(2));
it('should accept 3', () => testValue(3));

// ✅ Good: Parameterized
test.each([1, 2, 3])('should accept %d', (value) => {
  const result = schema.safeParse(value);
  expect(result.success).toBe(true);
});
```

### 3. Assert on Specific Error Properties

```typescript
it('should provide descriptive error message', () => {
  const result = schema.safeParse(invalidData);

  expect(result.success).toBe(false);
  if (!result.success) {
    // Check specific error properties
    expect(result.error.issues).toHaveLength(2);
    expect(result.error.issues[0].path).toEqual(['fieldName']);
    expect(result.error.issues[0].message).toContain('expected message');

    // Or use error formatters
    const errorMessages = result.error.errors;
    expect(errorMessages[0].message).toBe('specific error');
  }
});
```

### 4. Test Type Inference

```typescript
it('should infer correct TypeScript types', () => {
  type InferredType = z.infer<typeof MySchema>;

  // This will compile-time fail if types don't match
  const expected: InferredType = {
    // ... valid data
  };

  const result = MySchema.safeParse(expected);
  expect(result.success).toBe(true);
});
```

### 5. Test Transformations

```typescript
const TransformSchema = z.string().transform(s => s.toUpperCase());

it('should transform data correctly', () => {
  const result = TransformSchema.safeParse('hello');
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toBe('HELLO');
  }
});
```

### 6. Test Default Values

```typescript
const SchemaWithDefaults = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.string().default('default value')
});

it('should apply default values', () => {
  const result = SchemaWithDefaults.safeParse({
    required: 'present'
    // optional and withDefault omitted
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.optional).toBeUndefined();
    expect(result.data.withDefault).toBe('default value');
  }
});
```

---

## Common Pitfalls

### Pitfall 1: Not Testing Edge Cases

```typescript
// ❌ Missing: boundary testing
it('should reject values greater than 21', () => {
  // Only tests one value
});

// ✅ Better: comprehensive boundaries
it('should reject values outside valid range', () => {
  const invalidValues = [0, 22, 100, -1, 1.5];
  invalidValues.forEach(value => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
```

### Pitfall 2: Not Asserting on Error Messages

```typescript
// ❌ Only checks failure
expect(result.success).toBe(false);

// ✅ Also checks why it failed
if (!result.success) {
  expect(result.error.issues[0].message).toContain('specific error');
}
```

### Pitfall 3: Using `parse()` in Tests

```typescript
// ❌ Requires try/catch
try {
  schema.parse(invalid);
  expect(true).toBe(false); // force fail
} catch (err) {
  expect(err).toBeInstanceOf(z.ZodError);
}

// ✅ Use safeParse for cleaner tests
const result = schema.safeParse(invalid);
expect(result.success).toBe(false);
```

### Pitfall 4: Not Testing Type Coercion

```typescript
// ❌ Missing: what happens with wrong types?
const result = schema.safeParse({
  numberField: '123' as any
});

// ✅ Test type safety
it('should reject string numbers', () => {
  const result = schema.safeParse({
    numberField: '123' as any
  });
  expect(result.success).toBe(false);
});
```

### Pitfall 5: Not Testing Nested Validation

```typescript
// ❌ Only tests top-level
const result = ParentSchema.safeParse({
  field: 'value',
  nested: {} // not validated
});

// ✅ Test deeply
const result = ParentSchema.safeParse({
  field: 'value',
  nested: {
    invalidField: 'wrong type'
  }
});
expect(result.success).toBe(false);
```

---

## Code Examples

### Complete Test Suite Example

```typescript
// tests/models/subtask.test.ts
import { describe, it, expect, test } from 'vitest';
import { z } from 'zod';
import { SubtaskSchema } from '@/core/models';

describe('SubtaskSchema', () => {
  const validSubtask = {
    id: 'P1.M1.T1.S1',
    type: 'Subtask' as const,
    title: 'Implement feature X',
    status: 'Planned' as const,
    story_points: 3,
    dependencies: [],
    context_scope: 'src/ directory'
  };

  describe('Valid subtasks', () => {
    it('should accept minimal valid subtask', () => {
      const result = SubtaskSchema.safeParse(validSubtask);
      expect(result.success).toBe(true);
    });

    it('should accept subtask with dependencies', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        dependencies: ['P1.M1.T1.S1', 'P1.M1.T1.S2']
      });
      expect(result.success).toBe(true);
    });

    it.each(['Planned', 'Researching', 'Implementing', 'Complete', 'Failed', 'Obsolete'])(
      'should accept status: %s',
      (status) => {
        const result = SubtaskSchema.safeParse({
          ...validSubtask,
          status: status as any
        });
        expect(result.success).toBe(true);
      }
    );
  });

  describe('ID validation', () => {
    it('should enforce P{N}.M{N}.T{N}.S{N} format', () => {
      const validIds = ['P1.M1.T1.S1', 'P99.M99.T99.S99'];
      const invalidIds = ['P1.M1.T1', 'P1.M1.T1.S1.X', 'p1.m1.t1.s1'];

      validIds.forEach(id => {
        const result = SubtaskSchema.safeParse({ ...validSubtask, id });
        expect(result.success).toBe(true);
      });

      invalidIds.forEach(id => {
        const result = SubtaskSchema.safeParse({ ...validSubtask, id });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Title validation', () => {
    it('should require non-empty title', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        title: ''
      });
      expect(result.success).toBe(false);
    });

    it('should enforce max length of 200', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        title: 'a'.repeat(201)
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Story points validation', () => {
    const validPoints = [1, 2, 3, 5, 8, 13, 21];
    const invalidPoints = [0, 4, 6, 7, 22, -1, 1.5];

    test.each(validPoints)('should accept %d story points', (points) => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: points
      });
      expect(result.success).toBe(true);
    });

    test.each(invalidPoints)('should reject %d story points', (points) => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: points
      });
      expect(result.success).toBe(false);
    });

    it('should require integer values', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: 2.5
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Type safety', () => {
    it('should reject string numbers for story_points', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        story_points: '3' as any
      });
      expect(result.success).toBe(false);
    });

    it('should enforce literal type "Subtask"', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        type: 'Task' as any
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Error messages', () => {
    it('should provide descriptive error for invalid ID', () => {
      const result = SubtaskSchema.safeParse({
        ...validSubtask,
        id: 'invalid'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const idError = result.error.issues.find(
          issue => issue.path[0] === 'id'
        );
        expect(idError?.message).toContain('Invalid subtask ID format');
      }
    });
  });
});
```

### Testing Async Refinements

```typescript
const AsyncSchema = z.string().refine(
  async (val) => {
    // Simulate async check (e.g., database lookup)
    return val.length > 5;
  },
  { message: 'Too short' }
);

describe('Async refinement', () => {
  it('should pass async validation', async () => {
    const result = await AsyncSchema.safeParseAsync('long enough');
    expect(result.success).toBe(true);
  });

  it('should fail async validation', async () => {
    const result = await AsyncSchema.safeParseAsync('short');
    expect(result.success).toBe(false);
  });
});
```

---

## Recommended Testing Utilities

### Helper Functions

```typescript
// tests/utils/zod-helpers.ts
import { z } from 'zod';

/**
 * Assert that a schema successfully parses data
 */
export function expectValid<T>(
  schema: z.ZodType<T>,
  data: unknown
): asserts data is T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Expected valid data but got errors:\n${JSON.stringify(result.error.issues, null, 2)}`
    );
  }
}

/**
 * Assert that a schema fails to parse data
 */
export function expectInvalid(
  schema: z.ZodType<any>,
  data: unknown,
  expectedErrorCount?: number
): z.ZodError {
  const result = schema.safeParse(data);
  if (result.success) {
    throw new Error('Expected invalid data but parsing succeeded');
  }
  if (expectedErrorCount !== undefined) {
    expect(result.error.issues).toHaveLength(expectedErrorCount);
  }
  return result.error;
}

/**
 * Extract error message for a specific field
 */
export function getErrorMessage(
  result: z.SafeParseError<any>,
  fieldPath: (string | number)[]
): string | undefined {
  return result.error.issues.find(
    issue => JSON.stringify(issue.path) === JSON.stringify(fieldPath)
  )?.message;
}

/**
 * Test all values in an array against a schema
 */
export function testEachValid<T>(
  schema: z.ZodType<T>,
  values: unknown[]
): void {
  values.forEach(value => {
    const result = schema.safeParse(value);
    expect(result.success).toBe(true);
  });
}

/**
 * Test that all values in an array fail validation
 */
export function testEachInvalid(
  schema: z.ZodType<any>,
  values: unknown[]
): void {
  values.forEach(value => {
    const result = schema.safeParse(value);
    expect(result.success).toBe(false);
  });
}
```

### Using the Helpers

```typescript
import { expectValid, expectInvalid, getErrorMessage } from '../utils/zod-helpers';
import { SubtaskSchema } from '@/core/models';

describe('SubtaskSchema with helpers', () => {
  it('should validate correct data', () => {
    const data = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask' as const,
      title: 'Test',
      status: 'Planned' as const,
      story_points: 3,
      dependencies: [],
      context_scope: 'Test'
    };

    expectValid(SubtaskSchema, data);
  });

  it('should reject invalid story_points', () => {
    const data = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask' as const,
      title: 'Test',
      status: 'Planned' as const,
      story_points: 4, // Invalid: not Fibonacci
      dependencies: [],
      context_scope: 'Test'
    };

    const error = expectInvalid(SubtaskSchema, data);
    const message = getErrorMessage(error, ['story_points']);
    expect(message).toBeTruthy();
  });
});
```

---

## Summary

### Key Takeaways

1. **Use `safeParse()` for all tests** - It provides type-safe discriminated unions without try/catch
2. **Test both success and failure cases** - Comprehensive coverage of valid and invalid inputs
3. **Assert on error properties** - Check error messages, paths, and counts
4. **Use parameterized tests** - `test.each()` for multiple test cases
5. **Test edge cases** - Boundary values, type coercion, nested validation
6. **Test type inference** - Verify TypeScript types are correct
7. **Create helper utilities** - Reduce boilerplate in tests

### Recommended File Structure

```
tests/
├── models/
│   ├── subtask.test.ts
│   ├── task.test.ts
│   ├── milestone.test.ts
│   ├── phase.test.ts
│   ├── backlog.test.ts
│   ├── validation-gate.test.ts
│   ├── prp-document.test.ts
│   └── bug.test.ts
└── utils/
    └── zod-helpers.ts
```

### Next Steps for P4.M4.T1.S1

1. Implement test files for each schema using the patterns above
2. Focus on the schemas with complex validation first:
   - SubtaskSchema (story_points Fibonacci validation)
   - TaskSchema, MilestoneSchema, PhaseSchema (nested validation)
   - ValidationGateSchema (union types, nullable fields)
3. Create helper utilities in `tests/utils/zod-helpers.ts`
4. Ensure 100% coverage of all validation rules
5. Add integration tests for schema validation in real workflows

---

## Sources

### Official Zod Documentation
- [Zod API Documentation](https://zod.dev/api)
- [Zod GitHub Repository](https://github.com/colinhacks/zod)
- Zod README: `/node_modules/zod/README.md`

### Zod Test Suite (59+ test files)
- `/node_modules/zod/src/v3/tests/object.test.ts`
- `/node_modules/zod/src/v3/tests/number.test.ts`
- `/node_modules/zod/src/v3/tests/string.test.ts`
- `/node_modules/zod/src/v3/tests/error.test.ts`
- `/node_modules/zod/src/v3/tests/refinements.test.ts`
- `/node_modules/zod/src/v3/tests/async-refinements.test.ts`
- `/node_modules/zod/src/v3/tests/enum.test.ts`
- `/node_modules/zod/src/v3/tests/unions.test.ts`
- `/node_modules/zod/src/v3/tests/discriminated-unions.test.ts`
- `/node_modules/zod/src/v3/tests/array.test.ts`
- And 49+ additional test files

### Your Codebase
- `/home/dustin/projects/hacky-hack/src/core/models.ts` - Your Zod schemas
- `/home/dustin/projects/hacky-hack/tests/integration/prp-generator-integration.test.ts` - Existing schema usage examples
- `/home/dustin/projects/hacky-hack/tests/integration/prp-blueprint-agent.test.ts` - More schema usage examples

---

**End of Research Report**

This comprehensive report provides all the patterns, examples, and best practices needed to implement thorough Zod schema testing for work item P4.M4.T1.S1. Use the code examples and patterns directly in your test implementation.
