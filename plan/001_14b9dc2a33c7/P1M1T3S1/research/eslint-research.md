# ESLint Configuration Research for TypeScript Projects

> Research compiled on: 2026-01-12
> Target Project Configuration: TypeScript 5.2+, ES2022, NodeNext, strict mode
> Project Path: `/home/dustin/projects/hacky-hack`

---

## 1. Official Documentation URLs

### Primary TypeScript-ESLint Resources

| Resource                                 | URL                                                         | Purpose                                             |
| ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| **Main TypeScript-ESLint Documentation** | https://typescript-eslint.io/                               | Central hub for all TypeScript-ESLint documentation |
| **Getting Started Guide**                | https://typescript-eslint.io/getting-started/               | Installation and initial setup instructions         |
| **Parser Documentation**                 | https://typescript-eslint.io/packages/parser/               | @typescript-eslint/parser configuration options     |
| **ESLint Plugin Rules**                  | https://typescript-eslint.io/rules/                         | Complete list of TypeScript-specific ESLint rules   |
| **Type-Aware Linting Guide**             | https://typescript-eslint.io/getting-started/typed-linting/ | Configuring type-aware linting with tsconfig        |
| **Migration Guide**                      | https://typescript-eslint.io/migration/                     | Migrating from TSLint or older versions             |
| **Troubleshooting**                      | https://typescript-eslint.io/troubleshooting/               | Common issues and solutions                         |
| **GitHub Repository**                    | https://github.com/typescript-eslint/typescript-eslint      | Source code, issues, and contributions              |

### ESLint Flat Config (ESLint 9+)

| Resource                                | URL                                                                  | Purpose                                   |
| --------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| **Flat Config Migration Guide**         | https://eslint.org/docs/latest/use/configure/configuration-files-new | New flat config format (eslint.config.js) |
| **TypeScript-ESLint Flat Config Guide** | https://typescript-eslint.io/getting-started/flat-config             | Flat config setup for TypeScript projects |

---

## 2. Recommended ESLint Configuration for TypeScript 5.2+

### Current Project Context

Based on the project's `tsconfig.json`:

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
    "outDir": "./dist",
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["vitest/globals"]
  }
}
```

### Installation Commands

```bash
# Core ESLint and TypeScript-ESLint packages
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# For ESLint 9+ flat config (recommended for new projects)
npm install --save-dev eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin typescript-eslint

# Optional: Additional useful plugins
npm install --save-dev eslint-plugin-import eslint-config-prettier eslint-plugin-prettier
```

### Configuration Option A: Legacy .eslintrc.json (ESLint 8)

**File:** `/home/dustin/projects/hacky-hack/.eslintrc.json`

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "tsconfigRootDir": "./"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    // TypeScript-specific rules
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",

    // Override problematic rules from eslint:recommended
    "no-undef": "off", // TypeScript handles this better
    "no-unused-vars": "off", // Use @typescript-eslint/no-unused-vars instead

    // Code style rules
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["node_modules/", "dist/", "coverage/", "*.js", "*.d.ts"]
}
```

### Configuration Option B: Flat Config (ESLint 9+) - RECOMMENDED

**File:** `/home/dustin/projects/hacky-hack/eslint.config.js`

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Override problematic rules
      'no-undef': 'off', // TypeScript handles this better
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead

      // Code style rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '*.js', '*.d.ts'],
  }
);
```

**Note:** For ESLint 9+ with TypeScript 5.2+, you can use the new `typescript-eslint` package (v8+) which simplifies configuration:

```bash
npm install --save-dev typescript-eslint
```

### Configuration Option C: Flat Config with Modern Package (ESLint 9+ v8)

**File:** `/home/dustin/projects/hacky-hack/eslint.config.mjs`

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // Auto-discovers tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  },
];
```

### Minimal Configuration (Quick Start)

