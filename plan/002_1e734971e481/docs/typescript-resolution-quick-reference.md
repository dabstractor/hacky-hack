# TypeScript Module Resolution Quick Reference

**Quick guide for verifying TypeScript can resolve imports from local packages and npm linked packages.**

---

## Quick Verification Commands

### Basic Type Check (Recommended)
```bash
# Check all files can be compiled
npm run typecheck

# Or directly
npx tsc --noEmit
```

### Verbose Resolution Tracing
```bash
# Trace how TypeScript resolves modules
npx tsc --noEmit --traceResolution 2>&1 | grep "Resolving module"
```

### Using the Verification Script
```bash
# Basic verification
npx tsx scripts/verify-module-resolution.ts

# Verbose mode (shows all resolved modules)
npx tsx scripts/verify-module-resolution.ts --verbose

# Check specific project
npx tsx scripts/verify-module-resolution.ts --project=./packages/app
```

---

## Common Error Codes

| Code | Message | Quick Fix |
|------|---------|-----------|
| TS2307 | Cannot find module | Build linked package, check npm link |
| TS1479 | Module kind mismatch | Match `module` settings in tsconfig |
| TS2834 | Missing file extension | Add `.js` extension to ES module imports |
| TS6137 | Cannot find type declarations | Generate `.d.ts` files with `declaration: true` |

---

## Quick Checklist

### For npm Linked Packages

- [ ] **Build the package first**
  ```bash
  cd ../local-package
  npm run build
  ```

- [ ] **Create the link**
  ```bash
  npm link
  cd ../your-project
  npm link local-package
  ```

- [ ] **Verify the symlink**
  ```bash
  ls -la node_modules/local-package
  # Should show: local-package -> ../../local-package
  ```

- [ ] **Check type declarations exist**
  ```bash
  ls ../local-package/dist/*.d.ts
  # Should show: index.d.ts
  ```

- [ ] **Verify package.json configuration**
  ```json
  {
    "types": "./dist/index.d.ts",
    "main": "./dist/index.js"
  }
  ```

- [ ] **Run type check**
  ```bash
  npx tsc --noEmit
  ```

### For TypeScript Paths (Development)

- [ ] **Set baseUrl in tsconfig.json**
  ```json
  {
    "compilerOptions": {
      "baseUrl": "."
    }
  }
  ```

- [ ] **Configure paths**
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@local-pkg": ["../local-pkg/src"]
      }
    }
  }
  ```

- [ ] **Verify resolution**
  ```bash
  npx tsc --noEmit
  ```

**Note:** TypeScript paths are compile-time only. Runtime requires npm link or bundler configuration.

---

## Module Resolution Settings

### Recommended for Modern Projects (Node.js 16+)

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### For CommonJS Projects

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true
  }
}
```

---

## Testing Import Resolution

### Test Script

Create `test-imports.ts`:
```typescript
// Test importing from linked package
import { foo } from 'local-package';

// Test importing from local package via paths
import { bar } from '@local-pkg';

// Test that types are available
const test: ReturnType<typeof foo> = bar();

console.log('Imports resolved successfully!');
```

Run the test:
```bash
# Compile check
npx tsc --noEmit test-imports.ts

# Runtime check
npx tsx test-imports.ts
```

---

## Troubleshooting Flow

```
Start: Import not working
  |
  ├─→ Can you import from node_modules?
  |   └─→ No: Check npm link exists
  |         Run: ls -la node_modules/pkg-name
  |
  ├─→ Are type declarations generated?
  |   └─→ No: Build the package
  |         Run: cd ../pkg && npm run build
  |
  ├─→ Is moduleResolution set correctly?
  |   └─→ No: Update tsconfig.json
  |         Set: "moduleResolution": "NodeNext"
  |
  ├─→ Do you need file extensions?
  |   └─→ Yes: Add .js to ES module imports
  |         Change: import { x } from './file'
  |         To: import { x } from './file.js'
  |
  └─→ Still not working?
      Run: npx tsc --noEmit --traceResolution
          Look for where resolution fails
```

---

## Quick Reference: tsconfig.json

```json
{
  "compilerOptions": {
    // Module resolution
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Path mapping for development
    "baseUrl": ".",
    "paths": {
      "@local-pkg": ["../local-pkg/src"]
    },

    // For linked packages
    "declaration": true,
    "composite": true,
    "preserveSymlinks": false
  },

  // Project references (optional)
  "references": [
    { "path": "../local-pkg" }
  ]
}
```

---

## Quick Reference: package.json

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

## Essential Commands

```bash
# Build and link a package
cd ../local-package && npm run build && npm link

# Link into current project
npm link local-package

# Verify TypeScript resolution
npx tsc --noEmit

# Verbose resolution tracing
npx tsc --noEmit --traceResolution

# Unlink when done
npm unlink local-package

# Check package installation
npm list local-package
```

---

## Key Takeaways

1. **Always build before linking** - TypeScript needs `.d.ts` files
2. **Use `tsc --noEmit`** - Fastest way to verify resolution
3. **Match module settings** - All packages need same `module` and `moduleResolution`
4. **Check the symlink** - `ls -la node_modules/pkg-name`
5. **Use project references** - Better than paths for complex setups
6. **ESM needs extensions** - Add `.js` to ES module imports
7. **Verify package.json** - Check `types` and `exports` fields

---

**For detailed information, see:** [typescript-module-resolution-research.md](./typescript-module-resolution-research.md)
