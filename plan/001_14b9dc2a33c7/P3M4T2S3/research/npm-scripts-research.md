# NPM Scripts Best Practices for TypeScript Node.js CLI Projects

**Research Date:** 2026-01-13
**Status:** Compiled from established best practices (web tools unavailable)

---

## 1. Standard NPM Script Conventions for TypeScript Projects

### 1.1 Build Scripts

**Purpose:** Compile TypeScript to JavaScript for distribution

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:clean": "tsc --clean",
    "prebuild": "npm run validate",
    "postbuild": "npm run test:run"
  }
}
```

**Key Points:**

- Use `tsc` for TypeScript compilation
- `--watch` flag for incremental compilation during development
- `--clean` to remove build artifacts
- `prebuild` hook for validation before building
- `postbuild` hook for post-build tasks (testing, size analysis)

### 1.2 Development Scripts

**Purpose:** Run the application in development mode with hot reload

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:watch": "nodemon --exec tsx src/index.ts",
    "dev:debug": "node --inspect -r tsx src/index.ts",
    "start": "node dist/index.js",
    "start:dev": "NODE_ENV=development tsx src/index.ts",
    "start:prod": "NODE_ENV=production node dist/index.js"
  }
}
```

**Key Points:**

- `tsx` is faster than `ts-node` for TypeScript execution
- `nodemon` provides automatic restart on file changes
- Use `--` to pass arguments to the underlying command: `npm run dev -- --arg=value`
- Separate `start` for production (runs compiled JS)
- `start:dev` for development (runs TS directly)

### 1.3 Test Scripts

**Purpose:** Run unit tests, integration tests, and coverage reports

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "pretest": "npm run lint",
    "posttest": "npm run typecheck"
  }
}
```

**Key Points:**

- `vitest` is the modern, fast alternative to Jest
- `--run` flag for CI environments (no watch mode)
- `--coverage` for code coverage reports
- Separate unit and integration test configurations
- `pretest` hook for linting before tests
- `posttest` hook for type checking after tests

### 1.4 Linting and Formatting Scripts

**Purpose:** Enforce code quality and consistent formatting

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:cache": "eslint . --ext .ts --cache",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:write": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "typecheck": "tsc --noEmit",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "fix": "npm run lint:fix && npm run format:write"
  }
}
```

**Key Points:**

- `--fix` flag for ESLint auto-fixing
- `--cache` flag for faster subsequent lint runs
- `--check` with Prettier for CI (fails if formatting differs)
- `--write` with Prettier to apply formatting
- `tsc --noEmit` for type checking without compilation
- Combine all checks in `validate` script
- `fix` script combines all auto-fixing operations

### 1.5 Start Scripts for Production/Development

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "start:dev": "tsx src/index.ts",
    "start:watch": "nodemon --exec tsx src/index.ts",
    "start:production": "NODE_ENV=production node dist/index.js",
    "start:debug": "node --inspect-brk dist/index.js"
  }
}
```

---

## 2. Common NPM Script Naming Patterns and Conventions

### 2.1 Hierarchical Naming with Colons

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts"
  }
}
```

**Pattern:** `<namespace>:<action>:<variant>`

**Benefits:**

- Clear hierarchy and organization
- Tab completion support
- Easy to understand related scripts
- Scalable for large projects

### 2.2 Standard Script Names (Reserved by npm)

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "stop": "pkill -f node",
    "restart": "npm run stop && npm run start",
    "test": "vitest run",
    "install": "node install.js",
    "uninstall": "node uninstall.js",
    "publish": "npm run build && npm publish",
    "pack": "npm run build && npm pack"
  }
}
```

**Reserved Scripts:**

- `start` - Default for `npm start`
- `stop` - Default for `npm stop`
- `restart` - Default for `npm restart` (runs stop → start → restart)
- `test` - Default for `npm test`
- `install` - Runs after `npm install`
- `uninstall` - Runs before `npm uninstall`
- `publish` - Runs before `npm publish`

### 2.3 Lifecycle Hooks

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test",
    "prepack": "npm run build",
    "prepare": "npm run build",
    "preinstall": "node check-node-version.js",
    "postinstall": "husky install",
    "prebuild": "npm run validate",
    "postbuild": "npm run test:run",
    "pretest": "npm run lint",
    "posttest": "npm run typecheck"
  }
}
```