If you want to start with a minimal setup and add rules gradually:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:@typescript-eslint/recommended"],
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {}
}
```

---

## 3. Key ESLint Rules for TypeScript Projects

### Critical Type-Safety Rules

| Rule                                            | Severity | Purpose                                      | Example                                |
| ----------------------------------------------- | -------- | -------------------------------------------- | -------------------------------------- |
| `@typescript-eslint/no-floating-promises`       | error    | Catch unhandled Promise rejections           | `fetch(url);` (missing await)          |
| `@typescript-eslint/no-misused-promises`        | error    | Prevent using promises in non-async contexts | `array.some(async () => ...)`          |
| `@typescript-eslint/await-thenable`             | error    | Only await actual Promises                   | `await 5;`                             |
| `@typescript-eslint/strict-boolean-expressions` | error    | Enforce strict boolean checks                | `if (value)` when value could be falsy |
| `@typescript-eslint/no-unsafe-assignment`       | error    | Catch unsafe type assignments                | `const str: string = value as any;`    |
| `@typescript-eslint/no-unsafe-call`             | error    | Catch unsafe function calls                  | `(value as any).method();`             |
| `@typescript-eslint/no-unsafe-member-access`    | error    | Catch unsafe property access                 | `(obj as any).property;`               |
| `@typescript-eslint/no-unsafe-return`           | error    | Catch unsafe return values                   | `return value as any;`                 |

### Code Quality Rules

| Rule                                                | Severity | Purpose                                       | Default Setting              |
| --------------------------------------------------- | -------- | --------------------------------------------- | ---------------------------- |
| `@typescript-eslint/no-unused-vars`                 | error    | Detect unused variables, functions, imports   | Recommended                  |
| `@typescript-eslint/no-explicit-any`                | warn     | Discourage `any` type usage                   | Recommended                  |
| `@typescript-eslint/explicit-function-return-type`  | off      | Require explicit return types                 | Off (inference is preferred) |
| `@typescript-eslint/explicit-module-boundary-types` | off      | Require explicit types for exported functions | Off                          |
| `@typescript-eslint/no-non-null-assertion`          | warn     | Warn about `!` operator                       | Recommended                  |
| `@typescript-eslint/prefer-nullish-coalescing`      | warn     | Prefer `??` over `\|\|`                       | Stylistic                    |
| `@typescript-eslint/prefer-optional-chain`          | warn     | Prefer optional chaining `?.`                 | Stylistic                    |
| `@typescript-eslint/prefer-readonly`                | warn     | Use readonly for immutable properties         | Stylistic                    |
| `@typescript-eslint/consistent-type-imports`        | warn     | Use `import type` for type-only imports       | Stylistic                    |

### Code Style Rules

| Rule                                             | Severity | Purpose                                        |
| ------------------------------------------------ | -------- | ---------------------------------------------- |
| `@typescript-eslint/consistent-type-definitions` | warn     | Enforce consistent `type` vs `interface` usage |
| `@typescript-eslint/no-inferrable-types`         | warn     | Remove redundant type annotations              |
| `@typescript-eslint/no-empty-interface`          | warn     | Prevent empty interfaces that extend nothing   |
| `@typescript-eslint/no-duplicate-imports`        | error    | Merge duplicate imports                        |
| `@typescript-eslint/semi`                        | error    | Enforce semicolon usage                        |
| `@typescript-eslint/member-delimiter-style`      | error    | Consistent delimiter in interfaces/types       |

### Best Practice Rules

| Rule                                               | Severity | Purpose                                                  |
| -------------------------------------------------- | -------- | -------------------------------------------------------- |
| `@typescript-eslint/naming-convention`             | warn     | Enforce naming conventions for classes, interfaces, etc. |
| `@typescript-eslint/no-invalid-void-type`          | error    | Prevent invalid `void` type usage                        |
| `@typescript-eslint/no-meaningless-void-operator`  | error    | Prevent meaningless `void` expressions                   |
| `@typescript-eslint/no-unnecessary-type-assertion` | warn     | Remove unnecessary type assertions                       |
| `@typescript-eslint/parameter-properties`          | warn     | Prefer parameter properties in constructors              |
| `@typescript-eslint/prefer-as-const`               | warn     | Prefer `as const` for literal types                      |

### Rules to Disable (Handled Better by TypeScript)

| Rule             | Reason                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| `no-undef`       | TypeScript's compiler handles this better with full type information     |
| `no-unused-vars` | `@typescript-eslint/no-unused-vars` handles TypeScript-specific patterns |
| `no-shadow`      | TypeScript's shadowing detection is more nuanced                         |

---

## 4. Configuration Examples by Use Case

### Example 1: Node.js Backend (Current Project Setup)

**File:** `/home/dustin/projects/hacky-hack/.eslintrc.json`

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "tsconfigRootDir": "./"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-undef": "off",
    "no-unused-vars": "off"
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "ignorePatterns": ["dist/", "node_modules/", "*.js"]
}
```

