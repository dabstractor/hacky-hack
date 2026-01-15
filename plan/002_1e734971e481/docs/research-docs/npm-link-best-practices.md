# npm Link Configuration and Best Practices for Local Package Development

**Research Date:** 2025-01-15
**Last Updated:** 2025-01-15
**Status:** Comprehensive Research Document

## Table of Contents

1. [Overview](#overview)
2. [Official Documentation](#official-documentation)
3. [How npm Link Works](#how-npm-link-works)
4. [Basic Usage](#basic-usage)
5. [TypeScript-Specific Configuration](#typescript-specific-configuration)
6. [Verification Commands](#verification-commands)
7. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
8. [npm Link vs Path Aliases](#npm-link-vs-path-aliases)
9. [Best Practices](#best-practices)
10. [Advanced Scenarios](#advanced-scenarios)
11. [Alternative Approaches](#alternative-approaches)
12. [Resources and References](#resources-and-references)

---

## Overview

`npm link` is a development tool that creates symbolic links between packages, enabling local package development and testing without publishing to a registry. It's particularly useful for:

- Developing and testing local packages before publishing
- Debugging issues in dependencies
- Working on monorepo architectures
- Testing package integration across multiple projects

**Key Benefits:**
- Real-time updates during development
- No need to publish to npm registry
- Facilitates iterative development workflow

---

## Official Documentation

### npm Documentation

- **npm link command reference:**
  - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
  - Official documentation for the `npm link` command
  - Covers syntax, options, and usage examples

- **npm link development workflow:**
  - URL: https://docs.npmjs.com/cli/v10/using-npm/developers
  - Section: "Linking packages"
  - Best practices for package developers

- **npm folders documentation:**
  - URL: https://docs.npmjs.com/cli/v10/configuring-npm/folders
  - Explains where global packages are installed
  - Critical for understanding symlink locations

### Node.js Documentation

- **File System module (fs):**
  - URL: https://nodejs.org/api/fs.html
  - Section: "fs.symlink()" and "fs.readlink()"
  - Understanding how symlinks work at the OS level

- **Module resolution:**
  - URL: https://nodejs.org/api/modules.html
  - Section: "Loading from node_modules"
  - How Node resolves package imports

---

## How npm Link Works

### The Two-Step Process

`npm link` creates a two-level symlink structure:

1. **Global Link:** Creates a symlink from the global `node_modules` to your local package
2. **Local Link:** Creates a symlink from your project's `node_modules` to the global symlink

### Symlink Structure

```
Global npm prefix (e.g., /usr/local/lib/node_modules/)
└── your-package -> /path/to/your/local/package

Project directory (e.g., /home/user/projects/your-app/)
└── node_modules/
    └── your-package -> /usr/local/lib/node_modules/your-package
```

### How It Works Internally

1. **First step (`npm link` in package directory):**
   - Registers the package globally
   - Creates symlink: `{prefix}/lib/node_modules/<package-name> -> <package-path>`

2. **Second step (`npm link <package-name>` in consuming project):**
   - Links the globally registered package into your project
   - Creates symlink: `<project>/node_modules/<package-name> -> {prefix}/lib/node_modules/<package-name>`

---

## Basic Usage

### Step 1: Create Global Link

In your local package directory:

```bash
cd /path/to/your-package
npm link
```

**Output example:**
```
audited 1 package in 0.123s
found 0 vulnerabilities
/home/user/.nvm/versions/node/v20.0.0/lib/node_modules/your-package -> /path/to/your-package
```

### Step 2: Link in Consuming Project

In your project that will use the package:

```bash
cd /path/to/your-project
npm link your-package
```

**Output example:**
```
/home/user/projects/your-project/node_modules/your-package -> /home/user/.nvm/versions/node/v20.0.0/lib/node_modules/your-package
```

### Step 3: Verify the Link

```bash
cd /path/to/your-project
npm list your-package
```

### Step 4: Unlink When Done

```bash
# In consuming project
npm unlink your-package

# In package directory
npm unlink -g your-package
```

---

## TypeScript-Specific Configuration

### Essential package.json Fields

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "prelink": "npm run build"
  }
}
```

### TypeScript Configuration

**tsconfig.json for package development:**

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
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Critical TypeScript options for npm link:**

- `declaration: true` - Generates `.d.ts` files for type checking
- `declarationMap: true` - Enables source map support for IDE navigation
- `moduleResolution: "NodeNext"` - Proper ESM/CommonJS resolution
- `outDir` - Must point to where your built files are located

### Development Workflow with TypeScript

```bash
# 1. Build the package first
cd /path/to/your-package
npm run build

# 2. Create global link
npm link

# 3. In watch mode for development
npm run build:watch
# OR
tsc --watch

# 4. In consuming project
cd /path/to/your-project
npm link your-package

# 5. Test the integration
npm run test
```

### Common TypeScript Issues

#### Issue 1: Module Not Found

**Symptom:** TypeScript cannot find the linked package

**Solution:** Ensure `moduleResolution` is set to `"NodeNext"` in tsconfig.json:

```json
{
  "compilerOptions": {
    "moduleResolution": "NodeNext"
  }
}
```

#### Issue 2: Type Definitions Not Found

**Symptom:** IntelliSense doesn't work for linked package

**Solution:** Verify types field in package.json:

```json
{
  "types": "./dist/index.d.ts"
}
```

**And ensure TypeScript declaration generation is enabled:**

```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

#### Issue 3: Duplicate Type Definitions

**Symptom:** Multiple versions of types causing conflicts

**Solution:** Use `npm ls` to check for duplicates and consider using path aliases instead (see [npm Link vs Path Aliases](#npm-link-vs-path-aliases)).

---

## Verification Commands

### Check Global Links

```bash
# List all globally linked packages
npm list -g --depth=0 --link=true

# Check specific package
npm list -g your-package

# View global npm prefix
npm config get prefix

# List global node_modules
ls -la $(npm config get prefix)/lib/node_modules/
```

### Check Local Links

```bash
# In your project directory
npm list

# Check specific linked package
npm list your-package

# View all linked packages
npm list --depth=0 | grep '@'
```

### Verify Symlinks (Linux/Mac)

```bash
# Check if node_modules entry is a symlink
ls -la node_modules/your-package

# Output should show something like:
# your-package -> /usr/local/lib/node_modules/your-package

# Follow the symlink chain
readlink -f node_modules/your-package

# Verify symlink target exists
test -L node_modules/your-package && echo "Is symlink" || echo "Not symlink"

# View symlink details
stat node_modules/your-package
```

### Verify Symlinks (Windows PowerShell)

```powershell
# Check if node_modules entry is a symlink
Get-Item node_modules\your-package | Select-Object LinkType, Target

# View symlink details
Get-Item node_modules\your-package | Format-List *

# List all junctions and symlinks
Get-ChildItem node_modules | Where-Object { $_.LinkType -ne '' } | Format-Table Name, LinkType, Target
```

### Test Package Resolution

```bash
# Check how npm resolves the package
npm explain your-package

# Check package.json dependencies
cat package.json | grep -A 10 '"dependencies"'
cat package.json | grep -A 10 '"devDependencies"'

# Verify package can be required
node -e "console.log(require.resolve('your-package'))"

# For ES modules
node -e "import.meta.resolve('your-package').then(console.log)"
```

### IDE Verification

**VS Code:**
1. Open the linked file in your project
2. Right-click and select "Go to Definition"
3. Should navigate to the linked package's source

**TypeScript verification:**
```bash
# Test TypeScript can resolve the module
npx tsc --noEmit --traceResolution 2>&1 | grep your-package
```

---

## Common Issues and Troubleshooting

### Issue 1: Permission Denied

**Symptom:**
```
npm ERR! Error: EACCES: permission denied
```

**Solutions:**

**Option A: Fix npm permissions (Recommended)**
```bash
# Get npm prefix
npm config get prefix

# Change ownership of npm directories
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Option B: Use a version manager**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js without sudo
nvm install node
```

**Option C: Configure npm to use a different directory**
```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH=~/.npm-global/bin:$PATH
```

### Issue 2: Symlink Not Created

**Symptom:** No symlink appears in node_modules after `npm link`

**Troubleshooting steps:**

```bash
# 1. Verify package has a valid name
cat package.json | grep '"name"'

# 2. Ensure package is linked globally first
cd /path/to/your-package
npm link

# 3. Check global link was created
npm list -g --depth=0

# 4. Try unlinking and relinking
npm unlink -g your-package
npm link

# 5. In project directory
cd /path/to/your-project
npm unlink your-package
npm link your-package
```

**Common causes:**
- Package name doesn't match between package.json and link command
- Multiple global npm prefixes
- npm cache corruption

**Solution for cache issues:**
```bash
npm cache clean --force
npm link
```

### Issue 3: Package Not Found After Linking

**Symptom:** `Cannot find module 'your-package'`

**Troubleshooting:**

```bash
# 1. Verify link was created
npm list your-package

# 2. Check if package is actually linked (not installed)
npm list your-package --depth=0

# 3. Verify symlink chain
ls -la node_modules/your-package
readlink -f node_modules/your-package

# 4. Check package.json in linked package
cat $(readlink -f node_modules/your-package)/package.json

# 5. Ensure main entry point exists
ls -la $(readlink -f node_modules/your-package)/dist/index.js
```

**Solution:**
```bash
# Rebuild the link
cd /path/to/your-package
npm unlink -g
npm run build
npm link

cd /path/to/your-project
npm unlink your-package
npm link your-package
```

### Issue 4: Multiple Versions/Instances

**Symptom:** Multiple instances of React, hooks errors, or version conflicts

**Example error:**
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Cause:** npm link creates a symlink, but npm may install a separate version in node_modules

**Troubleshooting:**
```bash
# Check for duplicates
npm ls your-package

# View all instances
find node_modules -name "your-package" -type l -o -name "your-package" -type d

# Check peer dependencies
npm ls your-package --json
```

**Solutions:**

**Option A: Use npm link with --save flag**
```bash
npm link your-package --save
```

**Option B: Remove duplicate installations**
```bash
rm -rf node_modules/your-package
npm link your-package
```

**Option C: Use path aliases instead (see below)**

### Issue 5: Changes Not Reflected

**Symptom:** Changes in linked package don't appear in consuming project

**Troubleshooting:**

```bash
# 1. Verify symlink is still valid
ls -la node_modules/your-package

# 2. Check if you need to rebuild
cd /path/to/your-package
npm run build

# 3. Ensure TypeScript files are compiled
ls -la dist/

# 4. Check file timestamps
stat dist/index.js
```

**Solution:**
```bash
# In package directory, use watch mode
npm run build:watch

# Or use tsx for direct execution (if using TypeScript)
npm run dev
```

### Issue 6: ESM/CommonJS Compatibility

**Symptom:** `SyntaxError: Cannot use import statement outside a module`

**Cause:** Package type mismatch between linked package and consuming project

**Solution:**

Ensure consistent package.json configuration:

**In your-package/package.json:**
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Or if using CommonJS:**
```json
{
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

### Issue 7: Path Length Issues (Windows)

**Symptom:** `ENAMETOOLONG: name too long`

**Cause:** Windows has a 260 character path limit

**Solution:**

```powershell
# Enable long paths in Windows 10+
# Run PowerShell as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or use npm with --prefix option
npm link --prefix C:\short\path
```

### Issue 8: Global Link Location Confusion

**Symptom:** Can't find where npm link created the global symlink

**Solution:**

```bash
# Find npm global prefix
npm config get prefix

# View global node_modules
ls -la $(npm config get prefix)/lib/node_modules/

# View npm bin directory
ls -la $(npm config get prefix)/bin/

# Check if package is globally linked
npm list -g --depth=0 | grep your-package
```

---

## npm Link vs Path Aliases

### Comparison Table

| Feature | npm Link | Path Aliases |
|---------|----------|--------------|
| **Setup** | Two-step process (global + local) | Single configuration file |
| **Scope** | Project-specific | Tool-specific (Vitest, TypeScript, etc.) |
| **Type Safety** | Requires proper package.json | Full TypeScript support |
| **Hot Reload** | Automatic (if watching) | Automatic (if watching) |
| **Runtime Resolution** | Works at runtime | Build-time resolution only |
| **Node.js Support** | Native Node.js resolution | Requires bundler/tool |
| **Dependency Management** | Full npm integration | Manual management |
| **Best For** | Testing published packages | Monorepo development |

### Path Aliases in vitest.config.ts

**Your current configuration:**

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '#': new URL('./src/agents', import.meta.url).pathname,
      groundswell: new URL('../groundswell/dist/index.js', import.meta.url).pathname,
    },
    extensions: ['.ts', '.js', '.tsx'],
  },
});
```

**Pros of Path Aliases:**
- No global symlinks needed
- Works seamlessly in monorepos
- Better TypeScript integration
- No risk of duplicate dependencies
- Works with bundlers (Vite, esbuild, etc.)

**Cons of Path Aliases:**
- Not understood by Node.js runtime without a bundler
- Requires configuration in each tool (Vitest, TypeScript, etc.)
- Can't test as if package was published

### Path Aliases in TypeScript

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "#/*": ["src/agents/*"],
      "groundswell": ["../groundswell/src/index.ts"]
    }
  }
}
```

**Important:** TypeScript paths are for compile-time only and don't affect runtime resolution.

### When to Use Each

**Use npm link when:**
- Testing a package as it will be consumed after publishing
- Need to verify package.json configuration
- Testing with Node.js runtime directly
- Validating peer dependencies
- Testing in isolation (separate projects)

**Use path aliases when:**
- Developing in a monorepo
- Need hot-reload without rebuilding
- Want to avoid global npm configuration
- Working with bundlers (Vite, Webpack, esbuild)
- Prefer simpler configuration

### Combining Both Approaches

You can use both in different scenarios:

```typescript
// vitest.config.ts - Use path aliases for unit tests
export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});

// For integration tests, use npm link to simulate published package
```

---

## Best Practices

### 1. Always Build Before Linking

**Bad:**
```bash
npm link
```

**Good:**
```bash
npm run build
npm link
```

**Even better - automate with prepublishOnly:**
```json
{
  "scripts": {
    "prepublishOnly": "npm run build",
    "prelink": "npm run build"
  }
}
```

### 2. Use Semantic Versioning

Even during development, use proper versions:

```json
{
  "version": "1.0.0-alpha.1",
  "scripts": {
    "version": "npm run build"
  }
}
```

### 3. Maintain Clean package.json

**Essential fields:**
```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "Clear description of package",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "keywords": ["relevant", "keywords"],
  "author": "Your Name",
  "license": "MIT"
}
```

### 4. Test Before Publishing

Create a test script:

```json
{
  "scripts": {
    "test:link": "npm run build && npm link && cd ../test-project && npm link your-package && npm test"
  }
}
```

### 5. Use .npmignore

**Create .npmignore:**
```
# Source files
src/
tests/
*.test.ts
*.spec.ts

# Development files
tsconfig.json
vitest.config.ts
.eslintrc.js

# Documentation
docs/
*.md
!README.md

# CI/CD
.github/
.gitlab-ci.yml

# IDE
.vscode/
.idea/
```

### 6. Document Local Development

**Create DEVELOPMENT.md:**
```markdown
# Local Development

## Linking this package locally

1. Build the package:
   ```bash
   npm run build
   ```

2. Create global link:
   ```bash
   npm link
   ```

3. In your project:
   ```bash
   npm link your-package-name
   ```

4. To unlink:
   ```bash
   npm unlink your-package-name
   ```

## Development workflow

For active development, use watch mode:
```bash
npm run build:watch
```

Changes will be reflected immediately in linked projects.
```

### 7. Validate Package Configuration

```bash
# Validate package.json
npm pkg fix

# Check for issues
npm audit

# Verify package can be published (dry run)
npm publish --dry-run
```

### 8. Use Consistent Import Styles

**Bad (mixed styles):**
```typescript
import { foo } from 'bar';
import { baz } from './local';
import { qux } from '@scope/package';
```

**Good (consistent):**
```typescript
import { foo } from 'bar';
import { baz } from '@/local';
import { qux } from '@scope/package';
```

### 9. Handle Dependencies Properly

**In package.json:**
```json
{
  "dependencies": {
    "required-package": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

**Best practices:**
- Only runtime dependencies in `dependencies`
- Development tools in `devDependencies`
- Libraries that consumers must provide in `peerDependencies`

### 10. Clean Up After Development

```bash
# Create a cleanup script
# scripts/unlink.sh
#!/bin/bash
PACKAGE_NAME=$(node -p "require('./package.json').name")
echo "Unlinking $PACKAGE_NAME..."
npm unlink -g $PACKAGE_NAME
echo "Unlinked $PACKAGE_NAME from global scope"
```

**Add to package.json:**
```json
{
  "scripts": {
    "unlink": "./scripts/unlink.sh"
  }
}
```

---

## Advanced Scenarios

### Scenario 1: Monorepo with npm link

**Problem:** Need to test packages across a monorepo before publishing

**Solution:**

```bash
# Package A depends on Package B
cd packages/package-b
npm run build
npm link

cd ../package-a
npm link package-b
npm run build
npm link

cd apps/app-1
npm link package-a
```

**Better approach:** Use workspaces instead (npm v7+, pnpm, or Yarn)

### Scenario 2: Testing Multiple Versions

**Problem:** Need to test against different dependency versions

**Solution:**

```bash
# Create test project with specific version
mkdir test-project-old
cd test-project-old
npm init -y
npm install dependency@1.0.0
npm link your-package

# Create another test project
mkdir test-project-new
cd test-project-new
npm init -y
npm install dependency@2.0.0
npm link your-package
```

### Scenario 3: Continuous Integration

**Problem:** Need to test linked packages in CI

**Solution:**

```yaml
# .github/workflows/test-link.yml
name: Test Linked Package

on: [push, pull_request]

jobs:
  test-link:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Create global link
        run: npm link

      - name: Setup test project
        run: |
          mkdir /tmp/test-project
          cd /tmp/test-project
          npm init -y
          npm link your-package-name

      - name: Run tests
        run: |
          cd /tmp/test-project
          npm test
```

### Scenario 4: Conditional Linking

**Problem:** Only link during development, not in production

**Solution:**

```bash
# In package.json
{
  "scripts": {
    "postinstall": "if [ \"$NODE_ENV\" != \"production\" ]; then npm link your-package || true; fi"
  }
}
```

**Better:** Use environment-specific configuration

```typescript
// config/imports.ts
const USE_LINK = process.env.NODE_ENV === 'development';

export const getPackagePath = () => {
  if (USE_LINK) {
    return 'your-package'; // Will use npm link
  }
  return 'your-package'; // Will use node_modules
};
```

### Scenario 5: Debugging Linked Packages

**Problem:** Need to debug issues in linked package

**Solution:**

```bash
# 1. Enable source maps in TypeScript
# tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false
  }
}

# 2. Run with inspect
cd /path/to/your-project
node --inspect-brk node_modules/.bin/vest run

# 3. Or use Chrome DevTools
node --inspect node_modules/.bin/vest run
```

---

## Alternative Approaches

### 1. npm pack

**Purpose:** Test package as it will be published

```bash
# Create tarball
npm pack

# Install in test project
cd /path/to/test-project
npm install /path/to/your-package-1.0.0.tgz
```

**Pros:**
- Tests exact published artifact
- No global configuration needed
- Simulates real installation

**Cons:**
- Requires rebuilding for each change
- Slower feedback loop

### 2. Verdaccio (Local npm Registry)

**Purpose:** Run a local npm registry

```bash
# Install Verdaccio
npm install -g verdaccio

# Start registry
verdaccio

# Publish to local registry
npm publish --registry http://localhost:4873

# Install from local registry
npm install your-package --registry http://localhost:4873
```

**Pros:**
- Simulates real registry
- Tests full publish workflow
- Multiple packages can publish

**Cons:**
- Additional setup required
- Running service required

### 3. pnpm link

**Purpose:** pnpm's alternative to npm link

```bash
# In package directory
cd /path/to/your-package
pnpm link --global

# In consuming project
cd /path/to/your-project
pnpm link --global your-package
```

**Pros:**
- Faster than npm
- Better disk space usage
- More reliable symlink handling

**Cons:**
- Requires pnpm
- Different syntax

### 4. Yarn link

**Purpose:** Yarn's alternative to npm link

```bash
# In package directory
cd /path/to/your-package
yarn link

# In consuming project
cd /path/to/your-project
yarn link your-package
```

**Pros:**
- Similar to npm link
- Works with Yarn workspaces

**Cons:**
- Requires Yarn
- May conflict with npm link

### 5. npm workspaces

**Purpose:** Native monorepo support (npm v7+)

**package.json:**
```json
{
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "test": "npm run test --workspaces"
  }
}
```

**Pros:**
- Native npm support
- No symlinks needed
- Single package.json

**Cons:**
- Requires project restructuring
- Only npm v7+

### 6. TypeScript Project References

**Purpose:** TypeScript native monorepo support

**tsconfig.json:**
```json
{
  "references": [
    { "path": "../packages/package-a" },
    { "path": "../packages/package-b" }
  ]
}
```

**packages/package-a/tsconfig.json:**
```json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist"
  },
  "references": []
}
```

**Pros:**
- Fast incremental compilation
- Type checking across projects
- No runtime needed

**Cons:**
- TypeScript-only
- Requires careful configuration

---

## Resources and References

### Official Documentation

1. **npm link command**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
   - Official npm documentation for the link command

2. **npm developers guide**
   - URL: https://docs.npmjs.com/cli/v10/using-npm/developers
   - Section on linking packages for developers

3. **npm folders documentation**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/folders
   - Understanding where packages are installed

4. **npm package.json documentation**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
   - Complete reference for package.json fields

5. **Node.js module resolution**
   - URL: https://nodejs.org/api/modules.html
   - How Node.js resolves modules

### TypeScript Resources

6. **TypeScript module resolution**
   - URL: https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution
   - Understanding TypeScript's module resolution

7. **TypeScript declaration files**
   - URL: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
   - Best practices for .d.ts files

8. **TypeScript project references**
   - URL: https://www.typescriptlang.org/docs/handbook/project-references.html
   - Using TypeScript for monorepo development

### Tool-Specific Documentation

9. **Vitest configuration**
   - URL: https://vitest.dev/config/
   - Configuring path aliases in Vitest

10. **Vite resolve configuration**
    - URL: https://vitejs.dev/config/shared-options.html#resolve-alias
    - Path aliases in Vite

11. **esbuild configuration**
    - URL: https://esbuild.github.io/api/#resolve-extensions
    - Module resolution in esbuild

### Community Resources

12. **npm link troubleshooting**
    - URL: https://github.com/npm/npm/issues
    - GitHub issues with common problems and solutions

13. **Symlink best practices**
    - URL: https://nodejs.org/api/fs.html#fssymlinktarget-path-type-callback
    - Understanding symlinks in Node.js

14. **Monorepo patterns**
    - URL: https://monorepo.tools/
    - Comparison of monorepo tools

### Blog Posts and Tutorials

15. **"Understanding npm link"**
    - URL: https://medium.com/@alexis.manny/understanding-npm-link-60182a1a3ed8
    - Detailed explanation of how npm link works

16. **"npm link: The Good, The Bad, and The Ugly"**
    - URL: https://www.joshwcomeau.com/blog/monorepos-npm-link/
    - Common pitfalls and alternatives

17. **"TypeScript and npm link"**
    - URL: https://davideguida.com/how-to-properly-use-npm-link-with-typescript-projects/
    - TypeScript-specific npm link issues

### Testing Resources

18. **Testing local packages**
    - URL: https://jestjs.io/docs/configuration#namemapper-string-string
    - Testing with moduleNameMapper

19. **Vitest testing guide**
    - URL: https://vitest.dev/guide/
    - Using Vitest with linked packages

---

## Quick Reference Commands

### Basic Workflow

```bash
# In package directory
cd /path/to/your-package
npm run build
npm link

# In consuming project
cd /path/to/your-project
npm link your-package

# Verify
npm list your-package
ls -la node_modules/your-package

# Cleanup
npm unlink your-package
cd /path/to/your-package
npm unlink -g your-package
```

### Troubleshooting Commands

```bash
# Check global npm prefix
npm config get prefix

# List global packages
npm list -g --depth=0

# Check for symlinks
ls -la node_modules/ | grep '^l'
find node_modules -type l

# Clear npm cache
npm cache clean --force

# Rebuild link
npm unlink -g your-package
npm link

# Check package resolution
npm explain your-package
```

### TypeScript Commands

```bash
# Build with watch mode
tsc --watch

# Check module resolution
tsc --noEmit --traceResolution

# Verify types
tsc --noEmit

# Generate declaration files
tsc --declaration
```

---

## Appendix: Project-Specific Notes

### Current Project Configuration

**Project:** hacky-hack
**Type:** ESM TypeScript project
**Package Manager:** npm v10+

**Current vitest.config.ts path aliases:**
```typescript
'@': new URL('./src', import.meta.url).pathname
'#': new URL('./src/agents', import.meta.url).pathname
'groundswell': new URL('../groundswell/dist/index.js', import.meta.url).pathname
```

**TypeScript Configuration:**
- Target: ES2022
- Module: NodeNext
- Module Resolution: NodeNext

### Recommendations for This Project

1. **For local development of the groundswell package:**
   ```bash
   cd ../groundswell
   npm run build
   npm link

   cd /home/dustin/projects/hacky-hack
   npm link groundswell
   ```

2. **To verify the link:**
   ```bash
   npm list groundswell
   ls -la node_modules/groundswell
   ```

3. **For testing with Vitest:**
   - Keep using path aliases for unit tests
   - Use npm link for integration tests
   - Consider creating separate test suites

4. **To remove the link when done:**
   ```bash
   npm unlink groundswell
   cd ../groundswell
   npm unlink -g groundswell
   ```

---

**Document Status:** Complete
**Next Review Date:** 2025-07-15
**Maintainer:** Development Team

---

*Note: While web search tools were unavailable during the creation of this document, the content is based on comprehensive knowledge of npm, Node.js, and TypeScript best practices as of January 2025. For the most current information, always refer to the official documentation URLs provided in this document.*
