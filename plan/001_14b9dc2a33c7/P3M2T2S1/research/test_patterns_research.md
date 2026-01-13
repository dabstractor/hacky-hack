# Test Patterns Research

## Summary

This document details the existing test patterns in the codebase that should guide scope parser test implementation.

## Test Framework and Configuration

**Framework**: Vitest 1.6.1

### vitest.config.ts Configuration

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/dist/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
```

**Key Requirements**: 100% coverage enforced across all metrics

## Test Structure and Organization

### Describe/It Pattern

```typescript
describe('module-name', () => {
  describe('functionName', () => {
    it('should do something when given input', () => {
      // SETUP
      // EXECUTE
      // VERIFY
    });
  });
});
```

### Organization Guidelines

1. Top-level describe for module/file
2. Nested describes for functions or grouped behavior
3. Grouped by input scenarios, edge cases, integration scenarios
4. Separate sections for error handling

## Test Fixture Pattern

### Factory Functions (from task-utils.test.ts)

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

const createComplexBacklog = (): Backlog => {
  // Returns a deeply nested structure for comprehensive testing
};
```

**Pattern**: Factory functions create test data with sensible defaults

### Mocking Pattern (from session-manager.test.ts)

```typescript
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('../../../src/core/session-utils.js', () => ({
  hashPRD: vi.fn(),
}));
```

## Testing Patterns Found

### Setup/Execute/Verify Pattern

```typescript
it('should find items correctly', () => {
  // SETUP: Create test data
  const backlog = createComplexBacklog();

  // EXECUTE: Call the function
  const result = findItem(backlog, 'P1.M1.T1');

  // VERIFY: Check results
  expect(result).not.toBeNull();
  expect(result?.id).toBe('P1.M1.T1');
});
```

### Comprehensive Edge Case Testing

Common edge cases tested in the codebase:

- Empty inputs: `''`, `[]`, `{}`
- Null/undefined values
- Invalid formats
- Boundary conditions (single item, large datasets)
- Circular references
- Special characters (Unicode, emojis)

### Pure Function Testing

- No external dependencies (e.g., prd-differ tests)
- Direct function calls
- Input/output validation only

## Assertion Patterns

### Basic Assertions

```typescript
expect(result).not.toBeNull();
expect(result?.id).toBe('expected-id');
expect(result?.status).toBe('Planned');
```

### Array Validations

```typescript
expect(result).toHaveLength(expectedLength);
expect(result.every(item => item.status === 'Planned')).toBe(true);
```

### Object Matching

```typescript
expect(session).toMatchObject({
  metadata: { id: 'expected-id' },
  prdSnapshot: 'content',
});
```

### Error Testing

```typescript
await expect(() => manager.initialize()).rejects.toThrow(SessionFileError);
```

## Similar Parsing Utilities Tests

### PRD Section Parser Tests (from prd-differ.test.ts)

```typescript
describe('parsePRDSections()', () => {
  describe('GIVEN a PRD with multiple markdown headers', () => {
    it('SHOULD parse all sections with correct levels and content', () => {
      const prd = `# Project Overview
This is a test project.

## Features
- User authentication`;

      const sections = parsePRDSections(prd);

      expect(sections).toHaveLength(2);
      expect(sections[0]).toEqual({
        level: 1,
        title: 'Project Overview',
        content: '\nThis is a test project.\n',
        lineNumber: 1,
      });
    });
  });
});
```

**Key Patterns**:

- BDD-style test descriptions (GIVEN/SHOULD)
- Markdown header parsing with level detection
- Content extraction between headers
- Empty section handling

## Test File Locations

| File                                      | Purpose                       |
| ----------------------------------------- | ----------------------------- |
| `tests/unit/core/task-utils.test.ts`      | Hierarchy traversal utilities |
| `tests/unit/core/session-manager.test.ts` | Session management with mocks |
| `tests/unit/core/prd-differ.test.ts`      | PRD parsing utilities         |
| `tests/unit/core/models.test.ts`          | Data models validation        |

## Key Insights for Scope Parser Testing

### 1. Test Structure

- Top-level describe for scope parser module
- Nested describes for each parsing function
- Separate sections for valid/invalid inputs
- Integration scenarios with Backlog data

### 2. Factory Functions Needed

- `createValidScope()` - creates valid scope strings
- `createInvalidScope()` - creates malformed scope strings
- `createTestBacklogWithScopes()` - creates test Backlog with specific hierarchy

### 3. Edge Cases to Test

- Empty scope strings
- Malformed scope syntax
- Overlapping scopes
- Nested scopes
- Wildcard patterns
- "all" keyword
- Invalid characters

### 4. Assertion Patterns

- Scope extraction validation
- Scope hierarchy validation
- Context preservation checks
- Error message validation

## References

- **tests/unit/core/task-utils.test.ts**: Hierarchy traversal tests
- **tests/unit/core/prd-differ.test.ts**: Parsing utility tests
- **tests/unit/core/models.test.ts**: Model validation tests
- **vitest.config.ts**: Test configuration and coverage requirements