**Lifecycle Order:**

1. `pre<command>` - Runs before the command
2. `<command>` - The main command
3. `post<command>` - Runs after the command

**Special Lifecycle Scripts:**

- `prepublishOnly` - Runs ONLY before `npm publish` (not on install)
- `prepare` - Runs BEFORE both `npm pack` and `npm publish`
- `prepack` - Runs before packing a tarball
- `prepublish` - **DEPRECATED** - Do not use

---

## 3. Structuring Scripts with Arguments

### 3.1 Using `--` to Pass Arguments

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "test": "vitest",
    "lint": "eslint . --ext .ts"
  }
}
```

**Usage:**

```bash
# Pass arguments to the underlying command
npm run dev -- --port=3000 --debug
npm run test -- --reporter=verbose
npm run lint -- src/file1.ts src/file2.ts
```

**Key Point:** Everything after `--` is passed to the underlying command, not to npm.

### 3.2 Using Environment Variables

```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js",
    "start:dev": "NODE_ENV=development tsx src/index.ts",
    "start:test": "NODE_ENV=test tsx src/index.ts",
    "test:integration": "NODE_ENV=test vitest run --config vitest.integration.config.ts"
  }
}
```

**Alternative with cross-env (for Windows compatibility):**

```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "build": "cross-env NODE_ENV=production tsc"
  }
}
```

### 3.3 Using Shell Variables

```json
{
  "scripts": {
    "release": "standard-version $@",
    "deploy": "npm run build && scp -r dist/* user@$DEPLOY_HOST:/app"
  }
}
```

**Usage:**

```bash
npm run release -- --release-as minor
```

---

## 4. Best Practices for Script Ordering

### 4.1 Pre-build Validation Pattern

```json
{
  "scripts": {
    "prebuild": "npm run validate",
    "build": "tsc",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "lint": "eslint . --ext .ts",
    "format:check": "prettier --check \"**/*.{ts,js,json,md}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

**Execution Order:**

1. `npm run build` is called
2. `prebuild` runs automatically → calls `validate`
3. `validate` runs `lint`, `format:check`, `typecheck` in sequence
4. If all pass, `build` runs

### 4.2 Pre-publish Safety Pattern

```json
{
  "scripts": {
    "prepublishOnly": "npm run validate && npm run build && npm run test:run",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "build": "tsc",
    "test:run": "vitest run --coverage"
  }
}
```

**This ensures:**

- Code is linted before publishing
- Code is formatted correctly before publishing
- Types are valid before publishing
- Build succeeds before publishing
- Tests pass before publishing

### 4.3 Development Workflow Pattern

```json
{
  "scripts": {
    "predev": "npm run typecheck",
    "dev": "nodemon --exec tsx src/index.ts",
    "pretest": "npm run lint",
    "test": "vitest",
    "posttest": "npm run typecheck"
  }
}
```

### 4.4 CI/CD Pattern

```json
{
  "scripts": {
    "ci": "npm run validate && npm run test:coverage && npm run build",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "test:coverage": "vitest run --coverage",
    "build": "tsc"
  }
}
```

---

## 5. Scripts that Work Well with Popular Tools

### 5.1 TypeScript Compiler (tsc)

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:clean": "tsc --clean",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch"
  },
  "tsconfig": {
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src",
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true
    }
  }
}
```

**Recommendations:**

- Use `--noEmit` for faster type checking without compilation
- Use `--watch` for development (incremental compilation)
- Use `--clean` to remove build artifacts
- Enable source maps for debugging

### 5.2 tsx (TypeScript Executor)

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:watch": "nodemon --exec tsx src/index.ts",
    "test": "vitest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "tsx": "^4.0.0"
  }
}
```

**Why tsx over ts-node:**

- 10-20x faster startup time
- Uses esbuild for compilation
- Better ESM support
- Native TypeScript transform

**Usage Patterns:**

```bash
# Run TypeScript file directly
npm run dev

# Run with watch mode
npm run dev:watch

# Pass arguments
npm run dev -- --port=3000
```

