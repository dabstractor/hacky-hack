# Zod Schema Testing Best Practices with TypeScript and Vitest

This document compiles best practices for testing Zod schema validation in TypeScript using Vitest.

## Table of Contents

1. [Testing Schema Validation](#1-testing-schema-validation)
2. [Testing Zod Error Messages and Error Paths](#2-testing-zod-error-messages-and-error-paths)
3. [Using safeParse() vs parse() in Tests](#3-using-safeparse-vs-parse-in-tests)
4. [Testing Complex Nested Schemas](#4-testing-complex-nested-schemas)
5. [Custom Refinement Testing Patterns](#5-custom-refinement-testing-patterns)
6. [Common Pitfalls When Testing Zod Schemas](#6-common-pitfalls-when-testing-zod-schemas)

---

## 1. Testing Schema Validation

### Success Case Testing

Always test that valid inputs pass validation:

```typescript
import { z } from 'zod';
import { describe, it, expect } from 'vitest';

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
  name: z.string().min(2),
});

describe('User Schema Validation - Success Cases', () => {
  it('should validate valid user data', () => {
    const validData = {
      email: 'test@example.com',
      age: 25,
      name: 'John Doe',
    };
    const result = userSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should accept data with extra fields (passthrough)', () => {
    const schemaWithPassthrough = userSchema.passthrough();
    const result = schemaWithPassthrough.safeParse({
      email: 'test@example.com',
      age: 25,
      name: 'John Doe',
      extraField: 'preserved',
    });
    expect(result.success).toBe(true);
  });
});
```

### Failure Case Testing

Test invalid inputs and verify proper rejection:

```typescript
describe('User Schema Validation - Failure Cases', () => {
  it('should reject invalid email format', () => {
    const result = userSchema.safeParse({
      email: 'not-an-email',
      age: 25,
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('email');
    }
  });

  it('should reject age below minimum', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      age: 15,
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name that is too short', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      age: 25,
      name: 'J',
    });
    expect(result.success).toBe(false);
  });
});
```

### Parametrized Testing

Use Vitest's `it.each` for testing multiple variants:

```typescript
const invalidEmailVariants = [
  ['plainaddress', 'missing @ symbol'],
  ['@missingdomain.com', 'missing local part'],
  ['missing@.com', 'invalid domain'],
  ['spaces in@email.com', 'contains spaces'],
  ['missingatsign.com', 'missing @ symbol'],
];

describe.each(invalidEmailVariants)('Email Validation', (email, reason) => {
  it(`should reject "${email}" because ${reason}`, () => {
    const result = userSchema.safeParse({
      email,
      age: 25,
      name: 'John Doe',
    });
    expect(result.success).toBe(false);
  });
});
```

---

## 2. Testing Zod Error Messages and Error Paths

### Accessing Error Information

```typescript
import { z } from 'zod';

const schema = z.object({
  user: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Must be a valid email address'),
  }),
  age: z.number().min(18, 'Must be 18 or older'),
});

describe('Error Messages and Paths', () => {
  it('should provide correct error paths for nested fields', () => {
    const result = schema.safeParse({
      user: { name: 'J', email: 'invalid' },
      age: 15,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.errors;

      // Check error paths
      expect(errors).toHaveLength(3);
      expect(errors[0].path).toEqual(['user', 'name']);
      expect(errors[1].path).toEqual(['user', 'email']);
      expect(errors[2].path).toEqual(['age']);

      // Check error messages
      expect(errors[0].message).toBe('Name must be at least 2 characters');
      expect(errors[2].message).toBe('Must be 18 or older');
    }
  });

  it('should filter errors by specific path', () => {
    const result = schema.safeParse({
      user: { name: 'J', email: 'invalid' },
      age: 15,
    });

    if (!result.success) {
      const nameErrors = result.error.errors.filter(
        e => e.path.join('.') === 'user.name'
      );
      expect(nameErrors).toHaveLength(1);
      expect(nameErrors[0].code).toBe(z.ZodIssueCode.too_small);
    }
  });

  it('should access error code for programmatic assertions', () => {
    const result = schema.safeParse({
      user: { name: 'J', email: 'test@example.com' },
      age: 25,
    });

    if (!result.success) {
      const nameError = result.error.errors[0];
      expect(nameError.code).toBe(z.ZodIssueCode.too_small);
      expect(nameError.minimum).toBe(2);
      expect(nameError.type).toBe('string');
    }
  });
});
```

### Snapshot Testing for Error Messages

```typescript
describe('Error Message Snapshots', () => {
  it('should match error snapshot', () => {
    const result = schema.safeParse({
      user: { name: 'J', email: 'bad' },
      age: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toMatchSnapshot();
    }
  });
});
```

---

## 3. Using safeParse() vs parse() in Tests

### safeParse() - Recommended for Tests

**Why use safeParse():**

- Returns result object without throwing
- Easy to assert on success/failure
- Clean test code without try-catch
- Better for testing multiple validation scenarios

```typescript
describe('Using safeParse() - Recommended', () => {
  it('provides clean assertions for success case', () => {
    const result = schema.safeParse({
      user: { name: 'John', email: 'john@example.com' },
      age: 25,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      // Type-safe access to validated data
      expect(result.data.user.name).toBe('John');
    }
  });

  it('provides clean assertions for failure case', () => {
    const result = schema.safeParse({
      user: { name: 'J', email: 'invalid' },
      age: 15,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });

  it('works well with expect().toMatch() assertions', () => {
    const result = schema.safeParse(validData);

    expect(result.success).toBe(true);
    expect(result).toMatchSnapshot();
  });
});
```

### parse() - Use for Exception Testing

**When to use parse():**

- Testing that errors are thrown correctly
- Testing custom error handlers
- Integration tests where exceptions are expected

```typescript
describe('Using parse() - For Exception Testing', () => {
  it('should throw ZodError for invalid data', () => {
    expect(() => {
      schema.parse({
        user: { name: 'J', email: 'invalid' },
        age: 15,
      });
    }).toThrow(z.ZodError);
  });

  it('should throw with specific error message', () => {
    expect(() => {
      schema.parse({
        user: { name: 'J', email: 'test@example.com' },
        age: 25,
      });
    }).toThrow('Name must be at least 2 characters');
  });

  it('should be caught with try-catch for detailed inspection', () => {
    try {
      schema.parse(invalidData);
      expect.fail('Should have thrown ZodError');
    } catch (error) {
      expect(error).toBeInstanceOf(z.ZodError);
      if (error instanceof z.ZodError) {
        expect(error.errors.length).toBeGreaterThan(0);
      }
    }
  });
});
```

### Custom Test Helper Functions

Create reusable helper functions for cleaner tests:

```typescript
function expectValidationSuccess<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  expectedData?: T
) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  if (result.success && expectedData) {
    expect(result.data).toEqual(expectedData);
  }
  return result;
}

function expectValidationFailure<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  expectedErrorCount?: number,
  expectedPaths?: string[][]
) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (!result.success) {
    if (expectedErrorCount) {
      expect(result.error.errors).toHaveLength(expectedErrorCount);
    }
    if (expectedPaths) {
      const actualPaths = result.error.errors.map(e => e.path);
      expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
    }
  }
  return result;
}

describe('Custom Test Helpers', () => {
  it('uses helper for success test', () => {
    expectValidationSuccess(schema, validData);
  });

  it('uses helper for failure test', () => {
    expectValidationFailure(schema, invalidData, 3, [
      ['user', 'name'],
      ['user', 'email'],
      ['age'],
    ]);
  });
});
```

---

## 4. Testing Complex Nested Schemas

### Deeply Nested Objects

```typescript
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
  country: z.object({
    code: z.string().length(2),
    name: z.string(),
  }),
});

const companySchema = z.object({
  name: z.string(),
  address: addressSchema,
  employees: z.array(
    z.object({
      id: z.number(),
      role: z.enum(['admin', 'user', 'guest']),
    })
  ),
});

describe('Deeply Nested Schemas', () => {
  it('should validate deeply nested valid data', () => {
    const validCompany = {
      name: 'Acme Corp',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        zipCode: '12345',
        country: {
          code: 'US',
          name: 'United States',
        },
      },
      employees: [
        { id: 1, role: 'admin' },
        { id: 2, role: 'user' },
      ],
    };

    const result = companySchema.safeParse(validCompany);
    expect(result.success).toBe(true);
  });

  it('should return correct error paths for deep nesting', () => {
    const result = companySchema.safeParse({
      name: 'Acme Corp',
      address: {
        street: '',
        city: 'Springfield',
        zipCode: 'invalid',
        country: {
          code: 'XXX',
          name: '',
        },
      },
      employees: [{ id: 1, role: 'invalid_role' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('address.street');
      expect(paths).toContain('address.zipCode');
      expect(paths).toContain('address.country.code');
      expect(paths).toContain('address.country.name');
      expect(paths).toContain('employees.0.role');
    }
  });
});
```

### Array and Optional Field Testing

```typescript
const complexSchema = z.object({
  tags: z.array(z.string().min(1)).min(1),
  optionalField: z.string().optional(),
  nullableField: z.string().nullable(),
  nestedArray: z
    .array(
      z.object({
        value: z.number(),
        label: z.string(),
      })
    )
    .optional(),
});

describe('Arrays and Optional Fields', () => {
  it('should validate array constraints', () => {
    const result = complexSchema.safeParse({
      tags: [],
      optionalField: 'present',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['tags']);
    }
  });

  it('should accept missing optional field', () => {
    const result = complexSchema.safeParse({
      tags: ['important'],
      nullableField: null,
    });
    expect(result.success).toBe(true);
  });

  it('should validate nested array items', () => {
    const result = complexSchema.safeParse({
      tags: ['test'],
      optionalField: null,
      nullableField: 'value',
      nestedArray: [{ value: 'not a number', label: 'test' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['nestedArray', 0, 'value']);
    }
  });
});
```

### Union and Discriminated Union Testing

```typescript
const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('click'),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal('keypress'),
    key: z.string(),
    timestamp: z.number(),
  }),
]);

describe('Discriminated Unions', () => {
  it('should validate correct union variant', () => {
    const clickEvent = { type: 'click', x: 100, y: 200 };
    const result = eventSchema.safeParse(clickEvent);
    expect(result.success).toBe(true);
  });

  it('should reject mismatched union variant', () => {
    const invalidEvent = { type: 'click', key: 'Enter' };
    const result = eventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });

  it('should reject invalid discriminator', () => {
    const invalidEvent = { type: 'hover', x: 100, y: 200 };
    const result = eventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].code).toBe(
        z.ZodIssueCode.invalid_union_discriminator
      );
    }
  });
});
```

---

## 5. Custom Refinement Testing Patterns

### Basic Refinement Testing

```typescript
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(val => /[A-Z]/.test(val), {
    message: 'Must contain at least one uppercase letter',
    path: ['uppercase'],
  })
  .refine(val => /[a-z]/.test(val), {
    message: 'Must contain at least one lowercase letter',
    path: ['lowercase'],
  })
  .refine(val => /[0-9]/.test(val), {
    message: 'Must contain at least one number',
    path: ['number'],
  });

describe('Password Refinement', () => {
  const validPassword = 'StrongPass123';

  it('should validate strong password', () => {
    const result = passwordSchema.safeParse(validPassword);
    expect(result.success).toBe(true);
  });

  it('should fail on missing uppercase', () => {
    const result = passwordSchema.safeParse('weakpass123');
    expect(result.success).toBe(false);
    if (!result.success) {
      const uppercaseError = result.error.errors.find(e =>
        e.path.includes('uppercase')
      );
      expect(uppercaseError).toBeDefined();
      expect(uppercaseError?.message).toBe(
        'Must contain at least one uppercase letter'
      );
    }
  });

  it('should fail on missing lowercase', () => {
    const result = passwordSchema.safeParse('WEAKPASS123');
    expect(result.success).toBe(false);
    if (!result.success) {
      const lowercaseError = result.error.errors.find(e =>
        e.path.includes('lowercase')
      );
      expect(lowercaseError).toBeDefined();
    }
  });

  it('should fail on missing number', () => {
    const result = passwordSchema.safeParse('StrongPassword');
    expect(result.success).toBe(false);
    if (!result.success) {
      const numberError = result.error.errors.find(e =>
        e.path.includes('number')
      );
      expect(numberError).toBeDefined();
    }
  });
});
```

### Complex Refinement with Custom Error Objects

```typescript
const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), {
    message:
      'Username can only contain letters, numbers, hyphens, and underscores',
    path: ['format'],
  })
  .refine(val => !val.startsWith('-') && !val.startsWith('_'), {
    message: 'Username cannot start with a hyphen or underscore',
    path: ['startCharacter'],
  });

describe('Username Refinement with Custom Paths', () => {
  it('should validate proper username', () => {
    expect(usernameSchema.safeParse('user-123').success).toBe(true);
  });

  it('should provide specific error for invalid characters', () => {
    const result = usernameSchema.safeParse('user@name');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['format']);
    }
  });

  it('should provide specific error for invalid start character', () => {
    const result = usernameSchema.safeParse('-invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['startCharacter']);
    }
  });
});
```

### SuperRefinement for Complex Cross-Field Validation

```typescript
const dateRangeSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ['startDate'],
        message: 'Invalid start date',
      });
    }

    if (isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ['endDate'],
        message: 'Invalid end date',
      });
    }

    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be after start date',
      });
    }
  });

describe('SuperRefinement for Cross-Field Validation', () => {
  it('should validate correct date range', () => {
    const result = dateRangeSchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should fail when end date is before start date', () => {
    const result = dateRangeSchema.safeParse({
      startDate: '2024-12-31',
      endDate: '2024-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'End date must be after start date'
      );
    }
  });

  it('should accumulate multiple errors', () => {
    const result = dateRangeSchema.safeParse({
      startDate: 'invalid-date',
      endDate: '2024-01-01',
    });
    expect(result.success).toBe(false);
    expect(result.error.errors.length).toBeGreaterThan(0);
  });
});
```

### Testing Async Refinements

```typescript
const uniqueEmailSchema = z
  .string()
  .email()
  .superRefine(async (email, ctx) => {
    // Simulate async check
    const exists = await checkEmailExists(email);
    if (exists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email already registered',
      });
    }
  });

// Mock function
async function checkEmailExists(email: string): Promise<boolean> {
  return email === 'existing@example.com';
}

describe('Async Refinement Testing', () => {
  it('should pass for unique email', async () => {
    const result = await uniqueEmailSchema.safeParseAsync('new@example.com');
    expect(result.success).toBe(true);
  });

  it('should fail for existing email', async () => {
    const result = await uniqueEmailSchema.safeParseAsync(
      'existing@example.com'
    );
    expect(result.success).toBe(false);
  });
});
```

---

## 6. Common Pitfalls When Testing Zod Schemas

### Pitfall 1: Not Type-Narrowing After safeParse()

**Problem:** Accessing `result.data` without checking `success`

```typescript
// BAD - TypeScript error and runtime risk
const result = schema.safeParse(data);
expect(result.data.name).toBe('John'); // Error: Object is possibly 'undefined'

// GOOD - Proper type narrowing
const result = schema.safeParse(data);
expect(result.success).toBe(true);
if (result.success) {
  expect(result.data.name).toBe('John');
}
```

### Pitfall 2: Forgetting About Extra Fields

**Problem:** Assuming Zod strips unknown fields by default

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

// Zod DOES NOT strip unknown fields by default
const result = schema.safeParse({
  name: 'John',
  age: 30,
  unknownField: 'will cause strict() to fail',
});

// Use .strict() to catch unknown fields in tests
const strictSchema = schema.strict();
const strictResult = strictSchema.safeParse({
  name: 'John',
  age: 30,
  unknownField: 'this will fail',
});
expect(strictResult.success).toBe(false);
```

### Pitfall 3: Not Testing Transformations

**Problem:** Only testing validation, not data transformation

```typescript
const schema = z.object({
  dateString: z.string().transform(val => new Date(val)),
  count: z.string().transform(val => parseInt(val, 10)),
});

describe('Schema Transformations', () => {
  it('should transform string to date', () => {
    const result = schema.safeParse({
      dateString: '2024-01-01',
      count: '42',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateString).toBeInstanceOf(Date);
      expect(result.data.count).toBe(42); // number, not string
      expect(typeof result.data.count).toBe('number');
    }
  });
});
```

### Pitfall 4: Ignoring Optional vs Nullable Distinctions

**Problem:** Confusing `optional()` (undefined) with `nullable()` (null)

```typescript
const schema = z.object({
  optional: z.string().optional(), // accepts undefined
  nullable: z.string().nullable(), // accepts null
  orDefault: z.string().default('default value'),
});

describe('Optional vs Nullable', () => {
  it('optional accepts undefined but not null', () => {
    const result1 = schema.safeParse({ optional: undefined, nullable: 'test' });
    expect(result1.success).toBe(true);

    const result2 = schema.safeParse({ optional: null, nullable: 'test' });
    expect(result2.success).toBe(false);
  });

  it('nullable accepts null but not undefined', () => {
    const result1 = schema.safeParse({ optional: 'test', nullable: null });
    expect(result1.success).toBe(true);

    // undefined is still accepted due to how optional fields work in objects
    const result2 = schema.safeParse({ optional: 'test', nullable: undefined });
    expect(result2.success).toBe(true);
  });
});
```

### Pitfall 5: Not Testing Edge Cases

**Problem:** Only testing obvious cases, missing edge cases

```typescript
describe('Edge Case Testing', () => {
  const schema = z.object({
    string: z.string(),
    number: z.number(),
    array: z.array(z.string()),
  });

  it('should handle null values', () => {
    expect(
      schema.safeParse({ string: null, number: 1, array: [] }).success
    ).toBe(false);
  });

  it('should handle undefined values', () => {
    expect(
      schema.safeParse({ string: undefined, number: 1, array: [] }).success
    ).toBe(false);
  });

  it('should handle empty strings', () => {
    const result = schema.safeParse({ string: '', number: 1, array: [] });
    expect(result.success).toBe(true); // Empty string is valid for z.string()
  });

  it('should handle NaN for numbers', () => {
    const result = schema.safeParse({ string: 'test', number: NaN, array: [] });
    expect(result.success).toBe(true); // NaN is valid for z.number()
  });

  it('should handle special float values', () => {
    const result1 = schema.safeParse({
      string: 'test',
      number: Infinity,
      array: [],
    });
    expect(result1.success).toBe(true);

    const result2 = schema.safeParse({
      string: 'test',
      number: -Infinity,
      array: [],
    });
    expect(result2.success).toBe(true);
  });

  it('should handle 0 and negative numbers', () => {
    const result = schema.safeParse({ string: 'test', number: 0, array: [] });
    expect(result.success).toBe(true);
  });
});
```

### Pitfall 6: Not Isolating Test Data

**Problem:** Mutating shared test fixtures

```typescript
// BAD - Shared fixture that gets mutated
const baseData = {
  name: 'John',
  email: 'john@example.com',
};

it('test 1', () => {
  const data = baseData;
  data.name = 'Jane'; // Mutates baseData!
  // ... test code
});

it('test 2', () => {
  const data = baseData;
  // data.name is now 'Jane' - unexpected state!
});

// GOOD - Create fresh data for each test
const createValidData = () => ({
  name: 'John',
  email: 'john@example.com',
});

it('test 1', () => {
  const data = createValidData();
  data.name = 'Jane';
  // ... test code
});

it('test 2', () => {
  const data = createValidData();
  // data.name is 'John' as expected
});
```

### Pitfall 7: Overly Complex Test Setup

**Problem:** Tests that require too much setup

```typescript
// BAD - Complex nested objects in every test
it('should validate user', () => {
  const result = userSchema.safeParse({
    personal: {
      name: 'John',
      email: 'john@example.com',
      phone: '555-1234',
      address: {
        street: '123 Main',
        city: 'Springfield',
        state: 'IL',
        zip: '12345',
        country: 'US',
      },
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
    // ... many more fields
  });
  expect(result.success).toBe(true);
});

// GOOD - Use builders or fixtures
const buildUser = (overrides = {}) => ({
  personal: {
    name: 'John',
    email: 'john@example.com',
    phone: '555-1234',
    address: {
      street: '123 Main',
      city: 'Springfield',
      state: 'IL',
      zip: '12345',
      country: 'US',
    },
  },
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
  ...overrides,
});

it('should validate user', () => {
  const result = userSchema.safeParse(buildUser());
  expect(result.success).toBe(true);
});

it('should validate user with custom theme', () => {
  const result = userSchema.safeParse(
    buildUser({
      preferences: { theme: 'light', notifications: true, language: 'en' },
    })
  );
  expect(result.success).toBe(true);
});
```

---

## Testing Utilities and Helpers

### Reusable Test Helper Library

```typescript
// test-utils/zod-helpers.ts
import { z } from 'zod';

type SafeParseResult<T> = ReturnType<z.ZodSchema<T>['safeParse']>;

export function assertSuccess<T>(
  result: SafeParseResult<T>
): asserts result is {
  success: true;
  data: T;
} {
  if (!result.success) {
    throw new Error(
      `Expected success but got errors: ${JSON.stringify(result.error.errors, null, 2)}`
    );
  }
}

export function assertFailure<T>(
  result: SafeParseResult<T>
): asserts result is {
  success: false;
  error: z.ZodError;
} {
  if (result.success) {
    throw new Error('Expected failure but got success');
  }
}

export function getErrorAtPath(
  result: SafeParseResult<any>,
  path: (string | number)[]
) {
  if (result.success) return undefined;
  return result.error.errors.find(
    e => JSON.stringify(e.path) === JSON.stringify(path)
  );
}

export function expectErrorsAtPath<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  path: (string | number)[],
  message?: string
) {
  const result = schema.safeParse(data);
  assertFailure(result);
  const error = getErrorAtPath(result, path);
  expect(error).toBeDefined();
  if (message && error) {
    expect(error.message).toBe(message);
  }
  return result;
}
```

---

## Summary Checklist

### Testing Schema Validation

- [ ] Test valid inputs pass
- [ ] Test invalid inputs fail with appropriate errors
- [ ] Use parametrized tests for multiple variants
- [ ] Test edge cases (null, undefined, empty, min/max)

### Testing Error Messages

- [ ] Verify error paths are correct
- [ ] Verify error messages match expectations
- [ ] Test error codes for programmatic handling
- [ ] Use snapshots for complex error structures

### Using safeParse vs parse

- [ ] Use safeParse() for most tests
- [ ] Use parse() only when testing thrown exceptions
- [ ] Always type-narrow after safeParse()
- [ ] Create helper functions for common patterns

### Testing Nested Schemas

- [ ] Test deeply nested objects
- [ ] Verify error paths for nested fields
- [ ] Test array validations
- [ ] Test optional/nullable fields correctly
- [ ] Test discriminated unions

### Testing Refinements

- [ ] Test each refinement independently
- [ ] Test multiple refinements together
- [ ] Use custom error paths for better error reporting
- [ ] Test superRefine for cross-field validation
- [ ] Test async refinements with async/await

### Avoiding Pitfalls

- [ ] Always type-narrow after safeParse()
- [ ] Be aware of strict mode and unknown fields
- [ ] Test transformations, not just validation
- [ ] Understand optional vs nullable
- [ ] Test edge cases (NaN, Infinity, 0, empty strings)
- [ ] Don't mutate shared test fixtures
- [ ] Use test builders for complex data

---

## Additional Resources

### Official Zod Documentation

- **GitHub Repository**: https://github.com/colinhacks/zod
- **Documentation**: https://zod.dev/
- **Error Handling Guide**: Check the official docs for the latest error handling patterns

### Related Testing Libraries

- **Vitest**: https://vitest.dev/
- **Testing Library**: Consider integrating with @testing-library/jest-dom for component testing

### Community Resources

- **Zod Discord**: Community support for complex validation scenarios
- **Stack Overflow**: Search for "zod testing typescript vitest"

---

_Note: This research document was compiled based on best practices as of January 2026. Always refer to the official Zod documentation for the most up-to-date information._
