# TypeScript Module Resolution Research: Local Packages and npm Linked Packages

**Research Date:** 2026-01-15
**TypeScript Version:** 5.2.0+
**Focus:** NodeNext mode, local packages, npm link integration

---

## Table of Contents

1. [Official TypeScript Documentation](#official-typescript-documentation)
2. [NodeNext Module Resolution](#nodenext-module-resolution)
3. [TypeScript Paths for Local Packages](#typescript-paths-for-local-packages)
4. [npm Link and TypeScript Integration](#npm-link-and-typescript-integration)
5. [Verifying TypeScript Import Resolution](#verifying-typescript-import-resolution)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Configuration Examples](#configuration-examples)
8. [Best Practices](#best-practices)

---

## Official TypeScript Documentation

### Core Documentation Links

1. **TypeScript Handbook - Module Resolution**
   - URL: https://www.typescriptlang.org/docs/handbook/modules/reference.html
   - Covers: Module resolution strategies, resolution algorithms
   - Sections: What is Module Resolution, Resolution Strategies

2. **TypeScript Handbook - Module Resolution Theory**
   - URL: https://www.typescriptlang.org/docs/handbook/modules/theory.html
   - Covers: How resolution works, algorithm details
   - Sections: Classic vs Node resolution strategies

3. **TypeScript Compiler Options - moduleResolution**
   - URL: https://www.typescriptlang.org/tsconfig#moduleResolution
   - Covers: All moduleResolution options (classic, node, node16, nodenext, bundler)
   - Sections: When to use each strategy

4. **TypeScript Compiler Options - paths**
   - URL: https://www.typescriptlang.org/tsconfig#paths
   - Covers: Path mapping for local packages
   - Sections: baseUrl relationship, path mapping syntax

5. **TypeScript Project References**
   - URL: https://www.typescriptlang.org/docs/handbook/project-references.html
   - Covers: Multi-project setups, composite projects
   - Sections: Setting up project references

6. **TypeScript Declaration Maps**
   - URL: https://www.typescriptlang.org/docs/handbook/declaration-maps.html
   - Covers: Debugging and source map generation
   - Sections: declarationMap setting

### Troubleshooting Resources

1. **TypeScript GitHub Issues - Module Resolution**
   - URL: https://github.com/microsoft/TypeScript/issues?q=is%3Aissue+module+resolution
   - Search for: "npm link", "local packages", "moduleResolution"

2. **TypeScript Community Discussions**
   - URL: https://github.com/microsoft/TypeScript/discussions
   - Search for: "monorepo", "workspace", "path mapping"

3. **Stack Overflow - TypeScript Module Resolution**
   - URL: https://stackoverflow.com/questions/tagged/typescript+module-resolution
   - Common issues: npm link, local packages, path mapping

---

## NodeNext Module Resolution

### What is NodeNext?

**NodeNext** is TypeScript's modern module resolution strategy that aligns with Node.js's ECMAScript module resolution (Node.js 12.17+). It's the recommended strategy for:

- Projects using ES modules (`"type": "module"` in package.json)
- Modern Node.js applications (Node.js 16+)
- Libraries targeting both ESM and CommonJS
- Projects using conditional exports

### Key Characteristics

#### 1. Dual Mode Support

NodeNext handles both CommonJS and ES Modules based on context:

```typescript
// ES Module import
import { something } from 'pkg';        // Resolves based on package.json "type"
import { other } from 'pkg/sub.mjs';    // Explicit ESM

// CommonJS require
const pkg = require('pkg');             // Resolves based on context
```

#### 2. File Extension Requirements

For ES module imports, file extensions are **required**:

```typescript
// ✅ Correct - ES Module
import { foo } from './local.js';       // .js for TypeScript files
import { bar } from './local.mjs';      // .mjs for explicit ESM
import { baz } from './local.cjs';      // .cjs for explicit CommonJS

// ❌ Incorrect - ES Module
import { foo } from './local';          // Missing extension
```

**Note:** TypeScript files still use `.ts` extension in source, but imports use `.js` extension.

#### 3. package.json `type` Field

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "type": "module",     // or "commonjs" or omitted (defaults to CommonJS)
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

- `"type": "module"` - Treats `.js` files as ES modules
- `"type": "commonjs"` or omitted - Treats `.js` files as CommonJS
- `.mjs` files are always ES modules
- `.cjs` files are always CommonJS

#### 4. Conditional Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

### Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Resolution Algorithm

NodeNext follows this resolution order:

1. **Check for relative imports** (starting with `./` or `../`)
2. **Check for absolute imports** (node_modules or paths mapping)
3. **Read package.json** of target package
4. **Apply package.json "exports" field** if present
5. **Resolve based on "type" field** (module vs commonjs)
6. **Append appropriate extensions** (.js, .mjs, .cjs, .json)
7. **Check for index files** (index.js, index.mjs, etc.)

---

## TypeScript Paths for Local Packages

### What are TypeScript Paths?

**TypeScript paths** allow you to map import aliases to physical file system locations. This is useful for:

- Monorepo setups with local packages
- Alias imports for cleaner code
- Resolving packages without publishing to npm
- Development-time linking of local packages

### Basic Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",                    // Base directory for path resolution
    "paths": {
      "@my-scope/shared-lib": ["packages/shared/src"],
      "@my-scope/utils": ["packages/utils/src"],
      "@/*": ["src/*"]                 // Wildcard patterns
    }
  }
}
```

### Path Mapping Syntax

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Exact match
      "shared-lib": ["../shared/src"],

      // Wildcard pattern
      "@shared/*": ["../shared/src/*"],

      // Multiple fallbacks
      "config": ["./config/local", "./config/default"]
    }
  }
}
```

### Monorepo Example

**Project Structure:**
```
monorepo/
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── app/
│       ├── src/
│       │   └── main.ts
│       ├── package.json
│       └── tsconfig.json
└── package.json  (workspace root)
```

**packages/app/tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared": ["../shared/src"]
    }
  },
  "references": [
    { "path": "../shared" }
  ]
}
```

**packages/app/src/main.ts:**
```typescript
import { something } from '@shared';  // Resolves to ../shared/src
```

### Important Considerations

#### 1. Paths vs. Runtime Resolution

TypeScript paths are **compile-time only**. They don't affect runtime resolution:

```json
{
  "compilerOptions": {
    "paths": {
      "my-lib": ["../local-lib/src"]  // TypeScript only
    }
  }
}
```

At runtime, Node.js will still look in `node_modules/my-lib`, not `../local-lib/src`.

#### 2. Combining with Other Tools

For runtime resolution, you need additional tooling:

**Option A: npm link**
```bash
cd ../local-lib
npm link
cd .
npm link local-lib
```

**Option B: tsconfig paths + bundler**
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'my-lib': path.resolve(__dirname, '../local-lib/src')
    }
  }
};
```

**Option C: package.json workspace**
```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

---

## npm Link and TypeScript Integration

### What is npm link?

**npm link** creates a symbolic link from a local package to node_modules, allowing development of linked packages without publishing.

### Basic Workflow

```bash
# 1. Create global link for the package to be linked
cd /path/to/local-package
npm link

# 2. Link the package into your project
cd /path/to/your-project
npm link local-package

# 3. Unlink when done
npm unlink local-package
```

### TypeScript + npm Link Configuration

#### Package Being Linked

**local-package/tsconfig.json:**
```json
{
  "compilerOptions": {
    "declaration": true,           // Generate .d.ts files
    "declarationMap": true,        // Generate .d.ts.map files
    "composite": true,             // Enable project references
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**local-package/package.json:**
```json
{
  "name": "local-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

#### Consuming Project

**your-project/tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "local-package": ["../local-package/src"]  // Optional: for development
    }
  },
  "references": [
    { "path": "../local-package" }  // Optional: project references
  ]
}
```

### Common npm Link + TypeScript Issues

#### Issue 1: Type Definitions Not Found

**Problem:**
```
TS2307: Cannot find module 'local-package' or its corresponding type declarations.
```

**Solutions:**

1. **Build the linked package first:**
```bash
cd ../local-package
npm run build
```

2. **Check types field in package.json:**
```json
{
  "types": "./dist/index.d.ts"  // Must point to built declaration files
}
```

3. **Verify declaration files are generated:**
```bash
ls -la ../local-package/dist/
# Should see index.d.ts and index.d.ts.map
```

#### Issue 2: Module Resolution Mismatch

**Problem:**
```
TS1479: The 'local-package' package has a 'module' kind that is not compatible with this project.
```

**Solutions:**

1. **Match module settings:**
```json
// Both packages should have the same module setting
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

2. **Check package.json type field:**
```json
{
  "type": "module"  // Should match between packages
}
```

#### Issue 3: Symlink Resolution

**Problem:** TypeScript doesn't resolve symlinks correctly.

**Solutions:**

1. **Use tsconfig paths:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "local-package": ["../local-package/src"]
    }
  }
}
```

2. **Use project references:**
```json
{
  "references": [
    { "path": "../local-package" }
  ]
}
```

3. **Enable preserveSymlinks:**
```json
{
  "compilerOptions": {
    "preserveSymlinks": true
  }
}
```

---

## Verifying TypeScript Import Resolution

### Method 1: Using tsc --noEmit

The most reliable way to verify TypeScript can resolve imports:

```bash
# Check all files
npx tsc --noEmit

# Check with specific tsconfig
npx tsc --noEmit --project tsconfig.json

# Watch mode for continuous checking
npx tsc --noEmit --watch

# Verbose mode to see resolution
npx tsc --noEmit --traceResolution
```

**What it checks:**
- All imports can be resolved
- Type definitions are found
- No type errors
- Module compatibility

**Example output:**
```
src/index.ts:3:20 - error TS2307: Cannot find module 'local-package' or its corresponding type declarations.
3 import { foo } from 'local-package';
                     ~~~~~~~~~~~~~~
Found 1 error in 1 file.
```

### Method 2: Using tsc --traceResolution

For detailed resolution information:

```bash
npx tsc --noEmit --traceResolution 2>&1 | grep "local-package"
```

**Example output:`
```
======== Resolving module 'local-package' from '/project/src/index.ts'. ========
Explicitly specified module resolution kind: 'NodeNext'.
Resolving in NodeNext mode with file '/project/src/index.ts'.
Loading module as file / folder, candidate module location '/project/node_modules/local-package'.
File '/project/node_modules/local-package/package.json' exists.
Found 'package.json' at '/project/node_modules/local-package/package.json'.
'package.json' has 'type' field 'module'.
Entering conditional exports for 'local-package'.
Package export condition 'import' matches.
Resolved to '/project/node_modules/local-package/dist/index.js'.
```

### Method 3: Using TypeScript Compiler API

Create a verification script:

**verify-typescript.ts:**
```typescript
import ts from 'typescript';

function verifyResolution(projectPath: string): void {
  const configPath = ts.findConfigFile(
    projectPath,
    ts.sys.fileExists,
    'tsconfig.json'
  );

  if (!configPath) {
    console.error('Could not find tsconfig.json');
    process.exit(1);
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    projectPath
  );

  const host = ts.createCompilerHost(compilerOptions.options);
  const program = ts.createProgram(
    compilerOptions.fileNames,
    compilerOptions.options,
    host
  );

  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getDeclarationDiagnostics()
  ];

  if (diagnostics.length === 0) {
    console.log('✅ All imports resolved successfully!');
  } else {
    console.log('❌ Found resolution errors:');
    diagnostics.forEach(diagnostic => {
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
      );
      const file = diagnostic.file?.fileName || 'Unknown';
      const line = diagnostic.start?.toString() || '?';
      console.log(`  ${file}:${line} - ${message}`);
    });
    process.exit(1);
  }
}

verifyResolution(process.cwd());
```

**Usage:**
```bash
npx tsx verify-typescript.ts
```

### Method 4: Using tsx Development Server

For runtime verification:

```bash
# Try to execute a file that imports the package
npx tsx -e "import { foo } from 'local-package'; console.log(foo);"

# Or with ts-node
npx ts-node -e "import { foo } from 'local-package'; console.log(foo);"
```

### Method 5: Using ESLint TypeScript Plugin

**.eslintrc.json:**
```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Usage:**
```bash
npx eslint src/**/*.ts
```

---

## Common Issues and Solutions

### Issue 1: "Cannot find module" Error

**Symptoms:**
```
TS2307: Cannot find module 'my-local-package' or its corresponding type declarations.
```

**Causes:**
1. Package not linked properly
2. Type declarations not built
3. TypeScript paths not configured
4. Module resolution mismatch

**Solutions:**

1. **Verify npm link:**
```bash
npm link my-local-package
ls -la node_modules/my-local-package  # Should be a symlink
```

2. **Build type declarations:**
```bash
cd ../my-local-package
npm run build  # Ensure .d.ts files are generated
```

3. **Check tsconfig paths:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "my-local-package": ["../my-local-package/src"]
    }
  }
}
```

4. **Match module resolution:**
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### Issue 2: Module Kind Mismatch

**Symptoms:**
```
TS1479: The 'my-local-package' package has a 'module' kind that is not compatible with this project.
```

**Causes:**
1. Different `module` settings between packages
2. Different `type` field in package.json
3. ESM vs CommonJS mismatch

**Solutions:**

1. **Match module settings:**
```json
// Both packages
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

