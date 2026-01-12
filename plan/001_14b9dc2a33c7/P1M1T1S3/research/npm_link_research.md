# npm Link Research: Local Package Linking in Node.js Projects

**Research Date:** 2026-01-12
**Focus:** npm link command patterns, TypeScript/ESM compatibility, verification, and troubleshooting

---

## Table of Contents

1. [npm Link Command Pattern](#npm-link-command-pattern)
2. [Common Pitfalls with TypeScript/ESM](#common-pitfalls-with-typescriptesm)
3. [Verification Methods](#verification-methods)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [References](#references)

---

## 1. npm Link Command Pattern

### What is npm link?

npm link is a development tool that creates symbolic links between local packages, enabling you to test and develop packages without publishing them to the npm registry. This is essential for monorepo development, local package testing, and iterative development workflows.

### Step-by-Step Process

#### Step 1: Prepare Your Local Package

Ensure your package has a valid `package.json` with the correct name:

```json
{
  "name": "my-local-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

#### Step 2: Build the Package (if using TypeScript)

```bash
cd /path/to/my-local-package
npm run build
```

#### Step 3: Create Global Link

```bash
npm link
```

This command:

1. Creates a global symlink in your system's global node_modules directory
2. Points to your local package directory
3. Makes the package available for linking in other projects

**Example output:**

```
/Users/your-username/.nvm/versions/v20.11.0/lib/node_modules/my-local-package -> /path/to/my-local-package
```

#### Step 4: Link to Target Project

```bash
cd /path/to/target-project
npm link my-local-package
```

This creates a symlink from `target-project/node_modules/my-local-package` to the global link.

#### Step 5: Verify Installation

```bash
npm list my-local-package
```

### Complete Workflow Example

```bash
# Terminal 1: Local Package Development
cd ~/projects/my-library
npm run build
npm link

# Terminal 2: Consuming Project
cd ~/projects/my-app
npm link my-library
npm run dev
```

### Unlinking Process

When development is complete, properly remove links:

```bash
# In the consuming project
cd /path/to/target-project
npm unlink my-local-package

# In the package directory
cd /path/to/my-local-package
npm unlink -g
```

---

## 2. Common Pitfalls with TypeScript/ESM

### Pitfall 1: Module Resolution Issues

**Problem:** ESM uses different resolution rules than CommonJS, causing import failures.

**Symptoms:**

```
Error: Cannot find module 'my-local-package'
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'my-local-package' imported from...
```

**Solutions:**

1. **Add `exports` field to package.json:**

```json
{
  "name": "my-local-package",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

2. **Use Node.js `--preserve-symlinks` flag:**

```bash
node --preserve-symlinks --loader ts-node/esm src/index.ts
```

Or in package.json:

```json
{
  "scripts": {
    "dev": "node --preserve-symlinks --loader ts-node/esm src/index.ts"
  }
}
```

### Pitfall 2: TypeScript Path Mapping Issues

**Problem:** TypeScript `tsconfig.json` paths don't resolve through symlinks.

**Symptoms:**

```
TS2307: Cannot find module 'my-local-package' or its corresponding type declarations.
```

**Solutions:**

1. **Configure TypeScript to follow symlinks:**

```json
{
  "compilerOptions": {
    "preserveSymlinks": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

2. **Add path mapping if needed:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "my-local-package": ["./node_modules/my-local-package"]
    }
  }
}
```

### Pitfall 3: Dual Package Hazard

**Problem:** Different versions of dependencies in linked vs. installed packages causing module instance mismatches.

**Symptoms:**

- Two copies of the same dependency loaded
- Singleton patterns breaking
- Type mismatches between packages

**Solutions:**

1. **Ensure peer dependencies are properly declared:**

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "typescript": ">=5.0.0"
  }
}
```

2. **Use npm link with --save to update package.json:**

```bash
npm link my-local-package --save
```

### Pitfall 4: Build Output Issues

**Problem:** Linked package points to source instead of compiled output.

**Solutions:**

1. **Ensure `main` and `types` fields point to compiled output:**

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"]
}
```

2. **Add prelink script to build automatically:**

```json
{
  "scripts": {
    "prelink": "npm run build"
  }
}
```

### Pitfall 5: Watch Mode Not Detecting Changes

**Problem:** Changes in linked package don't trigger rebuilds in consuming project.

**Solutions:**

1. **Use build watch mode in linked package:**

```bash
cd my-local-package
npm run build:watch
```

2. **Configure tools like Vite or webpack to watch linked packages:**

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ['my-local-package'],
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/my-local-package/**'],
    },
  },
};
```

---

## 3. Verification Methods

### Method 1: Basic Link Verification

Check if the package is linked:

```bash
# Check global link
npm list -g --depth=0 | grep my-local-package

# Check local link
npm list | grep my-local-package
```

### Method 2: Symlink Inspection

Verify the actual symlink exists:

```bash
# Unix/Linux/macOS
ls -la node_modules/my-local-package

# Expected output:
# my-local-package -> ../../path/to/my-local-package

# Windows
dir node_modules\my-local-package

# Or using PowerShell
Get-Item node_modules\my-local-package | Select-Object LinkType, Target
```

### Method 3: Package Contents Verification

```bash
# Verify package.json is accessible
cat node_modules/my-local-package/package.json

# Check if compiled output exists
ls -la node_modules/my-local-package/dist/

# Verify TypeScript declarations
cat node_modules/my-local-package/dist/index.d.ts
```

### Method 4: Runtime Import Test

Create a test script to verify the linked package works:

```javascript
// test-link.js
try {
  // For CommonJS
  const pkg = require('my-local-package');
  console.log('✓ Package loaded successfully');
  console.log('Package version:', pkg.version || 'N/A');
  console.log('Available exports:', Object.keys(pkg));
} catch (error) {
  console.error('✗ Failed to load package:', error.message);
  process.exit(1);
}
```

```bash
node test-link.js
```

### Method 5: TypeScript Compilation Test

```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test with ts-node
npx ts-node -e "import pkg from 'my-local-package'; console.log(pkg);"
```

### Method 6: Full Integration Test

```bash
# Create comprehensive test
cat > test-integration.mjs << 'EOF'
import pkg from 'my-local-package';

console.log('Integration Test Results:');
console.log('✓ ESM import successful');
console.log('Package exports:', Object.keys(pkg));

// Test specific functionality
if (pkg.someFunction) {
  const result = pkg.someFunction('test');
  console.log('✓ Function call successful:', result);
}
EOF

node test-integration.mjs
```

### Method 7: Development Server Verification

For frontend projects:

```bash
# Start dev server
npm run dev

# Check console for:
# - No module resolution errors
# - Correct package version loaded
# - Hot module replacement working
```

---

## 4. Troubleshooting Guide

### Issue 1: EACCES Permission Errors

**Symptoms:**

```
npm ERR! Error: EACCES: permission denied
```

**Solutions:**

1. **Fix npm permissions (Unix/Mac):**

```bash
# Get npm prefix
npm config get prefix

# Change ownership
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

2. **Use Node Version Manager (Recommended):**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use nvm to manage Node.js
nvm install 20
nvm use 20
```

3. **Use sudo (not recommended, avoid if possible):**

```bash
sudo npm link
```

### Issue 2: Link Not Working After Creation

**Symptoms:**

- Package appears linked but imports fail
- `npm list` shows the package but it's not actually linked

**Solutions:**

1. **Verify global link exists:**

```bash
npm list -g --depth=0
ls -la $(npm root -g)/my-local-package
```

2. **Recreate links:**

```bash
# Remove existing links
npm unlink -g my-local-package
cd target-project
npm unlink my-local-package

# Recreate links
cd /path/to/my-local-package
npm link

cd /path/to/target-project
npm link my-local-package
```

3. **Clear npm cache:**

```bash
npm cache clean --force
```

### Issue 3: Changes Not Reflected

**Symptoms:**

- Changes in linked package don't appear in consuming project
- Old code continues to run

**Solutions:**

1. **Ensure package is built:**

```bash
cd my-local-package
npm run build
```

2. **Restart development server:**

```bash
# Stop and restart dev server
npm run dev
```

3. **Clear build cache:**

```bash
# In consuming project
rm -rf node_modules/.cache
rm -rf dist
npm run build
```

4. **Verify symlink still points correctly:**

```bash
ls -la node_modules/my-local-package
```

### Issue 4: TypeScript Declaration Files Not Found

**Symptoms:**

```
TS2307: Cannot find module 'my-local-package' or its corresponding type declarations.
```

**Solutions:**

1. **Verify types field in package.json:**

```json
{
  "types": "./dist/index.d.ts"
}
```

2. **Ensure declaration files are built:**

```bash
# Check tsconfig.json
cat tsconfig.json | grep declaration

# Should include:
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

3. **Rebuild with declarations:**

```bash
npm run build
```

### Issue 5: Windows Symlink Issues

**Symptoms:**

```
Error: EPERM: operation not permitted, symlink
```

**Solutions:**

1. **Run terminal as Administrator:**
   - Right-click terminal
   - Select "Run as Administrator"

2. **Enable Windows Developer Mode:**
   - Settings → Update & Security → For developers
   - Enable "Developer Mode"

3. **Use Windows symlinks with --force:**

```bash
npm link --force
```

4. **Use junction points instead:**

```bash
# Create junction manually
mklink /J node_modules\my-local-package C:\path\to\my-local-package
```

### Issue 6: Package Resolution in Monorepos

**Symptoms:**

- Multiple versions of the same package
- Circular dependencies
- Wrong package instance loaded

**Solutions:**

1. **Use workspace protocol (npm 7+):**

```json
{
  "workspaces": ["packages/*"]
}
```

2. **Use local file path:**

```bash
npm install ../my-local-package
```

3. **Configure TypeScript to resolve workspaces:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "my-local-package": ["packages/my-local-package/src"]
    }
  }
}
```

### Issue 7: ESM Import Errors

**Symptoms:**

```
SyntaxError: Cannot use import statement outside a module
Warning: To load an ES module, set "type": "module" in the package.json
```

**Solutions:**

1. **Set package type:**

```json
{
  "type": "module"
}
```

2. **Use .mjs extension:**

```bash
# Rename files to .mjs
mv index.js index.mjs
```

3. **Use conditional exports:**

```json
{
  "exports": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

### Issue 8: Node Module Resolution with Symlinks

**Symptoms:**

- `__dirname` and `__filename` resolve incorrectly
- Relative imports break

**Solutions:**

1. **Use --preserve-symlinks flag:**

```bash
node --preserve-symlinks index.js
```

2. **Use import.meta.url instead of \_\_dirname:**

```javascript
// ESM alternative to __dirname
const __dirname = new URL('.', import.meta.url).pathname;
```

3. **Configure Node.js options:**

```json
{
  "scripts": {
    "start": "node --preserve-symlinks --experimental-loader ts-node/esm src/index.ts"
  }
}
```

---

## 5. References

### Official Documentation

1. **npm link Official Documentation**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-link
   - Description: Official npm documentation for the link command
   - Coverage: Basic usage, command syntax, examples

2. **npm Package Configuration**
   - URL: https://docs.npmjs.com/cli/v10/configuring-npm/package-json
   - Description: Package.json configuration reference
   - Coverage: exports field, main, types, browser fields

3. **Node.js ESM Documentation**
   - URL: https://nodejs.org/api/esm.html
   - Description: Official ECMAScript Modules documentation
   - Coverage: Module resolution, import syntax, package.json type field

4. **TypeScript Module Resolution**
   - URL: https://www.typescriptlang.org/docs/handbook/module-resolution.html
   - Description: TypeScript module resolution documentation
   - Coverage: Node16/nodenext resolution, preserveSymlinks

### Additional Resources

5. **Node.js --preserve-symlinks Documentation**
   - URL: https://nodejs.org/api/cli.html#--preserve-symlinks
   - Description: Node.js CLI flag documentation for symlink preservation

6. **npm Unlink Documentation**
   - URL: https://docs.npmjs.com/cli/v10/commands/npm-unlink
   - Description: Official documentation for removing links

### Community Resources

7. **Stack Overflow: npm link tag**
   - URL: https://stackoverflow.com/questions/tagged/npm-link
   - Community Q&A for common npm link issues

8. **GitHub: npm Issues**
   - URL: https://github.com/npm/cli/issues
   - Track and search for npm-related bug reports

---

## Best Practices Summary

### Do's:

- Always build TypeScript packages before linking
- Use the `exports` field for modern package configuration
- Verify symlinks after linking
- Use `--preserve-symlinks` for ESM projects
- Set up watch mode for active development
- Keep linked package names consistent with package.json
- Test with both CommonJS and ESM imports
- Document linking steps in project README

### Don'ts:

- Don't forget to rebuild after changes
- Don't use sudo for npm (use nvm instead)
- Don't link packages with conflicting dependencies
- Don't publish linked packages to registry
- Don't rely on npm link in production
- Don't ignore TypeScript errors in linked packages
- Don't forget to unlink when done
- Don't use npm link for CI/CD pipelines

### Alternative Tools:

1. **npm workspaces** (npm 7+)
   - Better for monorepo setups
   - No symlink management needed

2. **pnpm link**
   - More efficient storage
   - Better symlink handling

3. **yarn link**
   - Similar to npm link
   - May have different behavior

4. **Local npm install**
   - `npm install ./path/to/package`
   - Simpler for some use cases

---

## Quick Reference Commands

```bash
# Create global link (in package directory)
npm link

# Link to project (in consuming project)
npm link package-name

# Verify link
ls -la node_modules/package-name

# Unlink from project
npm unlink package-name

# Unlink global
npm unlink -g package-name

# Rebuild package
npm run build

# Clear npm cache
npm cache clean --force

# Check npm config
npm config list

# Check global npm path
npm root -g

# Run with symlink preservation
node --preserve-symlinks index.js

# TypeScript verification
npx tsc --noEmit

# Watch mode
npm run build:watch
```

---

**End of Research Document**
