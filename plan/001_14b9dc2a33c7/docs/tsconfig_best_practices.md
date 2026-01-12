# TypeScript 5.2+ tsconfig Best Practices for Node.js 20+

**Research Date:** January 12, 2026

## Critical Compiler Options for Groundswell Project

### Required Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Groundswell Decorator Requirements

Groundswell uses these decorators:

- `@Step(opts)` - Mark methods as workflow steps
- `@Task(opts)` - Mark methods that return child workflows
- `@ObservedState(meta)` - Mark fields for state snapshots

These require:

- `experimentalDecorators: true`
- `emitDecoratorMetadata: true`

### Runtime Dependency

```bash
npm install reflect-metadata
```

Entry point must import:

```typescript
import 'reflect-metadata';
```

## Module Resolution: NodeNext

### Key Points

- Respects `package.json "type": "module"`
- Requires `.js` extensions in ESM imports
- Converts `.ts` → `.js` during emit

### Extension Requirements

```typescript
// Source file: src/utils/helper.ts

// CORRECT - Use .js extension
import { foo } from './utils/helper.js';

// WRONG - Missing extension
import { foo } from './utils/helper';
```

## Strict Mode Settings

### Recommended Configuration

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

## Common Gotchas

### 1. Extension Mismatch

ESM requires file extensions in imports.

### 2. Decorator Import Order

```typescript
// MUST be first import
import 'reflect-metadata';

// Then other imports
import { something } from './module';
```

### 3. package.json Type Field

Must have `"type": "module"` for ESM.

## External References

- [TypeScript 5.2 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Node.js ESM](https://nodejs.org/api/esm.html)