### Example 2: With Vitest Testing Framework

```json
{
  "overrides": [
    {
      "files": ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
      "extends": ["plugin:vitest/recommended"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
}
```

### Example 3: Strict Mode (Production-Ready)

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

### Example 4: Permissive Mode (Development/Prototyping)

```json
{
  "extends": ["plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-empty-function": "off"
  }
}
```

### Example 5: Monorepo Setup

```json
{
  "parserOptions": {
    "project": ["./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
    "tsconfigRootDir": "./"
  },
  "overrides": [
    {
      "files": ["packages/backend/**/*.ts"],
      "rules": {
        "@typescript-eslint/strict-boolean-expressions": "error"
      }
    },
    {
      "files": ["packages/frontend/**/*.ts", "*.tsx"],
      "rules": {
        "@typescript-eslint/strict-boolean-expressions": "off"
      }
    }
  ]
}
```

---

## 5. Common Gotchas and Pitfalls

### 5.1 Type-Aware Linting Issues

#### Problem: "The file does not match your project config"

**Cause:** The parser can't find the file in your `tsconfig.json` include paths.

**Solution:**

```json
{
  "parserOptions": {
    "project": "./tsconfig.json",
    "tsconfigRootDir": "./" // CRITICAL: Must be absolute path resolution
  }
}
```

#### Problem: Slow linting performance

**Cause:** Type-aware linting is resource-intensive.

**Solutions:**

1. Use project service (v8+):

   ```json
   {
     "parserOptions": {
       "projectService": true,
       "tsconfigRootDir": "./"
     }
   }
   ```

2. Only enable type-checking for critical files:
   ```json
   {
     "overrides": [
       {
         "files": ["src/**/*.ts"],
         "extends": [
           "plugin:@typescript-eslint/recommended-requiring-type-checking"
         ]
       },
       {
         "files": ["tests/**/*.ts"],
         "extends": ["plugin:@typescript-eslint/recommended"]
       }
     ]
   }
   ```

### 5.2 Parser Configuration Pitfalls

#### Gotcha: Missing `sourceType: "module"`

**Problem:** ES2022/NodeNext modules won't lint correctly.

**Solution:**

```json
{
  "parserOptions": {
    "sourceType": "module"
  }
}
```

#### Gotcha: Incorrect `ecmaVersion`

**Problem:** Modern syntax (e.g., ES2022 class fields) not recognized.

**Solution:**

```json
{
  "parserOptions": {
    "ecmaVersion": 2022 // Or "latest"
  }
}
```

#### Gotcha: Forgetting to disable standard ESLint rules

**Problem:** Duplicate or conflicting rules (e.g., `no-unused-vars`).

**Solution:**

```json
{
  "rules": {
    "no-undef": "off",
    "no-unused-vars": "off",
    "no-redeclare": "off" // TypeScript handles this
  }
}
```

### 5.3 NodeNext/Node16 Module Resolution Issues

#### Problem: File extension errors

**Cause:** NodeNext requires explicit file extensions in imports.

**Configuration:**

```json
{
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2022
  },
  "rules": {
    "@typescript-eslint/no-import-type-side-effects": "error"
  }
}
```

#### Gotcha: `.js` extensions required in `.ts` files

With NodeNext, you must write:

```typescript
import { foo } from './bar.js'; // Even though file is bar.ts
```

### 5.4 Performance Pitfalls

#### Issue: Linting entire node_modules

**Solution:**

```json
{
  "ignorePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.config.js",
    "*.config.ts"
  ]
}
```

#### Issue: Type-checking slows down linting

**Solutions:**

1. Run type-checking separately (use `tsc --noEmit`)
2. Only enable type-aware rules in CI
3. Use `EXPERIMENTAL_useProjectService: true` (v8+)

### 5.5 Flat Config Migration (ESLint 9+)

#### Gotcha: Different configuration format

Old format (`.eslintrc.json`):

```json
{
  "extends": ["plugin:@typescript-eslint/recommended"]
}
```

New format (`eslint.config.js`):

```javascript
import tseslint from 'typescript-eslint';

export default [...tseslint.configs.recommended];
```

