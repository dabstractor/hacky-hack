# Development Tool Configuration Analysis

## Overview

Analysis of ESLint, Prettier, Vitest, and TypeScript configurations for the hacky-hack project. All configurations are optimized for ESM TypeScript with strict quality standards.

---

## ESLint Configuration (.eslintrc.json)

### Parser Settings

- **Parser**: `@typescript-eslint/parser`
- **ECMA Version**: 2022
- **Source Type**: Module (ESM)
- **Project**: References `./tsconfig.json` for type-aware linting

### Extended Configurations

- `eslint:recommended` - Base ESLint rules
- `plugin:@typescript-eslint/recommended` - TypeScript-specific rules
- `plugin:prettier/recommended` - Prettier integration

### Key Rules

| Rule                                            | Level | Configuration                                              |
| ----------------------------------------------- | ----- | ---------------------------------------------------------- |
| `prettier/prettier`                             | Error | Enforces Prettier formatting                               |
| `@typescript-eslint/no-unused-vars`             | Error | Ignores `_` prefixed variables/args, ignores rest siblings |
| `@typescript-eslint/no-explicit-any`            | Warn  | Allows `any` in tests                                      |
| `@typescript-eslint/no-floating-promises`       | Error | Prevents unhandled promises                                |
| `@typescript-eslint/no-misused-promises`        | Error | Prevents promise misuse                                    |
| `@typescript-eslint/strict-boolean-expressions` | Warn  | Strict boolean checks                                      |
| `no-console`                                    | Warn  | Allows `console.warn` and `console.error` only             |

### File Patterns

- **Test Override**: Relaxes rules for `**/*.test.ts`, `**/*.spec.ts`, `tests/**/*.ts`
  - Disables `no-explicit-any` and `no-non-null-assertion` in tests
- **Ignored**: `node_modules/`, `dist/`, `coverage/`, `*.config.js`, `*.config.ts`

### Environment

- Node.js environment enabled
- ES2022 features available

---

## Prettier Configuration (.prettierrc)

### Code Style Settings

| Setting           | Value                         |
| ----------------- | ----------------------------- |
| Semi-colons       | `true` (required)             |
| Trailing Commas   | `es5` (ES5-compatible)        |
| Quotes            | Single quotes                 |
| Print Width       | 80 characters                 |
| Tab Width         | 2 spaces                      |
| Tabs              | `false` (uses spaces)         |
| Arrow Parentheses | `avoid` (omits when possible) |
| End of Line       | `lf` (Unix-style)             |

---

## Vitest Configuration (vitest.config.ts)

### Test Environment

- **Environment**: Node.js
- **Globals**: Enabled (describes, it, expect available globally)
- **Include**: `tests/**/*.{test,spec}.ts`
- **Exclude**: `**/dist/**`, `**/node_modules/**`
- **Module Interop**: Enabled (`interopDefault: true`)

### Coverage Configuration

| Setting        | Value                                             |
| -------------- | ------------------------------------------------- |
| Provider       | v8                                                |
| Reporters      | text, json, html                                  |
| Include        | `src/**/*.ts`                                     |
| Exclude        | Test files, node_modules                          |
| **Thresholds** | **100%** (statements, branches, functions, lines) |

### Path Aliases

| Alias         | Target                         |
| ------------- | ------------------------------ |
| `@`           | `./src`                        |
| `#`           | `./src/agents`                 |
| `groundswell` | `../groundswell/dist/index.js` |

### ESBuild Settings

- Target: `esnext`
- Experimental decorators: Enabled
- Decorator metadata: Enabled

---

## TypeScript Configuration (tsconfig.json)

### Compiler Options

| Option                             | Value            | Purpose                             |
| ---------------------------------- | ---------------- | ----------------------------------- |
| `target`                           | `ES2022`         | Modern JavaScript output            |
| `module`                           | `NodeNext`       | ESM support with Node.js resolution |
| `moduleResolution`                 | `NodeNext`       | Native ESM resolution               |
| `lib`                              | `ES2022`         | ES2022 standard library             |
| `strict`                           | `true`           | All strict type-checking enabled    |
| `esModuleInterop`                  | `true`           | ESM/CommonJS interop                |
| `skipLibCheck`                     | `true`           | Skip .d.ts checking                 |
| `forceConsistentCasingInFileNames` | `true`           | Case-sensitive imports              |
| `outDir`                           | `./dist`         | Compiled output directory           |
| `resolveJsonModule`                | `true`           | JSON module imports                 |
| `types`                            | `vitest/globals` | Vitest global types                 |

### File Patterns

- **Include**: `src/**/*`, `tests/**/*`
- **Exclude**: `node_modules`, `dist`

---

## Key Observations

### 1. ESM-First Architecture

- All tools configured for ES modules (`sourceType: module`, `module: NodeNext`)
- Native ESM resolution with path aliases
- Decorator support enabled for potential framework use

### 2. Strict Quality Standards

- 100% test coverage requirement across all metrics
- Strict TypeScript mode enabled
- Prettier enforced as ESLint error
- Promise safety enforced (floating/misused promises)

### 3. Test-Specific Relaxations

- Tests allow `any` types and non-null assertions
- Console warnings/errors permitted (not info/logs)
- Test files excluded from coverage calculations

### 4. Modern JavaScript Target

- ES2022 target across all tools
- Latest Node.js module resolution
- Experimental decorators available

---

## Configuration Interdependencies

1. **TypeScript → ESLint**: ESLint references `tsconfig.json` for type-aware rules
2. **ESLint → Prettier**: Prettier runs as ESLint rule for unified formatting
3. **TypeScript → Vitest**: Vitest uses TS compiler options via esbuild
4. **Path Aliases**: Consistent `@` and `#` aliases used across Vitest resolution

---

## File Locations

- ESLint: `/home/dustin/projects/hacky-hack/.eslintrc.json`
- Prettier: `/home/dustin/projects/hacky-hack/.prettierrc`
- Vitest: `/home/dustin/projects/hacky-hack/vitest.config.ts`
- TypeScript: `/home/dustin/projects/hacky-hack/tsconfig.json`