2. **Match package.json type:**
```json
{
  "type": "module"  // Same in both packages
}
```

3. **Use conditional exports:**
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Issue 3: File Extension Required

**Symptoms:**
```
TS2834: Relative import paths need explicit file extensions in ECMA import mode when 'module' is set to 'NodeNext'.
```

**Causes:**
Using ES module imports without file extensions.

**Solutions:**

1. **Add file extensions:**
```typescript
// ❌ Wrong
import { foo } from './local';

// ✅ Correct
import { foo } from './local.js';  // Note: .js for .ts files
```

2. **Or use CommonJS:**
```typescript
// Works without extension
const { foo } = require('./local');
```

### Issue 4: Type Declarations Not Found

**Symptoms:**
```
Could not find a declaration file for module 'my-local-package'.
```

**Causes:**
1. Package not built with declarations
2. `declaration` flag not set
3. `types` field incorrect in package.json

**Solutions:**

1. **Enable declaration generation:**
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}
```

2. **Set types field:**
```json
{
  "types": "./dist/index.d.ts"
}
```

3. **Build before linking:**
```bash
cd ../my-local-package
npm run build
```

### Issue 5: Symlink Not Resolved

**Symptoms:**
TypeScript resolves to wrong location or doesn't follow symlinks.

**Causes:**
1. Symlink created incorrectly
2. TypeScript not configured to follow symlinks
3. Path mapping conflicts

**Solutions:**

1. **Verify symlink:**
```bash
ls -la node_modules/my-local-package
# Should show: my-local-package -> ../../my-local-package
```

2. **Enable preserveSymlinks:**
```json
{
  "compilerOptions": {
    "preserveSymlinks": true
  }
}
```

3. **Use project references:**
```json
{
  "references": [
    { "path": "../my-local-package" }
  ]
}
```

### Issue 6: Circular Dependencies

**Symptoms:**
```
TS2307: Cannot find module 'my-local-package' when it exists.
```

**Causes:**
1. Packages reference each other
2. Build order issues
3. Project reference cycles

**Solutions:**

1. **Use composite projects:**
```json
{
  "compilerOptions": {
    "composite": true
  }
}
```

2. **Use project references:**
```json
{
  "references": [
    { "path": "../shared", "prepend": true }
  ]
}
```

3. **Build in correct order:**
```bash
cd ../shared && npm run build
cd ../app && npm run build
```

---

## Configuration Examples

### Example 1: Simple Monorepo with npm link

**Project Structure:**
```
my-monorepo/
├── packages/
│   ├── shared/
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

