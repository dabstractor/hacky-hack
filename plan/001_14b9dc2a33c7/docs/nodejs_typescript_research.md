# Node.js 20+ Features and Best Practices for TypeScript Projects (2024-2025)

**Research Date:** 2025-01-12
**Target Node.js Version:** 20.x LTS (Active LTS until April 2026)
**Target TypeScript Version:** 5.2+

## Table of Contents

1. [Key Node.js 20+ Features for TypeScript](#1-key-nodejs-20-features-for-typescript)
2. [Recommended Tooling](#2-recommended-tooling)
3. [Native ESM Support Considerations](#3-native-esm-support-considerations)
4. [Performance Improvements and Best Practices](#4-performance-improvements-and-best-practices)
5. [Configuration Requirements](#5-configuration-requirements)
6. [Official Documentation References](#6-official-documentation-references)

---

## 1. Key Node.js 20+ Features for TypeScript

### 1.1 Stable Built-in Test Runner (`node:test`)

**Feature:** Node.js 20 includes a stable, built-in test runner that eliminates the need for external testing frameworks in many cases.

**Relevance to TypeScript:**
- Works seamlessly with TypeScript when using loaders like `tsx`
- Provides mocking, coverage, and watching capabilities
- Faster than Jest for simple test cases

**Example Usage:**
```typescript
import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { UserService } from './UserService.js';

describe('UserService', () => {
  test('should create user', async () => {
    const service = new UserService();
    const user = await service.create({ name: 'Alice' });
    assert.strictEqual(user.name, 'Alice');
  });
});
```

**Run with:** `node --test` or `tsx --test`

---

### 1.2 Permission Model (Experimental)

**Feature:** Security feature allowing fine-grained control over filesystem, worker, and child process access.

**Relevance to TypeScript:** Critical for agentic systems that execute code with filesystem access.

**Usage:**
```bash
node --experimental-permission --allow-fs-read=./src ./dist/index.js
```

**In TypeScript projects:**
```typescript
// Check permissions in code
if (process.permission.has('fs.read', './src')) {
  // Safe to read
}
```

---

### 1.3 Single Executable Applications

**Feature:** Bundle Node.js applications into single executable binaries.

**Relevance to TypeScript:** Distribute compiled TypeScript apps without requiring Node.js installation.

**Workflow:**
```bash
# Compile TypeScript
tsc

# Create single executable
node --experimental-sea-config sea-config.json
```

**Configuration (`sea-config.json`):**
```json
{
  "main": "./dist/index.js",
  "output": "prp-pipeline"
}
```

---

### 1.4 Import Attributes (formerly Import Assertions)

**Feature:** Enhanced module importing with type assertions.

**Relevance to TypeScript:** Type-safe JSON imports and module loading.

**Example:**
```typescript
// Import JSON with type assertion
import config from './config.json' with { type: 'json' };

// Import with specific format
import data from './data.csv' with { type: 'json' };
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  }
}
```

---

### 1.5 Custom WebSocket Client

**Feature:** Native WebSocket client (experimental in Node.js 20, stable in 21+).

**Relevance to TypeScript:** Real-time communication without external dependencies.

**Example:**
```typescript
import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
  ws.send('Hello from PRP Pipeline');
});
```

---

### 1.6 V8 11.3 Engine Upgrade

**Feature:** Performance improvements through V8 engine enhancements.

**Benefits for TypeScript:**
- Faster compilation and execution
- Better memory management
- Improved garbage collection

---

## 2. Recommended Tooling

### 2.1 TypeScript Execution Tools

#### **tsx (Recommended)**

**Why:** Fastest TypeScript execution using esbuild, zero-config, built-in watch mode.

**Installation:**
```bash
npm install -D tsx
```

**Usage:**
```bash
# Run TypeScript file
tsx src/index.ts

# Watch mode (replaces nodemon)
tsx watch src/index.ts

# Run tests
tsx --test
```

**Package.json scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "tsx --test",
    "build": "tsc"
  }
}
```

---

#### **ts-node (Legacy Alternative)**

**Why:** Traditional TypeScript execution, slower but widely compatible.

**Installation:**
```bash
npm install -D ts-node @types/node
```

**Usage:**
```bash
ts-node src/index.ts
```

**When to use:** Legacy projects requiring specific tsconfig configurations.

---

#### **swc-node / esbuild-register**

**Why:** Extremely fast compilation using SWC or esbuild.

**Installation (swc-node):**
```bash
npm install -D @swc-node/register
```

**Usage:**
```bash
node --loader @swc-node/register src/index.ts
```

**Performance comparison:**
- `tsx`: ~50ms startup (esbuild-based)
- `swc-node`: ~30ms startup (SWC-based)
- `ts-node`: ~500ms startup (tsc-based)

---

### 2.2 Build Tools

#### **tsup (Recommended for TypeScript)**

**Why:** Zero-config TypeScript bundler using esbuild, supports ESM/CJS dual package.

**Installation:**
```bash
npm install -D tsup
```

**Configuration (`tsup.config.ts`):**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
});
```

**Package.json:**
```json
{
  "scripts": {
    "build": "tsup"
  }
}
```

---

#### **esbuild (Ultra-Fast Alternative)**

**Why:** Fastest bundler, minimal configuration.

**Usage:**
```bash
esbuild src/index.ts --bundle --platform=node --target=node20 --outfile=dist/index.js
```

---

#### **unbuild (Modern Alternative)**

**Why:** Opinionated TypeScript build tool with smart defaults.

**Installation:**
```bash
npm install -D unbuild
```

**Configuration (`build.config.ts`):**
```typescript
export default {
  entries: ['src/index'],
  outDir: 'dist',
  declaration: true,
  externals: ['groundswell'],
};
```

---

### 2.3 Development Tools

#### **Watch Mode Replacements for nodemon**

**Option 1: tsx watch (Recommended)**
```bash
tsx watch src/index.ts
```

**Option 2: tsx-dev**
```bash
npm install -D tsx-dev
tsx-dev src/index.ts
```

**Option 3: nodemon + tsx**
```bash
nodemon --exec tsx src/index.ts
```

**Configuration (`nodemon.json`):**
```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "tsx"
}
```

---

### 2.4 Testing Tools

#### **Built-in `node:test` (Recommended for Node.js 20+)**

**Benefits:**
- No external dependencies
- Native TypeScript support with loaders
- Built-in coverage with `--experimental-test-coverage`

**Example:**
```typescript
import { test, describe, mock } from 'node:test';
import assert from 'node:assert';

test('math addition', () => {
  assert.strictEqual(1 + 1, 2);
});
```

**Run with coverage:**
```bash
node --experimental-test-coverage --test
```

---

#### **Vitest (Alternative)**

**Why:** Jest-compatible, faster, ESM-first.

**Installation:**
```bash
npm install -D vitest
```

**Configuration (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

---

#### **Jest (Traditional)**

**Why:** Widely adopted, extensive ecosystem.

**Installation:**
```bash
npm install -D jest @types/jest ts-jest
```

**Configuration (`jest.config.js`):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
```

---

## 3. Native ESM Support Considerations

### 3.1 Package.json Configuration

**For Pure ESM Projects (Recommended):**

```json
{
  "type": "module",
  "exports": "./dist/index.js",
  "imports": {
    "#*": "./dist/*"
  }
}
```

**For Dual Package (CJS + ESM):**

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

---

### 3.2 TypeScript Configuration for ESM

**Modern Configuration (`tsconfig.json`):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "allowImportingTsExtensions": false,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key Options Explained:**

- `module: "NodeNext"`: Best possible ESM support for Node.js
- `moduleResolution: "NodeNext"`: ESM-aware resolution algorithm
- `target: "ES2022"`: Modern JavaScript features (class fields, private methods)
- `allowImportingTsExtensions: false`: Requires `.js` extensions in imports

---

### 3.3 File Extension Requirements

**CRITICAL:** Node.js ESM requires file extensions in import statements.

**Incorrect:**
```typescript
import { UserService } from './UserService';
import config from './config';
```

**Correct:**
```typescript
import { UserService } from './UserService.js';
import config from './config.json' with { type: 'json' };
```

**Best Practice:** Always use `.js` extensions even when importing `.ts` files. TypeScript handles the mapping.

---

### 3.4 Dynamic Import for Conditional Loading

**Use dynamic imports for conditional dependencies:**

```typescript
// Load heavy dependencies only when needed
async function processWithTool() {
  const { heavyLibrary } = await import('./heavy-library.js');
  return heavyLibrary.process();
}
```

---

### 3.5 Import Meta for Module Information

**Replace `__dirname` and `__filename`:**

**Old (CommonJS):**
```typescript
const __filename = __filename;
const __dirname = __dirname;
```

**New (ESM):**
```typescript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**Or use this utility:**
```typescript
// utils/path.ts
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

export const getDirname = (meta: ImportMeta) =>
  dirname(fileURLToPath(meta.url));

// Usage
import { getDirname } from './utils/path.js';
const __dirname = getDirname(import.meta);
```

---

### 3.6 Subpath Exports and Imports

**Package.json exports:**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./utils": "./dist/utils/index.js",
    "./agents": "./dist/agents/index.js",
    "./package.json": "./package.json"
  },
  "imports": {
    "#*": "./src/*"
  }
}
```

**Usage in code:**
```typescript
// Public export
import { Agent } from 'prp-pipeline/agents';

// Internal import (using imports field)
import { config } from '#config.js';
```

---

## 4. Performance Improvements and Best Practices

### 4.1 V8 11.3 Performance Benefits

**Key Improvements:**
- **Maglev JIT Compiler:** New compilation tier between Ignition (baseline) and TurboFan (optimizing)
- **Faster async/await:** Reduced overhead for promise chains
- **Better regular expression performance**
- **Improved memory footprint**

**Impact on TypeScript Projects:**
- 10-20% faster startup times
- Reduced memory usage for large codebases
- Better performance for I/O-bound operations

---

### 4.2 Module Loading Optimization

**Use Native ESM Over CommonJS:**
```typescript
// Faster
import { fastify } from 'fastify';

// Slower (requires transpilation)
const { fastify } = require('fastify');
```

**Enable Synthetic Default Imports:**
```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

---

### 4.3 Lazy Loading Strategies

**Dynamic Imports for Heavy Dependencies:**
```typescript
// Agent Runtime - Lazy load expensive LLM libraries
async function createAgent(model: string) {
  if (model.includes('claude')) {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    return new Anthropic();
  }
  // ... other providers
}
```

**Re-export Pattern:**
```typescript
// Instead of importing everything at once
export * from './agents/ArchitectAgent.js';
export * from './agents/ResearcherAgent.js';

// Import specific agents when needed
import { ArchitectAgent } from './agents/index.js';
```

---

### 4.4 TypeScript Compiler Optimization

**Enable Incremental Compilation:**
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

**Use Project References for Monorepos:**
```json
{
  "compilerOptions": {
    "composite": true,
    "references": [
      { "path": "./packages/core" },
      { "path": "./packages/agents" }
    ]
  }
}
```

**Skip Type Checking in Development:**
```json
{
  "scripts": {
    "dev": "tsc --noEmit && tsx watch src/index.ts",
    "dev:fast": "tsx watch src/index.ts"
  }
}
```

---

### 4.5 Build-Time Optimization

**Use esbuild or swc for Faster Builds:**
```bash
# Instead of tsc (slow)
tsc

# Use esbuild (10-100x faster)
esbuild src/*.ts --bundle --platform=node --outdir=dist
```

**Parallel Compilation:**
```bash
# Use tsparticles for parallel compilation
npx tsc -p tsconfig.json --incremental
```

---

### 4.6 Memory Management

**Avoid Memory Leaks in Long-Running Processes:**

```typescript
// Bad: Global event emitters
globalEmitter.on('event', handler); // Never removed

// Good: Scoped event emitters
class AgentRuntime {
  private emitter = new EventEmitter();

  execute() {
    const handler = () => { /* ... */ };
    this.emitter.once('event', handler);
  }
}
```

**Stream Large Files:**
```typescript
// Bad: Load entire file into memory
const content = await fs.readFile('large-file.json');
const data = JSON.parse(content);

// Good: Stream processing
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

async function* processLargeFile(path: string) {
  const fileStream = createReadStream(path);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    yield JSON.parse(line);
  }
}
```

---

### 4.7 Clustering for CPU-Bound Tasks

**Use Worker Threads for TypeScript Compilation:**

```typescript
// build.worker.ts
import { parentPort } from 'worker_threads';
import { build } from './build.js';

parentPort?.on('message', (config) => {
  build(config).then(result => {
    parentPort?.postMessage({ type: 'done', result });
  });
});
```

---

## 5. Configuration Requirements

### 5.1 Minimal package.json for Node.js 20 + TypeScript

```json
{
  "name": "prp-pipeline",
  "version": "0.1.0",
  "type": "module",
  "description": "Autonomous PRP Development Pipeline",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "test": "node --test",
    "test:coverage": "node --experimental-test-coverage --test",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo"
  },
  "dependencies": {
    "groundswell": "link:../groundswell"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.1.0"
  },
  "exports": "./dist/index.js",
  "imports": {
    "#*": "./src/*"
  }
}
```

---

### 5.2 Complete tsconfig.json for Node.js 20

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": false,
    "noEmit": false,
    "importHelpers": true,
    "newLine": "lf",

    // Interop Constraints
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,

    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,

    // Completeness
    "skipDefaultLibCheck": true,

    // Projects
    "incremental": true,
    "composite": true,

    // Advanced
    "allowImportingTsExtensions": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

---

### 5.3 ESLint Configuration (`.eslintrc.json`)

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "no-console": "off"
  },
  "env": {
    "node": true,
    "es2022": true
  }
}
```

---

### 5.4 Prettier Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

### 5.5 .gitignore for TypeScript Projects

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
.cache/
```

---

## 6. Official Documentation References

### 6.1 Node.js 20 Release Notes

**Primary URL:** https://nodejs.org/en/blog/release/v20.0.0

**Key Sections:**
- [V8 11.3](https://nodejs.org/en/blog/release/v20.0.0#v8-11-3)
- [Permission Model](https://nodejs.org/en/blog/release/v20.0.0#permission-model)
- [Single Executable Applications](https://nodejs.org/en/blog/release/v20.0.0#single-executable-applications)
- [Test Runner](https://nodejs.org/en/blog/release/v20.0.0#stable-test-runner)
- [Import Attributes](https://nodejs.org/en/blog/release/v20.0.0#import-attributes)

**Latest Node.js 20.x Release Notes:** https://nodejs.org/en/blog/release/v20.11.1

---

### 6.2 Node.js ESM Documentation

**Primary URL:** https://nodejs.org/api/esm.html

**Key Sections:**
- [Introduction to ESM](https://nodejs.org/api/esm.html#introduction)
- [Packages](https://nodejs.org/api/esm.html#packages)
- [Import Attributes](https://nodejs.org/api/esm.html#import-attributes)
- [Import Meta](https://nodejs.org/api/esm.html#import-meta)
- [Interoperability with CommonJS](https://nodejs.org/api/esm.html#interoperability-with-commonjs)

**Subpath Exports:** https://nodejs.org/api/packages.html#subpath-exports

**Subpath Imports:** https://nodejs.org/api/packages.html#subpath-imports

---

### 6.3 TypeScript + Node.js Integration

**TypeScript Handbook:** https://www.typescriptlang.org/docs/handbook/modules/theory.html

**Key TypeScript Documentation:**
- [Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution-strategies)
- [NodeNext Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#nodenext)
- [Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

### 6.4 Node.js Test Runner Documentation

**Primary URL:** https://nodejs.org/api/test.html

**Key Sections:**
- [Getting Started](https://nodejs.org/api/test.html#getting-started)
- [Mocking](https://nodejs.org/api/test.html#mocking)
- [Coverage](https://nodejs.org/api/test.html#collecting-code-coverage)

---

### 6.5 Additional Resources

**Node.js 20 Documentation:** https://nodejs.org/docs/latest-v20.x/api/

**TypeScript 5.3 Release Notes:** https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/

**tsx Documentation:** https://tsx.is/

**esbuild Documentation:** https://esbuild.github.io/

---

## 7. Best Practices Summary

### 7.1 Project Initialization Checklist

- [ ] Set `type: "module"` in package.json
- [ ] Configure `tsconfig.json` with `module: "NodeNext"`
- [ ] Install `tsx` for development execution
- [ ] Enable incremental compilation
- [ ] Configure ESLint and Prettier
- [ ] Set up native `node:test` for testing
- [ ] Use `.js` extensions in all imports
- [ ] Replace `__dirname`/`__filename` with `import.meta.url`

---

### 7.2 Common Pitfalls to Avoid

1. **Missing File Extensions:** ESM requires `.js` extensions in imports
2. **Dual Module Hazards:** Avoid mixing CJS and ESM in the same project
3. **TypeScript Configuration:** Don't use `module: "commonjs"` with ESM
4. **Import Assertions:** Use `with { type: 'json' }` syntax, not `assert`
5. **Async/Await in Top-Level:** Ensure `target: "ES2022"` for top-level await

---

### 7.3 Performance Checklist

- [ ] Use `tsx` instead of `ts-node` for faster execution
- [ ] Enable incremental compilation
- [ ] Use dynamic imports for heavy dependencies
- [ ] Stream large files instead of loading into memory
- [ ] Enable source maps for debugging
- [ ] Use native `node:test` instead of Jest for simpler test suites

---

## 8. Migration Guide from CommonJS to ESM

### 8.1 Step-by-Step Migration

**Step 1: Update package.json**
```json
{
  "type": "module"
}
```

**Step 2: Update import statements**
```typescript
// Before
const fs = require('fs');
const { promisify } = require('util');

// After
import fs from 'node:fs';
import { promisify } from 'node:util';
```

**Step 3: Add file extensions**
```typescript
// Before
import { config } from './config';

// After
import { config } from './config.js';
```

**Step 4: Replace CommonJS globals**
```typescript
// Before
const __dirname = __dirname;
const __filename = __filename;

// After
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## 9. Tool-Specific Recommendations for PRP Pipeline

### 9.1 Recommended Stack

**Core:**
- Node.js 20 LTS
- TypeScript 5.3+
- tsx (development execution)

**Building:**
- tsup (for dual-package publishing)
- or esbuild (for internal tools)

**Testing:**
- Native `node:test` (simple tests)
- Vitest (if mocking is complex)

**Linting:**
- ESLint + @typescript-eslint
- Prettier for formatting

---

### 9.2 Package.json Scripts for PRP Pipeline

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsup",
    "test": "node --test",
    "test:watch": "node --test --watch",
    "test:coverage": "node --experimental-test-coverage --test",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo"
  }
}
```

---

**End of Research Document**

**Generated:** 2025-01-12
**Context:** PRP Development Pipeline (hacky-hack)
**Target Implementation:** Node.js 20+ TypeScript + Groundswell
