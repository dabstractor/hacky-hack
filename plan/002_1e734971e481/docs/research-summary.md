# TypeScript Module Resolution Research - Summary

**Date:** 2026-01-15
**Project:** hacky-hack
**TypeScript Version:** 5.2.0
**Node.js Version:** 20.0.0+

---

## Overview

This research documents TypeScript module resolution strategies for local packages and npm linked packages, with a focus on **NodeNext mode** - the modern resolution strategy for ES modules in Node.js 16+.

## Key Findings

### 1. Official TypeScript Documentation

The following official TypeScript documentation is essential for understanding module resolution:

- **Module Resolution Handbook**
  URL: https://www.typescriptlang.org/docs/handbook/modules/reference.html
  - Covers all resolution strategies (classic, node, node16, nodenext, bundler)
  - Explains when to use each strategy

- **Module Resolution Theory**
  URL: https://www.typescriptlang.org/docs/handbook/modules/theory.html
  - Detailed explanation of resolution algorithms
  - How TypeScript resolves imports

- **Compiler Options Reference**
  URL: https://www.typescriptlang.org/tsconfig#moduleResolution
  - Complete reference for all moduleResolution options
  - Related compiler options (module, baseUrl, paths)

- **Project References**
  URL: https://www.typescriptlang.org/docs/handbook/project-references.html
  - Best approach for complex monorepos
  - Enables incremental builds

### 2. NodeNext Module Resolution

**NodeNext** is the recommended module resolution strategy for modern Node.js projects:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**Key characteristics:**
- Aligns with Node.js ES module resolution
- Requires file extensions for ES module imports (`import { x } from './file.js'`)
- Respects `package.json` `type` field (`"type": "module"` or `"type": "commonjs"`)
- Supports conditional exports in package.json
- Handles both ESM and CommonJS

**Conditional exports example:**
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

### 3. TypeScript Paths for Local Packages

TypeScript paths allow compile-time aliasing of local packages:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared": ["../shared/src"],
      "@utils": ["../utils/src"]
    }
  }
}
```

**Important limitation:** TypeScript paths are **compile-time only**. Runtime resolution requires:
- npm link (for development)
- Workspace configuration (pnpm, Yarn, npm)
- Bundler configuration (webpack, esbuild, etc.)

### 4. npm Link and TypeScript

**Workflow:**
```bash
# 1. Build the package (generates .d.ts files)
cd ../local-package
npm run build

# 2. Create global link
npm link

# 3. Link into your project
cd ../your-project
npm link local-package

# 4. Verify resolution
npx tsc --noEmit
```

**Critical requirements for linked packages:**

1. **Generate type declarations:**
   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "declarationMap": true,
       "composite": true
     }
   }
   ```

2. **Configure package.json:**
   ```json
   {
     "types": "./dist/index.d.ts",
     "main": "./dist/index.js"
   }
   ```

3. **Match module settings:**
   Both packages should use the same `module` and `moduleResolution` settings.

### 5. Verifying TypeScript Import Resolution

**Best approach:** Use `tsc --noEmit`

```bash
# Basic check
npx tsc --noEmit

# With specific tsconfig
npx tsc --noEmit --project tsconfig.json

# Watch mode
npx tsc --noEmit --watch

# Verbose resolution tracing
npx tsc --noEmit --traceResolution
```

**What it checks:**
- All imports can be resolved
- Type definitions are found
- No type errors
- Module compatibility

**Alternative:** Use the provided verification script:
```bash
npx tsx scripts/verify-module-resolution.ts
npx tsx scripts/verify-module-resolution.ts --verbose
```

## Configuration Examples

### Minimal Configuration (ES Modules)

**tsconfig.json:**
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

**package.json:**
```json
{
  "type": "module"
}
```

### Monorepo Configuration