**packages/shared/package.json:**
```json
{
  "name": "@my-monorepo/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

**packages/shared/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

**packages/app/package.json:**
```json
{
  "name": "@my-monorepo/app",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@my-monorepo/shared": "*"
  }
}
```

**packages/app/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "@my-monorepo/shared": ["../shared/src"]
    }
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"]
}
```

**Setup commands:**
```bash
# Build shared package
cd packages/shared
npm run build

# Create global link
npm link

# Link into app
cd ../app
npm link @my-monorepo/shared

# Verify resolution
npx tsc --noEmit
```

### Example 2: Workspace with pnpm

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
```

**package.json (root):**
```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm -r --filter './packages/**' build",
    "typecheck": "pnpm -r --filter './packages/**' typecheck"
  }
}
```

**packages/shared/package.json:**
```json
{
  "name": "@my-monorepo/shared",
  "version": "workspace:*",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**packages/app/package.json:**
```json
{
  "name": "@my-monorepo/app",
  "version": "workspace:*",
  "type": "module",
  "dependencies": {
    "@my-monorepo/shared": "workspace:*"
  }
}
```

**Setup commands:**
```bash
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm build

# Type check all packages
pnpm typecheck
```

### Example 3: TypeScript Paths Only (Development)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "@shared": ["../shared/src"],
      "@utils": ["../utils/src"],
      "@types": ["../types/src"]
    }
  }
}
```

**Usage:**
```typescript
import { foo } from '@shared';
import { bar } from '@utils';
import { Baz } from '@types';
```

**Note:** This is compile-time only. Runtime requires additional configuration.

---

## Best Practices

### 1. Always Build Before Linking

```bash
cd ../local-package
npm run build
npm link

