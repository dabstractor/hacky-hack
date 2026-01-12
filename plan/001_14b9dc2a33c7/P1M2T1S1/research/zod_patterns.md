# Zod Schema Integration Patterns for TypeScript Interface Validation

**Research Date:** 2026-01-12
**Zod Version:** 3.25.76
**Researcher:** Claude Code Agent

## Table of Contents

1. [Creating Zod Schemas that Match TypeScript Interfaces](#1-creating-zod-schemas-that-match-typescript-interfaces)
2. [Best Practices for Defining Enums in Zod](#2-best-practices-for-defining-enums-in-zod)
3. [Recursive/Hierarchical Zod Schemas for Nested Structures](#3-recursivehierarchical-zod-schemas-for-nested-structures)
4. [Zod Discrimination for Union Types](#4-zod-discrimination-for-union-types)
5. [Extracting TypeScript Types from Zod Schemas](#5-extracting-typescript-types-from-zod-schemas-z-infer)
6. [Zod Error Handling and Validation Patterns](#6-zod-error-handling-and-validation-patterns)

---

## 1. Creating Zod Schemas that Match TypeScript Interfaces

### Pattern 1: Schema-First Approach (Recommended)

Define the Zod schema first, then infer the TypeScript type:

```typescript
import * as z from 'zod/v4';

// Define schema first
const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).optional(),
  role: z.enum(['admin', 'user', 'guest']),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Usage
const user: User = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  role: 'admin',
};

const validatedUser = UserSchema.parse(user);
```

**Documentation:** [Zod Official Docs - Basic Usage](https://zod.dev/api)

**Best Practices:**

- Always use schema-first approach to ensure type safety
- Use `.optional()` for nullable/optional fields
- Use built-in validators like `.email()`, `.url()`, `.min()` for common patterns
- Add `.describe()` for better error messages and documentation

### Pattern 2: Interface-First with ZodType Annotation

When you have an existing interface and need to create a matching schema:

```typescript
interface UserProfile {
  username: string;
  bio: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
  };
}

// Create Zod schema matching the interface
const UserProfileSchema: z.ZodType<UserProfile> = z.object({
  username: z.string().min(3).max(30),
  bio: z.string().max(500),
  website: z.string().url().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    github: z.string().optional(),
  }),
});
```

**Use Cases:**

- Migrating existing TypeScript codebases to Zod
- Working with external type definitions
- Maintaining compatibility with existing interfaces

### Pattern 3: Partial and Required Schema Extensions

```typescript
const BaseUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
});

// Make all fields optional (for updates)
const UserUpdateSchema = BaseUserSchema.partial();

// Make specific fields required
const UserCreateSchema = BaseUserSchema.required({
  username: true,
  email: true,
});

// Pick specific fields
const UserPublicSchema = BaseUserSchema.pick({
  username: true,
  email: true,
});

// Omit sensitive fields
const UserSafeSchema = BaseUserSchema.omit({
  id: true,
});
```

**Documentation Reference:** [Zod GitHub - Source Tests](https://github.com/colinhacks/zod/blob/master/src/v3/tests/base.test.ts)

---

## 2. Best Practices for Defining Enums in Zod

### Basic Enum Definition

```typescript
// Simple enum with string values
const StatusEnum = z.enum(['pending', 'active', 'inactive', 'suspended']);

type Status = z.infer<typeof StatusEnum>;
// Type: "pending" | "active" | "inactive" | "suspended"

// Access enum values programmatically
StatusEnum.options; // ["pending", "active", "inactive", "suspended"]

// Parse and validate
StatusEnum.parse('active'); // ✅ passes
StatusEnum.parse('unknown'); // ❌ throws ZodError
```

### Pattern: Const Assertions for Type Safety

```typescript
// Define values with const assertion
const HTTP_STATUS = ['200', '201', '204', '400', '401', '404', '500'] as const;

// Create enum from const array
const HttpStatusEnum = z.enum(HTTP_STATUS);

type HttpStatus = z.infer<typeof HttpStatusEnum>;
// Type: "200" | "201" | "204" | "400" | "401" | "404" | "500"
```

**Source:** [Zod Enum Tests](file:///home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/enum.test.ts)

### Pattern: Enum Extraction and Exclusion

```typescript
const foods = ['Pasta', 'Pizza', 'Tacos', 'Burgers', 'Salad'] as const;
const FoodEnum = z.enum(foods);

// Extract subset of enum values
const ItalianEnum = FoodEnum.extract(['Pasta', 'Pizza']);
type ItalianFood = z.infer<typeof ItalianEnum>;
// Type: "Pasta" | "Pizza"

// Exclude specific enum values
const UnhealthyEnum = FoodEnum.exclude(['Salad']);
type UnhealthyFood = z.infer<typeof UnhealthyEnum>;
// Type: "Pasta" | "Pizza" | "Tacos" | "Burgers"
```

### Pattern: Custom Error Messages for Enums

```typescript
const PriorityEnum = z.enum(['low', 'medium', 'high', 'critical'], {
  required_error: 'Priority is required',
  invalid_type_error: 'Priority must be a string',
});

// With custom error map
const StatusEnum = z.enum(['draft', 'published', 'archived'], {
  errorMap: () => ({
    message: 'Invalid status. Must be: draft, published, or archived',
  }),
});
```

### Pattern: Native Enum Support

```typescript
// TypeScript native enum
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

// Zod schema for native enum
const ColorEnum = z.nativeEnum(Color);

type Color = z.infer<typeof ColorEnum>;
// Type: Color
```

### Best Practices Summary

1. **Use const assertions** for compile-time type safety
2. **Prefer lowercase enum values** for API consistency
3. **Provide custom error messages** for better UX
4. **Use `.extract()` and `.exclude()`** to create derived enums
5. **Access `.options` property** to get enum values array

---

## 3. Recursive/Hierarchical Zod Schemas for Nested Structures

### Pattern: Basic Recursive Schema with `z.lazy()`

```typescript
interface Category {
  name: string;
  subcategories: Category[];
}

// Define recursive schema using z.lazy()
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema),
  })
);

// Usage
const testCategory: Category = {
  name: 'Technology',
  subcategories: [
    {
      name: 'Programming',
      subcategories: [
        { name: 'JavaScript', subcategories: [] },
        { name: 'Python', subcategories: [] },
      ],
    },
  ],
};

CategorySchema.parse(testCategory); // ✅ validates successfully
```

**Source:** [Zod Recursive Tests](file:///home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/recursive.test.ts)

### Pattern: Alternative with `z.late.object()`

```typescript
const CategorySchema: z.ZodType<Category> = z.late.object(() => ({
  name: z.string(),
  subcategories: z.array(CategorySchema),
}));
```

### Pattern: LinkedList-style Recursion

```typescript
type LinkedList = null | { value: number; next: LinkedList };

const LinkedListSchema: z.ZodType<LinkedList> = z.lazy(() =>
  z.union([
    z.null(),
    z.object({
      value: z.number(),
      next: LinkedListSchema,
    }),
  ])
);

// Usage
const linkedList = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: null,
    },
  },
};

LinkedListSchema.parse(linkedList); // ✅ validates
```

### Pattern: Tree Structure with Metadata

```typescript
interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
  metadata: {
    created: Date;
    modified: Date;
    size?: number;
  };
}

const FileSystemNodeSchema: z.ZodType<FileSystemNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(['file', 'directory']),
    children: z.array(z.lazy(() => FileSystemNodeSchema)).optional(),
    metadata: z.object({
      created: z.date(),
      modified: z.date(),
      size: z.number().optional(),
    }),
  })
);
```

### Pattern: JSON-like Nested Structures

```typescript
interface JsonValue {
  [key: string]: string | number | boolean | null | JsonValue | JsonValue[];
}

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ])
);
```

### Pattern: Organizational Chart (Mutual Recursion)

```typescript
interface Employee {
  id: number;
  name: string;
  role: string;
  manager?: Employee;
  directReports: Employee[];
}

const EmployeeSchema: z.ZodType<Employee> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    role: z.string(),
    manager: z.lazy(() => EmployeeSchema).optional(),
    directReports: z.array(z.lazy(() => EmployeeSchema)),
  })
);
```

### Best Practices for Recursive Schemas

1. **Always use `z.ZodType<Type>` annotation** to help TypeScript understand recursion
2. **Use `z.lazy()` for most cases** - it's the standard pattern
3. **Consider `z.late.object()` for complex object structures**
4. **Add depth limits** in production to prevent stack overflow
5. **Test with various nesting levels** to ensure performance

### Pattern: Depth-Limited Recursion

```typescript
function createCategorySchema(
  maxDepth: number,
  currentDepth = 0
): z.ZodType<Category> {
  if (currentDepth >= maxDepth) {
    return z.object({
      name: z.string(),
      subcategories: z.array(z.any()), // Stop validating at max depth
    });
  }

  return z.object({
    name: z.string(),
    subcategories: z.array(createCategorySchema(maxDepth, currentDepth + 1)),
  });
}

const CategorySchemaSafe = createCategorySchema(10); // Max 10 levels deep
```

---

## 4. Zod Discrimination for Union Types

### Basic Discriminated Union

```typescript
// Define schemas with a common discriminator property
const DogSchema = z.object({
  type: z.literal('dog'),
  bark: z.boolean(),
  breed: z.string(),
});

const CatSchema = z.object({
  type: z.literal('cat'),
  meow: z.boolean(),
  color: z.string(),
});

// Create discriminated union
const PetSchema = z.discriminatedUnion('type', [DogSchema, CatSchema]);

type Pet = z.infer<typeof PetSchema>;
// Type:
// { type: "dog"; bark: boolean; breed: string; } |
// { type: "cat"; meow: boolean; color: string; }

// Usage
const myDog = PetSchema.parse({ type: 'dog', bark: true, breed: 'Labrador' });
const myCat = PetSchema.parse({ type: 'cat', meow: true, color: 'orange' });
```

### Pattern: API Response Discrimination

```typescript
// Success response
const SuccessResponse = z.object({
  status: z.literal('success'),
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// Error response
const ErrorResponse = z.object({
  status: z.literal('error'),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// API response union
const ApiResponse = z.discriminatedUnion('status', [
  SuccessResponse,
  ErrorResponse,
]);

type ApiResponse = z.infer<typeof ApiResponse>;

// Type narrowing in practice
function handleResponse(response: ApiResponse) {
  if (response.status === 'success') {
    // TypeScript knows response.data exists
    console.log(response.data.name);
  } else {
    // TypeScript knows response.error exists
    console.error(response.error.message);
  }
}
```

**Source:** [Zod Discriminated Union Tests](file:///home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/discriminated-unions.test.ts)

### Pattern: Multiple Discriminator Types

```typescript
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('1'), val: z.literal(1) }),
  z.object({ type: z.literal(1), val: z.literal(2) }),
  z.object({ type: z.literal(BigInt(1)), val: z.literal(3) }),
  z.object({ type: z.literal('true'), val: z.literal(4) }),
  z.object({ type: z.literal(true), val: z.literal(5) }),
  z.object({ type: z.literal('null'), val: z.literal(6) }),
  z.object({ type: z.literal(null), val: z.literal(7) }),
]);
```

### Pattern: Nested Discriminated Unions

```typescript
const TextContent = z.object({
  kind: z.literal('text'),
  text: z.string(),
});

const ImageContent = z.object({
  kind: z.literal('image'),
  url: z.string(),
  alt: z.string(),
});

const ContentBlock = z.discriminatedUnion('kind', [TextContent, ImageContent]);

const Message = z.object({
  id: z.string(),
  timestamp: z.date(),
  content: ContentBlock,
});
```

### Pattern: Event System with Discriminated Unions

```typescript
// User events
const UserLoggedIn = z.object({
  event: z.literal('USER_LOGGED_IN'),
  userId: z.string(),
  timestamp: z.date(),
});

const UserLoggedOut = z.object({
  event: z.literal('USER_LOGGED_OUT'),
  userId: z.string(),
  timestamp: z.date(),
});

// System events
const SystemError = z.object({
  event: z.literal('SYSTEM_ERROR'),
  code: z.string(),
  message: z.string(),
  timestamp: z.date(),
});

const SystemMaintenance = z.object({
  event: z.literal('SYSTEM_MAINTENANCE'),
  startTime: z.date(),
  endTime: z.date(),
});

// Event union
const AppEvent = z.discriminatedUnion('event', [
  UserLoggedIn,
  UserLoggedOut,
  SystemError,
  SystemMaintenance,
]);

type AppEvent = z.infer<typeof AppEvent>;

// Event handler with type narrowing
function handleEvent(event: AppEvent) {
  switch (event.event) {
    case 'USER_LOGGED_IN':
      console.log(`User ${event.userId} logged in at ${event.timestamp}`);
      break;
    case 'USER_LOGGED_OUT':
      console.log(`User ${event.userId} logged out at ${event.timestamp}`);
      break;
    case 'SYSTEM_ERROR':
      console.error(`Error ${event.code}: ${event.message}`);
      break;
    case 'SYSTEM_MAINTENANCE':
      console.log(`Maintenance from ${event.startTime} to ${event.endTime}`);
      break;
  }
}
```

### Pattern: Discriminated Union with Shared Fields

```typescript
const basePersonSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

const Employee = basePersonSchema.extend({
  type: z.literal('employee'),
  employeeId: z.string(),
  department: z.string(),
  salary: z.number(),
});

const Contractor = basePersonSchema.extend({
  type: z.literal('contractor'),
  contractorId: z.string(),
  company: z.string(),
  hourlyRate: z.number(),
});

const Person = z.discriminatedUnion('type', [Employee, Contractor]);
```

### Best Practices for Discriminated Unions

1. **Use a common discriminator field name** (typically "type", "kind", "status")
2. **Use `z.literal()` for discriminator values** for type safety
3. **Keep discriminator values distinct** across all union members
4. **Place shared fields in a base schema** and use `.extend()`
5. **Prefer discriminated unions over regular unions** for better type narrowing

---

## 5. Extracting TypeScript Types from Zod Schemas (z.infer<>)

### Basic Type Inference

```typescript
const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
});

// Extract the inferred type
type User = z.infer<typeof UserSchema>;
// Type: { id: number; username: string; email: string; }

// Use the type in your code
const user: User = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
};
```

### Input vs Output Types (Transform Schemas)

```typescript
const StringToNumberSchema = z.string().transform(val => val.length);

// Input type (what goes in)
type Input = z.input<typeof StringToNumberSchema>;
// Type: string

// Output type (what comes out)
type Output = z.output<typeof StringToNumberSchema>;
// Type: number (also equivalent to z.infer<>)

// Example with complex transform
const DateSchema = z.string().transform(str => new Date(str));

type DateInput = z.input<typeof DateSchema>; // string
type DateOutput = z.output<typeof DateSchema>; // Date
```

### Pattern: Array Element Type Inference

```typescript
const ItemSchema = z.object({
  name: z.string(),
  price: z.number(),
});

type Item = z.infer<typeof ItemSchema>;
type ItemArray = z.infer<typeof ItemSchema>[];
// Or equivalently: z.infer<typeof z.array(ItemSchema)>
```

### Pattern: Union Type Inference

```typescript
const StatusSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), data: z.string() }),
  z.object({ type: z.literal('error'), error: z.string() }),
]);

type Status = z.infer<typeof StatusSchema>;
// Type:
// | { type: "success"; data: string; }
// | { type: "error"; error: string; }
```

### Pattern: Optional and Nullable Types

```typescript
const UserSchema = z.object({
  name: z.string(),
  age: z.number().optional(), // T | undefined
  phone: z.string().nullable(), // T | null
  address: z.string().nullish(), // T | null | undefined
});

type User = z.infer<typeof UserSchema>;
// Type: {
//   name: string;
//   age?: number | undefined;
//   phone: string | null;
//   address?: string | null | undefined;
// }
```

### Pattern: Record Type Inference

```typescript
const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
);

type Metadata = z.infer<typeof MetadataSchema>;
// Type: Record<string, string | number | boolean>
```

### Pattern: Generic Schema Inference

```typescript
function createSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
  });
}

const StringItemSchema = z.object({
  value: z.string(),
});

const StringCollectionSchema = createSchema(StringItemSchema);

type StringCollection = z.infer<typeof StringCollectionSchema>;
// Type: { items: Array<{ value: string; }>; total: number; }
```

### Pattern: Utility Types with Zod

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

type User = z.infer<typeof UserSchema>;

// Extract specific keys
type UserName = User['name']; // string

// Make partial
type PartialUser = Partial<User>;

// Make required
type RequiredUser = Required<User>;

// Pick specific fields
type UserPublic = Pick<User, 'name' | 'email'>;

// Omit specific fields
type UserSafe = Omit<User, 'id' | 'createdAt'>;
```

### Best Practices for Type Inference

1. **Always use `z.infer<typeof Schema>`** instead of manually defining types
2. **Export types alongside schemas** for easy importing
3. **Use `z.input` and `z.output`** when schemas transform data
4. **Combine with TypeScript utility types** for flexibility
5. **Avoid type duplication** - let Zod be the single source of truth

---

## 6. Zod Error Handling and Validation Patterns

### Pattern: Try-Catch with `.parse()`

```typescript
const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

try {
  const user = UserSchema.parse({
    username: 'jo', // Too short
    email: 'invalid-email',
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Validation failed:');
    error.issues.forEach(issue => {
      console.log(`- ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}

// Output:
// Validation failed:
// - username: String must contain at least 3 character(s)
// - email: Invalid email
```

**Documentation Reference:** [Zod README - Error Handling](https://github.com/colinhacks/zod/blob/master/README.md)

### Pattern: Safe Parse with `.safeParse()`

```typescript
const result = UserSchema.safeParse({
  username: 'jo',
  email: 'invalid',
});

if (!result.success) {
  // Access error details
  console.log(result.error.issues);
  // [
  //   {
  //     code: "too_small",
  //     minimum: 3,
  //     type: "string",
  //     inclusive: true,
  //     path: ["username"],
  //     message: "String must contain at least 3 character(s)"
  //   },
  //   {
  //     code: "invalid_string",
  //     validation: "email",
  //     path: ["email"],
  //     message: "Invalid email"
  //   }
  // ]
} else {
  // Access validated data
  const user = result.data;
  console.log(user);
}
```

### Pattern: Custom Error Messages

```typescript
// Inline custom error message
const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// Custom error with errorMap
const UsernameSchema = z.string().min(3).max(20, {
  message: 'Username must be between 3 and 20 characters',
});

// Custom error with errorMap function
const EmailSchema = z.string().email({
  errorMap: () => ({ message: 'Please provide a valid email address' }),
});

// Object-level custom errors
const UserSchema = z.object(
  {
    username: z.string().min(3, 'Username too short'),
    email: z.string().email('Invalid email format'),
  },
  {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_type) {
        return { message: 'Expected an object with username and email' };
      }
      return { message: ctx.defaultError };
    },
  }
);
```

**Source:** [Zod Error Tests](file:///home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/error.test.ts)

### Pattern: Refinement with Custom Errors

```typescript
const AgeSchema = z
  .number()
  .min(18, 'Must be at least 18 years old')
  .max(120, 'Must be less than 120 years old')
  .refine(age => age % 1 === 0, 'Age must be a whole number');

// With refinement params
const PasswordSchema = z
  .string()
  .min(8)
  .refine(password => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
    params: { code: 'UPPERCASE_REQUIRED' },
  });
```

### Pattern: Advanced Error Formatting

```typescript
function formatZodError(error: z.ZodError): string {
  const formatted = error.issues.map(issue => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
  return formatted.join('\n');
}

// Usage
const result = UserSchema.safeParse(invalidData);
if (!result.success) {
  console.error(formatZodError(result.error));
}
```

### Pattern: Structured Error Response for APIs

```typescript
interface ApiError {
  success: false;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

function formatApiError(error: z.ZodError): ApiError {
  return {
    success: false,
    errors: error.issues.map(issue => ({
      field: issue.path.join('.') || 'unknown',
      message: issue.message,
      code: issue.code,
    })),
  };
}

// Express.js middleware example
function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(formatApiError(result.error));
    }
    req.body = result.data;
    next();
  };
}
```

### Pattern: Async Validation

```typescript
const UniqueUsernameSchema = z
  .string()
  .min(3)
  .refine(async username => {
    // Check database for existing username
    const existing = await db.user.findUnique({
      where: { username },
    });
    return !existing;
  }, 'Username already taken');

// Parse async
const result = await UniqueUsernameSchema.safeParseAsync('john');

if (!result.success) {
  console.log(result.error.issues[0].message);
  // "Username already taken"
}
```

### Pattern: Multiple Validation Errors

```typescript
const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
  password: z.string().min(8),
});

const result = UserSchema.safeParse({
  username: 'jo',
  email: 'not-an-email',
  age: 15,
  password: 'short',
});

if (!result.success) {
  // All errors are collected, not just the first one
  console.log(`Found ${result.error.issues.length} validation errors`);
  // Found 4 validation errors

  result.error.issues.forEach(issue => {
    console.log(`- ${issue.path.join('.')}: ${issue.message}`);
  });
}
```

### Pattern: Early Termination with Fatal Errors

```typescript
const Schema = z.object({
  // If this fails, stop validating other fields
  apiToken: z.string().refine(token => token.startsWith('sk-'), {
    fatal: true,
    message: 'Invalid API token format',
  }),
  // These won't be validated if apiToken fails
  username: z.string().min(3),
  email: z.string().email(),
});
```

### Pattern: Default Values and Error Handling

```typescript
const ConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default('localhost'),
  debug: z.boolean().default(false),
});

const result = ConfigSchema.safeParse({ port: 8080 });

if (result.success) {
  console.log(result.data);
  // { port: 8080, host: "localhost", debug: false }
}
```

### Pattern: Custom Error Map

```typescript
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'This field must be a text string' };
    }
    if (issue.expected === 'number') {
      return { message: 'This field must be a number' };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Must be at least ${issue.minimum} characters` };
  }
  return { message: ctx.defaultError };
};

const Schema = z.string().min(5);
const result = Schema.safeParse('abc', { errorMap: customErrorMap });

if (!result.success) {
  console.log(result.error.issues[0].message);
  // "Must be at least 5 characters"
}
```

### Best Practices for Error Handling

1. **Use `.safeParse()` instead of try-catch** for better control flow
2. **Provide custom error messages** for better UX
3. **Format errors appropriately** for your context (CLI, API, UI)
4. **Use fatal refinements** to prevent cascading errors
5. **Log full error details** in development, simplified in production
6. **Handle async validation** with `.safeParseAsync()`
7. **Use consistent error formatting** across your application

---

## Additional Resources

### Official Documentation

- **Zod Official Website:** https://zod.dev
- **API Documentation:** https://zod.dev/api
- **GitHub Repository:** https://github.com/colinhacks/zod
- **Discord Community:** https://discord.gg/RcG33DQJdf
- **Twitter:** [@colinhacks](https://twitter.com/colinhacks)
- **Bluesky:** [@zod.dev](https://bsky.app/profile/zod.dev)

### Local Resources (from node_modules)

- **Package Info:** `/home/dustin/projects/hacky-hack/node_modules/zod/package.json`
- **README:** `/home/dustin/projects/hacky-hack/node_modules/zod/README.md`
- **Enum Tests:** `/home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/enum.test.ts`
- **Discriminated Union Tests:** `/home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/discriminated-unions.test.ts`
- **Error Tests:** `/home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/error.test.ts`
- **Recursive Tests:** `/home/dustin/projects/hacky-hack/node_modules/zod/src/v3/tests/recursive.test.ts`

### Related Projects in This Codebase

- **Environment Config Module:** `/home/dustin/projects/hacky-hack/src/config/environment.ts`
- **Type Definitions:** `/home/dustin/projects/hacky-hack/src/config/types.ts`
- **Validation Script:** `/home/dustin/projects/hacky-hack/src/scripts/validate-api.ts`

---

## Summary

This research document covers comprehensive Zod schema integration patterns for TypeScript interface validation. Key takeaways:

1. **Schema-first approach** is recommended for new projects
2. **Use `z.enum()` with const assertions** for type-safe enums
3. **Recursive schemas** require `z.lazy()` with proper type annotations
4. **Discriminated unions** provide excellent type narrowing for complex data structures
5. **`z.infer<>`** is the primary way to extract types from schemas
6. **Use `.safeParse()`** for better error handling control
7. **Custom error messages** significantly improve developer experience

All patterns include working examples, best practices, and references to official documentation and test files.
