# Vitest Import Testing Best Practices

**Research Date:** 2026-01-15
**Vitest Version:** 1.6.1
**TypeScript Version:** 5.2.0+
**Focus:** Testing module imports with Vitest and TypeScript for ESM libraries

---

## Table of Contents

1. [Overview](#overview)
2. [Official Documentation](#official-documentation)
3. [Testing Module Imports](#testing-module-imports)
4. [Testing Decorator Imports](#testing-decorator-imports)
5. [Mocking Module Imports](#mocking-module-imports)
6. [ESM-Specific Considerations](#esm-specific-considerations)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [Code Examples](#code-examples)
10. [Project-Specific Patterns](#project-specific-patterns)

---

## Overview

Testing module imports is crucial for ensuring that a library's exports can be successfully imported and used by consumers. This is especially important for:

- **ESM-only libraries** like Groundswell
- **Libraries with TypeScript decorators** that require special configuration
- **Libraries with complex export structures** (named exports, default exports, submodules)
- **npm linked packages** during development

**Key Goals:**

1. Verify that all exported symbols are accessible
2. Validate that decorators are properly transformed
3. Ensure type definitions are correct
4. Test import patterns that consumers will use

---

## Official Documentation

### Vitest Documentation

1. **Vitest Configuration**
   - URL: https://vitest.dev/config/
   - Covers: `vitest.config.ts` setup, module resolution, aliases
   - Sections: `resolve.alias`, `resolve.extensions`, `deps.interopDefault`

2. **Vitest Mocking API**
   - URL: https://vitest.dev/api/vi.html
   - Covers: `vi.mock()`, `vi.importActual()`, `vi.unmock()`
   - Sections: Module mocking, partial mocking, hoisting

3. **Vitest Testing Guide**
   - URL: https://vitest.dev/guide/
   - Covers: Test structure, setup files, globals
   - Sections: `beforeEach`, `afterEach`, test isolation

### TypeScript Documentation

4. **TypeScript Module Resolution**
   - URL: https://www.typescriptlang.org/docs/handbook/modules/theory.html
   - Covers: NodeNext resolution, ESM imports
   - Sections: File extensions, package.json exports

5. **TypeScript Decorators**
   - URL: https://www.typescriptlang.org/docs/handbook/decorators.html
   - Covers: `experimentalDecorators`, `emitDecoratorMetadata`
   - Sections: Decorator types, transformation

---

## Testing Module Imports

### 1. Basic Import Validation Test

The simplest approach to test that imports work:

```typescript
// tests/import-validation.test.ts
import { describe, expect, it } from 'vitest';

describe('Module imports', () => {
  it('should successfully import the main module', async () => {
    // Dynamic import to test runtime resolution
    const module = await import('groundswell');

    expect(module).toBeDefined();
    expect(typeof module).toBe('object');
  });

  it('should export expected symbols', async () => {
    const { createAgent, createPrompt, type Agent } = await import('groundswell');

    expect(createAgent).toBeDefined();
    expect(typeof createAgent).toBe('function');
    expect(createPrompt).toBeDefined();
    expect(typeof createPrompt).toBe('function');
    expect(Agent).toBeDefined();
  });
});
```

### 2. Static Import Testing

For compile-time validation:

```typescript
// tests/static-imports.test.ts
import { describe, expect, it } from 'vitest';
import { createAgent, createPrompt, type Agent } from 'groundswell';

describe('Static imports', () => {
  it('should import createAgent', () => {
    expect(createAgent).toBeDefined();
    expect(typeof createAgent).toBe('function');
  });

  it('should import createPrompt', () => {
    expect(createPrompt).toBeDefined();
    expect(typeof createPrompt).toBe('function');
  });

  it('should import Agent type', () => {
    // Type imports are erased at runtime, but this validates
    // that the type exists in the type definitions
    expect(true).toBe(true);
  });
});
```

### 3. Type-Only Import Testing

Validates that type definitions are exported correctly:

```typescript
// tests/type-imports.test.ts
import { describe, expect, it } from 'vitest';

describe('Type-only imports', () => {
  it('should import types without runtime errors', () => {
    // This should compile without errors
    type Agent = import('groundswell').Agent;
    type Workflow = import('groundswell').Workflow;

    expect(true).toBe(true);
  });

  it('should support type-only import syntax', () => {
    // Validates that type-only imports work
    const _typeCheck: import('groundswell').Agent = {} as any;
    expect(_typeCheck).toBeDefined();
  });
});
```

### 4. Submodule Import Testing

For libraries with exports from subpaths:

```typescript
// tests/submodule-imports.test.ts
import { describe, expect, it } from 'vitest';

describe('Submodule imports', () => {
  it('should import from groundswell/tools', async () => {
    const { MCPHandler } = await import('groundswell/tools');

    expect(MCPHandler).toBeDefined();
  });

  it('should import from groundswell/types', async () => {
    const { AgentConfig } = await import('groundswell/types');

    expect(AgentConfig).toBeDefined();
  });

  it('should handle type-only imports from submodules', async () => {
    // This should work without runtime errors
    type AgentConfig = import('groundswell/types').AgentConfig;

    expect(true).toBe(true);
  });
});
```

### 5. Namespace Import Testing

Validates namespace import patterns:

```typescript
// tests/namespace-imports.test.ts
import { describe, expect, it } from 'vitest';

describe('Namespace imports', () => {
  it('should support namespace import', async () => {
    const groundswell = await import('groundswell');

    expect(groundswell).toBeDefined();
    expect(groundswell.createAgent).toBeDefined();
    expect(groundswell.createPrompt).toBeDefined();
  });

  it('should include all exports in namespace', async () => {
    const groundswell = await import('groundswell');

    // Check that expected exports exist
    const exports = Object.keys(groundswell);
    expect(exports).toContain('createAgent');
    expect(exports).toContain('createPrompt');
  });
});
```

---

## Testing Decorator Imports

### 1. Decorator Import Validation

Decorators require special TypeScript configuration:

```typescript
// tests/decorator-imports.test.ts
import { describe, expect, it } from 'vitest';

describe('Decorator imports', () => {
  it('should import decorators successfully', async () => {
    const { MyDecorator, AnotherDecorator } = await import('groundswell');

    expect(MyDecorator).toBeDefined();
    expect(typeof MyDecorator).toBe('function');
    expect(AnotherDecorator).toBeDefined();
  });

  it('should apply decorators correctly', async () => {
    const { MyDecorator } = await import('groundswell');

    // Create a test class and apply decorator
    @MyDecorator
    class TestClass {
      testMethod() {}
    }

    expect(TestClass).toBeDefined();
  });
});
```

### 2. Decorator Metadata Testing

Verify that `emitDecoratorMetadata` works:

```typescript
// tests/decorator-metadata.test.ts
import { describe, expect, it } from 'vitest';
import 'reflect-metadata';

describe('Decorator metadata', () => {
  it('should preserve decorator metadata', async () => {
    const { TypedDecorator } = await import('groundswell');

    @TypedDecorator
    class TestClass {
      testProperty: string;
    }

    const metadata = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'testProperty'
    );
    expect(metadata).toBe(String);
  });
});
```

### 3. Vitest Configuration for Decorators

Essential `vitest.config.ts` settings:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
  esbuild: {
    target: 'esnext',
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
});
```

### 4. TypeScript Configuration for Decorators

Required `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

---

## Mocking Module Imports

### 1. Basic Module Mocking

Mock entire modules:

```typescript
// tests/mocking/basic.mock.test.ts
import { describe, expect, it, vi } from 'vitest';

// Mock at top level before imports
vi.mock('groundswell', () => ({
  createAgent: vi.fn(),
  createPrompt: vi.fn(),
}));

import { createAgent } from 'groundswell';

describe('Basic mocking', () => {
  it('should use mocked createAgent', () => {
    const mockAgent = { id: 'mock-agent' };
    vi.mocked(createAgent).mockReturnValue(mockAgent as any);

    const agent = createAgent({ name: 'test' });

    expect(agent).toBe(mockAgent);
    expect(createAgent).toHaveBeenCalledWith({ name: 'test' });
  });
});
```

### 2. Partial Mocking with vi.importActual

Preserve some exports while mocking others:

```typescript
// tests/mocking/partial.mock.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('groundswell', async () => {
  const actual = await vi.importActual('groundswell');
  return {
    ...(actual as any),
    createAgent: vi.fn(),
  };
});

import { createAgent, createPrompt } from 'groundswell';

describe('Partial mocking', () => {
  it('should mock createAgent but preserve createPrompt', () => {
    // createAgent is mocked
    vi.mocked(createAgent).mockReturnValue({ id: 'mock' } as any);

    // createPrompt is real
    const prompt = createPrompt('test');

    expect(createAgent).toHaveBeenCalled();
    expect(prompt).toBeDefined();
  });
});
```

### 3. Mocking Submodules

Mock specific export paths:

```typescript
// tests/mocking/submodule.mock.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('groundswell/tools', () => ({
  MCPHandler: vi.fn(),
}));

import { MCPHandler } from 'groundswell/tools';

describe('Submodule mocking', () => {
  it('should mock MCPHandler from groundswell/tools', () => {
    const mockHandler = { handle: vi.fn() };
    vi.mocked(MCPHandler).mockReturnValue(mockHandler as any);

    const handler = new MCPHandler();

    expect(handler).toBe(mockHandler);
  });
});
```

### 4. SpyOn for Existing Functions

Spy on functions without mocking:

```typescript
// tests/mocking/spyon.test.ts
import { describe, expect, it, vi } from 'vitest';
import * as groundswell from 'groundswell';

describe('SpyOn usage', () => {
  it('should spy on createAgent without mocking', () => {
    const spy = vi.spyOn(groundswell, 'createAgent');

    // Call real implementation
    groundswell.createAgent({ name: 'test' });

    expect(spy).toHaveBeenCalledWith({ name: 'test' });
    spy.mockRestore();
  });
});
```

---

## ESM-Specific Considerations

### 1. File Extension Requirements

ESM requires file extensions in imports:

```typescript
// ✅ Correct for ESM
import { foo } from './local.js';
import { bar } from 'groundswell/tools.js';

// ❌ Incorrect for ESM
import { foo } from './local';
import { bar } from 'groundswell/tools';
```

**Note:** TypeScript files still use `.ts` extension in source, but imports reference `.js` extension.

### 2. package.json Exports Field

ESM libraries should use `exports` field:

```json
{
  "name": "groundswell",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./tools": {
      "types": "./dist/tools.d.ts",
      "import": "./dist/tools.js"
    },
    "./types": {
      "types": "./dist/types.d.ts",
      "import": "./dist/types.js"
    }
  }
}
```

### 3. Conditional Exports Testing

Test different import conditions:

```typescript
// tests/conditional-exports.test.ts
import { describe, expect, it } from 'vitest';

describe('Conditional exports', () => {
  it('should resolve main export', async () => {
    const main = await import('groundswell');
    expect(main.createAgent).toBeDefined();
  });

  it('should resolve tools export', async () => {
    const tools = await import('groundswell/tools');
    expect(tools.MCPHandler).toBeDefined();
  });

  it('should resolve types export', async () => {
    const types = await import('groundswell/types');
    expect(types.AgentConfig).toBeDefined();
  });
});
```

### 4. Dynamic Import Testing

Dynamic imports are crucial for ESM:

```typescript
// tests/dynamic-imports.test.ts
import { describe, expect, it } from 'vitest';

describe('Dynamic imports', () => {
  it('should support dynamic import()', async () => {
    const groundswell = await import('groundswell');

    expect(groundswell).toBeDefined();
    expect(groundswell.createAgent).toBeDefined();
  });

  it('should handle dynamic import errors', async () => {
    await expect(import('nonexistent-package')).rejects.toThrow();
  });
});
```

### 5. Top-Level Await Testing

ESM supports top-level await:

```typescript
// tests/top-level-await.test.ts
import { describe, expect, it } from 'vitest';

describe('Top-level await', () => {
  it('should support top-level await in test files', async () => {
    const module = await import('groundswell');

    expect(module).toBeDefined();
  });
});
```

---

## Best Practices

### 1. Separate Import Tests from Functional Tests

Keep import validation separate from functionality tests:

```typescript
// ✅ Good: Separate import test
describe('Import validation', () => {
  it('should import all exports', async () => {
    const module = await import('groundswell');
    expect(module.createAgent).toBeDefined();
  });
});

describe('createAgent functionality', () => {
  it('should create an agent with config', () => {
    const { createAgent } = await import('groundswell');
    const agent = createAgent({ name: 'test' });
    expect(agent.name).toBe('test');
  });
});
```

### 2. Use Dynamic Imports for Runtime Testing

Dynamic imports test actual runtime resolution:

```typescript
// ✅ Good: Dynamic import
it('should resolve at runtime', async () => {
  const module = await import('groundswell');
  expect(module).toBeDefined();
});

// ⚠️ Limited: Static import (compile-time only)
import { createAgent } from 'groundswell';
it('should resolve at compile-time', () => {
  expect(createAgent).toBeDefined();
});
```

### 3. Test All Import Patterns

Test all ways consumers might import:

```typescript
describe('Import patterns', () => {
  it('should support named imports', async () => {
    const { createAgent } = await import('groundswell');
    expect(createAgent).toBeDefined();
  });

  it('should support namespace imports', async () => {
    const groundswell = await import('groundswell');
    expect(groundswell.createAgent).toBeDefined();
  });

  it('should support type-only imports', async () => {
    type Agent = import('groundswell').Agent;
    expect(true).toBe(true);
  });

  it('should support submodule imports', async () => {
    const { MCPHandler } = await import('groundswell/tools');
    expect(MCPHandler).toBeDefined();
  });
});
```

### 4. Validate Exported Types

Ensure type definitions are correct:

```typescript
describe('Type definitions', () => {
  it('should export Agent type', () => {
    type Agent = import('groundswell').Agent;
    const agent: Agent = {} as any;
    expect(agent).toBeDefined();
  });

  it('should export Workflow type', () => {
    type Workflow = import('groundswell').Workflow;
    const workflow: Workflow = {} as any;
    expect(workflow).toBeDefined();
  });
});
```

### 5. Test Decorator Transformation

Verify decorators work correctly:

```typescript
describe('Decorator transformation', () => {
  it('should transform decorators for ESM', async () => {
    const { MyDecorator } = await import('groundswell');

    @MyDecorator
    class TestClass {}

    expect(TestClass).toBeDefined();
  });

  it('should preserve decorator metadata', async () => {
    const { TypedDecorator } = await import('groundswell');

    @TypedDecorator
    class TestClass {
      testProperty: string;
    }

    const metadata = Reflect.getMetadata(
      'design:type',
      TestClass.prototype,
      'testProperty'
    );
    expect(metadata).toBe(String);
  });
});
```

### 6. Mock Cleanup

Always clean up mocks:

```typescript
describe('Mock cleanup', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should clean up mocks between tests', () => {
    const mock = vi.fn();
    mock();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('should start with clean state', () => {
    // No previous test's mocks should affect this test
    const mock = vi.fn();
    expect(mock).not.toHaveBeenCalled();
  });
});
```

### 7. Use vi.mocked() for Type Safety

Use `vi.mocked()` for TypeScript type safety:

```typescript
import { createAgent } from 'groundswell';

vi.mock('groundswell', () => ({
  createAgent: vi.fn(),
}));

it('should use vi.mocked for type safety', () => {
  // ✅ Good: Type-safe mock access
  vi.mocked(createAgent).mockReturnValue({ id: 'test' } as any);

  // ❌ Bad: Loses type safety
  (createAgent as any).mockReturnValue({ id: 'test' });
});
```

---

## Common Pitfalls

### 1. Missing File Extensions

**Problem:** ESM requires file extensions in relative imports.

```typescript
// ❌ Wrong
import { foo } from './local';

// ✅ Correct
import { foo } from './local.js';
```

**Solution:** Always include `.js` extension for TypeScript files (note: `.js`, not `.ts`).

### 2. Mock Hoisting Issues

**Problem:** `vi.mock()` is hoisted, but imports inside might not work as expected.

```typescript
// ❌ Wrong: Import before mock
import { createAgent } from 'groundswell';
vi.mock('groundswell', () => ({ createAgent: vi.fn() }));

// ✅ Correct: Mock before import
vi.mock('groundswell', () => ({ createAgent: vi.fn() }));
import { createAgent } from 'groundswell';
```

### 3. Decorator Configuration

**Problem:** Decorators fail without proper configuration.

```json
// ❌ Wrong: Missing decorator options
{
  "compilerOptions": {
    "target": "ES2022"
  }
}

// ✅ Correct: Include decorator options
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 4. Type Definition Mismatches

**Problem:** Runtime exports don't match type definitions.

```typescript
// ❌ Wrong: Type doesn't exist at runtime
// groundswell/index.ts
export function createAgent(config: AgentConfig): Agent;

// groundswell/index.d.ts
export declare function createAgent(config: AgentConfig): Agent;
export declare function nonexistent(): void; // ❌ Doesn't exist

// ✅ Correct: Types match runtime
// groundswell/index.ts
export function createAgent(config: AgentConfig): Agent;
export function helper(): void;

// groundswell/index.d.ts
export declare function createAgent(config: AgentConfig): Agent;
export declare function helper(): void;
```

### 5. Submodule Path Resolution

**Problem:** Submodule imports fail without proper `package.json` exports.

```json
// ❌ Wrong: No exports field
{
  "name": "groundswell",
  "main": "./dist/index.js"
}

// ✅ Correct: Include exports field
{
  "name": "groundswell",
  "exports": {
    ".": "./dist/index.js",
    "./tools": "./dist/tools.js",
    "./types": "./dist/types.js"
  }
}
```

### 6. Interop Default Issues

**Problem:** Default exports don't work correctly with ESM.

```typescript
// ❌ Wrong: Default export issues
// groundswell/index.ts
export default function createAgent() {}

// consumer.ts
import createAgent from 'groundswell'; // May not work

// ✅ Correct: Use named exports
// groundswell/index.ts
export function createAgent() {}

// consumer.ts
import { createAgent } from 'groundswell'; // Works reliably
```

**Solution:** Use `deps.interopDefault: true` in Vitest config:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    deps: {
      interopDefault: true,
    },
  },
});
```

---

## Code Examples

### Complete Import Test Suite

```typescript
// tests/import-validation-suite.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Groundswell import validation suite', () => {
  // Clean up mocks between tests
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Main module imports
  // ========================================================================

  describe('Main module (groundswell)', () => {
    it('should import main module dynamically', async () => {
      const groundswell = await import('groundswell');

      expect(groundswell).toBeDefined();
      expect(typeof groundswell).toBe('object');
    });

    it('should export createAgent function', async () => {
      const { createAgent } = await import('groundswell');

      expect(createAgent).toBeDefined();
      expect(typeof createAgent).toBe('function');
    });

    it('should export createPrompt function', async () => {
      const { createPrompt } = await import('groundswell');

      expect(createPrompt).toBeDefined();
      expect(typeof createPrompt).toBe('function');
    });

    it('should export Agent type', async () => {
      type Agent = import('groundswell').Agent;

      // Type imports are erased, but this validates compilation
      expect(true).toBe(true);
    });

    it('should support namespace import', async () => {
      const groundswell = await import('groundswell');

      expect(groundswell.createAgent).toBeDefined();
      expect(groundswell.createPrompt).toBeDefined();
    });
  });

  // ========================================================================
  // Submodule imports
  // ========================================================================

  describe('Submodules', () => {
    it('should import from groundswell/tools', async () => {
      const { MCPHandler } = await import('groundswell/tools');

      expect(MCPHandler).toBeDefined();
    });

    it('should import from groundswell/types', async () => {
      const { AgentConfig } = await import('groundswell/types');

      expect(AgentConfig).toBeDefined();
    });

    it('should support type-only imports from submodules', async () => {
      type AgentConfig = import('groundswell/types').AgentConfig;

      expect(true).toBe(true);
    });
  });

  // ========================================================================
  // Decorator imports
  // ========================================================================

  describe('Decorators', () => {
    it('should import decorators', async () => {
      const { AgentDecorator } = await import('groundswell');

      expect(AgentDecorator).toBeDefined();
      expect(typeof AgentDecorator).toBe('function');
    });

    it('should apply decorators correctly', async () => {
      const { AgentDecorator } = await import('groundswell');

      @AgentDecorator
      class TestClass {
        testMethod() {}
      }

      expect(TestClass).toBeDefined();
    });
  });

  // ========================================================================
  // Type definitions
  // ========================================================================

  describe('Type definitions', () => {
    it('should export all major types', async () => {
      type Agent = import('groundswell').Agent;
      type Workflow = import('groundswell').Workflow;
      type AgentConfig = import('groundswell/types').AgentConfig;

      expect(true).toBe(true);
    });

    it('should support type-only imports', async () => {
      // This should compile without errors
      const _typeCheck: import('groundswell').Agent = {} as any;

      expect(_typeCheck).toBeDefined();
    });
  });

  // ========================================================================
  // Error handling
  // ========================================================================

  describe('Error handling', () => {
    it('should throw on invalid imports', async () => {
      await expect(import('groundswell/nonexistent')).rejects.toThrow();
    });

    it('should provide helpful error messages', async () => {
      try {
        await import('groundswell/nonexistent');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
```

### Mocking Examples

```typescript
// tests/mocking-examples.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Groundswell mocking examples', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Full module mocking
  // ========================================================================

  describe('Full module mocking', () => {
    vi.mock('groundswell', () => ({
      createAgent: vi.fn(() => ({ id: 'mock-agent' })),
      createPrompt: vi.fn(() => ({ content: 'mock-prompt' })),
    }));

    it('should use mocked createAgent', async () => {
      const { createAgent } = await import('groundswell');

      const agent = createAgent({ name: 'test' });

      expect(agent).toEqual({ id: 'mock-agent' });
      expect(createAgent).toHaveBeenCalledWith({ name: 'test' });
    });

    it('should use mocked createPrompt', async () => {
      const { createPrompt } = await import('groundswell');

      const prompt = createPrompt('test');

      expect(prompt).toEqual({ content: 'mock-prompt' });
      expect(createPrompt).toHaveBeenCalledWith('test');
    });
  });

  // ========================================================================
  // Partial mocking
  // ========================================================================

  describe('Partial mocking', () => {
    vi.mock('groundswell', async () => {
      const actual = await vi.importActual('groundswell');
      return {
        ...(actual as any),
        createAgent: vi.fn(() => ({ id: 'partial-mock' })),
      };
    });

    it('should mock createAgent but preserve createPrompt', async () => {
      const { createAgent, createPrompt } = await import('groundswell');

      // createAgent is mocked
      const agent = createAgent({ name: 'test' });
      expect(agent).toEqual({ id: 'partial-mock' });

      // createPrompt is real
      const prompt = createPrompt('test');
      expect(prompt).toBeDefined();
    });
  });

  // ========================================================================
  // Submodule mocking
  // ========================================================================

  describe('Submodule mocking', () => {
    vi.mock('groundswell/tools', () => ({
      MCPHandler: vi.fn(() => ({ handle: vi.fn() })),
    }));

    it('should mock MCPHandler', async () => {
      const { MCPHandler } = await import('groundswell/tools');

      const handler = new MCPHandler();

      expect(handler).toEqual({ handle: expect.any(Function) });
    });
  });

  // ========================================================================
  // Spying on functions
  // ========================================================================

  describe('Spying', () => {
    it('should spy on createAgent', async () => {
      const groundswell = await import('groundswell');
      const spy = vi.spyOn(groundswell, 'createAgent');

      groundswell.createAgent({ name: 'test' });

      expect(spy).toHaveBeenCalledWith({ name: 'test' });

      spy.mockRestore();
    });

    it('should mock implementation temporarily', async () => {
      const groundswell = await import('groundswell');
      const spy = vi
        .spyOn(groundswell, 'createAgent')
        .mockReturnValue({ id: 'temp-mock' } as any);

      const agent = groundswell.createAgent({ name: 'test' });

      expect(agent).toEqual({ id: 'temp-mock' });

      spy.mockRestore();
    });
  });
});
```

---

## Project-Specific Patterns

### Current Project Configuration

The hacky-hack project uses:

- **Vitest 1.6.1** for testing
- **TypeScript 5.2.0** with NodeNext module resolution
- **ESM-only** configuration (`"type": "module"` in package.json)
- **Path aliases** in `vitest.config.ts`:
  - `@` → `./src`
  - `#` → `./src/agents`
  - `groundswell` → `../groundswell/dist/index.js`

### Groundswell Import Testing

Based on the existing test patterns in the project:

```typescript
// tests/unit/utils/groundswell-import-validation.test.ts
import { describe, expect, it } from 'vitest';

describe('Groundswell import validation', () => {
  it('should import createAgent from groundswell', async () => {
    const { createAgent } = await import('groundswell');

    expect(createAgent).toBeDefined();
    expect(typeof createAgent).toBe('function');
  });

  it('should import createPrompt from groundswell', async () => {
    const { createPrompt } = await import('groundswell');

    expect(createPrompt).toBeDefined();
    expect(typeof createPrompt).toBe('function');
  });

  it('should import Agent type from groundswell', async () => {
    type Agent = import('groundswell').Agent;

    // Type import validation (compile-time)
    expect(true).toBe(true);
  });

  it('should import from groundswell/tools', async () => {
    const { MCPHandler } = await import('groundswell/tools');

    expect(MCPHandler).toBeDefined();
  });

  it('should import from groundswell/types', async () => {
    const { AgentConfig } = await import('groundswell/types');

    expect(AgentConfig).toBeDefined();
  });

  it('should support namespace import', async () => {
    const groundswell = await import('groundswell');

    expect(groundswell.createAgent).toBeDefined();
    expect(groundswell.createPrompt).toBeDefined();
  });
});
```

### Testing with Path Aliases

The project uses path aliases for local imports:

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '#': new URL('./src/agents', import.meta.url).pathname,
      groundswell: new URL('../groundswell/dist/index.js', import.meta.url)
        .pathname,
    },
    extensions: ['.ts', '.js', '.tsx'],
  },
});
```

Testing path alias resolution:

```typescript
// tests/path-alias-validation.test.ts
import { describe, expect, it } from 'vitest';

describe('Path alias validation', () => {
  it('should resolve @ alias', async () => {
    const module = await import('@/utils/groundswell-verifier.js');

    expect(module).toBeDefined();
  });

  it('should resolve # alias', async () => {
    const module = await import('#/agents/prp-executor.js');

    expect(module).toBeDefined();
  });

  it('should resolve groundswell alias', async () => {
    const { createAgent } = await import('groundswell');

    expect(createAgent).toBeDefined();
  });
});
```

### Module Resolution Verification

The project includes a `module-resolution-verifier.test.ts` that validates import patterns:

```typescript
// Example from existing tests
describe('Module resolution verification', () => {
  it('should detect regular named imports from groundswell', () => {
    const source = "import { Workflow, Step } from 'groundswell';";

    const imports = parseImports(source);

    expect(imports).toContainEqual({
      module: 'groundswell',
      symbols: ['Workflow', 'Step'],
      type: 'named',
    });
  });

  it('should detect type-only imports from groundswell', () => {
    const source = "import type { Agent } from 'groundswell/types';";

    const imports = parseImports(source);

    expect(imports).toContainEqual({
      module: 'groundswell/types',
      symbols: ['Agent'],
      type: 'type-only',
    });
  });

  it('should detect namespace imports from groundswell', () => {
    const source = "import * as groundswell from 'groundswell';";

    const imports = parseImports(source);

    expect(imports).toContainEqual({
      module: 'groundswell',
      symbols: [],
      type: 'namespace',
    });
  });

  it('should detect submodule imports from groundswell/tools', () => {
    const source = "import { MCPHandler } from 'groundswell/tools';";

    const imports = parseImports(source);

    expect(imports).toContainEqual({
      module: 'groundswell/tools',
      symbols: ['MCPHandler'],
      type: 'named',
    });
  });
});
```

---

## Summary

### Key Takeaways

1. **Use dynamic imports** for runtime import validation
2. **Test all import patterns**: named, namespace, type-only, submodule
3. **Configure decorators properly** in both Vitest and TypeScript
4. **Mock carefully** using `vi.mock()` and `vi.importActual()`
5. **Clean up mocks** using `vi.clearAllMocks()` and `vi.restoreAllMocks()`
6. **Validate ESM requirements**: file extensions, package.json exports
7. **Separate import tests** from functional tests
8. **Use type-safe mocking** with `vi.mocked()`

### Recommended Test Structure

```typescript
// tests/import-validation.test.ts
describe('Import validation', () => {
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

  describe('Types', () => {
    it('should export types', async () => {
      type Agent = import('groundswell').Agent;
      expect(true).toBe(true);
    });
  });

  describe('Decorators', () => {
    it('should import decorators', async () => {
      const { MyDecorator } = await import('groundswell');
      expect(MyDecorator).toBeDefined();
    });
  });
});
```

### Configuration Checklist

- [ ] `vitest.config.ts` has `esbuild.tsconfigRaw` with `experimentalDecorators: true`
- [ ] `tsconfig.json` has `experimentalDecorators: true` and `emitDecoratorMetadata: true`
- [ ] `package.json` has `"type": "module"`
- [ ] `package.json` has proper `exports` field
- [ ] All imports use `.js` extension for relative imports
- [ ] Vitest config has `deps.interopDefault: true`
- [ ] Path aliases are configured correctly

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Vitest Version:** 1.6.1
**TypeScript Version:** 5.2.0+
**Node.js Version:** 20.0.0+