**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/app" }
  ]
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
    "composite": true,
    "outDir": "./dist"
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
      "@shared": ["../shared/src"]
    }
  },
  "references": [
    { "path": "../shared" }
  ]
}
```

## Common Issues and Solutions

### Issue 1: "Cannot find module" (TS2307)

**Solutions:**
1. Build the linked package: `cd ../pkg && npm run build`
2. Create npm link: `npm link pkg`
3. Check tsconfig.json paths configuration
4. Verify moduleResolution is set to "NodeNext"

### Issue 2: Module kind mismatch (TS1479)

**Solutions:**
1. Match `module` settings in all packages
2. Match `package.json` `type` field
3. Use conditional exports for dual ESM/CJS support

### Issue 3: Missing file extensions (TS2834)

**Solutions:**
1. Add `.js` extension to ES module imports
2. Remember to use `.js` for `.ts` files
3. Or use CommonJS (`require`)

### Issue 4: Cannot find type declarations (TS6137)

**Solutions:**
1. Enable `declaration: true` in tsconfig.json
2. Build the package to generate `.d.ts` files
3. Check `types` field in package.json

## Best Practices

1. **Always build before linking**
   ```bash
   cd ../local-package && npm run build && npm link
   ```

2. **Use consistent module settings**
   All packages should use the same `module` and `moduleResolution`.

3. **Enable declaration generation**
   ```json
   {
     "compilerOptions": {
       "declaration": true,
       "composite": true
     }
   }
   ```

4. **Use project references for monorepos**
   ```json
   {
     "references": [
       { "path": "../shared" }
     ]
   }
   ```

5. **Verify resolution regularly**
   Add to your build process:
   ```json
   {
     "scripts": {
       "typecheck": "tsc --noEmit",
       "prebuild": "npm run typecheck"
     }
   }
   ```

6. **Use workspaces when possible**
   Prefer pnpm/Yarn/npm workspaces over npm link for new projects.

## Tools and Scripts

The following tools have been created to help verify TypeScript module resolution:

### 1. verify-module-resolution.ts
```bash
npx tsx scripts/verify-module-resolution.ts
npx tsx scripts/verify-module-resolution.ts --verbose
```

Verifies that TypeScript can resolve all imports. Shows detailed resolution information in verbose mode.

### 2. test-import-resolution.ts
```bash
npx tsx scripts/test-import-resolution.ts
```

Runs a test suite checking:
- TypeScript compilation
- Configuration existence
- npm linked packages
- package.json exports
- Import resolution with sample code
- TypeScript version

## Troubleshooting Flow

```
Import not working
  |
  ├─→ Can you import from node_modules?
  |   └─→ Check: ls -la node_modules/pkg-name
  |
  ├─→ Are type declarations generated?
  |   └─→ Check: ls ../pkg/dist/*.d.ts
  |
  ├─→ Is moduleResolution set correctly?
  |   └─→ Check: tsconfig.json
  |
  ├─→ Do you need file extensions?
  |   └─→ Check: Are you using ES modules?
  |
  └─→ Still not working?
      Run: npx tsc --noEmit --traceResolution
```

## Quick Reference

**Verify resolution:**
```bash
npx tsc --noEmit
```

**Trace resolution:**
```bash
npx tsc --noEmit --traceResolution
```

**Build and link:**
```bash
cd ../pkg && npm run build && npm link
cd . && npm link pkg
```

**Check configuration:**
```bash
npx tsx scripts/verify-module-resolution.ts
```

## Related Documentation

- **Comprehensive Research:** [typescript-module-resolution-research.md](./typescript-module-resolution-research.md)
- **Quick Reference:** [typescript-resolution-quick-reference.md](./typescript-resolution-quick-reference.md)
- **Verification Tool:** [scripts/verify-module-resolution.ts](../scripts/verify-module-resolution.ts)
- **Test Suite:** [scripts/test-import-resolution.ts](../scripts/test-import-resolution.ts)

## URLs and Resources

### Official TypeScript Documentation
- Module Resolution: https://www.typescriptlang.org/docs/handbook/modules/reference.html
- Module Resolution Theory: https://www.typescriptlang.org/docs/handbook/modules/theory.html
- tsconfig Reference: https://www.typescriptlang.org/tsconfig
- Project References: https://www.typescriptlang.org/docs/handbook/project-references.html

### Community Resources
- TypeScript GitHub Issues: https://github.com/microsoft/TypeScript/issues
- TypeScript Discussions: https://github.com/microsoft/TypeScript/discussions
- Stack Overflow (TypeScript): https://stackoverflow.com/questions/tagged/typescript

### Tools
- TypeScript: https://www.typescriptlang.org/
- tsx: https://github.com/privatenumber/tsx
- ts-node: https://github.com/TypeStrong/ts-node

## Conclusion

TypeScript module resolution for local packages and npm linked packages is well-supported with **NodeNext mode**. The key to success is:

1. **Consistent configuration** across all packages
2. **Proper build process** that generates type declarations
3. **Verification using `tsc --noEmit`** before deployment
4. **Use of project references** for complex monorepos

The provided tools and documentation should help diagnose and resolve any module resolution issues.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Research Status:** Complete
