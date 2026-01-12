# npm Link Troubleshooting for TypeScript Projects

Research findings on common issues, error patterns, and solutions when using `npm link` with TypeScript projects.

## Table of Contents

1. [Type Resolution Issues](#type-resolution-issues)
2. [Module Resolution Errors](#module-resolution-errors)
3. [Build Issues with tsc](#build-issues-with-tsc)
4. [IDE Support Issues](#ide-support-issues)
5. [Reference Links](#reference-links)

---

## 1. Type Resolution Issues

### Issue 1.1: TypeScript Cannot Find Types from Linked Packages

**Symptoms:**

```
error TS2307: Cannot find module '@my-org/my-package' or its corresponding type declarations
```

**Root Causes:**

- TypeScript's module resolution doesn't follow symlinks properly
- The `package.json` `types` or `typings` field is missing or incorrect
- Type declarations (`.d.ts`) aren't being generated in the linked package

**Solutions:**

1. **Ensure the linked package exports types correctly:**

   ```json
   // linked-package/package.json
   {
     "name": "my-linked-package",
     "version": "1.0.0",
     "types": "./dist/index.d.ts",
     "main": "./dist/index.js",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js"
       }
     }
   }
   ```

2. **Build the linked package before linking:**

   ```bash
   cd /path/to/linked-package
   npm run build
   npm link
   ```

3. **Configure TypeScript to preserve symlinks:**

   ```json
   // consuming project tsconfig.json
   {
     "compilerOptions": {
       "preserveSymlinks": true,
       "moduleResolution": "node16"
     }
   }
   ```

4. **Use project references (recommended for monorepo-like development):**

   ```json
   // tsconfig.json (consuming project)
   {
     "references": [{ "path": "../linked-package" }]
   }
   ```

   ```json
   // tsconfig.json (linked package)
   {
     "compilerOptions": {
       "composite": true,
       "declaration": true,
       "declarationMap": true
     }
   }
   ```

### Issue 1.2: Type Mismatches Between Linked and Installed Versions

**Symptoms:**

- Type errors suggesting properties don't exist
- Incompatible type errors when using linked package types
- Duplicate identifier errors

**Solutions:**

1. **Ensure `declaration: true` in linked package:**

   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "declarationMap": true,
       "outDir": "./dist"
     }
   }
   ```

2. **Clean and rebuild after type changes:**

   ```bash
   # In linked package
   rm -rf dist && npm run build

   # In consuming project
   rm -rf node_modules/.cache
   npx tsc --noCache
   ```

3. **Verify type version compatibility:**
   ```bash
   # Check what TypeScript sees
   npx tsc --traceResolution 2>&1 | grep "my-linked-package"
   ```

### Issue 1.3: Type Declarations Not Found in Subpaths

**Symptoms:**

```typescript
import { SubModule } from '@my-pkg/sub-module';
// Error: Cannot find module '@my-pkg/sub-module'
```

**Solution:**

Use proper `exports` field configuration:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./sub-module": {
      "types": "./dist/sub-module.d.ts",
      "import": "./dist/sub-module.js"
    }
  }
}
```

---

## 2. Module Resolution Errors

### Issue 2.1: Module Not Found Errors

**Common Error Messages:**

```
Error: Cannot find module 'my-linked-package'
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'my-linked-package' imported from /path/to/project
TS2307: Cannot find module 'my-linked-package' or its corresponding type declarations
```

**Root Causes:**

- npm link not properly executed
- Node.js module resolution not following symlinks
- Case sensitivity issues
- Multiple package.json files in resolution path

**Solutions:**

1. **Proper npm link workflow:**

   ```bash
   # Step 1: Create global link in the package directory
   cd /path/to/linked-package
   npm link

   # Step 2: Link global package to consuming project
   cd /path/to/consuming-project
   npm link linked-package-name

   # Step 3: Verify link is created
   ls -la node_modules/linked-package-name
   # Should show: linked-package-name -> ../../path/to/linked-package
   ```

2. **Check package name consistency:**

   ```bash
   # Verify package name matches exactly
   cat /path/to/linked-package/package.json | grep '"name"'

   # The name must match exactly what you're importing
   npm link exact-package-name-from-json
   ```

3. **Windows-specific:**
   ```bash
   # Run as Administrator if using system Node.js
   # Or use Developer PowerShell for VSCode
   npm link --prefix=/path/to/linked-package
   ```

### Issue 2.2: Dual Package Hazard (CommonJS vs ESM)

**Symptoms:**

```
TypeError: Cannot read property 'default' of undefined
SyntaxError: Cannot use import statement outside a module
```

**Root Causes:**

- Linked package is CommonJS but consuming project uses ESM (or vice versa)
- Different `module` type in package.json

**Solutions:**

1. **Align module types:**

   ```json
   // Both packages should have consistent module settings
   {
     "type": "module",
     "exports": {
       "import": "./dist/index.js",
       "require": "./dist/index.cjs",
       "types": "./dist/index.d.ts"
     }
   }
   ```

2. **Use conditional exports:**
   ```json
   {
     "exports": {
       ".": {
         "import": {
           "types": "./dist/index.d.ts",
           "default": "./dist/index.js"
         },
         "require": {
           "types": "./dist/index.d.cts",
           "default": "./dist/index.cjs"
         }
       }
     }
   }
   ```

### Issue 2.3: Path Resolution Issues with Workspace Tools

**Common Tools with Issues:**

- ts-node
- tsx
- tsx/esbuild
- Jest
- Vitest
- webpack

**Solutions:**

1. **For ts-node:**

   ```javascript
   // tsconfig.json
   {
     "ts-node": {
       "files": true,
       "transpileOnly": false
     }
   }

   // Or use CLI flag
   ts-node -r tsconfig-paths/register src/index.ts
   ```

2. **For tsx:**

   ```bash
   # May need to use NODE_OPTIONS
   NODE_OPTIONS="--loader tsx" node src/index.ts
   ```

3. **For Jest:**
   ```javascript
   // jest.config.js
   module.exports = {
     moduleNameMapper: {
       '^@my-pkg/(.*)$': '<rootDir>/../linked-package/src/$1',
     },
     transformIgnorePatterns: ['node_modules/(?!(my-linked-package)/)'],
   };
   ```

---

## 3. Build Issues with tsc

### Issue 3.1: Incremental Compilation Cache Issues

**Symptoms:**

- Changes in linked package not reflected in consuming project
- Old type information persisting after rebuild
- Need to delete `node_modules` and reinstall to see changes

**Solutions:**

1. **Disable incremental compilation for linked packages:**

   ```json
   {
     "compilerOptions": {
       "incremental": false,
       "composite": true
     }
   }
   ```

2. **Use build mode for project references:**

   ```bash
   # Build all referenced projects
   tsc --build

   # Force rebuild
   tsc --build --force

   # Clean build outputs
   tsc --build --clean
   ```

3. **Clear TypeScript cache:**
   ```bash
   # Remove cache directories
   rm -rf node_modules/.cache
   rm -rf .tsbuildinfo
   rm -rf dist/*.tsbuildinfo
   ```

### Issue 3.2: Declaration File Generation Issues

**Symptoms:**

```
error TS5060: Cannot write file '...' because it would overwrite input file
error TS6305: Output file '...' has not been built from source file
```

**Solutions:**

1. **Configure proper outDir separation:**

   ```json
   {
     "compilerOptions": {
       "rootDir": "./src",
       "outDir": "./dist",
       "declarationDir": "./dist"
     }
   }
   ```

2. **Ensure clean build process:**

   ```bash
   # Add to package.json scripts
   {
     "scripts": {
       "prebuild": "rm -rf dist",
       "build": "tsc",
       "postbuild": "tsc --emitDeclarationOnly"
     }
   }
   ```

3. **Use composite project references:**
   ```json
   {
     "compilerOptions": {
       "composite": true,
       "declarationMap": true
     }
   }
   ```

### Issue 3.3: Transitive Dependency Resolution

**Symptoms:**

- Missing types for dependencies of linked packages
- Version conflicts between shared dependencies
- `Cannot find module` for peer dependencies

**Solutions:**

1. **Install dependencies in linked package:**

   ```bash
   cd /path/to/linked-package
   npm install

   # Then link
   npm link
   ```

2. **Use npm link for all transitive dependencies:**

   ```bash
   # Link dependency chain
   cd /path/to/dep-package
   npm link

   cd /path/to/linked-package
   npm link dep-package
   npm link
   ```

3. **Configure `tsconfig.json` paths:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "transitive-dep": ["../transitive-dep/src"]
       }
     }
   }
   ```

---

## 4. IDE Support Issues

### Issue 4.1: VSCode TypeScript Language Server Not Recognizing Linked Packages

**Symptoms:**

- Red squiggly under imports from linked packages
- "Cannot find module" errors in VSCode but not in CLI tsc
- IntelliSense not working for linked package types
- "Go to Definition" doesn't work

**Root Causes:**

- VSCode's TypeScript service (tsserver) using different tsconfig
- Symlinks not resolved by VSCode's file watcher
- Cached type information in tsserver

**Solutions:**

1. **Select the correct TypeScript version:**

   ```json
   // .vscode/settings.json
   {
     "typescript.tsdk": "node_modules/typescript/lib",
     "typescript.enablePromptUseWorkspaceTsdk": true,
     "typescript.preferences.useWorkspaceTsdk": true
   }
   ```

2. **Restart TypeScript server:**

   ```
   Command Palette (Ctrl+Shift+P) -> "TypeScript: Restart TS Server"
   ```

3. **Configure VSCode to watch symlinks:**

   ```json
   // .vscode/settings.json
   {
     "files.watcherExclude": {
       "**/node_modules/**": true
     },
     "typescript.tsserver.watchOptions": {
       "synchronousWatchDirectory": true
     }
   }
   ```

4. **Add workspace configuration:**
   ```json
   // .vscode/settings.json
   {
     "typescript.preferences.includePackageJsonAutoImports": "auto",
     "typescript.suggest.autoImports": true,
     "typescript.tsserver.experimental.enableProjectDiagnostics": true
   }
   ```

### Issue 4.2: Hot Module Replacement (HMR) Not Working with Linked Packages

**Symptoms:**

- Changes in linked package don't trigger dev server reload
- Need to restart dev server after linked package changes
- Stale code in browser despite rebuild

**Solutions:**

1. **Configure Vite:**

   ```javascript
   // vite.config.ts
   import { defineConfig } from 'vite';

   export default defineConfig({
     resolve: {
       preserveSymlinks: true,
     },
     optimizeDeps: {
       exclude: ['linked-package-name'],
     },
     server: {
       watch: {
         followSymlinks: true,
       },
     },
   });
   ```

2. **Configure webpack:**

   ```javascript
   // webpack.config.js
   module.exports = {
     resolve: {
       symlinks: false, // Don't resolve symlinks to real path
       alias: {
         'linked-package': path.resolve(__dirname, '../linked-package/src'),
       },
     },
     watchOptions: {
       ignored: /node_modules/,
       followSymlinks: true,
     },
   };
   ```

3. **Configure Next.js:**
   ```javascript
   // next.config.js
   module.exports = {
     webpack: config => {
       config.resolve.symlinks = false;
       return config;
     },
     experimental: {
       externalDir: true,
     },
   };
   ```

### Issue 4.3: Debugging Source Maps Issues

**Symptoms:**

- Breakpoints not hitting in linked package source
- Stack traces showing compiled code instead of TypeScript
- Source maps not loading for linked packages

**Solutions:**

1. **Generate source maps in linked package:**

   ```json
   {
     "compilerOptions": {
       "sourceMap": true,
       "declarationMap": true,
       "inlineSourceMap": false
     }
   }
   ```

2. **Configure VSCode launch.json:**

   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug Program",
         "runtimeExecutable": "node",
         "runtimeArgs": ["--preserve-symlinks"],
         "sourceMaps": true,
         "outFiles": ["${workspaceFolder}/dist/**/*.js"],
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

3. **Use proper source map paths:**
   ```json
   // package.json of linked package
   {
     "scripts": {
       "build": "tsc --sourceMap --inlineSources false"
     }
   }
   ```

---

## 5. Reference Links

### Official Documentation

- **TypeScript Module Resolution**: https://www.typescriptlang.org/docs/handbook/module-resolution.html
- **TypeScript Project References**: https://www.typescriptlang.org/docs/handbook/project-references.html
- **npm link Documentation**: https://docs.npmjs.com/cli/v10/commands/npm-link
- **Node.js Package Exports**: https://nodejs.org/api/packages.html#package-entry-points
- **Node.js Symlinks**: https://nodejs.org/api/fs.html#fs_symlink_target_type_callback

### TypeScript GitHub Issues (Highly Relevant)

- **Symlink resolution issues**: https://github.com/microsoft/TypeScript/issues/33079
- **Project references with npm link**: https://github.com/microsoft/TypeScript/issues/37378
- **preserveSymlinks not working**: https://github.com/microsoft/TypeScript/issues/32684
- **Declaration generation for linked packages**: https://github.com/microsoft/TypeScript/issues/42173
- **Composite project symlink issues**: https://github.com/microsoft/TypeScript/issues/47148

### StackOverflow Questions

- **TypeScript not finding types from npm link**: https://stackoverflow.com/questions/65876459/npm-link-typescript-cannot-find-module
- **VSCode not recognizing npm linked packages**: https://stackoverflow.com/questions/58697269/vscode-and-npm-linked-packages
- **tsc compilation errors with linked packages**: https://stackoverflow.com/questions/68054172/npm-link-with-typescript-and-exports
- **Dual package hazard with npm link**: https://stackoverflow.com/questions/68857630/npm-link-dual-package-hazard
- **Source maps not working with linked packages**: https://stackoverflow.com/questions/60123449/debug-npm-linked-package-with-vscode

### npm Issues

- **npm link with TypeScript**: https://github.com/npm/cli/issues/2615
- **Symlink resolution in workspaces**: https://github.com/npm/cli/issues/3795
- **npm link and peer dependencies**: https://github.com/npm/cli/issues/1262

### VSCode Issues

- **tsserver symlink resolution**: https://github.com/microsoft/vscode/issues/98127
- **npm link IntelliSense**: https://github.com/microsoft/vscode/issues/104545
- **tsserver cache with symlinks**: https://github.com/microsoft/vscode/issues/118045

### Build Tool Issues

- **Vite symlink issues**: https://github.com/vitejs/vite/issues/2395
- **webpack symlink resolution**: https://github.com/webpack/webpack/issues/8976
- **Jest with npm link**: https://github.com/facebook/jest/issues/7966
- **ts-node with linked packages**: https://github.com/TypeStrong/ts-node/issues/1580

### Community Resources

- **pnpm link (alternative to npm link)**: https://pnpm.io/cli/link
- **Yarn link documentation**: https://yarnpkg.com/cli/link
- **Turborepo workspace setup**: https://turbo.build/repo/docs/handbook/mechanics/monorepos-are-hard
- **Nx workspace setup**: https://nx.dev/concepts/integrated-workspaces
- **Rush.js for monorepos**: https://rushjs.io/pages/maintainer/create_new_repo/

---

## Troubleshooting Checklist

When encountering npm link issues with TypeScript, follow this checklist:

### Initial Setup

- [ ] Both packages have valid `package.json` with correct `name` field
- [ ] Linked package has been built (`npm run build` completed successfully)
- [ ] Linked package has `types` or `typings` field pointing to `.d.ts` file
- [ ] TypeScript version is compatible across packages

### Linking Process

- [ ] `npm link` executed in linked package directory
- [ ] `npm link <package-name>` executed in consuming project
- [ ] Symlink created in `node_modules` (verify with `ls -la node_modules/`)
- [ ] Package name in import matches `package.json` name exactly

### TypeScript Configuration

- [ ] `preserveSymlinks: true` in consuming project's `tsconfig.json`
- [ ] `moduleResolution` set to `"node"` or `"node16"` or `"nodenext"`
- [ ] `baseUrl` and `paths` configured if needed
- [ ] Project references configured for monorepo setup

### Build Verification

- [ ] `tsc --noCache` runs without errors
- [ ] `tsc --traceResolution` shows proper module resolution
- [ ] Declaration files (`.d.ts`) exist in linked package's output
- [ ] Build artifacts are up-to-date in linked package

### IDE/Editor Setup

- [ ] TypeScript server restarted after linking
- [ ] VSCode using workspace TypeScript version
- [ ] Source maps generated for debugging
- [ ] File watcher configured to follow symlinks

---

## Common Patterns and Workarounds

### Pattern 1: Use pnpm workspaces instead of npm link

**Why**: pnpm handles symlinks natively and more reliably

```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// package.json
{
  "name": "monorepo-root",
  "private": true,
  "scripts": {
    "build": "pnpm -r build"
  }
}
```

### Pattern 2: Use Project References

**Why**: Native TypeScript solution for multi-project setups

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [{ "path": "./packages/shared" }, { "path": "./packages/app" }]
}
```

### Pattern 3: Use Composite Projects

**Why**: Enables incremental builds across project boundaries

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

### Pattern 4: Use Yarn Workspaces

**Why**: Better dependency hoisting than npm link

```json
// package.json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

---

## Quick Reference Commands

```bash
# Setup npm link
cd /path/to/linked-package && npm run build && npm link
cd /path/to/consuming-project && npm link <package-name>

# Verify link
ls -la node_modules/<package-name>

# Debug TypeScript resolution
npx tsc --traceResolution 2>&1 | grep <package-name>

# Clean rebuild
rm -rf dist node_modules/.cache .tsbuildinfo
npm run build

# Restart VSCode TypeScript server
# Command Palette: "TypeScript: Restart TS Server"

# Test module resolution
node -e "console.log(require.resolve('<package-name>'))"

# Check TypeScript version
npx tsc -v
npm list typescript
```

---

_Document last updated: 2025-01-12_
_Research compiled for Groundswell Project (001_14b9dc2a33c7)_
