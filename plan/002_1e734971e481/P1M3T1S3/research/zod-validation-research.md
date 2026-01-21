# Zod String Validation Patterns Research

## Overview

Research into Zod validation patterns for custom string format validation, focusing on regex, refine, and superRefine methods.

## Key Zod Validation Methods

### 1. .regex() - Pattern-based validation

Simple pattern matching for structured strings:

```typescript
const alphanumericSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed');

// Multiple regex patterns
const strongPasswordSchema = z
  .string()
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');
```

### 2. .refine() - Custom validation logic

Custom validation with detailed error messages:

```typescript
const emailSchema = z
  .string()
  .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email format',
  });

// Refine with multiple checks
const usernameSchema = z.string().refine(
  val => {
    return val.length >= 3 && val.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(val);
  },
  {
    message:
      'Username must be 3-20 alphanumeric characters, underscores or hyphens',
  }
);
```

### 3. .superRefine() - Advanced validation with context

Multiple specific error messages with validation context:

```typescript
const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 8,
      type: 'string',
      inclusive: true,
      message: 'Password must be at least 8 characters',
    });
  }

  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must contain at least one uppercase letter',
    });
  }
});
```

## Patterns from the Codebase

### Hierarchical ID Validation (src/core/models.ts)

```typescript
// Subtask ID validation (P.M.T.S format)
id: z
  .string()
  .regex(
    /^P\d+\.M\d+\.T\d+\.S\d+$/,
    'Invalid subtask ID format (expected P{N}.M{N}.T{N}.S{N})'
  ),

// Task ID validation (P.M.T format)
id: z
  .string()
  .regex(
    /^P\d+\.M\d+\.T\d+$/,
    'Invalid task ID format (expected P{N}.M{N}.T{N})'
  ),
```

### Multi-Section String Validation

For validating structured strings with multiple sections:

```typescript
const contractSchema = z.string().superRefine((contract, ctx) => {
  const sections = contract.split(/^##\s+/m).filter(Boolean);

  // Validate minimum sections
  if (sections.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Contract must have at least 3 sections',
    });
  }

  // Validate required sections
  const requiredSections = ['Parties', 'Terms', 'Signatures'];
  const foundSections = sections.map(s =>
    s
      .split('\n')[0]
      .trim()
      .replace(/^#+\s*/, '')
  );

  requiredSections.forEach(required => {
    if (!foundSections.some(found => found.includes(required))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing required section: ${required}`,
      });
    }
  });
});
```

## Best Practices

1. **Use anchored patterns** (^ and $) for full string validation
2. **Combine multiple validations** for complex requirements
3. **Use .superRefine()** for multiple specific error messages
4. **Always provide meaningful error messages**
5. **Pre-compile regex patterns** using `const` with `as const`

## External Resources

- Zod Official Docs: https://zod.dev
- Zod GitHub: https://github.com/colinhacks/zod
- StackOverflow: "zod regex validation examples"
- GitHub: "zod structured validation" language:typescript