#### Gotcha: No more `overrides`

Old:

```json
{
  "overrides": [{ "files": ["test.ts"], "rules": {} }]
}
```

New:

```javascript
export default [
  {
    files: ['test.ts'],
    rules: {},
  },
];
```

### 5.6 Testing Environment Issues

#### Problem: Test globals not recognized

**Solution:**

```json
{
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.spec.ts"],
      "env": {
        "vitest/globals": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

### 5.7 Common Rule Conflicts

| Conflict                             | Resolution                                                |
| ------------------------------------ | --------------------------------------------------------- |
| `eslint-plugin-import` vs TypeScript | Disable `import/no-unresolved` (TS handles better)        |
| Prettier vs ESLint                   | Use `eslint-config-prettier` and `eslint-plugin-prettier` |
| `no-shadow` vs TypeScript            | Disable `no-shadow`, use `@typescript-eslint/no-shadow`   |

### 5.8 Specific TypeScript Version Issues

#### TypeScript 5.2+ Considerations

- **Decorator metadata**: Ensure parser supports experimental decorators
- **`using` declarations**: Set `ecmaVersion: 2022` or higher
- **New syntax support**: Update parser regularly

```json
{
  "parserOptions": {
    "ecmaVersion": 2022,
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unsafe-declaration-merging": "error"
  }
}
```

### 5.9 CI/CD Pipeline Gotchas

#### Problem: Linting fails in CI but not locally

**Causes:**

1. Different Node.js versions
2. Missing dependencies
3. Different `tsconfig.json` paths

**Solution:**

```json
{
  "parserOptions": {
    "project": "./tsconfig.json",
    "tsconfigRootDir": import.meta.dirname || __dirname
  }
}
```

### 5.10 Common Error Messages and Solutions

| Error                                            | Cause                          | Solution                                           |
| ------------------------------------------------ | ------------------------------ | -------------------------------------------------- |
| `Cannot find module '@typescript-eslint/parser'` | Package not installed          | `npm install --save-dev @typescript-eslint/parser` |
| `Parsing error: ";" expected`                    | Wrong parser or parser options | Ensure `@typescript-eslint/parser` is configured   |
| `Definition for rule 'xxx' was not found`        | Rule doesn't exist in plugin   | Check rule name at typescript-eslint.io/rules      |
| `require() of ES Module`                         | CommonJS vs ESM mismatch       | Set `sourceType: "module"`                         |
| `Could not find tsconfig.json`                   | Incorrect `tsconfigRootDir`    | Use absolute path: `tsconfigRootDir: __dirname`    |

---

## 6. Recommended Next Steps for This Project

### Installation

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Add to package.json scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:check": "eslint . --ext .ts --max-warnings 0"
  }
}
```

### Recommended Starting Configuration

Create `/home/dustin/projects/hacky-hack/.eslintrc.json` with the configuration from **Example 1** above, tailored for your Node.js backend with TypeScript 5.2+, ES2022, NodeNext, and strict mode.

### Optional: Add Prettier Integration

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

Update ESLint config to include Prettier:

```json
{
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ]
}
```

---

## 7. Additional Resources

- **TypeScript-ESLint Changelog**: https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md
- **ESLint Documentation**: https://eslint.org/docs/latest/
- **TSConfig Reference**: https://www.typescriptlang.org/tsconfig
- **Vitest ESLint Plugin**: https://github.com/vitest-dev/eslint-plugin-vitest

---

## 8. Summary Checklist

- [ ] Install ESLint and TypeScript-ESLint packages
- [ ] Create `.eslintrc.json` (legacy) or `eslint.config.js` (flat config)
- [ ] Configure parser with correct `project` and `tsconfigRootDir`
- [ ] Choose appropriate extends based on strictness requirements
- [ ] Add lint scripts to package.json
- [ ] Configure `.gitignore` patterns for dist/build outputs
- [ ] Set up overrides for test files
- [ ] Consider adding Prettier for formatting
- [ ] Run `npm run lint` to verify configuration
- [ ] Add `--fix` to pre-commit hooks or CI pipeline

---

_This research document is a comprehensive guide for configuring ESLint with TypeScript 5.2+, ES2022, NodeNext, and strict mode. Always refer to the official documentation for the most up-to-date information._