### 5.3 nodemon (Development Hot Reload)

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "dev:debug": "nodemon --exec 'node --inspect -r tsx' src/index.ts"
  },
  "nodemonConfig": {
    "watch": ["src"],
    "ext": "ts,json",
    "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
    "delay": "1000",
    "verbose": true
  }
}
```

**Best Practices:**

- Use `--exec` to run TypeScript files directly
- Ignore test files in watch mode
- Add a small delay to prevent rapid restarts
- Use nodemon config in package.json for project-wide settings

### 5.4 vitest (Testing Framework)

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:bail": "vitest run --bail=1",
    "test:reporter": "vitest run --reporter=verbose"
  },
  "vitest": {
    "environment": "node",
    "coverage": {
      "provider": "v8",
      "reporter": ["text", "json", "html"]
    }
  }
}
```

**Key Features:**

- Native ESM support
- Fast (uses Vite's transformer)
- Jest-compatible API
- Built-in coverage with v8

**Recommended Patterns:**

```bash
# Development (watch mode)
npm run test

# CI (single run)
npm run test:run

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

### 5.5 eslint (Linting)

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:cache": "eslint . --ext .ts --cache",
    "lint:quiet": "eslint . --ext .ts --quiet",
    "lint:debug": "eslint . --ext .ts --debug"
  },
  "eslintConfig": {
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ]
  }
}
```

**Best Practices:**

- Use `--fix` for auto-fixing linting errors
- Use `--cache` for faster subsequent runs
- Use `--quiet` to only show errors (no warnings)
- Run linting before tests (`pretest` hook)
- Use TypeScript-aware linting with @typescript-eslint

### 5.6 prettier (Formatting)

```json
{
  "scripts": {
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:write": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\""
  },
  "prettier": {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 80,
    "tabWidth": 2
  }
}
```

**Best Practices:**

- Use `--check` for CI (fails if formatting differs)
- Use `--write` for development (applies formatting)
- Include all file types (TypeScript, JSON, Markdown, YAML)
- Combine with ESLint using eslint-config-prettier

---

## 6. Complete Recommended Script Configuration

Based on your current setup and best practices, here's the recommended configuration:

```json
{
  "scripts": {
    "=== Development ===": "",
    "dev": "tsx src/index.ts",
    "dev:watch": "nodemon --exec tsx src/index.ts",
    "dev:debug": "node --inspect -r tsx src/index.ts",

    "=== Build ===": "",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:clean": "tsc --clean",
    "prebuild": "npm run validate",
    "postbuild": "npm run test:run",

    "=== Start ===": "",
    "start": "node dist/index.js",
    "start:dev": "NODE_ENV=development tsx src/index.ts",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "start:watch": "nodemon --exec tsx src/index.ts",

    "=== Pipeline ===": "",
    "pipeline": "tsx src/index.ts",
    "pipeline:dev": "nodemon --exec tsx src/index.ts",

    "=== Test ===": "",
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:bail": "vitest run --bail=1",
    "pretest": "npm run lint",
    "posttest": "npm run typecheck",

    "=== Lint ===": "",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:cache": "eslint . --ext .ts --cache",
    "lint:quiet": "eslint . --ext .ts --quiet",

    "=== Format ===": "",
    "format": "prettier --write \"**/*.{ts,js,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,json,md,yml,yaml}\"",

    "=== Type Check ===": "",
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",

    "=== Validation ===": "",
    "validate": "npm run lint && npm run format:check && npm run typecheck",
    "fix": "npm run lint:fix && npm run format",

    "=== CI/CD ===": "",
    "ci": "npm run validate && npm run test:coverage && npm run build",
    "prepublishOnly": "npm run validate && npm run build && npm run test:run",
    "prepare": "npm run build"
  }
}
```

---

## 7. Key Recommendations Summary

### 7.1 Script Organization

1. **Use hierarchical naming** with colons (`test:unit`, `test:integration`)
2. **Group related scripts** with comments (Development, Build, Test, etc.)
3. **Follow standard conventions** for reserved scripts (`start`, `test`, `build`)
4. **Use lifecycle hooks** for automation (`prebuild`, `pretest`, `prepublishOnly`)

### 7.2 Script Best Practices

1. **Validate before building** - Use `prebuild` hook with `validate` script
2. **Lint before testing** - Use `pretest` hook with `lint` script
3. **Type check after testing** - Use `posttest` hook with `typecheck` script
4. **Use `--` for arguments** - Pass args to underlying commands: `npm run dev -- --arg=value`
5. **Combine validation steps** - Create a `validate` script that runs lint, format:check, and typecheck

### 7.3 Tool-Specific Recommendations

**tsx:**

- Use for fast TypeScript execution in development
- Combine with nodemon for watch mode
- Don't use for production (use compiled JS instead)

**nodemon:**

- Use with `--exec` flag for TypeScript files
- Configure watch paths and ignore patterns
- Add delay to prevent rapid restarts

**vitest:**

- Use `vitest run` for CI environments
- Use `vitest` (watch mode) for development
- Enable coverage with `--coverage` flag

**eslint:**

- Use `--fix` for auto-fixing
- Use `--cache` for faster subsequent runs
- Use TypeScript-aware rules with @typescript-eslint

**prettier:**

- Use `--check` for CI (fails if formatting differs)
- Use `--write` for development (applies formatting)
- Combine with ESLint using eslint-config-prettier

**tsc:**

- Use `--noEmit` for type checking without compilation
- Use `--watch` for incremental compilation
- Use `--clean` to remove build artifacts

### 7.4 Production vs Development

**Development:**

- Use `tsx` to run TypeScript files directly
- Use `nodemon` for hot reload
- Use watch mode for compilation and testing

**Production:**

- Compile TypeScript to JavaScript first
- Run compiled JavaScript with `node`
- Set `NODE_ENV=production`

### 7.5 Safety Checks

1. **Always validate before publishing** - Use `prepublishOnly` hook
2. **Always run tests before building** - Use `prebuild` or `postbuild` hook
3. **Always lint before testing** - Use `pretest` hook
4. **Always check formatting in CI** - Use `format:check` script

---

## 8. Official Documentation URLs

**Note:** Due to tool usage limits, URLs are provided based on official documentation sources. Please verify these URLs independently.

### Core Documentation

- **npm scripts:** https://docs.npmjs.com/cli/v10/using-npm/scripts
- **npm lifecycle:** https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-operation-order
- **TypeScript compiler:** https://www.typescriptlang.org/docs/handbook/compiler-options.html

### Tool-Specific Documentation

- **tsx:** https://github.com/privatenumber/tsx
- **nodemon:** https://nodemon.io/
- **vitest:** https://vitest.dev/guide/cli.html
- **eslint:** https://eslint.org/docs/latest/use/command-line-interface
- **prettier:** https://prettier.io/docs/en/cli.html
- **@typescript-eslint:** https://typescript-eslint.io/linting/typed-linting/

### Best Practices Articles

- **Node.js best practices:** https://github.com/goldbergyoni/nodebestpractices
- **TypeScript best practices:** https://github.com/typescript-cheatsheets/react

---

## 9. Additional Resources

### Tools to Enhance npm Scripts

```json
{
  "devDependencies": {
    "tsx": "^4.0.0",
    "nodemon": "^3.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0",
    "cross-env": "^7.0.0",
    "npm-run-all": "^4.1.5",
    "concurrently": "^8.0.0"
  }
}
```

### Useful Script Patterns

**Parallel execution:**

```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"npm run test:watch\"",
    "test:all": "npm-run-all test:unit test:integration"
  }
}
```

**Conditional execution:**

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build",
    "build:dev": "NODE_ENV=development npm run build"
  }
}
```

**Cleanup scripts:**

```json
{
  "scripts": {
    "clean": "rimraf dist",
    "clean:all": "rimraf dist node_modules coverage",
    "prebuild": "npm run clean"
  }
}
```

---

## 10. Conclusion

Following these npm scripts best practices will help you:

1. **Maintain consistency** across your project and team
2. **Catch errors early** with validation hooks
3. **Improve development workflow** with watch mode and hot reload
4. **Ensure code quality** with linting and formatting
5. **Streamline CI/CD** with comprehensive test and build scripts
6. **Prevent bad publishes** with prepublishOnly hooks

The key is to use scripts as orchestration tools that tie together your development tools (tsx, nodemon, vitest, eslint, prettier) in a way that's both efficient and maintainable.
