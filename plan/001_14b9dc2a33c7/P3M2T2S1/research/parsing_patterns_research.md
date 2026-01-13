# Parsing Patterns Research

## Summary

This document details the existing parsing patterns in the codebase that should guide scope parser implementation.

## String Parsing Utilities and Patterns

### Regex-Based Parsing (from src/core/prd-differ.ts)

#### Markdown Header Parsing (Lines 192, 323-324)

````typescript
// Markdown header parsing pattern
const headerMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);

// Code block detection pattern
const hasCodeBlocks = /```/.test(content);
const hasTables = /\|.*\|/.test(content);
````

### ID Format Validation Patterns (from src/core/models.ts)

#### Task ID Validation (Lines 237-241, 348-351)

```typescript
// Subtask ID format validation
id: z.string().regex(
  /^P\d+\.M\d+\.T\d+\.S\d+$/,
  'Invalid subtask ID format (expected P{N}.M{N}.T{N}.S{N})'
),

// Task ID format validation
id: z.string().regex(
  /^P\d+\.M\d+\.T\d+$/,
  'Invalid task ID format (expected P{N}.M{N}.T{N})'
),

// Milestone ID format validation
id: z.string().regex(
  /^P\d+\.M\d+$/,
  'Invalid milestone ID format (expected P{N}.M{N})'
),

// Phase ID format validation
id: z.string().regex(
  /^P\d+$/,
  'Invalid phase ID format (expected P{N})'
),
```

### Text Normalization Patterns (from src/core/prd-differ.ts)

#### normalizeMarkdown Function (Lines 278-301)

````typescript
export function normalizeMarkdown(text: string): string {
  const lines = text.split('\n');
  const normalized: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      normalized.push(line);
    } else if (inCodeBlock) {
      // Preserve whitespace in code blocks exactly
      normalized.push(line);
    } else {
      // Normalize outside code blocks
      normalized.push(line.trimEnd().replace(/  +/g, ' '));
    }
  }

  return normalized.join('\n').replace(/\r\n/g, '\n');
}
````

**Key Pattern**: Split-Process-Join - Split text into lines, process each line, join back

## Enum Definitions and Type Guards

### Status Enum Pattern (from src/core/models.ts, Lines 55-85)

```typescript
// String literal union type
export type Status =
  | 'Planned'
  | 'Researching'
  | 'Implementing'
  | 'Complete'
  | 'Failed'
  | 'Obsolete';

// Zod enum for runtime validation
export const StatusEnum = z.enum([
  'Planned',
  'Researching',
  'Implementing',
  'Complete',
  'Failed',
  'Obsolete',
]);
```

**Best Practice**: Use string literal unions with Zod enums for:

- Type safety at compile time
- Runtime validation
- Serialization compatibility

### Type Guard Pattern (from src/utils/task-utils.ts, Lines 63-65)

```typescript
export function isSubtask(item: HierarchyItem): item is Subtask {
  return item.type === 'Subtask';
}
```

## Error Handling Patterns

### Custom Error Class (from src/config/types.ts, Lines 74-88)

```typescript
export class EnvironmentValidationError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
  }
}
```

**Pattern**: Custom error classes with:

- Descriptive error messages
- Typed properties for context
- Proper error name assignment

### Validation with Zod (from src/core/models.ts, Lines 236-253)

```typescript
export const SubtaskSchema: z.ZodType<Subtask> = z.object({
  id: z.string().regex(/^P\d+\.M\d+\.T\d+\.S\d+$/, 'Invalid subtask ID format'),
  type: z.literal('Subtask'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  status: StatusEnum,
  story_points: z
    .number()
    .int('Story points must be an integer')
    .min(1, 'Story points must be at least 1')
    .max(21, 'Story points cannot exceed 21'),
  dependencies: z.array(z.string()).min(0),
  context_scope: z.string().min(1, 'Context scope is required'),
});
```

**Pattern**: Comprehensive validation with:

- Regex patterns for format validation
- Descriptive error messages
- Type constraints (min, max)
- Literal types for discriminated unions

## Naming Conventions Used

| Purpose            | Convention                                      | Example                              |
| ------------------ | ----------------------------------------------- | ------------------------------------ |
| Parser functions   | `parse{Noun}()`                                 | `parsePRDSections()`, `parseScope()` |
| Validation schemas | `{Type}Schema`, `{Type}Enum`                    | `StatusEnum`, `SubtaskSchema`        |
| Type guards        | `is{Type}()`                                    | `isSubtask()`, `isValidScope()`      |
| Custom errors      | `{Context}Error`                                | `EnvironmentValidationError`         |
| Error messages     | `"Invalid {field} format (expected {pattern})"` | Specific and helpful                 |

## CLI-Related Dependencies

**Finding**: The codebase uses NO CLI parsing libraries currently.

- No commander, yargs, or other CLI frameworks in package.json
- CLI arguments are handled through process.argv directly
- Main entry point: src/index.ts (simple script runner)

**Implication**: Scope parser should use raw string parsing without CLI framework dependencies initially.

## Best Practices Observed

1. **Immutable Parsing**: All parsing functions return new data structures
2. **Defensive Programming**: Extensive validation at all levels
3. **Type Safety**: Full TypeScript with Zod runtime validation
4. **Error Context**: Detailed error messages with expected patterns
5. **Section-Aware Parsing**: Handle different content types differently
6. **Normalization**: Normalize input before comparison/processing

## References

- **src/core/prd-differ.ts**: Text parsing patterns (lines 192, 278-301, 323-324)
- **src/core/models.ts**: ID validation regex patterns (lines 55-85, 236-253)
- **src/config/types.ts**: Custom error class pattern (lines 74-88)
- **src/utils/task-utils.ts**: Type guard patterns (lines 63-65)
