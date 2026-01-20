# TypeScript Testing Frameworks Research for P1.M3.T1.S1

## Current Project Setup

**Framework**: Vitest 1.6.1
**TypeScript Version**: 5.2+
**Coverage Requirement**: 100%

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
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

## Type Testing with Vitest

### expectTypeOf() - Type System Assertions
```typescript
import { expectTypeOf } from 'vitest';

describe('Type definitions', () => {
  it('should have correct Subtask type structure', () => {
    expectTypeOf<Subtask>()
      .toMatchTypeOf<{
        readonly id: string;
        readonly type: 'Subtask';
        readonly title: string;
        readonly status: Status;
        readonly story_points: number;
        readonly dependencies: string[];
        readonly context_scope: string;
      }>();
  });

  it('should have correct type discriminator', () => {
    expectTypeOf<Subtask>()
      .toHaveProperty('type')
      .extract<'type'>()
      .toBeLiteral('Subtask');
  });

  it('should infer correct type from Zod schema', () => {
    type InferredSubtask = z.infer<typeof SubtaskSchema>;
    expectTypeOf<InferredSubtask>().toEqualTypeOf<Subtask>();
  });
});
```

### TypeScript Compilation Verification

**Approach 1: Using typecheck-runner utility**
```typescript
import { runTypecheck } from '../../../src/utils/typecheck-runner.js';

describe('TypeScript compilation verification', () => {
  it('should verify models.ts compiles without errors', async () => {
    const result = await runTypecheck({
      projectPath: '/home/dustin/projects/hacky-hack',
    });

    expect(result.success).toBe(true);
    expect(result.errorCount).toBe(0);
  });
});
```

**Approach 2: Using npm run typecheck**
```typescript
import { execSync } from 'node:child_process';

describe('TypeScript compilation verification', () => {
  it('should compile entire project without type errors', () => {
    expect(() => {
      execSync('npm run typecheck', { stdio: 'pipe' });
    }).not.toThrow();
  });
});
```

## Type Inference Verification with Zod

```typescript
describe('Zod schema type inference', () => {
  it('should infer correct Subtask type from schema', () => {
    type InferredSubtask = z.infer<typeof SubtaskSchema>;

    const sample: InferredSubtask = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'Scope',
    };

    const verified: Subtask = sample;
    expect(verified).toBeDefined();
  });
});
```

## Type Narrowing Patterns

```typescript
describe('Type narrowing with discriminated unions', () => {
  it('should narrow types based on discriminator', () => {
    const item: HierarchyItem = {
      id: 'P1.M1.T1.S1',
      type: 'Subtask',
      title: 'Test',
      status: 'Planned',
      story_points: 2,
      dependencies: [],
      context_scope: 'Test',
    };

    switch (item.type) {
      case 'Phase':
        expectTypeOf(item).toHaveProperty('milestones');
        break;
      case 'Subtask':
        expectTypeOf(item).toHaveProperty('story_points');
        expectTypeOf(item).toHaveProperty('dependencies');
        expectTypeOf(item).toHaveProperty('context_scope');
        break;
    }
  });
});
```

## Sources
- https://vitest.dev/api/expect-typeof.html
- https://vitest.dev/api/assert.html
- https://www.typescriptlang.org/docs/handbook/compiler-options.html
- https://zod.dev/?id=type-inference