cd .
npm link local-package
```

### 2. Use Consistent Module Settings

Ensure all packages use the same module configuration:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### 3. Enable Declaration Generation

Always generate type declarations for linked packages:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "composite": true
  }
}
```

### 4. Use Project References

For complex monorepos, use project references:

```json
{
  "references": [
    { "path": "../shared" },
    { "path": "../utils" }
  ]
}
```

### 5. Verify Resolution Regularly

Add verification to your build process:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "prebuild": "npm run typecheck"
  }
}
```

### 6. Use Conditional Exports

Support both ESM and CommonJS:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### 7. Document Your Setup

Create a README explaining your module resolution setup:

```markdown
# Module Resolution Setup

This project uses npm link for local package development.

## Setup

1. Build shared packages:
   ```bash
   cd packages/shared && npm run build
   ```

2. Link packages:
   ```bash
   cd packages/shared && npm link
   cd packages/app && npm link @my-monorepo/shared
   ```

3. Verify resolution:
   ```bash
   npm run typecheck
   ```
```

### 8. Use Workspaces When Possible

For new projects, prefer workspaces over npm link:

**pnpm:**
```yaml
packages:
  - 'packages/*'
```

**Yarn:**
```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

**npm:**
```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### 9. Test Both Compile-time and Runtime

```bash
# Compile-time check
npx tsc --noEmit

