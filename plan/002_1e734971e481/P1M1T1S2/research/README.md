# Vitest Import Testing Research Summary

**Research Date:** 2026-01-15
**Document:** `vitest-import-testing.md` (1,349 lines, 35KB)
**Status:** Complete

---

## Research Overview

This document provides a comprehensive guide to testing module imports with Vitest and TypeScript, with specific focus on:

1. **ESM-only libraries** like Groundswell
2. **TypeScript decorators** requiring special configuration
3. **npm linked packages** during development
4. **Complex export structures** (named, default, submodule exports)

---

## Key Findings

### 1. Testing Module Imports

**Dynamic Imports (Recommended for Runtime Testing):**
```typescript
it('should import successfully', async () => {
  const module = await import('groundswell');
  expect(module.createAgent).toBeDefined();
});
```

**Static Imports (For Compile-Time Validation):**
```typescript
import { createAgent } from 'groundswell';

it('should import at compile-time', () => {
  expect(createAgent).toBeDefined();
});
```

### 2. Testing Decorator Imports

**Required Configuration:**

**vitest.config.ts:**
```typescript
esbuild: {
  target: 'esnext',
  tsconfigRaw: {
    compilerOptions: {
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
  },
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Testing Decorators:**
```typescript
it('should apply decorators correctly', async () => {
  const { MyDecorator } = await import('groundswell');

  @MyDecorator
  class TestClass {}

  expect(TestClass).toBeDefined();
});
```

### 3. Mocking Module Imports

**Full Module Mocking:**
```typescript
vi.mock('groundswell', () => ({
  createAgent: vi.fn(),
}));
```

**Partial Mocking:**
```typescript
vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...actual,
    createAgent: vi.fn(),
  };
});
```

**Type-Safe Mocking:**
```typescript
import { createAgent } from 'groundswell';

vi.mock('groundswell', () => ({
  createAgent: vi.fn(),
}));

// Use vi.mocked() for type safety
vi.mocked(createAgent).mockReturnValue({ id: 'mock' } as any);
```

### 4. ESM-Specific Considerations

**File Extension Requirements:**
```typescript
// ✅ Correct for ESM
import { foo } from './local.js';
import { bar } from 'groundswell/tools.js';

// ❌ Incorrect for ESM
import { foo } from './local';
import { bar } from 'groundswell/tools';
```

**package.json Exports:**
```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./tools": {
      "types": "./dist/tools.d.ts",
      "import": "./dist/tools.js"
    }
  }
}
```

### 5. Best Practices

1. **Separate import tests from functional tests**
2. **Test all import patterns** (named, namespace, type-only, submodule)
3. **Use dynamic imports for runtime validation**
4. **Clean up mocks** with `vi.clearAllMocks()` and `vi.restoreAllMocks()`
5. **Use `vi.mocked()` for type safety**
6. **Validate type definitions** with type-only imports

### 6. Common Pitfalls

1. **Missing file extensions** in ESM imports
2. **Mock hoisting issues** - declare `vi.mock()` before imports
3. **Decorator configuration** - must enable in both Vitest and TypeScript
4. **Type definition mismatches** - runtime exports must match types
5. **Submodule path resolution** - requires proper `package.json` exports
6. **Interop default issues** - use `deps.interopDefault: true`

---

## Project-Specific Recommendations

### Current Project Configuration

The hacky-hack project uses:
- **Vitest 1.6.1**
- **TypeScript 5.2.0** with NodeNext module resolution
- **ESM-only** (`"type": "module"`)
- **Path aliases** for local imports

### Recommended Test Structure

```typescript
// tests/import-validation.test.ts
describe('Groundswell import validation', () => {
  describe('Main module', () => {
    it('should import dynamically', async () => {
      const module = await import('groundswell');
      expect(module).toBeDefined();
    });

    it('should export expected symbols', async () => {
      const { createAgent, createPrompt } = await import('groundswell');
      expect(createAgent).toBeDefined();
      expect(createPrompt).toBeDefined();
    });
  });

  describe('Submodules', () => {
    it('should import from groundswell/tools', async () => {
      const { MCPHandler } = await import('groundswell/tools');
      expect(MCPHandler).toBeDefined();
    });
  });

  describe('Decorators', () => {
    it('should import and apply decorators', async () => {
      const { AgentDecorator } = await import('groundswell');

      @AgentDecorator
      class TestClass {}

      expect(TestClass).toBeDefined();
    });
  });
});
```

---

## Configuration Checklist

Before testing imports, ensure:

- [ ] `vitest.config.ts` has `esbuild.tsconfigRaw` with `experimentalDecorators: true`
- [ ] `tsconfig.json` has `experimentalDecorators: true` and `emitDecoratorMetadata: true`
- [ ] `package.json` has `"type": "module"`
- [ ] `package.json` has proper `exports` field
- [ ] All relative imports use `.js` extension
- [ ] Vitest config has `deps.interopDefault: true`
- [ ] Path aliases are configured correctly
- [ ] Type definitions are built (`.d.ts` files exist)

---

## Documentation Links

The full research document includes:
- **Official documentation URLs** for Vitest and TypeScript
- **Code examples** for all testing patterns
- **Best practices** for import testing
- **Common pitfalls** and solutions
- **ESM-specific considerations**
- **Decorator testing patterns**

**Location:** `/home/dustin/projects/hacky-hack/plan/002_1e734971e481/P1M1T1S2/research/vitest-import-testing.md`

---

## Next Steps

1. **Review the full research document** for detailed examples
2. **Implement import validation tests** for Groundswell
3. **Configure Vitest** for decorator support if not already done
4. **Test all import patterns** used in the project
5. **Set up mocking strategies** for test isolation
6. **Validate ESM configuration** for proper module resolution

---

**Research Status:** ✅ Complete
**Document Size:** 1,349 lines, 35KB
**Last Updated:** 2026-01-15
