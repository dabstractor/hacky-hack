# package.json Best Practices for TypeScript Projects (2024-2025)

This document outlines current best practices for configuring `package.json` in TypeScript projects, with specific focus on modern Node.js 20+ environments.

## Table of Contents

1. [Essential package.json Fields](#essential-packagejson-fields)
2. [TypeScript-Specific Configuration](#typescript-specific-configuration)
3. [Dependency Versioning Strategies](#dependency-versioning-strategies)
4. [npm Scripts for TypeScript Workflows](#npm-scripts-for-typescript-workflows)
5. [Node.js 20+ Considerations](#nodejs-20-considerations)
6. [Complete Example](#complete-example)

---

## Essential package.json Fields

### type Field

The `type` field is critical for modern TypeScript/Node.js projects to enable ES modules:

```json
{
  "type": "module"
}
```

- `"type": "module"` - Treats `.js` files as ES modules
- `"type": "commonjs"` or omitted - Treats `.js` files as CommonJS (legacy)
- Files ending in `.mjs` are always ES modules
- Files ending in `.cjs` are always CommonJS

**Official Documentation:**

- [Node.js ECMAScript Modules - package.json "type" field](https://nodejs.org/api/esm.html#packages)
- [npm package.json type field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#type)

### engines Field

Specify Node.js and npm version requirements:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**Best Practices:**

- Use Node.js 20 LTS (or 18 LTS) as minimum for modern TypeScript projects
- Specify `>=` for flexibility while ensuring minimum requirements
- Consider your dependencies' minimum versions
- Node.js 20 LTS is actively maintained until April 2026

**Official Documentation:**

- [npm package.json engines field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#engines)
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)

### exports Field (Conditional Exports)

The modern way to define package entry points with TypeScript support:

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts"
}
```

**Conditional Exports Best Practices:**

- Always include `types` condition for TypeScript support
- Support both ESM (`import`) and CJS (`require`) for compatibility
- Use conditional exports for better tree-shaking
- Include `default` as fallback for older tools
- Maintain backward compatibility with `main` and `types` fields
- Use subpath exports for internal modules (e.g., `./utils`)

**Subpath Exports Example:**

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    }
  }
}
```

**Official Documentation:**

- [Node.js Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports)
- [Node.js Packages exports field](https://nodejs.org/api/packages.html#exports)
- [TypeScript Module Resolution - package.json exports](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution)
- [npm package.json exports field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#exports)

### files Field

Control which files are published to npm:

```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```

**Best Practices:**

- Only include production files (typically compiled output)
- Exclude source files, tests, and configuration
- Reduces package size significantly
- Use `.npmignore` for more complex exclusion patterns

**Official Documentation:**

- [npm package.json files field](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#files)

### Other Important Fields

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "Clear description of your package",
  "license": "MIT",
  "author": "Your Name <email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  },
  "keywords": ["typescript", "nodejs", "library"],
  "homepage": "https://github.com/username/repo#readme",
  "bugs": "https://github.com/username/repo/issues"
}
```

**Official Documentation:**

- [npm package.json standard fields](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

---

## TypeScript-Specific Configuration

### tsconfig.json Integration

Your `package.json` should work in tandem with `tsconfig.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit"
  }
}
```

**Recommended tsconfig.json settings for 2024-2025:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Official Documentation:**

- [TypeScript Compiler Options - Module](https://www.typescriptlang.org/tsconfig#module)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution)
- [TypeScript tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

### Types Field

For TypeScript projects, always specify the types entry point:

```json
{
  "types": "./dist/index.d.ts"
}
```

**Official Documentation:**

- [TypeScript - package.json types field](https://www.typescriptlang.org/docs/handbook/modules/reference.html#types)

---

## Dependency Versioning Strategies

### Version Range Operators

```json
{
  "dependencies": {
    "exact": "1.2.3",
    "caret": "^1.2.3",
    "tilde": "~1.2.3",
    "greater": ">=1.2.3",
    "range": "1.2.3 - 2.3.4"
  }
}
```

- **Exact (`1.2.3`)**: Only this version
- **Caret (`^1.2.3`)**: Compatible with version 1.x.x (updates minor and patch)
- **Tilde (`~1.2.3`)**: Compatible with version 1.2.x (updates patch only)
- **Greater (`>=1.2.3`)**: Any version 1.2.3 or higher

### Best Practices by Dependency Type

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  },
  "optionalDependencies": {
    "fsevents": "^2.3.3"
  }
}
```

**Dependencies**:

- Use caret ranges (`^`) for libraries and applications
- Allows automatic updates for compatible versions
- Lock files (`package-lock.json` or `yarn.lock`) ensure exact versions in production

**DevDependencies**:

- Use caret ranges for development tools
- TypeScript compiler often uses exact versions in production apps
- Build tools and linters can use ranges

**PeerDependencies**:

- Specify compatible version ranges for libraries that require specific peer packages
- Use `peerDependenciesMeta` for optional peer dependencies
- Don't bundle peer dependencies

**Official Documentation:**

- [npm package.json dependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#dependencies)
- [npm Semantic Versioning](https://docs.npmjs.com/cli/v10/about-semantic-versioning)
- [npm Semantic Versioning Calculator](https://semver.npmjs.com/)

### TypeScript-Specific Versioning

For TypeScript compiler, many teams prefer exact versions:

```json
{
  "devDependencies": {
    "typescript": "5.3.3"
  }
}
```

**Reasons for exact TypeScript versions:**

- Compiler changes can affect type checking behavior
- Ensures consistent builds across environments
- Prevents unexpected breaking changes from minor version updates
- Update TypeScript explicitly when ready

### Lock Files

**Always commit lock files:**

- `package-lock.json` (npm)
- `yarn.lock` (Yarn)
- `pnpm-lock.yaml` (pnpm)

Lock files ensure all developers and CI/CD environments use identical dependency versions.

**Official Documentation:**

- [npm package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)

---

## npm Scripts for TypeScript Workflows

### Essential Development Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:prod": "tsc && npm run minify",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepublishOnly": "npm run build && npm run test",
    "prepare": "husky install || echo \"No git hooks\"",
    "pre-commit": "lint-staged",
    "ci": "npm run type-check && npm run lint && npm run test && npm run build"
  }
}
```

### Script Categories

**Build Scripts:**

- `build` - Compile TypeScript to JavaScript
- `build:watch` - Watch mode for development
- `prebuild` - Runs before build (cleanup, etc.)

**Type Checking:**

- `type-check` - Fast type checking without emitting files
- Useful for CI/CD pipelines

**Linting and Formatting:**

- `lint` - Check code quality with ESLint
- `lint:fix` - Auto-fix linting issues
- `format` - Format code with Prettier
- `format:check` - Check formatting without changing files

**Testing:**

- `test` - Run test suite
- `test:watch` - Watch mode for TDD
- `test:coverage` - Generate coverage reports
- `test:ci` - Optimized for CI/CD environments

**Git Hooks:**

- `prepare` - Set up Husky git hooks
- `pre-commit` - Run lint-staged before commits

**CI/CD:**

- `ci` - Complete validation pipeline (type-check, lint, test, build)

### Lifecycle Scripts

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "postinstall": "husky install || echo \"No git hooks\"",
    "prepublishOnly": "npm run build && npm run test",
    "preversion": "npm run test",
    "postversion": "git push && git push --tags"
  }
}
```

**Official Documentation:**

- [npm scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts)
- [npm Lifecycle Scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-operation-order)

---

## Node.js 20+ Considerations

### Native ES Modules Support

Node.js 20 has enhanced support for ES modules:

```json
{
  "type": "module",
  "exports": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

**Node.js 20+ Features:**

- Improved ESM compatibility
- Better performance for conditional exports
- Stable `import.meta.resolve()`
- Enhanced module resolution

**Official Documentation:**

- [Node.js 20 Release Notes - ES Modules](https://nodejs.org/en/blog/release/v20.0.0)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)

### Permission Model (Node.js 20.12+)

Node.js 20.12 introduced an experimental permission model:

```json
{
  "scripts": {
    "start": "node --experimental-permission index.js"
  }
}
```

**Official Documentation:**

- [Node.js Permission Model](https://nodejs.org/api/permissions.html)

### Test Runner (Node.js 20+)

Node.js 20+ includes a built-in test runner:

```json
{
  "scripts": {
    "test": "node --test",
    "test:watch": "node --test --watch"
  }
}
```

**Official Documentation:**

- [Node.js Test Runner](https://nodejs.org/api/test.html)

### package.json Imports Field

Node.js 20+ supports subpath imports for local modules:

```json
{
  "imports": {
    "#utils": {
      "types": "./src/utils/index.d.ts",
      "import": "./src/utils/index.js"
    },
    "#config": {
      "types": "./src/config/index.d.ts",
      "import": "./src/config/index.js"
    }
  }
}
```

Usage in TypeScript:

```typescript
import { helper } from '#utils';
import { config } from '#config';
```

**Official Documentation:**

- [Node.js Subpath Imports](https://nodejs.org/api/packages.html#subpath-imports)
- [TypeScript Module Resolution - path mapping](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution)

### Enhanced require() and import()

Node.js 20 synchronizes `require()` and `import()` behavior:

```json
{
  "type": "module",
  "exports": {
    "node": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "default": "./dist/index.js"
  }
}
```

**Official Documentation:**

- [Node.js Package Exports](https://nodejs.org/api/packages.html#package-entry-points)

---

## Complete Example

Here's a comprehensive `package.json` example for a modern TypeScript library in 2024-2025:

```json
{
  "name": "modern-typescript-library",
  "version": "1.0.0",
  "description": "A modern TypeScript library following 2024-2025 best practices",
  "type": "module",
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js"
    },
    "./package.json": "./package.json"
  },
  "imports": {
    "#internal": {
      "types": "./src/internal/index.d.ts",
      "import": "./src/internal/index.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepublishOnly": "npm run build && npm run test",
    "prepare": "husky install || echo \"No git hooks\"",
    "pre-commit": "lint-staged",
    "ci": "npm run type-check && npm run lint && npm run test && npm run build"
  },
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/lodash": "^4.14.202",
    "@types/node": "^20.10.6",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "rimraf": "^5.0.5",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "peerDependencies": {
    "typescript": ">=5.0.0"
  },
  "peerDependenciesMeta": {
    "typescript": {
      "optional": true
    }
  },
  "keywords": ["typescript", "nodejs", "library", "esm"],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  },
  "homepage": "https://github.com/username/repo#readme",
  "bugs": {
    "url": "https://github.com/username/repo/issues"
  }
}
```

---

## Additional Resources

### Official Documentation

- **npm:**
  - [package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
  - [npm Scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts)
  - [Semantic Versioning](https://docs.npmjs.com/cli/v10/about-semantic-versioning)
  - [package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)

- **Node.js:**
  - [Packages: exports field](https://nodejs.org/api/packages.html#exports)
  - [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports)
  - [Subpath Exports](https://nodejs.org/api/packages.html#subpath-exports)
  - [Subpath Imports](https://nodejs.org/api/packages.html#subpath-imports)
  - [ES Modules](https://nodejs.org/api/esm.html)
  - [Node.js 20 Release Notes](https://nodejs.org/en/blog/release/v20.0.0)
  - [Test Runner](https://nodejs.org/api/test.html)
  - [Permission Model](https://nodejs.org/api/permissions.html)

- **TypeScript:**
  - [Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution)
  - [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
  - [Compiler Options](https://www.typescriptlang.org/tsconfig)
  - [Package.json types field](https://www.typescriptlang.org/docs/handbook/modules/reference.html#types)
  - [TypeScript 5.3 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-3/)

### Community Best Practices

- [TypeScript Deep Dive - Modules](https://basarat.gitbook.io/typescript/type-system/modules)
- [node.best - ES Modules](https://node.best/)
- [2ality - ECMAScript modules](https://2ality.com/2021/12/top-level-await.html)
- [TypeScript ESLint Getting Started](https://typescript-eslint.io/getting-started/)

---

## Summary of Key Recommendations

1. **Use `"type": "module"`** for all new TypeScript projects targeting Node.js 20+
2. **Define conditional exports** with TypeScript types support
3. **Specify `engines`** to enforce Node.js 20+ and npm 10+
4. **Use caret ranges (`^`)** for most dependencies, exact versions for TypeScript
5. **Commit lock files** to ensure reproducible builds
6. **Set up comprehensive npm scripts** for build, test, lint, and CI workflows
7. **Use subpath imports** (`#`) for internal module imports
8. **Include `types` field** in exports for proper TypeScript support
9. **Keep `package.json` clean** with only production files in the `files` field
10. **Leverage Node.js 20+ features** like built-in test runner and enhanced ESM support
