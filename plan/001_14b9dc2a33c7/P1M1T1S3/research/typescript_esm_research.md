# TypeScript ES Modules (ESM) with Local npm Packages

## Research Document

**Date**: 2025-01-12
**Subject**: TypeScript ESM configuration for monorepo/local package development
**Target**: TypeScript 5.2+ with Node.js 20+ using NodeNext module resolution

---

## Table of Contents

1. [moduleResolution: NodeNext](#1-moduleresolution-nodenext)
2. [ESM Imports](#2-esm-imports)
3. [package.json exports](#3-packagejson-exports)
4. [type Field](#4-type-field)
5. [Build Considerations](#5-build-considerations)
6. [Practical Examples](#6-practical-examples)
7. [References](#7-references)

---

## 1. moduleResolution: NodeNext

### Overview

`moduleResolution: "NodeNext"` is TypeScript's module resolution strategy that aligns with Node.js's native ECMAScript Module (ESM) support, introduced in Node.js 12.20+ and stabilized in Node.js 20+. This setting requires TypeScript 4.7+.

### How It Works

NodeNext resolution uses Node.js's hybrid module system, where:
- **Package mode** is determined by the nearest `package.json` with a `type` field
- **File extensions** are required for ESM imports (`.js`, `.mjs`, or `.mts`)
- **Conditional exports** from `package.json` are respected

### Resolution Algorithm

1. **Check package type**: TypeScript looks for the nearest `package.json` to determine if the package is ESM (`"type": "module"`) or CommonJS (no type field or `"type": "commonjs"`)

2. **File extension requirements**:
   - **ESM packages**: Must include file extensions in imports
   - **CommonJS packages**: Extensions optional (Node.js legacy behavior)

3. **Extension mapping**:
   - `.ts` → `.js` at runtime
   - `.mts` → `.mjs` (ESM-specific)
   - `.cts` → `.cjs` (CommonJS-specific)
   - `.d.mts` → `.d.mjs` (type declarations for ESM)

### Configuration

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true
  }
}
```

**Critical requirements**:
- `module: "NodeNext"` must be paired with `moduleResolution: "NodeNext"`
- `target: "ES2022"` or later for full ESM support
- `esModuleInterop: true` for interoperability with CommonJS packages

### Package Detection Example

```
project/
├── package.json          ← "type": "module"
├── src/
│   ├── index.ts          ← Treated as ESM
│   └── utils/
│       └── helper.ts     ← Treated as ESM
└── legacy/
    └── package.json      ← "type": "commonjs" (or no type field)
    └── old-code.ts       ← Treated as CommonJS
```

---

## 2. ESM Imports

### Correct Syntax for Local Packages

When importing from a local npm package (e.g., `groundswell`) in a monorepo or workspace:

```typescript
// ✅ CORRECT - Named import from package
import { Workflow } from 'groundswell';
import { Agent, Task } from 'groundswell/core';

// ✅ CORRECT - Default import (if package exports default)
import Groundswell from 'groundswell';

// ✅ CORRECT - Namespace import
import * as Groundswell from 'groundswell';

// ✅ CORRECT - Subpath imports
import { Builder } from 'groundswell/builders';
import { LLMAdapter } from 'groundswell/adapters/llm';

// ❌ INCORRECT - Missing extension for relative paths (not applicable for package imports)
import { helper } from './utils';  // Error in ESM
import { helper } from './utils.js';  // Correct for relative imports

// ❌ INCORRECT - Require statements (CommonJS)
const { Workflow } = require('groundswell');  // Won't work in ESM
```

### Package Import Rules

1. **No file extensions for package imports**:
   ```typescript
   import { Workflow } from 'groundswell';  // ✅ Correct
   import { Workflow } from 'groundswell/index.js';  // ❌ Unnecessary
   ```

2. **Subpath imports must be defined in exports**:
   ```typescript
   import { Builder } from 'groundswell/builders';  // Only if package.json exports allow it
   ```

3. **Type-only imports** (for types only):
   ```typescript
   import type { WorkflowConfig } from 'groundswell';
   import { Workflow } from 'groundswell';  // Runtime import
   ```

### Relative Path Extensions

When using relative paths within the same package, file extensions are **required** in ESM:

```typescript
// Within the same package
import { localHelper } from './utils/helper.js';  // ✅ Required .js extension
import { localHelper } from './utils/helper';     // ❌ Error in ESM
import { localHelper } from './utils/helper.ts';  // ❌ Wrong extension (use .js)
```

**Why `.js` instead of `.ts`?**
TypeScript compiles `.ts` to `.js`, so import paths reference the **output** files, not source files.

---

## 3. package.json exports

### Overview

The `exports` field in `package.json` controls:
- Which files can be imported from a package
- How they can be imported (conditional exports)
- Type definition locations for TypeScript
- Module format (ESM vs CommonJS)

### Basic Exports

```json
{
  "name": "groundswell",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "exports": "./dist/index.js"
}
```

### Conditional Exports

Conditional exports allow different entry points based on import type:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  }
}
```

**Conditional export keys**:
- `types`: TypeScript type definitions (highest priority for TypeScript)
- `import`: ESM imports (import statements)
- `require`: CommonJS imports (require())
- `default`: Fallback for unknown conditions
- `node`: Node.js-specific condition
- `browser`: Browser-specific condition

### Subpath Exports

Define specific entry points for deep imports:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./core": {
      "types": "./dist/core.d.ts",
      "import": "./dist/core.js"
    },
    "./builders": {
      "types": "./dist/builders.d.ts",
      "import": "./dist/builders.js"
    },
    "./adapters/*": "./dist/adapters/*.js"
  }
}
```

**Usage**:
```typescript
import { Agent } from 'groundswell/core';
import { WorkflowBuilder } from 'groundswell/builders';
import { OpenAIAdapter } from 'groundswell/adapters/openai';
```

### Directory Exports

Export entire directories with patterns:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./utils/*": "./dist/utils/*.js",
    "./components/*.js": "./dist/components/*.js"
  }
}
```

### Exports for Local Package (groundswell)

For the `groundswell` package in a monorepo:

```json
{
  "name": "groundswell",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core.d.ts",
      "import": "./dist/core.js"
    },
    "./builders": {
      "types": "./dist/builders.d.ts",
      "import": "./dist/builders.js"
    },
    "./adapters": {
      "types": "./dist/adapters.d.ts",
      "import": "./dist/adapters.js"
    },
    "./types": {
      "types": "./dist/types.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

### Exports Validation

TypeScript validates imports against the `exports` field:

```typescript
// ✅ Allowed - defined in exports
import { Workflow } from 'groundswell';
import { Agent } from 'groundswell/core';

// ❌ Error - not defined in exports
import { Internal } from 'groundswell/internal/stuff';
```

This provides **package encapsulation**, preventing imports of private implementation details.

---

## 4. type Field

### Overview

The `type` field in `package.json` determines how Node.js and TypeScript treat `.js` files:

```json
{
  "type": "module"    // Treat .js as ESM
}
```

```json
{
  "type": "commonjs"  // Treat .js as CommonJS (legacy)
}
```

### Impact on Module Resolution

**When `type: "module"`**:
- `.js` files are treated as ESM
- `.mjs` files are always ESM
- `.cjs` files are always CommonJS
- Imports **must** include extensions for relative paths
- `require()` is not available
- `__dirname` and `__filename` are not available (use `import.meta.url`)

**When `type: "commonjs"` or omitted**:
- `.js` files are treated as CommonJS
- `.cjs` files are always CommonJS
- `.mjs` files are always ESM
- `import`/`export` statements require `.mjs` extension

### Package.json Type Configuration

**Root package (hacky-hack)**:
```json
{
  "name": "hacky-hack",
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Local package (groundswell)**:
```json
{
  "name": "groundswell",
  "version": "0.1.0",
  "type": "module"
}
```

### TypeScript File Extensions

| Source File | Output File | Module Type | Import Syntax |
|------------|-------------|-------------|---------------|
| `.ts` | `.js` | Inherits from `type` field | `from './file.js'` |
| `.mts` | `.mjs` | Always ESM | `from './file.mjs'` |
| `.cts` | `.cjs` | Always CommonJS | `from './file.cjs'` |
| `.d.ts` | N/A | Type declaration | N/A |
| `.d.mts` | N/A | ESM types | N/A |
| `.d.cts` | N/A | CommonJS types | N/A |

### Best Practice

**Use `.ts` source files** and let the `type` field control the output:
- ESM packages: `type: "module"` + `.ts` sources → `.js` ESM output
- CommonJS packages: `type: "commonjs"` + `.ts` sources → `.js` CommonJS output

Only use `.mts`/`.cts` when you need to mix module formats within a single project.

### Import Meta URL

In ESM, use `import.meta.url` instead of `__dirname`/`__filename`:

```typescript
// ESM approach
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usage
const configPath = new URL('./config.json', import.meta.url);
```

---

## 5. Build Considerations

### TypeScript Compiler (tsc) with Linked Packages

When building a monorepo with local packages:

#### 1. Package Linking

**Using npm workspaces** (recommended):
```json
// root package.json
{
  "name": "hacky-hack",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

```json
// packages/groundswell/package.json
{
  "name": "groundswell",
  "version": "0.1.0"
}
```

**Using npm link**:
```bash
cd packages/groundswell
npm link

cd ../../
npm link groundswell
```

#### 2. Build Order

Build dependencies first:
```bash
# 1. Build local package
cd packages/groundswell
npm run build

# 2. Build consuming package
cd ../../
npm run build
```

#### 3. TypeScript Project References

Use TypeScript project references for proper incremental compilation:

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/groundswell" },
    { "path": "./packages/app" }
  ]
}
```

```json
// packages/groundswell/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```json
// packages/app/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../groundswell" }
  ],
  "include": ["src/**/*"]
}
```

#### 4. Declaration Files

TypeScript generates `.d.ts` files automatically. Ensure they're emitted:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}
```

**Output structure**:
```
dist/
├── index.js          ← JavaScript output
├── index.d.ts        ← TypeScript declarations
├── index.d.ts.map    ← Source map for declarations
├── core.js
├── core.d.ts
└── ...
```

#### 5. package.json Build Outputs

Configure `package.json` to point to built files:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

#### 6. Watch Mode for Development

For development with hot reloading:

```bash
# In groundswell package
cd packages/groundswell
npm run build -- --watch

# In app package (separate terminal)
cd ../../
npm run dev
```

**Or use a tool like `tsc-alias`** for path preservation:
```bash
npm install --save-dev tsc-alias
```

```json
{
  "scripts": {
    "build": "tsc && tsc-alias",
    "build:watch": "tsc -w & tsc-alias -w"
  }
}
```

### Verification Checklist

Before using local packages in production:

- [ ] Package has `type: "module"` in package.json
- [ ] tsconfig.json has `module: "NodeNext"` and `moduleResolution: "NodeNext"`
- [ ] package.json has correct `exports` field
- [ ] Build outputs include `.js` and `.d.ts` files
- [ ] Imports use correct syntax (no extensions for packages, extensions for relative paths)
- [ ] Local package is built before consuming package
- [ ] `node_modules` linked package points to built `dist/` folder

---

## 6. Practical Examples

### Example 1: Simple Local Package Import

**Project structure**:
```
hacky-hack/
├── packages/
│   ├── groundswell/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── app/
│       ├── src/
│       │   └── main.ts
│       ├── package.json
│       └── tsconfig.json
└── package.json
```

**groundswell/package.json**:
```json
{
  "name": "groundswell",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**groundswell/src/index.ts**:
```typescript
export class Workflow {
  constructor(public name: string) {}

  execute() {
    console.log(`Executing workflow: ${this.name}`);
  }
}
```

**app/src/main.ts**:
```typescript
import { Workflow } from 'groundswell';

const workflow = new Workflow('Test Workflow');
workflow.execute();
```

**Build and run**:
```bash
cd packages/groundswell
npm run build

cd ../app
npm run build
node dist/main.js
```

### Example 2: Subpath Exports

**groundswell/package.json**:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core.js",
    "./builders": "./dist/builders.js"
  }
}
```

**app/src/main.ts**:
```typescript
import { Workflow } from 'groundswell';
import { Agent } from 'groundswell/core';
import { Builder } from 'groundswell/builders';
```

### Example 3: Type-Only Imports

**groundswell/types.ts**:
```typescript
export interface WorkflowConfig {
  name: string;
  maxRetries?: number;
}
```

**app/src/main.ts**:
```typescript
import type { WorkflowConfig } from 'groundswell/types';
import { Workflow } from 'groundswell';

const config: WorkflowConfig = { name: 'Test' };
const workflow = new Workflow(config);
```

### Example 4: Mixed Relative and Package Imports

**app/src/index.ts**:
```typescript
// Package import (no extension)
import { Workflow } from 'groundswell';

// Relative import (extension required)
import { localHelper } from './utils/helper.js';

// Type-only relative import
import type { LocalConfig } from './config.js';
```

---

## 7. References

### Official Documentation

1. **TypeScript Module Resolution**
   - URL: https://www.typescriptlang.org/tsconfig#moduleResolution
   - URL: https://www.typescriptlang.org/docs/handbook/modules/theory.html
   - URL: https://www.typescriptlang.org/docs/handbook/modules/reference.html
   - Covers: NodeNext, bundler, classic resolution strategies

2. **TypeScript 5.2 Release Notes**
   - URL: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
   - Covers: Improvements to NodeNext, ESM handling

3. **Node.js ES Modules**
   - URL: https://nodejs.org/api/esm.html
   - URL: https://nodejs.org/api/packages.html
   - Covers: `type` field, package imports, subpath imports

4. **Node.js Package Exports**
   - URL: https://nodejs.org/api/packages.html#exports
   - URL: https://nodejs.org/api/packages.html#subpath-exports
   - Covers: Conditional exports, subpath patterns

5. **package.json Exports**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#exports
   - Covers: npm-specific export behavior

### Community Resources

6. **TypeScript Deep Dive - Modules**
   - URL: https://basarat.gitbook.io/typescript/type-system/modules
   - Covers: Module systems, best practices

7. **Node.js ESM FAQ**
   - URL: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
   - Covers: Common ESM pitfalls and solutions

8. **Using TypeScript with Node.js ESM**
   - URL: https://github.com/microsoft/TypeScript/wiki/Using-TypeScript-with-Node.js---ECMAScript-Modules
   - Covers: Official TypeScript wiki on ESM setup

---

## Key Takeaways

1. **Always use** `module: "NodeNext"` + `moduleResolution: "NodeNext"` for Node.js 20+ ESM projects
2. **Set** `type: "module"` in package.json for both root and local packages
3. **Use** `exports` field in package.json to control public API and enable subpath imports
4. **Include** file extensions for relative imports, omit for package imports
5. **Build** local packages before consuming packages (use project references or build scripts)
6. **Verify** .d.ts files are generated and correctly referenced in package.json

---

**Research Completed**: 2025-01-12
**TypeScript Version**: 5.2+
**Node.js Version**: 20.0.0+