# Runtime check
npx tsx src/index.ts
```

### 10. Use TypeScript 5.0+ Features

If using TypeScript 5.0+, leverage new resolution features:

```json
{
  "compilerOptions": {
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": false,  // Require .js extensions
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true,
    "customConditions": ["development", "production"]
  }
}
```

---

## Quick Reference

### Common Commands

```bash
# Build and link a package
cd ../local-package && npm run build && npm link

# Link into current project
npm link local-package

# Verify TypeScript resolution
npx tsc --noEmit

# Verbose resolution tracing
npx tsc --noEmit --traceResolution

# Watch mode
npx tsc --noEmit --watch

# Check specific file
npx tsc --noEmit src/index.ts

# Unlink
npm unlink local-package
```

### Common tsconfig.json Settings

```json
{
  "compilerOptions": {
    // Module resolution
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Path mapping
    "baseUrl": ".",
    "paths": {
      "@local-pkg": ["../local-pkg/src"]
    },

    // Declaration files
    "declaration": true,
    "declarationMap": true,
    "composite": true,

    // Resolution options
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "preserveSymlinks": false,

    // New TypeScript 5.0+ features
    "allowImportingTsExtensions": false,
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true
  }
}
```

### Common package.json Settings

```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## Troubleshooting Checklist

When experiencing module resolution issues:

- [ ] Is the linked package built? (`npm run build`)
- [ ] Are type declarations generated? (`ls dist/*.d.ts`)
- [ ] Is npm link working? (`ls -la node_modules/linked-package`)
- [ ] Are module settings consistent? (`module: "NodeNext"`)
- [ ] Is package.json type field set? (`"type": "module"`)
- [ ] Are exports configured? (`exports` field)
- [ ] Does tsc --noEmit pass?
- [ ] Are file extensions correct for ES modules?
- [ ] Is baseUrl set for paths?
- [ ] Are project references configured?
- [ ] Is preserveSymlinks set correctly?
- [ ] Are both packages TypeScript 5.0+?

---

## Additional Resources

### Official Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [tsconfig.json Reference](https://www.typescriptlang.org/tsconfig)
- [TypeScript 5.0 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/)

### Community Resources
- [TypeScript Discord](https://discord.gg/typescript)
- [Stack Overflow - TypeScript](https://stackoverflow.com/questions/tagged/typescript)
- [TypeScript GitHub Discussions](https://github.com/microsoft/TypeScript/discussions)

### Tools
- [tsc-alias](https://github.com/justkey007/tsc-alias) - Path alias resolver
- [ts-node](https://github.com/TypeStrong/ts-node) - TypeScript execution
- [tsx](https://github.com/privatenumber/tsx) - TypeScript execution (ESM)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**TypeScript Version:** 5.2.0+
**Node.js Version:** 20.0.0+
